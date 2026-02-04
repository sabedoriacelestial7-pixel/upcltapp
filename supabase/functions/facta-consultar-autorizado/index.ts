import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FACTA_BASE_URL = "https://webservice.facta.com.br";
const PROXY_URL = "https://robinson-feeding-yale-perspectives.trycloudflare.com/proxy";

// Token cache
let tokenCache: { token: string; expira: Date } | null = null;

async function getFactaToken(): Promise<string> {
  // Check if cached token is still valid
  if (tokenCache && new Date() < tokenCache.expira) {
    console.log("Using cached Facta token");
    return tokenCache.token;
  }

  const authBasic = Deno.env.get('FACTA_AUTH_BASIC');
  if (!authBasic) {
    throw new Error("FACTA_AUTH_BASIC not configured");
  }

  console.log("Fetching new Facta token via proxy...");
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);
  
  let response: Response;
  try {
    response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'GET',
        url: `${FACTA_BASE_URL}/gera-token`,
        headers: { 'Authorization': `Basic ${authBasic}` }
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
  } catch (fetchError) {
    clearTimeout(timeoutId);
    console.error(`Failed to connect to proxy: ${fetchError}`);
    throw new Error("Não foi possível conectar ao servidor proxy.");
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Token request failed: ${response.status} - ${errorText.substring(0, 200)}`);
    throw new Error(`Falha na autenticação (HTTP ${response.status})`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    console.error(`Non-JSON response: ${text.substring(0, 200)}`);
    throw new Error("API Facta indisponível. Tente novamente.");
  }

  const data = await response.json();
  console.log("Token response:", JSON.stringify(data));
  
  if (data.erro) {
    throw new Error(data.mensagem || "Failed to get Facta token");
  }

  tokenCache = {
    token: data.token,
    expira: new Date(Date.now() + 55 * 60 * 1000)
  };

  return data.token;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const userToken = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(userToken);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;

    const body = await req.json();
    const { cpf, celular } = body;
    
    if (!cpf) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "CPF é obrigatório", status: 'error' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!celular) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Celular é obrigatório", status: 'error' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cpfLimpo = cpf.replace(/\D/g, '');
    const celularLimpo = celular.replace(/\D/g, '');

    console.log(`Checking authorization status for CPF: ${cpfLimpo.substring(0, 3)}...`);

    // Get Facta token
    const token = await getFactaToken();

    // Call Facta API to check authorization and get data via proxy
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    
    let factaResponse: Response;
    try {
      factaResponse = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'GET',
          url: `${FACTA_BASE_URL}/consignado-trabalhador/autoriza-consulta?cpf=${cpfLimpo}&celular=${celularLimpo}`,
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error(`Failed to connect to proxy: ${fetchError}`);
      throw new Error("Não foi possível conectar ao servidor proxy.");
    }

    const factaData = await factaResponse.json();
    console.log("Facta authorization check response:", JSON.stringify(factaData));

    // Check if still pending authorization
    if (factaData.erro && factaData.codigo === 'AGUARDANDO_AUTORIZACAO') {
      return new Response(
        JSON.stringify({ 
          sucesso: false, 
          mensagem: "Aguardando autorização do cliente",
          status: 'pending'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token expired - needs new authorization request
    const isTokenExpired = factaData.erro && (
      factaData.mensagem?.includes('Token expirado') || 
      factaData.mensagem?.includes('solicita-autorizacao')
    );
    
    if (isTokenExpired) {
      return new Response(
        JSON.stringify({ 
          sucesso: false, 
          mensagem: "Código de autorização expirado. Solicite um novo código.",
          status: 'expired'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for other errors
    if (factaData.erro) {
      return new Response(
        JSON.stringify({ 
          sucesso: false, 
          mensagem: factaData.mensagem || "Erro ao verificar autorização",
          status: 'error',
          codigo: factaData.codigo
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authorization granted - extract worker data
    // Facta returns data in dados_trabalhador.dados structure
    const dadosTrabalhador = factaData.dados_trabalhador?.dados || factaData.dados;
    
    if (!dadosTrabalhador || dadosTrabalhador.length === 0) {
      return new Response(
        JSON.stringify({ 
          sucesso: false, 
          mensagem: "CPF não encontrado na base",
          status: 'not_found',
          dados: null 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trabalhador = dadosTrabalhador[0];
    const elegivel = trabalhador.elegivel === "S" || trabalhador.elegivel === "SIM" || trabalhador.elegivel === "1" || trabalhador.elegivel === true;

    // Helper function to parse Brazilian number format (e.g., "891,65" -> 891.65)
    const parseValor = (valor: string | number | undefined): number => {
      if (valor === undefined || valor === null || valor === '') return 0;
      if (typeof valor === 'number') return valor;
      // Replace dots (thousands separator) and convert comma to decimal point
      const normalized = valor.toString().replace(/\./g, '').replace(',', '.');
      return parseFloat(normalized) || 0;
    };

    const dadosFormatados = {
      nome: trabalhador.nome,
      cpf: trabalhador.cpf,
      valorMargemDisponivel: parseValor(trabalhador.valorMargemDisponivel),
      valorBaseMargem: parseValor(trabalhador.valorBaseMargem),
      valorTotalVencimentos: parseValor(trabalhador.valorTotalVencimentos),
      nomeEmpregador: trabalhador.nomeEmpregador,
      cnpjEmpregador: trabalhador.numeroInscricaoEmpregador || trabalhador.cnpjEmpregador,
      dataAdmissao: trabalhador.dataAdmissao,
      dataNascimento: trabalhador.dataNascimento,
      matricula: trabalhador.matricula,
      nomeMae: trabalhador.nomeMae,
      sexo: trabalhador.sexo_codigo,
      elegivel: elegivel,
      atualizadoEm: trabalhador.updated_at || new Date().toISOString()
    };

    // Save margin query to database
    const { error: insertError } = await supabase
      .from('margin_queries')
      .insert({
        user_id: userId,
        cpf: cpfLimpo,
        nome_trabalhador: dadosFormatados.nome,
        valor_margem_disponivel: dadosFormatados.valorMargemDisponivel,
        valor_base_margem: dadosFormatados.valorBaseMargem,
        valor_total_vencimentos: dadosFormatados.valorTotalVencimentos,
        nome_empregador: dadosFormatados.nomeEmpregador,
        data_admissao: dadosFormatados.dataAdmissao,
        elegivel: elegivel,
        motivo_inelegibilidade: !elegivel ? (trabalhador.motivoInelegibilidade_descricao || 'Cliente não elegível') : null,
        api_response: factaData
      });

    if (insertError) {
      console.error("Error saving margin query:", insertError);
    }

    if (!elegivel) {
      return new Response(
        JSON.stringify({ 
          sucesso: false, 
          mensagem: trabalhador.motivoInelegibilidade_descricao || "Cliente não elegível para consignado",
          status: 'ineligible',
          dados: dadosFormatados 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        sucesso: true, 
        mensagem: "Margem disponível!",
        status: 'authorized',
        dados: dadosFormatados 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in facta-consultar-autorizado function:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro interno ao consultar autorização";
    return new Response(
      JSON.stringify({ 
        sucesso: false, 
        mensagem: errorMessage,
        status: 'error',
        dados: null 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
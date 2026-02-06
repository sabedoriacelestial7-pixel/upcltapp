// Edge function for checking authorization and getting worker data - v2.0 (API CLT v2.0)
// Endpoint: GET /consignado-trabalhador/autoriza-consulta?cpf=X
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FACTA_BASE_URL = "https://webservice.facta.com.br";

// Token cache
let tokenCache: { token: string; expira: Date } | null = null;

async function getFactaToken(): Promise<string> {
  if (tokenCache && new Date() < tokenCache.expira) {
    console.log("Using cached Facta token");
    return tokenCache.token;
  }

  const authBasic = Deno.env.get('FACTA_AUTH_BASIC');
  if (!authBasic) {
    throw new Error("FACTA_AUTH_BASIC not configured");
  }

  console.log("Fetching new Facta token...");
  
  const response = await fetch(`${FACTA_BASE_URL}/gera-token`, {
    method: 'GET',
    headers: { 'Authorization': authBasic }
  });

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    console.error("Invalid response type:", contentType, "Body:", text.substring(0, 200));
    throw new Error("Servidor Facta retornou resposta inválida");
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

// Helper function to parse Brazilian number format (e.g., "891,65" -> 891.65)
function parseValor(valor: string | number | undefined): number {
  if (valor === undefined || valor === null || valor === '') return 0;
  if (typeof valor === 'number') return valor;
  // Replace dots (thousands separator) and convert comma to decimal point
  const normalized = valor.toString().replace(/\./g, '').replace(',', '.');
  return parseFloat(normalized) || 0;
}

serve(async (req) => {
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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;

    const body = await req.json();
    const { cpf } = body;
    
    if (!cpf) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "CPF é obrigatório", status: 'error' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cpfLimpo = cpf.replace(/\D/g, '');

    console.log(`Checking authorization status for CPF: ${cpfLimpo.substring(0, 3)}...`);

    // Get Facta token
    const token = await getFactaToken();

    // Call Facta API - conforme doc v2.0: GET /consignado-trabalhador/autoriza-consulta?cpf=X
    // Nota: Este endpoint retorna os dados do trabalhador se já autorizado
    const factaResponse = await fetch(
      `${FACTA_BASE_URL}/consignado-trabalhador/autoriza-consulta?cpf=${cpfLimpo}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const responseText = await factaResponse.text();
    console.log("Raw Facta response:", responseText.substring(0, 500));

    // Check if response is HTML (error page)
    if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
      console.error("Facta returned HTML instead of JSON");
      return new Response(
        JSON.stringify({ 
          sucesso: false, 
          mensagem: "Servidor temporariamente indisponível",
          status: 'error',
          dados: null 
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let factaData;
    try {
      factaData = JSON.parse(responseText);
    } catch {
      return new Response(
        JSON.stringify({ 
          sucesso: false, 
          mensagem: "Resposta inválida do servidor",
          status: 'error',
          dados: null 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Facta authorization check response:", JSON.stringify(factaData));

    // Check if token expired - doc v2.0: "Token expirado, necessário utilizar o endpoint {solicita-autorizacao-consulta}"
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

    // Check for "virada de folha" - indisponibilidade temporária
    if (factaData.mensagem?.includes('virada de folha')) {
      return new Response(
        JSON.stringify({ 
          sucesso: false, 
          mensagem: "Consulta temporariamente indisponível. Tente novamente mais tarde.",
          status: 'unavailable'
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
    // Conforme doc v2.0, dados estão em dados_trabalhador.dados
    const dadosTrabalhador = factaData.dados_trabalhador?.dados || [];
    
    if (!dadosTrabalhador || dadosTrabalhador.length === 0) {
      return new Response(
        JSON.stringify({ 
          sucesso: false, 
          mensagem: "CPF não encontrado na base de trabalhadores",
          status: 'not_found',
          dados: null 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trabalhador = dadosTrabalhador[0];
    
    // Check eligibility - pode ser "S", "SIM", "1", true ou vazio
    const elegivelRaw = trabalhador.elegivel;
    const elegivel = elegivelRaw === "S" || elegivelRaw === "SIM" || elegivelRaw === "1" || 
                     elegivelRaw === true || elegivelRaw === "true";

    // Build formatted response - campos conforme doc v2.0
    const dadosFormatados = {
      nome: trabalhador.nome,
      cpf: trabalhador.cpf,
      matricula: trabalhador.matricula,
      valorMargemDisponivel: parseValor(trabalhador.valorMargemDisponivel),
      valorBaseMargem: parseValor(trabalhador.valorBaseMargem),
      valorTotalVencimentos: parseValor(trabalhador.valorTotalVencimentos),
      nomeEmpregador: trabalhador.nomeEmpregador,
      cnpjEmpregador: trabalhador.numeroInscricaoEmpregador,
      inscricaoEmpregadorDescricao: trabalhador.inscricaoEmpregador_descricao,
      dataAdmissao: trabalhador.dataAdmissao,
      dataDesligamento: trabalhador.dataDesligamento,
      dataNascimento: trabalhador.dataNascimento,
      nomeMae: trabalhador.nomeMae,
      sexo: trabalhador.sexo_codigo,
      sexoDescricao: trabalhador.sexo_descricao,
      categoriaTrabalhador: trabalhador.codigoCategoriaTrabalhador,
      cboDescricao: trabalhador.cbo_descricao,
      cnaeDescricao: trabalhador.cnae_descricao,
      pessoaPoliticamenteExposta: trabalhador.pessoaExpostaPoliticamente_descricao,
      paisNacionalidade: trabalhador.paisNacionalidade_descricao,
      qtdEmprestimosAtivos: parseInt(trabalhador.qtdEmprestimosAtivosSuspensos) || 0,
      possuiAlertas: trabalhador.possuiAlertas === "S" || trabalhador.possuiAlertas === true,
      elegivel: elegivel,
      erroMensagem: trabalhador.erro_mensagem,
      erroCodigo: trabalhador.erro_codigo,
      atualizadoEm: new Date().toISOString()
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
        motivo_inelegibilidade: !elegivel ? (trabalhador.erro_mensagem || 'Cliente não elegível') : null,
        api_response: factaData
      });

    if (insertError) {
      console.error("Error saving margin query:", insertError);
    }

    if (!elegivel) {
      return new Response(
        JSON.stringify({ 
          sucesso: false, 
          mensagem: trabalhador.erro_mensagem || "Cliente não elegível para consignado CLT",
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FACTA_BASE_URL = "https://cltoff.facta.com.br";

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

  console.log("Fetching new Facta token...");
  
  // authBasic already includes "Basic " prefix
  const response = await fetch(`${FACTA_BASE_URL}/gera-token`, {
    method: 'GET',
    headers: {
      'Authorization': authBasic
    }
  });

  const data = await response.json();
  console.log("Token response:", JSON.stringify(data));
  
  if (data.erro) {
    throw new Error(data.mensagem || "Failed to get Facta token");
  }

  // Cache token for 55 minutes (tokens expire in 60 min)
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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { cpf } = await req.json();
    
    if (!cpf) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "CPF é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cpfLimpo = cpf.replace(/\D/g, '');
    console.log(`Consulting margin for CPF: ${cpfLimpo.substring(0, 3)}...`);

    // Get Facta token
    const token = await getFactaToken();

    // Call Facta API
    const factaResponse = await fetch(
      `${FACTA_BASE_URL}/clt/base-offline/debug?cpf=${cpfLimpo}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const factaData = await factaResponse.json();
    console.log("Facta API response:", JSON.stringify(factaData));

    if (factaData.erro) {
      return new Response(
        JSON.stringify({ 
          sucesso: false, 
          mensagem: factaData.mensagem || "Erro ao consultar API Facta",
          dados: null 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!factaData.dados || factaData.dados.length === 0) {
      return new Response(
        JSON.stringify({ 
          sucesso: false, 
          mensagem: "CPF não encontrado na base",
          dados: null 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trabalhador = factaData.dados[0];
    const elegivel = trabalhador.elegivel === "S" || trabalhador.elegivel === "1" || trabalhador.elegivel === true;

    const dadosFormatados = {
      nome: trabalhador.nome,
      cpf: trabalhador.cpf,
      valorMargemDisponivel: parseFloat(trabalhador.valorMargemDisponivel) || 0,
      valorBaseMargem: parseFloat(trabalhador.valorBaseMargem) || 0,
      valorTotalVencimentos: parseFloat(trabalhador.valorTotalVencimentos) || 0,
      nomeEmpregador: trabalhador.nomeEmpregador,
      dataAdmissao: trabalhador.dataAdmissao,
      dataNascimento: trabalhador.dataNascimento,
      matricula: trabalhador.matricula,
      nomeMae: trabalhador.nomeMae,
      sexo: trabalhador.sexo_codigo,
      elegivel: elegivel,
      atualizadoEm: trabalhador.updated_at || new Date().toISOString()
    };

    if (!elegivel) {
      return new Response(
        JSON.stringify({ 
          sucesso: false, 
          mensagem: trabalhador.motivoInelegibilidade_descricao || "Cliente não elegível para consignado",
          dados: dadosFormatados 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        sucesso: true, 
        mensagem: "Margem disponível!",
        dados: dadosFormatados 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in consulta-margem function:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro interno ao consultar margem";
    return new Response(
      JSON.stringify({ 
        sucesso: false, 
        mensagem: errorMessage,
        dados: null 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

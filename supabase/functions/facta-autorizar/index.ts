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
  console.log(`Proxy URL: ${PROXY_URL}`);
  
  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error("Token request timed out after 25 seconds");
    controller.abort();
  }, 25000);
  
  let response: Response;
  try {
    response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        method: 'GET',
        url: `${FACTA_BASE_URL}/gera-token`,
        headers: {
          'Authorization': `Basic ${authBasic}`
        }
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    console.log(`Token proxy response status: ${response.status}`);
  } catch (fetchError) {
    clearTimeout(timeoutId);
    console.error(`Failed to connect to proxy: ${fetchError}`);
    throw new Error("Não foi possível conectar ao servidor proxy. Verifique se o serviço está ativo.");
  }

  // Check if response is OK
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Facta token request failed: ${response.status} - ${errorText.substring(0, 200)}`);
    throw new Error(`Falha na autenticação com Facta (HTTP ${response.status})`);
  }

  // Check content type before parsing
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    console.error(`Facta returned non-JSON response: ${text.substring(0, 200)}`);
    throw new Error("API Facta indisponível. Tente novamente em alguns minutos.");
  }

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

    const userToken = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(userToken);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { cpf, celular, canal, nome } = body;
    
    if (!cpf) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "CPF é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!celular) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Celular é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cpfLimpo = cpf.replace(/\D/g, '');
    const celularLimpo = celular.replace(/\D/g, '');
    const tipoEnvio = canal === 'W' ? 'WHATSAPP' : 'SMS';
    const nomeCliente = nome || 'Cliente';

    console.log(`Requesting authorization for CPF: ${cpfLimpo.substring(0, 3)}... via ${tipoEnvio}`);

    // Get Facta token
    const token = await getFactaToken();

    // Create AbortController for authorization request
    const authController = new AbortController();
    const authTimeoutId = setTimeout(() => {
      console.error("Authorization request timed out after 25 seconds");
      authController.abort();
    }, 25000);
    
    let factaResponse: Response;
    try {
      factaResponse = await fetch(PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          method: 'POST',
          url: `${FACTA_BASE_URL}/solicita-autorizacao-consulta`,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: {
            averbador: '10010',
            nome: nomeCliente,
            cpf: cpfLimpo,
            celular: celularLimpo,
            tipo_envio: tipoEnvio
          }
        }),
        signal: authController.signal
      });
      clearTimeout(authTimeoutId);
      console.log(`Authorization proxy response status: ${factaResponse.status}`);
    } catch (fetchError) {
      clearTimeout(authTimeoutId);
      console.error(`Failed to connect to proxy for authorization: ${fetchError}`);
      throw new Error("Não foi possível conectar ao servidor proxy para autorização.");
    }

    const factaData = await factaResponse.json();
    console.log("Facta authorization response:", JSON.stringify(factaData));

    // Check for explicit errors
    if (factaData.erro) {
      return new Response(
        JSON.stringify({ 
          sucesso: false, 
          mensagem: factaData.mensagem || "Erro ao solicitar autorização",
          codigo: factaData.codigo
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle array response (Facta sometimes returns array)
    const responseData = Array.isArray(factaData) ? factaData[0] : factaData;
    const mensagem = responseData?.mensagem || '';

    // Check if already authorized - can proceed directly to consultation
    if (mensagem.includes('Token válido') || mensagem.includes('Não necessita de autorização')) {
      console.log("CPF already authorized, returning already_authorized status");
      return new Response(
        JSON.stringify({ 
          sucesso: true, 
          mensagem: "CPF já autorizado! Consultando dados...",
          status: 'already_authorized'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for business errors in the message (Facta sometimes returns erro:false with error messages)
    const isBusinessError = 
      mensagem.includes('Telefone já informado') ||
      mensagem.includes('não é um numero de celular válido') ||
      mensagem.includes('CPF incorreto') ||
      mensagem.includes('Averbador indisponível') ||
      mensagem.includes('não encontrado');
    
    if (isBusinessError) {
      // Map error messages to user-friendly versions
      let userMessage = mensagem;
      if (mensagem.includes('Telefone já informado')) {
        userMessage = 'Este telefone já está vinculado a outro CPF. Use o telefone cadastrado para este CPF.';
      } else if (mensagem.includes('não é um numero de celular válido')) {
        userMessage = 'Número de celular inválido. Verifique e tente novamente.';
      }
      
      return new Response(
        JSON.stringify({ 
          sucesso: false, 
          mensagem: userMessage
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if authorization was successful (contains success keywords)
    const isSuccess = 
      mensagem.includes('enviado') || 
      mensagem.includes('sucesso') ||
      responseData?.protocolo;

    return new Response(
      JSON.stringify({ 
        sucesso: isSuccess, 
        mensagem: isSuccess 
          ? "Código de autorização enviado com sucesso!" 
          : (mensagem || "Solicitação processada"),
        protocolo: responseData?.protocolo || responseData?.id,
        status: 'code_sent'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in facta-autorizar function:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro interno ao solicitar autorização";
    return new Response(
      JSON.stringify({ 
        sucesso: false, 
        mensagem: errorMessage
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

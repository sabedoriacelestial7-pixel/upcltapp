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
  // Check if cached token is still valid
  if (tokenCache && new Date() < tokenCache.expira) {
    console.log("Using cached Facta token");
    return tokenCache.token;
  }

  const authBasic = Deno.env.get('FACTA_AUTH_BASIC');
  if (!authBasic) {
    throw new Error("Credenciais Facta não configuradas. Contate o suporte.");
  }

  console.log("Fetching new Facta token...");
  
  let response: Response;
  try {
    // authBasic already includes "Basic " prefix
    response = await fetch(`${FACTA_BASE_URL}/gera-token`, {
      method: 'GET',
      headers: {
        'Authorization': authBasic
      }
    });
  } catch (fetchError) {
    console.error("Fetch error getting token:", fetchError);
    throw new Error("Erro de conexão com o servidor Facta. Tente novamente.");
  }

  console.log(`Token response status: ${response.status}`);

  // Check if response is OK
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Token request failed: ${response.status} - ${errorText.substring(0, 200)}`);
    throw new Error("Servidor Facta indisponível. Tente novamente em alguns minutos.");
  }

  // Check content type before parsing
  const contentType = response.headers.get('content-type') || '';
  const responseText = await response.text();
  
  console.log(`Token response content-type: ${contentType}`);
  console.log(`Token response body (first 200 chars): ${responseText.substring(0, 200)}`);
  
  if (!contentType.includes('application/json') && !responseText.startsWith('{')) {
    console.error("Non-JSON response from Facta:", responseText.substring(0, 500));
    throw new Error("API Facta indisponível. Tente novamente em alguns minutos.");
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (parseError) {
    console.error("Failed to parse token response:", responseText.substring(0, 200));
    throw new Error("Resposta inválida do servidor Facta. Tente novamente.");
  }
  
  console.log("Token response:", JSON.stringify(data));
  
  if (data.erro) {
    throw new Error(data.mensagem || "Falha na autenticação com Facta");
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
        JSON.stringify({ sucesso: false, mensagem: 'Não autorizado. Faça login novamente.' }),
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
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: 'Sessão inválida. Faça login novamente.' }),
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

    // Build form data
    const formData = new URLSearchParams();
    formData.append('averbador', '10010');
    formData.append('nome', nomeCliente);
    formData.append('cpf', cpfLimpo);
    formData.append('celular', celularLimpo);
    formData.append('tipo_envio', tipoEnvio);

    // Call Facta API directly
    let factaResponse: Response;
    try {
      factaResponse = await fetch(`${FACTA_BASE_URL}/solicita-autorizacao-consulta`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      });
    } catch (fetchError) {
      console.error("Fetch error calling authorization:", fetchError);
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Erro de conexão. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Facta authorization response status: ${factaResponse.status}`);

    // Check content type and parse response
    const responseText = await factaResponse.text();
    console.log(`Authorization response (first 200 chars): ${responseText.substring(0, 200)}`);
    
    if (!responseText.startsWith('{') && !responseText.startsWith('[')) {
      console.error("Non-JSON authorization response:", responseText.substring(0, 500));
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Serviço temporariamente indisponível. Tente novamente em alguns minutos." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let factaData;
    try {
      factaData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse authorization response:", responseText.substring(0, 200));
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Resposta inválida do servidor. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
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

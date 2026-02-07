// Facta authorization edge function - v3.0 (API CLT v2.0)
// Endpoint: POST /solicita-autorizacao-consulta
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FACTA_BASE_URL = "https://webservice.facta.com.br";

// Token cache
let tokenCache: { token: string; expira: Date } | null = null;

// Helper function to call Facta API via proxy
async function callFactaApi(method: string, url: string, headers: Record<string, string>, body?: string): Promise<Response> {
  const proxyUrl = Deno.env.get('FACTA_API_URL');
  
  if (!proxyUrl) {
    console.log("FACTA_API_URL not configured, calling Facta directly");
    // Call Facta directly (will only work if IP is whitelisted)
    return await fetch(url, {
      method,
      headers,
      body
    });
  }

  console.log(`Calling Facta via proxy: ${proxyUrl}`);
  
  // Call via proxy
  const proxyBody: Record<string, unknown> = {
    method,
    url,
    headers
  };
  
  if (body) {
    proxyBody.body = body;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'UpCLT-EdgeFunction/1.0',
        'Accept': 'application/json',
        'Connection': 'keep-alive'
      },
      body: JSON.stringify(proxyBody),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    console.error("Proxy connection error:", err);
    throw new Error("Não foi possível conectar ao servidor proxy. Verifique se o túnel está ativo.");
  }
}

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
  
  // Garantir que o header tenha o prefixo "Basic "
  const authHeader = authBasic.startsWith('Basic ') ? authBasic : `Basic ${authBasic}`;
  
  const response = await callFactaApi('GET', `${FACTA_BASE_URL}/gera-token`, {
    'Authorization': authHeader
  });

  const contentType = response.headers.get('content-type') || '';
  const responseText = await response.text();
  
  console.log("Token response text:", responseText.substring(0, 200));
  
  // Check if response is HTML (error page)
  if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
    console.error("Facta returned HTML instead of JSON");
    throw new Error("Servidor Facta temporariamente indisponível");
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    console.error("Failed to parse token response:", responseText.substring(0, 200));
    throw new Error("Resposta inválida do servidor Facta");
  }

  console.log("Token response:", JSON.stringify(data));
  
  if (data.erro) {
    throw new Error(data.mensagem || "Falha ao obter token Facta");
  }

  tokenCache = {
    token: data.token,
    expira: new Date(Date.now() + 55 * 60 * 1000)
  };

  return data.token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: 'Sessão inválida' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { cpf, celular, canal, nome } = body;
    
    if (!cpf || !celular) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "CPF e celular são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cpfLimpo = cpf.replace(/\D/g, '');
    // Formatar celular no padrão esperado pela Facta: (XX) XXXXX-XXXX
    const celularLimpo = celular.replace(/\D/g, '');
    const celularFormatado = celularLimpo.length === 11 
      ? `(${celularLimpo.slice(0,2)}) ${celularLimpo.slice(2,7)}-${celularLimpo.slice(7)}`
      : celularLimpo;
    
    const tipoEnvio = canal === 'W' ? 'WHATSAPP' : 'SMS';

    console.log(`Auth request: CPF ${cpfLimpo.substring(0,3)}*** via ${tipoEnvio}`);
    console.log(`Celular formatado: ${celularFormatado}`);

    // Get Facta token
    const token = await getFactaToken();

    // Build form body conforme documentação v2.0
    // Campos: averbador, nome, cpf, celular, tipo_envio, matricula (opcional)
    const formData = new URLSearchParams();
    formData.append('averbador', '10010'); // Averbador CLT
    formData.append('nome', nome || 'Cliente');
    formData.append('cpf', cpfLimpo);
    formData.append('celular', celularFormatado);
    formData.append('tipo_envio', tipoEnvio);
    formData.append('representante_legal', 'N');

    console.log("Request body:", formData.toString());

    // Call Facta authorization API via proxy
    const factaRes = await callFactaApi(
      'POST',
      `${FACTA_BASE_URL}/solicita-autorizacao-consulta`,
      {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      formData.toString()
    );

    const responseText = await factaRes.text();
    console.log("Facta response:", responseText.substring(0, 500));

    // Check if response is HTML (error page)
    if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
      console.error("Facta returned HTML instead of JSON");
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Servidor Facta temporariamente indisponível" }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let factaData;
    try {
      factaData = JSON.parse(responseText);
    } catch {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Resposta inválida do servidor Facta" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = Array.isArray(factaData) ? factaData[0] : factaData;
    const mensagem = data?.mensagem || '';

    console.log("Parsed response:", JSON.stringify(data));

    // Check if already authorized - conforme doc v2.0
    if (mensagem.includes('Token válido') || mensagem.includes('Não necessita')) {
      return new Response(
        JSON.stringify({ sucesso: true, mensagem: "CPF já autorizado!", status: 'already_authorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for success - conforme doc v2.0: "Solicitação enviada com sucesso!"
    if (!data.erro && mensagem.includes('Solicitação enviada')) {
      return new Response(
        JSON.stringify({ 
          sucesso: true, 
          mensagem: "Código de autorização enviado!",
          status: 'code_sent'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for known error patterns
    const errorPatterns = [
      { pattern: 'Telefone já informado', friendly: 'Este telefone já está associado a outro CPF' },
      { pattern: 'inválida para {tipo_envio}', friendly: 'Tipo de envio inválido' },
      { pattern: 'CPF incorreto', friendly: 'CPF inválido' },
      { pattern: 'Averbador indisponível', friendly: 'Sistema temporariamente indisponível' },
    ];

    for (const errorPattern of errorPatterns) {
      if (mensagem.includes(errorPattern.pattern)) {
        return new Response(
          JSON.stringify({ sucesso: false, mensagem: errorPattern.friendly }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check for errors
    if (data.erro) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: mensagem || "Erro na solicitação" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Success (generic)
    return new Response(
      JSON.stringify({ 
        sucesso: true, 
        mensagem: mensagem || "Código de autorização enviado!",
        status: 'code_sent'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    return new Response(
      JSON.stringify({ sucesso: false, mensagem: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

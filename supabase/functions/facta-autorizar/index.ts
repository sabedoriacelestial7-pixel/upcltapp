// Facta authorization edge function - v2.0
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FACTA_BASE_URL = "https://webservice.facta.com.br";

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
    const celularLimpo = celular.replace(/\D/g, '');
    const tipoEnvio = canal === 'W' ? 'WHATSAPP' : 'SMS';

    console.log(`Auth request: CPF ${cpfLimpo.substring(0,3)}*** via ${tipoEnvio}`);

    // Get Facta token
    const authBasic = Deno.env.get('FACTA_AUTH_BASIC');
    if (!authBasic) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Credenciais Facta não configuradas" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokenRes = await fetch(`${FACTA_BASE_URL}/gera-token`, {
      method: 'GET',
      headers: { 'Authorization': authBasic }
    });

    if (!tokenRes.ok) {
      console.error("Token fetch failed:", tokenRes.status);
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: "Servidor Facta indisponível" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokenData = await tokenRes.json();
    if (tokenData.erro) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: tokenData.mensagem }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = tokenData.token;

    // Build form body
    const formData = new URLSearchParams();
    formData.append('averbador', '10010');
    formData.append('nome', nome || 'Cliente');
    formData.append('cpf', cpfLimpo);
    formData.append('celular', celularLimpo);
    formData.append('tipo_envio', tipoEnvio);

    // Call Facta authorization API
    const factaRes = await fetch(`${FACTA_BASE_URL}/solicita-autorizacao-consulta`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    const responseText = await factaRes.text();
    console.log("Facta response:", responseText.substring(0, 300));

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

    // Check if already authorized
    if (mensagem.includes('Token válido') || mensagem.includes('Não necessita')) {
      return new Response(
        JSON.stringify({ sucesso: true, mensagem: "CPF já autorizado!", status: 'already_authorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for errors
    if (data.erro) {
      return new Response(
        JSON.stringify({ sucesso: false, mensagem: mensagem || "Erro na solicitação" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Success
    return new Response(
      JSON.stringify({ 
        sucesso: true, 
        mensagem: "Código de autorização enviado!",
        status: 'code_sent'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ sucesso: false, mensagem: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

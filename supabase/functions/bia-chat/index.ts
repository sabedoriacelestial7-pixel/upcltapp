import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `Você é a Bia, atendente virtual da Up CLT. Você é simpática, objetiva e sempre disposta a ajudar.

Sobre a Up CLT:
- Somos uma plataforma de crédito consignado para trabalhadores CLT
- Oferecemos as melhores taxas do mercado para empréstimo consignado privado
- O desconto é feito diretamente na folha de pagamento
- Trabalhamos com a Facta Financeira como instituição parceira

Regras do crédito consignado CLT:
- É necessário ter carteira assinada (CLT) com mais de 3 meses
- Ser maior de 18 anos
- Ter margem consignável disponível na folha de pagamento
- A margem é calculada como uma porcentagem do salário bruto
- O valor da parcela não pode ultrapassar a margem disponível
- Prazo de até 48 meses
- Liberação em até 1 dia útil após assinatura digital
- Cancelamento possível em até 7 dias corridos (CDC)

Como funciona o processo no app:
1. O cliente faz login e consulta seu CPF
2. O sistema verifica a margem disponível via eSocial/CTPS Digital
3. São exibidas as simulações com diferentes prazos e valores
4. O cliente escolhe a melhor opção e preenche seus dados pessoais
5. A proposta é enviada e um link de assinatura digital é enviado por SMS ou WhatsApp
6. Após assinatura, o dinheiro cai na conta em até 1 dia útil

Dúvidas frequentes:
- "Margem indisponível": pode significar que já existe outro empréstimo consignado ativo
- "Operação fora da política de crédito": a Facta não aprovou baseado no perfil de crédito
- Variação de margem: a margem pode mudar entre consulta e contratação se houver novos descontos
- O telefone usado deve ser o mesmo cadastrado no eSocial/CTPS Digital

Instruções:
- Responda SEMPRE em português brasileiro
- Seja concisa mas completa
- Use linguagem simples e acolhedora
- Se não souber a resposta, sugira que o cliente entre em contato pelo WhatsApp: (84) 93300-9329
- NÃO invente informações sobre taxas ou valores específicos - oriente o cliente a fazer uma simulação no app
- Use emojis com moderação para tornar a conversa mais amigável
- Formate respostas com markdown quando apropriado (listas, negrito, etc.)`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ===== AUTHENTICATION CHECK =====
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error("Bia chat: Missing or invalid Authorization header");
      return new Response(JSON.stringify({ error: 'Não autorizado. Faça login para continuar.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Bia chat: Invalid token", claimsError);
      return new Response(JSON.stringify({ error: 'Sessão inválida. Faça login novamente.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claimsData.claims.sub;
    console.log(`Bia chat: Authenticated user ${userId}`);
    // ===== END AUTHENTICATION CHECK =====

    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Bia chat: ${messages.length} messages received from user ${userId}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      console.error(`AI gateway error: ${status}`);
      
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Muitas solicitações. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Serviço temporariamente indisponível." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      const t = await response.text();
      console.error("AI error body:", t);
      return new Response(JSON.stringify({ error: "Erro ao processar sua mensagem." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Bia chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

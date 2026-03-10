// Edge function for bulk offline margin consultation
// Accepts array of CPFs, queries Facta offline base, returns results
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FACTA_BASE_URL = "https://cltoff.facta.com.br";

let tokenCache: { token: string; expira: Date } | null = null;

async function getProxyUrl(): Promise<string> {
  const proxyUrl = Deno.env.get('FACTA_API_URL');
  if (!proxyUrl) throw new Error("FACTA_API_URL not configured");
  return proxyUrl;
}

async function proxyRequest(method: string, url: string, headers: Record<string, string>): Promise<any> {
  const proxyUrl = await getProxyUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, url, headers }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw new Error("Proxy unavailable");
  }
}

async function getFactaToken(): Promise<string> {
  if (tokenCache && new Date() < tokenCache.expira) return tokenCache.token;

  let authBasic = Deno.env.get('FACTA_AUTH_BASIC');
  if (!authBasic) throw new Error("FACTA_AUTH_BASIC not configured");
  if (!authBasic.startsWith('Basic ')) authBasic = `Basic ${authBasic}`;

  const data = await proxyRequest('GET', `${FACTA_BASE_URL}/gera-token`, {
    'Authorization': authBasic
  });

  if (data.erro) throw new Error(data.mensagem || "Failed to get token");

  tokenCache = { token: data.token, expira: new Date(Date.now() + 55 * 60 * 1000) };
  return data.token;
}

function parseValor(valor: string | number | undefined): number {
  if (valor === undefined || valor === null || valor === '') return 0;
  if (typeof valor === 'number') return valor;
  return parseFloat(valor.toString().replace(/\./g, '').replace(',', '.')) || 0;
}

// Coeficientes Facta CLT NOVO GOLD (parcela / valor_liberado)
const COEFICIENTES: Record<number, number> = {
  5: 0.258812, 6: 0.258812, 8: 0.205558, 10: 0.173927,
  12: 0.153060, 14: 0.138306, 15: 0.132458, 18: 0.119019,
  20: 0.112470, 24: 0.102963, 30: 0.083036, 36: 0.077260,
};

// Prioridade de prazos: maior primeiro
const PRAZOS_PRIORIDADE = [36, 24, 12, 6];

function calcularValorLiberado(valorParcela: number, parcelas: number = 36): number {
  const coef = COEFICIENTES[parcelas] || COEFICIENTES[36];
  return Math.round((valorParcela / coef) * 100) / 100;
}

// Converte centavos para reais e aplica 97% da margem (regra de parcela máxima)
function calcularParcelaMaxima(margemCentavos: number): number {
  const margemReais = margemCentavos / 100;
  return Math.floor(margemReais * 0.97 * 10) / 10;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ erro: true, mensagem: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ erro: true, mensagem: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ erro: true, mensagem: 'Acesso restrito a administradores' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { cpfs } = await req.json();
    if (!Array.isArray(cpfs) || cpfs.length === 0) {
      return new Response(JSON.stringify({ erro: true, mensagem: 'Lista de CPFs é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (cpfs.length > 500) {
      return new Response(JSON.stringify({ erro: true, mensagem: 'Máximo de 500 CPFs por lote' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const token = await getFactaToken();
    const resultados: any[] = [];

    for (const cpfRaw of cpfs) {
      const cpfLimpo = cpfRaw.toString().replace(/\D/g, '');
      if (cpfLimpo.length !== 11) {
        resultados.push({ cpf: cpfRaw, status: 'erro', mensagem: 'CPF inválido', dados: null });
        continue;
      }

      try {
        const factaData = await proxyRequest('GET',
          `${FACTA_BASE_URL}/clt/base-offline/debug?cpf=${cpfLimpo}`,
          { 'Authorization': `Bearer ${token}` }
        );

        if (factaData.erro || !factaData.dados || factaData.dados.length === 0) {
          resultados.push({
            cpf: cpfLimpo,
            status: 'nao_encontrado',
            mensagem: factaData.mensagem || 'CPF não encontrado na base offline',
            dados: null
          });
          continue;
        }

        const t = factaData.dados[0];
        const elegivel = t.elegivel === "S" || t.elegivel === "SIM" || t.elegivel === "1" || t.elegivel === true;

        const margemRaw = parseValor(t.valorMargemDisponivel);
        // Converter centavos → reais e aplicar 97%
        const parcelaMaxima = margemRaw > 0 ? calcularParcelaMaxima(margemRaw) : 0;
        
        // Usar maior prazo disponível: 36x → 24x → 12x → 6x
        let prazoEscolhido = PRAZOS_PRIORIDADE[0];
        // (todos os prazos estão nos coeficientes, usar 36x por padrão)
        
        const valorLiberado = parcelaMaxima > 0 ? calcularValorLiberado(parcelaMaxima, prazoEscolhido) : 0;

        resultados.push({
          cpf: cpfLimpo,
          status: elegivel ? 'elegivel' : 'inelegivel',
          mensagem: elegivel ? 'Margem disponível' : (t.motivoInelegibilidade_descricao || 'Não elegível'),
          dados: {
            nome: t.nome,
            matricula: t.matricula,
            valorMargemDisponivel: Math.round((margemRaw / 100) * 100) / 100,
            valorBaseMargem: Math.round((parseValor(t.valorBaseMargem) / 100) * 100) / 100,
            valorTotalVencimentos: Math.round((parseValor(t.valorTotalVencimentos) / 100) * 100) / 100,
            valorLiberado,
            valorParcela: parcelaMaxima,
            parcelas: prazoEscolhido,
            nomeEmpregador: t.nomeEmpregador,
            cnpjEmpregador: t.numeroInscricaoEmpregador,
            dataAdmissao: t.dataAdmissao,
            dataNascimento: t.dataNascimento,
            elegivel
          }
        });
      } catch (err) {
        resultados.push({
          cpf: cpfLimpo,
          status: 'erro',
          mensagem: 'Erro ao consultar',
          dados: null
        });
      }

      // Small delay to avoid rate limiting
      if (cpfs.length > 10) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    const resumo = {
      total: resultados.length,
      elegiveis: resultados.filter(r => r.status === 'elegivel').length,
      inelegiveis: resultados.filter(r => r.status === 'inelegivel').length,
      naoEncontrados: resultados.filter(r => r.status === 'nao_encontrado').length,
      erros: resultados.filter(r => r.status === 'erro').length,
    };

    return new Response(JSON.stringify({ erro: false, resumo, resultados }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("Bulk consultation error:", error);
    return new Response(JSON.stringify({ erro: true, mensagem: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

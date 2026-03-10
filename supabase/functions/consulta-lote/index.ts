// Edge function for bulk offline margin consultation + real Facta simulation
// Accepts array of CPFs, queries Facta offline base, then simulates for eligible ones
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FACTA_OFFLINE_URL = "https://cltoff.facta.com.br";
const FACTA_WS_URL = "https://webservice.facta.com.br";

let tokenCacheOffline: { token: string; expira: Date } | null = null;
let tokenCacheWs: { token: string; expira: Date } | null = null;

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

async function getFactaTokenOffline(): Promise<string> {
  if (tokenCacheOffline && new Date() < tokenCacheOffline.expira) return tokenCacheOffline.token;

  let authBasic = Deno.env.get('FACTA_AUTH_BASIC');
  if (!authBasic) throw new Error("FACTA_AUTH_BASIC not configured");
  if (!authBasic.startsWith('Basic ')) authBasic = `Basic ${authBasic}`;

  const data = await proxyRequest('GET', `${FACTA_OFFLINE_URL}/gera-token`, {
    'Authorization': authBasic
  });

  if (data.erro) throw new Error(data.mensagem || "Failed to get offline token");

  tokenCacheOffline = { token: data.token, expira: new Date(Date.now() + 55 * 60 * 1000) };
  return data.token;
}

async function getFactaTokenWs(): Promise<string> {
  if (tokenCacheWs && new Date() < tokenCacheWs.expira) return tokenCacheWs.token;

  let authBasic = Deno.env.get('FACTA_AUTH_BASIC');
  if (!authBasic) throw new Error("FACTA_AUTH_BASIC not configured");
  if (!authBasic.startsWith('Basic ')) authBasic = `Basic ${authBasic}`;

  const data = await proxyRequest('GET', `${FACTA_WS_URL}/gera-token`, {
    'Authorization': authBasic,
    'Accept': 'application/json'
  });

  if (data.erro) throw new Error(data.mensagem || "Failed to get WS token");

  tokenCacheWs = { token: data.token, expira: new Date(Date.now() + 55 * 60 * 1000) };
  return data.token;
}

function parseValor(valor: string | number | undefined): number {
  if (valor === undefined || valor === null || valor === '') return 0;
  if (typeof valor === 'number') return valor;
  return parseFloat(valor.toString().replace(/\./g, '').replace(',', '.')) || 0;
}

// Converte centavos para reais
function centavosToReais(centavos: number): number {
  return Math.round((centavos / 100) * 100) / 100;
}

// Aplica 97% da margem e trunca para 1 casa decimal
function calcularParcelaMaxima(margemCentavos: number): number {
  const margemReais = margemCentavos / 100;
  return Math.floor(margemReais * 0.97 * 10) / 10;
}

// Prioridade de prazos: maior primeiro
const PRAZOS_PRIORIDADE = [36, 30, 24, 20, 18, 15, 14, 12, 10, 8, 6, 5];

// Consulta operações disponíveis na API real da Facta (webservice)
// Converte data de YYYY-MM-DD para DD/MM/YYYY (formato Facta WS)
function formatDateForFacta(dateStr: string): string {
  if (!dateStr) return '';
  // Se já está em DD/MM/YYYY
  if (dateStr.includes('/')) return dateStr;
  // Converter de YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

async function consultarSimulacaoReal(
  token: string,
  cpf: string,
  dataNascimento: string,
  valorRenda: number,
  valorParcela: number
): Promise<{ valorLiberado: number; valorParcela: number; parcelas: number; codigoTabela: number | null; coeficiente: string | null; nomeTabela: string | null } | null> {
  try {
    const dataNascFormatada = formatDateForFacta(dataNascimento);
    
    const queryParams = new URLSearchParams({
      produto: 'D',
      tipo_operacao: '13',
      averbador: '10010',
      convenio: '3',
      opcao_valor: '2', // por valor da parcela
      cpf: cpf,
      data_nascimento: dataNascFormatada,
      valor_renda: valorRenda.toFixed(2),
      valor_parcela: valorParcela.toFixed(2),
    });

    console.log(`→ Simulação real para CPF ${cpf.substring(0, 3)}... dataNasc=${dataNascFormatada} renda=${valorRenda.toFixed(2)} parcela=${valorParcela.toFixed(2)}`);

    const result = await proxyRequest('GET',
      `${FACTA_WS_URL}/proposta/operacoes-disponiveis?${queryParams}`,
      {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    );

    // A API retorna os dados no campo 'tabelas' ou 'dados'
    const tabelas = result.tabelas || result.dados;
    
    if (result.erro || !tabelas || !Array.isArray(tabelas) || tabelas.length === 0) {
      console.log(`Simulação sem resultado para CPF ${cpf.substring(0, 3)}...: ${result.mensagem || 'sem tabelas'}`);
      return null;
    }

    // Filtrar tabelas COM seguro (prioridade) e pegar o maior prazo disponível
    
    // Log first table to see field names
    if (tabelas.length > 0) {
      console.log(`→ Campos da tabela: ${Object.keys(tabelas[0]).join(', ')}`);
      console.log(`→ Primeira tabela: ${JSON.stringify(tabelas[0])}`);
    }

    // Priorizar tabelas com seguro (valor_seguro > 0 ou nome contém "seguro")
    const tabelasComSeguro = tabelas.filter((t: any) =>
      (t.valor_seguro && parseFloat(t.valor_seguro) > 0) ||
      (t.tabela || t.nome_tabela || '').toLowerCase().includes('seguro')
    );

    const tabelasParaUsar = tabelasComSeguro.length > 0 ? tabelasComSeguro : tabelas;

    // Encontrar a tabela com o maior prazo
    let melhorTabela: any = null;
    let melhorPrazo = 0;

    for (const tabela of tabelasParaUsar) {
      const prazo = parseInt(tabela.prazo) || 0;
      if (prazo > melhorPrazo) {
        melhorPrazo = prazo;
        melhorTabela = tabela;
      }
    }

    if (!melhorTabela) {
      for (const prazoDesejado of PRAZOS_PRIORIDADE) {
        melhorTabela = tabelasParaUsar.find((t: any) => parseInt(t.prazo) === prazoDesejado);
        if (melhorTabela) break;
      }
    }

    if (!melhorTabela) {
      melhorTabela = tabelasParaUsar[0];
    }

    // Mapear campos (API retorna: valor_liquido, parcela, prazo, coeficiente, codigo_tabela, tabela, valor_seguro, taxa)
    const valorLiberadoReal = parseFloat(melhorTabela.valor_liquido || melhorTabela.valor_operacao || '0');
    const valorParcelaReal = parseFloat(melhorTabela.parcela || melhorTabela.valor_parcela || '0');
    const prazoReal = parseInt(melhorTabela.prazo) || 36;

    console.log(`→ Melhor tabela: prazo=${prazoReal}, liberado=${valorLiberadoReal}, parcela=${valorParcelaReal}, tabela=${melhorTabela.tabela || melhorTabela.nome_tabela}`);

    return {
      valorLiberado: Math.round(valorLiberadoReal * 100) / 100,
      valorParcela: Math.round(valorParcelaReal * 100) / 100,
      parcelas: prazoReal,
      codigoTabela: parseInt(melhorTabela.codigo_tabela || melhorTabela.codigoTabela) || null,
      coeficiente: (melhorTabela.coeficiente || '').toString(),
      nomeTabela: melhorTabela.tabela || melhorTabela.nome_tabela || null,
    };
  } catch (err) {
    console.error(`Erro na simulação real para CPF ${cpf.substring(0, 3)}...:`, err);
    return null;
  }
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

    const { cpfs, simular = true } = await req.json();
    if (!Array.isArray(cpfs) || cpfs.length === 0) {
      return new Response(JSON.stringify({ erro: true, mensagem: 'Lista de CPFs é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (cpfs.length > 500) {
      return new Response(JSON.stringify({ erro: true, mensagem: 'Máximo de 500 CPFs por lote' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const tokenOffline = await getFactaTokenOffline();
    let tokenWs: string | null = null;
    
    // Só obtém token WS se simulação estiver habilitada
    if (simular) {
      try {
        tokenWs = await getFactaTokenWs();
      } catch (err) {
        console.error("Erro ao obter token WS, simulação desabilitada:", err);
      }
    }

    const resultados: any[] = [];

    for (const cpfRaw of cpfs) {
      const cpfLimpo = cpfRaw.toString().replace(/\D/g, '');
      if (cpfLimpo.length !== 11) {
        resultados.push({ cpf: cpfRaw, status: 'erro', mensagem: 'CPF inválido', dados: null });
        continue;
      }

      try {
        // ETAPA 1: Consulta base offline
        const factaData = await proxyRequest('GET',
          `${FACTA_OFFLINE_URL}/clt/base-offline/debug?cpf=${cpfLimpo}`,
          { 'Authorization': `Bearer ${tokenOffline}` }
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
        const parcelaMaxima = margemRaw > 0 ? calcularParcelaMaxima(margemRaw) : 0;
        const rendaReais = centavosToReais(parseValor(t.valorTotalVencimentos));

        // Valores padrão (estimados localmente)
        let valorLiberado = 0;
        let valorParcela = parcelaMaxima;
        let parcelas = 36;
        let codigoTabela: number | null = null;
        let coeficiente: string | null = null;
        let nomeTabela: string | null = null;
        let simulacaoReal = false;

        // ETAPA 2: Simulação real via API Facta (só para elegíveis com margem > 0)
        if (elegivel && parcelaMaxima > 0 && tokenWs && t.dataNascimento) {
          const simResult = await consultarSimulacaoReal(
            tokenWs,
            cpfLimpo,
            t.dataNascimento,
            rendaReais,
            parcelaMaxima
          );

          if (simResult) {
            valorLiberado = simResult.valorLiberado;
            valorParcela = simResult.valorParcela;
            parcelas = simResult.parcelas;
            codigoTabela = simResult.codigoTabela;
            coeficiente = simResult.coeficiente;
            nomeTabela = simResult.nomeTabela;
            simulacaoReal = true;
          }
        }

        // Se não teve simulação real, calcular estimativa local
        if (!simulacaoReal && parcelaMaxima > 0) {
          // Coeficiente local para fallback
          const COEF_LOCAL: Record<number, number> = {
            6: 0.258812, 12: 0.153060, 24: 0.102963, 36: 0.077260,
          };
          const coef = COEF_LOCAL[36];
          valorLiberado = Math.round((parcelaMaxima / coef) * 100) / 100;
        }

        resultados.push({
          cpf: cpfLimpo,
          status: elegivel ? 'elegivel' : 'inelegivel',
          mensagem: elegivel ? 'Margem disponível' : (t.motivoInelegibilidade_descricao || 'Não elegível'),
          dados: {
            nome: t.nome,
            matricula: t.matricula,
            valorMargemDisponivel: centavosToReais(margemRaw),
            valorBaseMargem: centavosToReais(parseValor(t.valorBaseMargem)),
            valorTotalVencimentos: rendaReais,
            valorLiberado,
            valorParcela,
            parcelas,
            codigoTabela,
            coeficiente,
            nomeTabela,
            nomeEmpregador: t.nomeEmpregador,
            cnpjEmpregador: t.numeroInscricaoEmpregador,
            dataAdmissao: t.dataAdmissao,
            dataNascimento: t.dataNascimento,
            elegivel,
            simulacaoReal
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

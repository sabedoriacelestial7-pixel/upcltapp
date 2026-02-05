import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Proxy na VPS do cliente com IP liberado na Facta (via Cloudflare Tunnel)
const FACTA_BASE_URL = "https://webservice.facta.com.br";
const PROXY_URL = "https://mysql-metallica-solving-lined.trycloudflare.com";

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

// Helper function to call Facta API via proxy
async function callFactaApi(method: string, path: string, token: string, params?: Record<string, any>): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  const requestBody: any = {
    method: method,
    url: `${FACTA_BASE_URL}${path}`,
    headers: { 'Authorization': `Bearer ${token}` }
  };

  // For POST requests with form data
  if (method === 'POST' && params) {
    requestBody.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    requestBody.body = params;
  }

  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return await response.json();
  } catch (fetchError) {
    clearTimeout(timeoutId);
    console.error(`Failed to call Facta API: ${fetchError}`);
    throw new Error("Erro ao comunicar com a API Facta.");
  }
}

// Consulta operações disponíveis (tabelas e coeficientes)
async function consultarOperacoesDisponiveis(token: string, params: {
  cpf: string;
  dataNascimento: string;
  valorRenda: number;
  valorParcela?: number;
  prazo?: number;
}) {
  const queryParams = new URLSearchParams({
    produto: 'D',
    tipo_operacao: '13',
    averbador: '10010',
    convenio: '3',
    opcao_valor: params.valorParcela ? '2' : '1',
    cpf: params.cpf,
    data_nascimento: params.dataNascimento,
    valor_renda: params.valorRenda.toString(),
  });

  if (params.valorParcela) {
    queryParams.append('valor_parcela', params.valorParcela.toString());
  }
  if (params.prazo) {
    queryParams.append('prazo', params.prazo.toString());
  }

  console.log(`Consulting available operations for CPF: ${params.cpf.substring(0, 3)}...`);

  return await callFactaApi('GET', `/proposta/operacoes-disponiveis?${queryParams}`, token);
}

// Etapa 1 - Simulador
async function etapa1Simulador(token: string, params: {
  cpf: string;
  dataNascimento: string;
  loginCertificado: string;
  codigoTabela: number;
  prazo: number;
  valorOperacao: number;
  valorParcela: number;
  coeficiente: string;
  vendedor?: string;
}) {
  console.log(`Creating simulation for CPF: ${params.cpf.substring(0, 3)}...`);

  const formParams: Record<string, string> = {
    produto: 'D',
    tipo_operacao: '13',
    averbador: '10010',
    convenio: '3',
    cpf: params.cpf,
    data_nascimento: params.dataNascimento,
    login_certificado: params.loginCertificado,
    codigo_tabela: params.codigoTabela.toString(),
    prazo: params.prazo.toString(),
    valor_operacao: params.valorOperacao.toString(),
    valor_parcela: params.valorParcela.toString(),
    coeficiente: params.coeficiente,
  };
  
  if (params.vendedor) {
    formParams.vendedor = params.vendedor;
  }

  return await callFactaApi('POST', '/proposta/etapa1-simulador', token, formParams);
}

// Etapa 2 - Dados Pessoais
async function etapa2DadosPessoais(token: string, params: {
  idSimulador: string;
  cpf: string;
  nome: string;
  sexo: string;
  estadoCivil: string;
  dataNascimento: string;
  rg: string;
  estadoRg: string;
  orgaoEmissor: string;
  dataExpedicao: string;
  estadoNatural: string;
  cidadeNatural: string;
  nacionalidade?: string;
  celular: string;
  renda: number;
  cep: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  nomeMae: string;
  nomePai?: string;
  valorPatrimonio: string;
  clienteIletrado: string;
  tipoConta: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  matricula: string;
  email: string;
  tipoChavePix: string;
  chavePix: string;
  cnpjEmpregador?: string;
  dataAdmissao?: string;
}) {
  console.log(`Saving personal data for CPF: ${params.cpf.substring(0, 3)}...`);

  const formParams: Record<string, string> = {
    id_simulador: params.idSimulador,
    cpf: params.cpf,
    nome: params.nome,
    sexo: params.sexo,
    estado_civil: params.estadoCivil,
    data_nascimento: params.dataNascimento,
    rg: params.rg,
    estado_rg: params.estadoRg,
    orgao_emissor: params.orgaoEmissor,
    data_expedicao: params.dataExpedicao,
    estado_natural: params.estadoNatural,
    cidade_natural: params.cidadeNatural,
    nacionalidade: params.nacionalidade || '1',
    celular: params.celular,
    renda: params.renda.toString(),
    cep: params.cep,
    endereco: params.endereco,
    numero: params.numero,
    bairro: params.bairro,
    cidade: params.cidade,
    estado: params.estado,
    nome_mae: params.nomeMae,
    nome_pai: params.nomePai || 'NAO DECLARADO',
    valor_patrimonio: params.valorPatrimonio,
    cliente_iletrado_impossibilitado: params.clienteIletrado,
    tipo_conta: params.tipoConta,
    matricula: params.matricula,
    email: params.email,
    tipo_chave_pix: params.tipoChavePix,
    chave_pix: params.chavePix,
  };

  if (params.complemento) formParams.complemento = params.complemento;
  if (params.banco) {
    formParams.banco = params.banco;
    if (params.agencia) formParams.agencia = params.agencia;
    if (params.conta) formParams.conta = params.conta;
  }
  if (params.cnpjEmpregador) formParams.cnpj_empregador = params.cnpjEmpregador;
  if (params.dataAdmissao) formParams.data_admissao = params.dataAdmissao;

  return await callFactaApi('POST', '/proposta/etapa2-dados-pessoais', token, formParams);
}

// Etapa 3 - Proposta Cadastro
async function etapa3PropostaCadastro(token: string, params: {
  codigoCliente: string;
  idSimulador: string;
}) {
  console.log(`Creating proposal...`);

  return await callFactaApi('POST', '/proposta/etapa3-proposta-cadastro', token, {
    codigo_cliente: params.codigoCliente,
    id_simulador: params.idSimulador,
  });
}

// Enviar link de formalização
async function enviarLinkFormalizacao(token: string, params: {
  codigoAf: string;
  tipoEnvio: 'sms' | 'whatsapp';
}) {
  console.log(`Sending formalization link via ${params.tipoEnvio}...`);

  return await callFactaApi('POST', '/proposta/envio-link', token, {
    codigo_af: params.codigoAf,
    tipo_envio: params.tipoEnvio,
  });
}

// Consultar andamento de propostas
async function consultarAndamentoPropostas(token: string, params: {
  cpf?: string;
  propostas?: string;
  dataIni?: string;
  dataFim?: string;
}) {
  const queryParams = new URLSearchParams({
    convenio: '3',
    averbador: '10010',
  });

  if (params.cpf) queryParams.append('cpf', params.cpf);
  if (params.propostas) queryParams.append('propostas', params.propostas);
  if (params.dataIni) queryParams.append('data_ini', params.dataIni);
  if (params.dataFim) queryParams.append('data_fim', params.dataFim);

  console.log(`Consulting proposals status...`);

  return await callFactaApi('GET', `/proposta/andamento-propostas?${queryParams}`, token);
}

// Consultar ocorrências de proposta
async function consultarOcorrencias(token: string, codigoAf: string) {
  console.log(`Consulting occurrences for AF: ${codigoAf}...`);

  return await callFactaApi('GET', `/proposta/consulta-ocorrencias?af=${codigoAf}`, token);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ erro: true, mensagem: 'Unauthorized' }),
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
        JSON.stringify({ erro: true, mensagem: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;

    const { operacao, ...params } = await req.json();
    
    if (!operacao) {
      return new Response(
        JSON.stringify({ erro: true, mensagem: "Operação é obrigatória" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Facta token
    const token = await getFactaToken();
    let result: any;

    switch (operacao) {
      case 'operacoes-disponiveis':
        result = await consultarOperacoesDisponiveis(token, params);
        break;

      case 'etapa1-simulador':
        result = await etapa1Simulador(token, params);
        break;

      case 'etapa2-dados-pessoais':
        result = await etapa2DadosPessoais(token, params);
        break;

      case 'etapa3-proposta-cadastro':
        result = await etapa3PropostaCadastro(token, params);
        break;

      case 'envio-link':
        result = await enviarLinkFormalizacao(token, params);
        break;

      case 'andamento-propostas':
        result = await consultarAndamentoPropostas(token, params);
        break;

      case 'consulta-ocorrencias':
        result = await consultarOcorrencias(token, params.codigoAf);
        break;

      default:
        return new Response(
          JSON.stringify({ erro: true, mensagem: `Operação desconhecida: ${operacao}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`Operation ${operacao} result:`, JSON.stringify(result));

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in facta-operacoes function:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    return new Response(
      JSON.stringify({ erro: true, mensagem: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

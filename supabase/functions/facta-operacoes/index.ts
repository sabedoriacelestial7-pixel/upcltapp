// Edge function for Facta operations (simulation, proposal creation) - v2.0
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
  console.log("=== INÍCIO OBTENÇÃO TOKEN ===");
  
  const proxyUrl = Deno.env.get('FACTA_API_URL');
  
  if (tokenCache && new Date() < tokenCache.expira) {
    console.log("✓ Usando token em cache");
    return tokenCache.token;
  }

  const authBasic = Deno.env.get('FACTA_AUTH_BASIC');
  if (!authBasic) {
    throw new Error("FACTA_AUTH_BASIC não configurado");
  }

  if (!proxyUrl) {
    throw new Error("FACTA_API_URL não configurado");
  }

  console.log("→ Buscando novo token via proxy...");
  console.log("→ Proxy URL:", proxyUrl);
  
  // Garantir que o header tenha o prefixo "Basic "
  const authHeader = authBasic.startsWith('Basic ') ? authBasic : `Basic ${authBasic}`;
  
  const requestBody = {
    method: 'GET',
    url: `${FACTA_BASE_URL}/gera-token`,
    headers: { 
      'Authorization': authHeader,
      'Accept': 'application/json'
    }
  };
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error("✗ TIMEOUT atingido (30s)");
    controller.abort();
  }, 30000);
  
  let response: Response;
  
  try {
    const startTime = Date.now();
    console.log("→ Enviando requisição ao proxy...");
    
    response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'UpCLT-EdgeFunction/1.0',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    const elapsed = Date.now() - startTime;
    clearTimeout(timeoutId);
    
    console.log(`✓ Resposta recebida em ${elapsed}ms`);
    console.log("→ Status:", response.status);
    
  } catch (fetchError: any) {
    clearTimeout(timeoutId);
    console.error("✗ ERRO AO CONECTAR NO PROXY:");
    console.error("  - Nome:", fetchError.name);
    console.error("  - Mensagem:", fetchError.message);
    
    throw new Error(`Não foi possível conectar ao servidor proxy. Verifique se o túnel Cloudflare está ativo na VPS.`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error("✗ Erro na resposta do proxy:", errorText);
    throw new Error(`Proxy retornou erro: ${response.status}`);
  }

  let data;
  try {
    data = await response.json();
  } catch (parseError) {
    console.error("✗ Erro ao parsear JSON:", parseError);
    throw new Error("Resposta inválida do proxy");
  }

  console.log("→ Resposta do proxy:", JSON.stringify(data, null, 2));

  if (data.erro) {
    throw new Error(data.mensagem || "Erro ao obter token da Facta");
  }

  if (!data.token) {
    throw new Error("Token não retornado pela API Facta");
  }

  const expira = new Date();
  expira.setMinutes(expira.getMinutes() + 55);
  
  tokenCache = {
    token: data.token,
    expira: expira
  };

  console.log("✓ Token obtido e armazenado em cache");
  return data.token;
}

// Helper function to call Facta API via proxy with detailed logs
async function callFactaApi(method: string, path: string, token: string, params?: Record<string, any>): Promise<any> {
  console.log(`=== CHAMADA API FACTA: ${method} ${path} ===`);
  
  const proxyUrl = Deno.env.get('FACTA_API_URL');
  if (!proxyUrl) {
    throw new Error("FACTA_API_URL não configurado");
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error("✗ TIMEOUT atingido (30s)");
    controller.abort();
  }, 30000);

  const requestBody: any = {
    method: method,
    url: `${FACTA_BASE_URL}${path}`,
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  };

  // For POST requests with form data
  if (method === 'POST' && params) {
    requestBody.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    requestBody.body = params;
    console.log("→ Params:", JSON.stringify(params));
  }

  try {
    const startTime = Date.now();
    console.log("→ Enviando requisição ao proxy...");
    
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'UpCLT-EdgeFunction/1.0',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    const elapsed = Date.now() - startTime;
    clearTimeout(timeoutId);
    
    console.log(`✓ Resposta recebida em ${elapsed}ms`);
    console.log("→ Status:", response.status);
    
    const data = await response.json();
    console.log("→ Resposta:", JSON.stringify(data));
    
    return data;
    
  } catch (fetchError: any) {
    clearTimeout(timeoutId);
    console.error("✗ ERRO AO CHAMAR API FACTA:");
    console.error("  - Nome:", fetchError.name);
    console.error("  - Mensagem:", fetchError.message);
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

  console.log(`→ Consultando operações disponíveis para CPF: ${params.cpf.substring(0, 3)}...`);

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
  console.log(`→ Criando simulação para CPF: ${params.cpf.substring(0, 3)}...`);

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
  console.log(`→ Salvando dados pessoais para CPF: ${params.cpf.substring(0, 3)}...`);

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
  console.log(`→ Criando proposta...`);

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
  console.log(`→ Enviando link de formalização via ${params.tipoEnvio}...`);

  return await callFactaApi('POST', '/proposta/envio-link', token, {
    codigo_af: params.codigoAf,
    tipo_envio: params.tipoEnvio,
  });
}

// Consultar andamento de propostas - conforme doc v8.0
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
  if (params.propostas) queryParams.append('af', params.propostas);
  if (params.dataIni) queryParams.append('data_ini', params.dataIni);
  if (params.dataFim) queryParams.append('data_fim', params.dataFim);

  console.log(`→ Consultando status das propostas...`);

  return await callFactaApi('GET', `/proposta/andamento-propostas?${queryParams}`, token);
}

// Consultar ocorrências de proposta - conforme doc v8.0
async function consultarOcorrencias(token: string, codigoAf: string) {
  console.log(`→ Consultando ocorrências para AF: ${codigoAf}...`);

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
    
    console.log("\n========================================");
    console.log(`NOVA REQUISIÇÃO - Operação: ${operacao}`);
    console.log(`User ID: ${userId}`);
    console.log("========================================\n");
    
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

    console.log(`✓ Operação ${operacao} concluída com sucesso`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("\n✗✗✗ ERRO GERAL ✗✗✗");
    console.error("Nome:", error.name);
    console.error("Mensagem:", error.message);
    console.error("Stack:", error.stack);
    
    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    return new Response(
      JSON.stringify({ erro: true, mensagem: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

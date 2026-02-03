import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Proxy na VPS do cliente com IP liberado na Facta (via Cloudflare Tunnel)
const FACTA_BASE_URL = "https://roger-removing-fits-individuals.trycloudflare.com";

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

  console.log("Fetching new Facta token from webservice...");
  
  const response = await fetch(`${FACTA_BASE_URL}/gera-token`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${authBasic}`,
      'Accept': 'application/json'
    }
  });

  const responseText = await response.text();
  console.log("Token response status:", response.status);
  console.log("Token response text:", responseText.substring(0, 200));
  
  let data;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    throw new Error(`Failed to parse token response: ${responseText.substring(0, 100)}`);
  }
  
  if (data.erro) {
    throw new Error(data.mensagem || "Failed to get Facta token");
  }

  tokenCache = {
    token: data.token,
    expira: new Date(Date.now() + 55 * 60 * 1000)
  };

  return data.token;
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

  const response = await fetch(
    `${FACTA_BASE_URL}/proposta/operacoes-disponiveis?${queryParams}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return await response.json();
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

  const formData = new FormData();
  formData.append('produto', 'D');
  formData.append('tipo_operacao', '13');
  formData.append('averbador', '10010');
  formData.append('convenio', '3');
  formData.append('cpf', params.cpf);
  formData.append('data_nascimento', params.dataNascimento);
  formData.append('login_certificado', params.loginCertificado);
  formData.append('codigo_tabela', params.codigoTabela.toString());
  formData.append('prazo', params.prazo.toString());
  formData.append('valor_operacao', params.valorOperacao.toString());
  formData.append('valor_parcela', params.valorParcela.toString());
  formData.append('coeficiente', params.coeficiente);
  
  if (params.vendedor) {
    formData.append('vendedor', params.vendedor);
  }

  const response = await fetch(
    `${FACTA_BASE_URL}/proposta/etapa1-simulador`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }
  );

  return await response.json();
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

  const formData = new FormData();
  formData.append('id_simulador', params.idSimulador);
  formData.append('cpf', params.cpf);
  formData.append('nome', params.nome);
  formData.append('sexo', params.sexo);
  formData.append('estado_civil', params.estadoCivil);
  formData.append('data_nascimento', params.dataNascimento);
  formData.append('rg', params.rg);
  formData.append('estado_rg', params.estadoRg);
  formData.append('orgao_emissor', params.orgaoEmissor);
  formData.append('data_expedicao', params.dataExpedicao);
  formData.append('estado_natural', params.estadoNatural);
  formData.append('cidade_natural', params.cidadeNatural);
  formData.append('nacionalidade', params.nacionalidade || '1');
  formData.append('celular', params.celular);
  formData.append('renda', params.renda.toString());
  formData.append('cep', params.cep);
  formData.append('endereco', params.endereco);
  formData.append('numero', params.numero);
  if (params.complemento) formData.append('complemento', params.complemento);
  formData.append('bairro', params.bairro);
  formData.append('cidade', params.cidade);
  formData.append('estado', params.estado);
  formData.append('nome_mae', params.nomeMae);
  formData.append('nome_pai', params.nomePai || 'NAO DECLARADO');
  formData.append('valor_patrimonio', params.valorPatrimonio);
  formData.append('cliente_iletrado_impossibilitado', params.clienteIletrado);
  formData.append('tipo_conta', params.tipoConta);
  
  if (params.banco) {
    formData.append('banco', params.banco);
    if (params.agencia) formData.append('agencia', params.agencia);
    if (params.conta) formData.append('conta', params.conta);
  }
  
  formData.append('matricula', params.matricula);
  formData.append('email', params.email);
  formData.append('tipo_chave_pix', params.tipoChavePix);
  formData.append('chave_pix', params.chavePix);
  
  if (params.cnpjEmpregador) formData.append('cnpj_empregador', params.cnpjEmpregador);
  if (params.dataAdmissao) formData.append('data_admissao', params.dataAdmissao);

  const response = await fetch(
    `${FACTA_BASE_URL}/proposta/etapa2-dados-pessoais`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }
  );

  return await response.json();
}

// Etapa 3 - Proposta Cadastro
async function etapa3PropostaCadastro(token: string, params: {
  codigoCliente: string;
  idSimulador: string;
}) {
  console.log(`Creating proposal...`);

  const formData = new FormData();
  formData.append('codigo_cliente', params.codigoCliente);
  formData.append('id_simulador', params.idSimulador);

  const response = await fetch(
    `${FACTA_BASE_URL}/proposta/etapa3-proposta-cadastro`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }
  );

  return await response.json();
}

// Enviar link de formalização
async function enviarLinkFormalizacao(token: string, params: {
  codigoAf: string;
  tipoEnvio: 'sms' | 'whatsapp';
}) {
  console.log(`Sending formalization link via ${params.tipoEnvio}...`);

  const formData = new FormData();
  formData.append('codigo_af', params.codigoAf);
  formData.append('tipo_envio', params.tipoEnvio);

  const response = await fetch(
    `${FACTA_BASE_URL}/proposta/envio-link`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }
  );

  return await response.json();
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

  const response = await fetch(
    `${FACTA_BASE_URL}/proposta/andamento-propostas?${queryParams}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return await response.json();
}

// Consultar ocorrências de proposta
async function consultarOcorrencias(token: string, codigoAf: string) {
  console.log(`Consulting occurrences for AF: ${codigoAf}...`);

  const response = await fetch(
    `${FACTA_BASE_URL}/proposta/consulta-ocorrencias?af=${codigoAf}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return await response.json();
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

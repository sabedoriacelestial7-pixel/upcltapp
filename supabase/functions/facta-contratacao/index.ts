import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FACTA_BASE_URL = "https://webservice.facta.com.br";
const PROXY_URL = "https://subsidiaries-flow-intelligent-clicking.trycloudflare.com/proxy";

// Mapeamento de UF para código IBGE do estado
const UF_TO_IBGE: Record<string, string> = {
  'AC': '12', 'AL': '27', 'AP': '16', 'AM': '13', 'BA': '29',
  'CE': '23', 'DF': '53', 'ES': '32', 'GO': '52', 'MA': '21',
  'MT': '51', 'MS': '50', 'MG': '31', 'PA': '15', 'PB': '25',
  'PR': '41', 'PE': '26', 'PI': '22', 'RJ': '33', 'RN': '24',
  'RS': '43', 'RO': '11', 'RR': '14', 'SC': '42', 'SP': '35',
  'SE': '28', 'TO': '17'
};

// Token cache
let tokenCache: { token: string; expira: Date } | null = null;

async function getFactaToken(): Promise<string> {
  if (tokenCache && new Date() < tokenCache.expira) {
    return tokenCache.token;
  }

  const authBasic = Deno.env.get('FACTA_AUTH_BASIC');
  if (!authBasic) {
    throw new Error("FACTA_AUTH_BASIC not configured");
  }

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
    throw new Error("Não foi possível conectar ao servidor proxy.");
  }

  const data = await response.json();
  if (data.erro) {
    throw new Error(data.mensagem || "Failed to get Facta token");
  }

  tokenCache = {
    token: data.token,
    expira: new Date(Date.now() + 55 * 60 * 1000)
  };

  return data.token;
}

async function proxyPost(url: string, token: string, formData: Record<string, string>): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'POST',
        url: url,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return await response.json();
  } catch (fetchError) {
    clearTimeout(timeoutId);
    throw new Error("Não foi possível conectar ao servidor proxy.");
  }
}

interface ContratacaoParams {
  cpf: string;
  dataNascimento: string;
  valorRenda: number;
  matricula: string;
  cnpjEmpregador?: string;
  dataAdmissao?: string;
  codigoTabela: number;
  prazo: number;
  valorOperacao: number;
  valorParcela: number;
  coeficiente: string;
  bancoId: string;
  bancoNome: string;
  nome: string;
  sexo: string;
  estadoCivil: string;
  rg: string;
  estadoRg: string;
  orgaoEmissor: string;
  dataExpedicao: string;
  estadoNatural: string;
  cidadeNatural: string;
  cidadeNaturalNome: string; // Nome da cidade natural (ex: "Cariacica")
  celular: string;
  email: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  cidadeNome: string; // Nome da cidade do endereço (ex: "Guarapari")
  estado: string;
  nomeMae: string;
  nomePai?: string;
  tipoConta: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  tipoChavePix: string;
  chavePix: string;
  tipoEnvio: 'sms' | 'whatsapp';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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

    const userId = claimsData.claims.sub as string;
    const params: ContratacaoParams = await req.json();

    console.log(`Starting contracting process for CPF: ${params.cpf.substring(0, 3)}...`);

    const token = await getFactaToken();
    const loginCertificado = Deno.env.get('FACTA_LOGIN_CERTIFICADO') || '1024';

    // Step 1: Create simulation
    console.log("Step 1: Creating simulation...");
    const simuladorFormData: Record<string, string> = {
      produto: 'D',
      tipo_operacao: '13',
      averbador: '10010',
      convenio: '3',
      cpf: params.cpf,
      data_nascimento: params.dataNascimento,
      login_certificado: loginCertificado,
      codigo_tabela: params.codigoTabela.toString(),
      prazo: params.prazo.toString(),
      valor_operacao: params.valorOperacao.toString(),
      valor_parcela: params.valorParcela.toString(),
      coeficiente: params.coeficiente
    };

    const simuladorResult = await proxyPost(
      `${FACTA_BASE_URL}/proposta/etapa1-simulador`,
      token,
      simuladorFormData
    );
    console.log("Simulator result:", JSON.stringify(simuladorResult));

    if (simuladorResult.erro) {
      await supabase.from('proposals').insert({
        user_id: userId,
        cpf: params.cpf,
        nome: params.nome,
        celular: params.celular,
        email: params.email,
        banco_id: params.bancoId,
        banco_nome: params.bancoNome,
        codigo_tabela: params.codigoTabela,
        valor_operacao: params.valorOperacao,
        valor_parcela: params.valorParcela,
        parcelas: params.prazo,
        coeficiente: parseFloat(params.coeficiente),
        status: 'erro_simulacao',
        api_response: simuladorResult
      });

      return new Response(
        JSON.stringify({ 
          erro: true, 
          mensagem: simuladorResult.mensagem || "Erro ao criar simulação",
          etapa: 'simulador'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const idSimulador = simuladorResult.id_simulador;

    // Step 2: Save personal data
    console.log("Step 2: Saving personal data...");
    
    // Garante que CEP está apenas com números
    const cepLimpo = params.cep.replace(/\D/g, '');
    
    // A API Facta espera o NOME da cidade em texto, não o código IBGE
    console.log("Address data - cidade (nome):", params.cidadeNome, "estado:", params.estado, "cep:", cepLimpo);
    console.log("Natural data - cidade_natural (nome):", params.cidadeNaturalNome, "estado_natural:", params.estadoNatural);
    
    const dadosFormData: Record<string, string> = {
      id_simulador: idSimulador,
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
      cidade_natural: params.cidadeNaturalNome, // Envia NOME da cidade, não código IBGE
      nacionalidade: '1',
      celular: params.celular,
      renda: params.valorRenda.toString(),
      cep: cepLimpo,
      endereco: params.endereco,
      numero: params.numero,
      bairro: params.bairro,
      cidade: params.cidadeNome, // Envia NOME da cidade, não código IBGE
      estado: params.estado,
      nome_mae: params.nomeMae,
      nome_pai: params.nomePai || 'NAO DECLARADO',
      valor_patrimonio: '1',
      cliente_iletrado_impossibilitado: 'N',
      tipo_conta: params.tipoConta,
      matricula: params.matricula,
      email: params.email,
      tipo_chave_pix: params.tipoChavePix,
      chave_pix: params.chavePix
    };

    if (params.complemento) dadosFormData.complemento = params.complemento;
    if (params.banco) {
      dadosFormData.banco = params.banco;
      if (params.agencia) dadosFormData.agencia = params.agencia;
      if (params.conta) dadosFormData.conta = params.conta;
    }
    if (params.cnpjEmpregador) dadosFormData.cnpj_empregador = params.cnpjEmpregador;
    if (params.dataAdmissao) dadosFormData.data_admissao = params.dataAdmissao;

    const dadosResult = await proxyPost(
      `${FACTA_BASE_URL}/proposta/etapa2-dados-pessoais`,
      token,
      dadosFormData
    );
    console.log("Personal data result:", JSON.stringify(dadosResult));

    if (dadosResult.erro) {
      await supabase.from('proposals').insert({
        user_id: userId,
        cpf: params.cpf,
        nome: params.nome,
        celular: params.celular,
        email: params.email,
        banco_id: params.bancoId,
        banco_nome: params.bancoNome,
        codigo_tabela: params.codigoTabela,
        valor_operacao: params.valorOperacao,
        valor_parcela: params.valorParcela,
        parcelas: params.prazo,
        coeficiente: parseFloat(params.coeficiente),
        id_simulador: idSimulador,
        status: 'erro_dados',
        api_response: dadosResult
      });

      return new Response(
        JSON.stringify({ 
          erro: true, 
          mensagem: dadosResult.mensagem || "Erro ao salvar dados pessoais",
          etapa: 'dados-pessoais'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const codigoCliente = dadosResult.codigo_cliente;

    // Step 3: Create proposal
    console.log("Step 3: Creating proposal...");
    const propostaResult = await proxyPost(
      `${FACTA_BASE_URL}/proposta/etapa3-proposta-cadastro`,
      token,
      { codigo_cliente: codigoCliente, id_simulador: idSimulador }
    );
    console.log("Proposal result:", JSON.stringify(propostaResult));

    if (propostaResult.erro) {
      await supabase.from('proposals').insert({
        user_id: userId,
        cpf: params.cpf,
        nome: params.nome,
        celular: params.celular,
        email: params.email,
        banco_id: params.bancoId,
        banco_nome: params.bancoNome,
        codigo_tabela: params.codigoTabela,
        valor_operacao: params.valorOperacao,
        valor_parcela: params.valorParcela,
        parcelas: params.prazo,
        coeficiente: parseFloat(params.coeficiente),
        id_simulador: idSimulador,
        codigo_cliente: codigoCliente,
        status: 'erro_proposta',
        api_response: propostaResult
      });

      return new Response(
        JSON.stringify({ 
          erro: true, 
          mensagem: propostaResult.mensagem || "Erro ao criar proposta",
          etapa: 'proposta'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const codigoAf = propostaResult.codigo;
    const urlFormalizacao = propostaResult.url_formalizacao;

    // Step 4: Send formalization link
    console.log("Step 4: Sending formalization link...");
    const linkResult = await proxyPost(
      `${FACTA_BASE_URL}/proposta/envio-link`,
      token,
      { codigo_af: codigoAf, tipo_envio: params.tipoEnvio }
    );
    console.log("Link sending result:", JSON.stringify(linkResult));

    // Save successful proposal
    const { data: proposal, error: insertError } = await supabase.from('proposals').insert({
      user_id: userId,
      cpf: params.cpf,
      nome: params.nome,
      celular: params.celular,
      email: params.email,
      banco_id: params.bancoId,
      banco_nome: params.bancoNome,
      codigo_tabela: params.codigoTabela,
      valor_operacao: params.valorOperacao,
      valor_parcela: params.valorParcela,
      parcelas: params.prazo,
      coeficiente: parseFloat(params.coeficiente),
      id_simulador: idSimulador,
      codigo_cliente: codigoCliente,
      codigo_af: codigoAf,
      url_formalizacao: urlFormalizacao,
      status: 'aguardando_assinatura',
      api_response: {
        simulador: simuladorResult,
        dados: dadosResult,
        proposta: propostaResult,
        link: linkResult
      }
    }).select().single();

    if (insertError) {
      console.error("Error saving proposal:", insertError);
    }

    return new Response(
      JSON.stringify({
        erro: false,
        mensagem: "Proposta criada com sucesso! Link de assinatura enviado.",
        proposta: {
          id: proposal?.id,
          codigoAf,
          urlFormalizacao,
          status: 'aguardando_assinatura'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in facta-contratacao function:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    return new Response(
      JSON.stringify({ erro: true, mensagem: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
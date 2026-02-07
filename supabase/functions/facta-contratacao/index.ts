// Edge function for Facta contract creation - v2.0
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FACTA_BASE_URL = "https://webservice.facta.com.br";
const PROXY_URL = Deno.env.get('FACTA_API_URL') || "https://api.upclt.app";

// Mapeamento de UF para código IBGE do estado (2 dígitos)
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
  // Garantir que o header tenha o prefixo "Basic "
  const authHeader = authBasic.startsWith('Basic ') ? authBasic : `Basic ${authBasic}`;

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
        headers: { 'Authorization': authHeader }
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

// Consulta código da cidade na API Facta (eles usam códigos internos, não IBGE)
// Endpoint: GET /proposta-combos/cidade?estado=X&nome_cidade=Y
async function consultarCodigoCidadeFacta(token: string, estado: string, nomeCidade: string): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const params = new URLSearchParams({
      estado: estado.toLowerCase(),
      nome_cidade: nomeCidade
    });
    
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'GET',
        url: `${FACTA_BASE_URL}/proposta-combos/cidade?${params}`,
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    const data = await response.json();
    console.log(`Facta cidade lookup for "${nomeCidade}" in ${estado}:`, JSON.stringify(data));
    
    if (data.erro || !data.cidade) {
      return null;
    }
    
    // Retorna o primeiro código encontrado
    const codigos = Object.keys(data.cidade);
    if (codigos.length > 0) {
      return codigos[0];
    }
    return null;
  } catch (fetchError) {
    clearTimeout(timeoutId);
    console.error(`Failed to lookup city code: ${fetchError}`);
    return null;
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
  cpfConjuge?: string;
  nomeConjuge?: string;
  rg: string;
  estadoRg: string;
  orgaoEmissor: string;
  dataExpedicao: string;
  estadoNatural: string;
  cidadeNatural: string;
  cidadeNaturalNome: string;
  celular: string;
  email: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  cidadeNome: string;
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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ erro: true, mensagem: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const params: ContratacaoParams = await req.json();

    console.log(`Starting contracting process for CPF: ${params.cpf.substring(0, 3)}...`);
    console.log(`Estado civil: ${params.estadoCivil}, CPF conjuge: ${params.cpfConjuge || 'N/A'}`);
    console.log(`Data nascimento received: ${params.dataNascimento}`);

    const token = await getFactaToken();
    const loginCertificado = Deno.env.get('FACTA_LOGIN_CERTIFICADO') || '1024';

    // Step 1: Create simulation - conforme doc API Facta
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
      coeficiente: params.coeficiente,
      matricula: params.matricula
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

      // Extrai limites - campos diretos OU parseando da mensagem de texto
      const msg = simuladorResult.mensagem || '';
      let prestacaoMaxima: number | null = parseFloat(simuladorResult.prestacao_maxima) || null;
      let prazoMaximo: number | null = parseInt(simuladorResult.prazo_maximo) || null;
      let prazoMinimo: number | null = null;

      // Tenta extrair limites da mensagem quando não vêm em campos separados
      if (!prestacaoMaxima) {
        const matchValor = msg.match(/R\$\s*([\d.,]+)/i);
        if (matchValor) prestacaoMaxima = parseFloat(matchValor[1].replace(/\./g, '').replace(',', '.')) || null;
      }
      if (!prazoMaximo) {
        const matchPrazoMax = msg.match(/prazo\s*m[áa]ximo\s*(?:[ée]\s*(?:de\s*)?)(\d+)/i);
        if (matchPrazoMax) prazoMaximo = parseInt(matchPrazoMax[1]) || null;
      }
      if (!prazoMinimo) {
        const matchPrazoMin = msg.match(/prazo\s*m[ií]nimo\s*(?:[ée]\s*(?:de\s*)?)(\d+)/i);
        if (matchPrazoMin) prazoMinimo = parseInt(matchPrazoMin[1]) || null;
      }

      const hasLimits = prestacaoMaxima || prazoMaximo || prazoMinimo;
      
      return new Response(
        JSON.stringify({ 
          erro: true, 
          mensagem: msg || "Erro ao criar simulação",
          etapa: 'simulador',
          ...(hasLimits && {
            limites: {
              prestacaoMaxima,
              prazoMaximo,
              prazoMinimo
            }
          })
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const idSimulador = simuladorResult.id_simulador;

    // Step 2: Save personal data
    console.log("Step 2: Saving personal data...");
    
    // Garante que CEP está apenas com números
    const cepLimpo = params.cep.replace(/\D/g, '');
    
    // A Facta usa códigos internos próprios para cidades, NÃO códigos IBGE!
    // Consulta via endpoint /proposta-combos/cidade
    console.log("Looking up Facta city codes...");
    console.log("City name for address:", params.cidadeNome, "state:", params.estado);
    console.log("City name for natural:", params.cidadeNaturalNome, "state:", params.estadoNatural);
    
    // Consulta códigos das cidades na API Facta
    const [cidadeCodigoFacta, cidadeNaturalCodigoFacta] = await Promise.all([
      consultarCodigoCidadeFacta(token, params.estado, params.cidadeNome),
      consultarCodigoCidadeFacta(token, params.estadoNatural, params.cidadeNaturalNome)
    ]);
    
    console.log("Facta city codes - cidade:", cidadeCodigoFacta, "cidade_natural:", cidadeNaturalCodigoFacta);
    
    if (!cidadeCodigoFacta) {
      return new Response(
        JSON.stringify({ 
          erro: true, 
          mensagem: `Cidade "${params.cidadeNome}" não encontrada no cadastro Facta para o estado ${params.estado}`,
          etapa: 'dados-pessoais'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!cidadeNaturalCodigoFacta) {
      return new Response(
        JSON.stringify({ 
          erro: true, 
          mensagem: `Cidade natural "${params.cidadeNaturalNome}" não encontrada no cadastro Facta para o estado ${params.estadoNatural}`,
          etapa: 'dados-pessoais'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Consultar código do órgão emissor na Facta
    let orgaoEmissorCodigo = params.orgaoEmissor;
    try {
      const orgaoResponse = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'GET',
          url: `${FACTA_BASE_URL}/proposta-combos/orgao-emissor`,
          headers: { 'Authorization': `Bearer ${token}` }
        })
      });
      const orgaoData = await orgaoResponse.json();
      console.log("Orgao emissor combos:", JSON.stringify(orgaoData).substring(0, 500));
      
      if (orgaoData.orgao_emissor) {
        const siglaUpper = params.orgaoEmissor.toUpperCase().trim();
        // Primeiro verifica se a sigla já é uma chave válida
        if (orgaoData.orgao_emissor[siglaUpper] || orgaoData.orgao_emissor[params.orgaoEmissor]) {
          orgaoEmissorCodigo = orgaoData.orgao_emissor[siglaUpper] ? siglaUpper : params.orgaoEmissor;
          console.log(`Orgao emissor "${params.orgaoEmissor}" is already a valid key: "${orgaoEmissorCodigo}"`);
        } else {
          // Fallback: procura nas values
          const entries = Object.entries(orgaoData.orgao_emissor);
          const match = entries.find(([key, nome]) => 
            key.toUpperCase() === siglaUpper || (nome as string).toUpperCase().includes(siglaUpper)
          );
          if (match) {
            orgaoEmissorCodigo = match[0];
            console.log(`Mapped orgao emissor "${params.orgaoEmissor}" -> code "${orgaoEmissorCodigo}"`);
          } else {
            console.log(`WARNING: orgao emissor "${params.orgaoEmissor}" not found in Facta combos. Available keys: ${Object.keys(orgaoData.orgao_emissor).join(', ')}`);
          }
        }
      }
    } catch (e) {
      console.error("Failed to lookup orgao emissor:", e);
    }

    const dadosFormData: Record<string, string> = {
      id_simulador: idSimulador,
      cpf: params.cpf,
      nome: params.nome,
      sexo: params.sexo,
      estado_civil: params.estadoCivil,
      data_nascimento: params.dataNascimento,
      rg: params.rg,
      estado_rg: params.estadoRg,
      orgao_emissor: orgaoEmissorCodigo,
      data_expedicao: params.dataExpedicao,
      estado_natural: params.estadoNatural,
      cidade_natural: cidadeNaturalCodigoFacta,
      nacionalidade: '1',
      celular: params.celular,
      renda: params.valorRenda.toString(),
      cep: cepLimpo,
      endereco: params.endereco,
      numero: params.numero,
      bairro: params.bairro,
      cidade: cidadeCodigoFacta,
      estado: params.estado,
    };

    // Facta exige dados do cônjuge - envia dados do próprio cliente como fallback
    dadosFormData.cpf_conjuge = params.cpf;
    dadosFormData.nome_conjuge = params.nome;
    dadosFormData.nascimento_conjuge = params.dataNascimento;

    dadosFormData.nome_mae = params.nomeMae;
    dadosFormData.nome_pai = params.nomePai || 'NAO DECLARADO';
    dadosFormData.valor_patrimonio = '1';
    dadosFormData.cliente_iletrado_impossibilitado = 'N';
    dadosFormData.tipo_conta = params.tipoConta;
    dadosFormData.matricula = params.matricula;
    dadosFormData.email = params.email;
    dadosFormData.tipo_chave_pix = params.tipoChavePix;
    dadosFormData.chave_pix = params.chavePix;

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

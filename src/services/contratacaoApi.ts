import { supabase } from '@/integrations/supabase/client';

export interface TabelaOperacao {
  tabela: string;
  codigoTabela: number;
  convenio: string;
  idConvenio: number;
  tipoOperacao: string;
  idTipoOperacao: number;
  averbador: string;
  idAverbador: number;
  taxa: number;
  prazo: number;
  coeficiente: number;
  contrato: number;
  parcela: number;
  valor_seguro: number;
  valor_liquido: number;
  saldo_devedor: number;
}

export interface OperacoesDisponiveisResult {
  erro: boolean;
  tabelas?: TabelaOperacao[];
  mensagem?: string;
}

export async function consultarOperacoesDisponiveis(params: {
  cpf: string;
  dataNascimento: string;
  valorRenda: number;
  valorParcela?: number;
  prazo?: number;
}): Promise<OperacoesDisponiveisResult> {
  const { data, error } = await supabase.functions.invoke('facta-operacoes', {
    body: {
      operacao: 'operacoes-disponiveis',
      ...params
    }
  });

  if (error) {
    console.error('Error calling facta-operacoes:', error);
    return {
      erro: true,
      mensagem: error.message || 'Erro ao consultar operações disponíveis'
    };
  }

  return data as OperacoesDisponiveisResult;
}

export interface DadosPessoaisContratacao {
  // Dados da margem/simulação
  cpf: string;
  dataNascimento: string;
  valorRenda: number;
  matricula: string;
  cnpjEmpregador?: string;
  dataAdmissao?: string;
  
  // Dados da operação
  codigoTabela: number;
  prazo: number;
  valorOperacao: number;
  valorParcela: number;
  coeficiente: string;
  bancoId: string;
  bancoNome: string;
  
  // Dados pessoais
  nome: string;
  sexo: string;
  estadoCivil: string;
  rg: string;
  estadoRg: string;
  orgaoEmissor: string;
  dataExpedicao: string;
  estadoNatural: string;
  cidadeNatural: string;
  cidadeNaturalNome: string; // Nome da cidade natural para API Facta
  celular: string;
  email: string;
  
  // Endereço
  cep: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  cidadeNome: string; // Nome da cidade para API Facta
  estado: string;
  
  // Filiação
  nomeMae: string;
  nomePai?: string;
  
  // Bancários
  tipoConta: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  tipoChavePix: string;
  chavePix: string;
  
  // Envio
  tipoEnvio: 'sms' | 'whatsapp';
}

export interface ContratacaoResult {
  erro: boolean;
  mensagem: string;
  etapa?: string;
  proposta?: {
    id: string;
    codigoAf: string;
    urlFormalizacao: string;
    status: string;
  };
}

export async function realizarContratacao(dados: DadosPessoaisContratacao): Promise<ContratacaoResult> {
  const { data, error } = await supabase.functions.invoke('facta-contratacao', {
    body: dados
  });

  if (error) {
    console.error('Error calling facta-contratacao:', error);
    return {
      erro: true,
      mensagem: error.message || 'Erro ao realizar contratação'
    };
  }

  return data as ContratacaoResult;
}

export interface Proposta {
  id: string;
  user_id: string;
  cpf: string;
  nome: string;
  celular: string | null;
  email: string | null;
  banco_id: string;
  banco_nome: string;
  codigo_tabela: number | null;
  valor_operacao: number;
  valor_parcela: number;
  parcelas: number;
  taxa_mensal: number | null;
  coeficiente: number | null;
  id_simulador: string | null;
  codigo_cliente: string | null;
  codigo_af: string | null;
  url_formalizacao: string | null;
  status: string;
  status_facta: string | null;
  status_crivo: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropostasResult {
  erro: boolean;
  propostas?: Proposta[];
  mensagem?: string;
}

export async function listarPropostas(): Promise<PropostasResult> {
  const { data, error } = await supabase.functions.invoke('facta-propostas', {
    body: {}
  });

  if (error) {
    console.error('Error calling facta-propostas:', error);
    return {
      erro: true,
      mensagem: error.message || 'Erro ao listar propostas'
    };
  }

  return data as PropostasResult;
}

export async function atualizarStatusPropostas(): Promise<PropostasResult> {
  const { data, error } = await supabase.functions.invoke('facta-propostas?action=atualizar', {
    body: {}
  });

  if (error) {
    console.error('Error calling facta-propostas:', error);
    return {
      erro: true,
      mensagem: error.message || 'Erro ao atualizar propostas'
    };
  }

  return data as PropostasResult;
}

export interface Ocorrencia {
  codigo: string;
  data: string;
  hora: string;
  status: string;
  obs: string;
  item: string;
}

export interface OcorrenciasResult {
  erro: boolean;
  ocorrencias?: Ocorrencia[];
  mensagem?: string;
}

export async function consultarOcorrencias(codigoAf: string): Promise<OcorrenciasResult> {
  const { data, error } = await supabase.functions.invoke(`facta-propostas?action=ocorrencias&codigo_af=${codigoAf}`, {
    body: {}
  });

  if (error) {
    console.error('Error calling facta-propostas:', error);
    return {
      erro: true,
      mensagem: error.message || 'Erro ao consultar ocorrências'
    };
  }

  return data as OcorrenciasResult;
}

// Status mapping for display
export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  'pendente': { label: 'Pendente', color: 'bg-yellow-500' },
  'aguardando_assinatura': { label: 'Aguardando Assinatura', color: 'bg-blue-500' },
  'erro_simulacao': { label: 'Erro na Simulação', color: 'bg-red-500' },
  'erro_dados': { label: 'Erro nos Dados', color: 'bg-red-500' },
  'erro_proposta': { label: 'Erro na Proposta', color: 'bg-red-500' },
  // Facta statuses
  '12 - AGUARDANDO ASSINATURA DIGITAL': { label: 'Aguardando Assinatura', color: 'bg-blue-500' },
  '215 - AGUARDA AVERBACAO - ASSINATURA DIGITAL OK': { label: 'Assinatura OK - Aguarda Averbação', color: 'bg-cyan-500' },
  '225 - AGUARDA ATUACAO MASTER': { label: 'Aguarda Atuação', color: 'bg-purple-500' },
  '28 - CANCELADO': { label: 'Cancelado', color: 'bg-red-500' },
  '5 - EFETIVADA': { label: 'Efetivada', color: 'bg-green-500' },
  '6 - PAGA': { label: 'Paga', color: 'bg-green-600' },
};

export function getStatusInfo(status: string | null): { label: string; color: string } {
  if (!status) return { label: 'Desconhecido', color: 'bg-gray-500' };
  return STATUS_LABELS[status] || { label: status, color: 'bg-gray-500' };
}

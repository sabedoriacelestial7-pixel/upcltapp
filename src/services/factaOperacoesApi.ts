import { supabase } from '@/integrations/supabase/client';

export interface TabelaFacta {
  averbador: string;
  codigoTabela: number;
  coeficiente: number;
  contrato: number;
  convenio: string;
  idAverbador: number;
  idConvenio: number;
  idTipoOperacao: number;
  parcela: number;
  prazo: number;
  saldo_devedor: number;
  tabela: string;
  taxa: number;
  tipoOperacao: string;
  valor_liquido: number;
  valor_seguro: number;
}

export interface OperacoesDisponiveisResult {
  erro: boolean;
  mensagem?: string;
  tabelas?: TabelaFacta[];
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

// Agrupa as tabelas por prazo e retorna a melhor opção (menor taxa) para cada prazo
export function agruparTabelasPorPrazo(tabelas: TabelaFacta[]): Map<number, TabelaFacta> {
  const porPrazo = new Map<number, TabelaFacta>();
  
  for (const tabela of tabelas) {
    const existente = porPrazo.get(tabela.prazo);
    // Mantém a tabela com menor taxa (melhor para o cliente)
    if (!existente || tabela.taxa < existente.taxa) {
      porPrazo.set(tabela.prazo, tabela);
    }
  }
  
  return porPrazo;
}

// Retorna os prazos disponíveis ordenados
export function getPrazosDisponiveis(tabelas: TabelaFacta[]): number[] {
  const prazos = [...new Set(tabelas.map(t => t.prazo))];
  return prazos.sort((a, b) => a - b);
}

// Encontra a melhor tabela para um prazo específico
export function getMelhorTabelaParaPrazo(tabelas: TabelaFacta[], prazo: number): TabelaFacta | undefined {
  const tabelasDoPrazo = tabelas.filter(t => t.prazo === prazo);
  if (tabelasDoPrazo.length === 0) return undefined;
  
  // Retorna a com menor taxa
  return tabelasDoPrazo.reduce((melhor, atual) => 
    atual.taxa < melhor.taxa ? atual : melhor
  );
}

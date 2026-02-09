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

// Agrupa as tabelas por prazo e retorna a melhor opção COM SEGURO para cada prazo (maior comissão)
export function agruparTabelasPorPrazo(tabelas: TabelaFacta[]): Map<number, TabelaFacta> {
  const porPrazo = new Map<number, TabelaFacta>();
  
  for (const tabela of tabelas) {
    const existente = porPrazo.get(tabela.prazo);
    // Prioriza tabelas COM seguro (maior comissão), depois maior valor líquido
    const tabelaComSeguro = tabela.valor_seguro > 0;
    const existenteComSeguro = existente?.valor_seguro ? existente.valor_seguro > 0 : false;
    
    if (!existente) {
      porPrazo.set(tabela.prazo, tabela);
    } else if (tabelaComSeguro && !existenteComSeguro) {
      // Prefere com seguro
      porPrazo.set(tabela.prazo, tabela);
    } else if (tabelaComSeguro === existenteComSeguro && tabela.valor_liquido > existente.valor_liquido) {
      // Se ambas têm/não têm seguro, prefere maior valor líquido
      porPrazo.set(tabela.prazo, tabela);
    }
  }
  
  return porPrazo;
}

// Retorna os prazos disponíveis ordenados
export function getPrazosDisponiveis(tabelas: TabelaFacta[]): number[] {
  const prazos = [...new Set(tabelas.map(t => t.prazo))];
  return prazos.sort((a, b) => b - a);
}

// Encontra a melhor tabela COM SEGURO para um prazo específico (maior comissão)
export function getMelhorTabelaParaPrazo(tabelas: TabelaFacta[], prazo: number): TabelaFacta | undefined {
  const tabelasDoPrazo = tabelas.filter(t => t.prazo === prazo);
  if (tabelasDoPrazo.length === 0) return undefined;
  
  // Filtra tabelas COM seguro primeiro (maior comissão)
  const comSeguro = tabelasDoPrazo.filter(t => t.valor_seguro > 0);
  const candidatas = comSeguro.length > 0 ? comSeguro : tabelasDoPrazo;
  
  // Retorna a com maior valor líquido (melhor para o cliente)
  return candidatas.reduce((melhor, atual) => 
    atual.valor_liquido > melhor.valor_liquido ? atual : melhor
  );
}

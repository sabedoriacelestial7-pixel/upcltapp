import { BANCOS_ORDENADOS } from '@/data/bancos';

// Fatores de cálculo Facta Financeira - CLT NOVO GOLD SB
// Prazo máximo: 36x para todos os bancos
const FATORES_PARCELAS: Record<number, number> = {
  5: 0.258812,
  6: 0.258812,
  8: 0.205558,
  10: 0.173927,
  12: 0.153060,
  14: 0.138306,
  15: 0.132458,
  18: 0.119019,
  20: 0.112470,
  24: 0.102963,
  30: 0.083036,
  36: 0.077260,
};

// Calcula o valor da parcela baseado na margem disponível (15% da margem)
export function calcularParcelaDaMargem(margemDisponivel: number): number {
  const valorParcela = margemDisponivel * 0.15; // 15% da margem (100% - 85%)
  return Math.round(valorParcela * 100) / 100;
}

// Calcula o valor liberado baseado na parcela e número de parcelas
export function calcularValorLiberado(valorParcela: number, parcelas: number): number {
  const fator = FATORES_PARCELAS[parcelas] || 0.077260; // Default para 36x
  const valorLiberado = valorParcela / fator;
  return Math.round(valorLiberado * 100) / 100;
}

// Sistema Price - Cálculo de parcela (mantido para referência/simulações manuais)
export function calcularParcela(valor: number, parcelas: number, taxaMensal: number): number {
  const i = taxaMensal / 100;
  const n = parcelas;
  
  const parcela = valor * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
  return Math.round(parcela * 100) / 100;
}

export function calcularTotal(parcela: number, numParcelas: number): number {
  return Math.round(parcela * numParcelas * 100) / 100;
}

export interface BancoCalculado {
  id: string;
  nome: string;
  logo: string;
  sigla: string;
  taxaMensal: number;
  cor: string;
  destaque: string | null;
  valorParcela: number;
  valorLiberado: number;
  valorTotal: number;
  parcelas: number;
}

// Calcular para todos os bancos baseado na margem disponível
export function calcularTodosBancos(margemDisponivel: number, parcelas: number): BancoCalculado[] {
  // Limitar parcelas ao máximo de 36x
  const parcelasLimitadas = Math.min(parcelas, 36);
  const valorParcela = calcularParcelaDaMargem(margemDisponivel);
  const valorLiberado = calcularValorLiberado(valorParcela, parcelasLimitadas);
  
  return BANCOS_ORDENADOS.map(banco => {
    const valorTotal = calcularTotal(valorParcela, parcelasLimitadas);
    
    return {
      ...banco,
      valorParcela,
      valorLiberado,
      valorTotal,
      parcelas: parcelasLimitadas
    };
  });
}

// Obter fatores disponíveis para o seletor de parcelas (máximo 36x)
export function getParcelasDisponiveis(): number[] {
  return Object.keys(FATORES_PARCELAS).map(Number).sort((a, b) => a - b);
}

// Obter fator específico
export function getFator(parcelas: number): number {
  return FATORES_PARCELAS[parcelas] || 0.077260;
}

// Prazo máximo permitido
export const PRAZO_MAXIMO = 36;

import { BANCOS_ORDENADOS } from '@/data/bancos';

// Sistema Price - Cálculo de parcela
export function calcularParcela(valor: number, parcelas: number, taxaMensal: number): number {
  const i = taxaMensal / 100; // Converter percentual para decimal
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
  taxaMensal: number;
  cor: string;
  destaque: string | null;
  valorParcela: number;
  valorTotal: number;
  parcelas: number;
}

// Calcular para todos os bancos
export function calcularTodosBancos(valor: number, parcelas: number): BancoCalculado[] {
  return BANCOS_ORDENADOS.map(banco => {
    const valorParcela = calcularParcela(valor, parcelas, banco.taxaMensal);
    const valorTotal = calcularTotal(valorParcela, parcelas);
    
    return {
      ...banco,
      valorParcela,
      valorTotal,
      parcelas
    };
  });
}

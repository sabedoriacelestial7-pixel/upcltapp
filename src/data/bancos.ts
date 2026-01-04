export interface Banco {
  id: string;
  nome: string;
  logo: string;
  taxaMensal: number;
  cor: string;
  destaque: string | null;
}

export const BANCOS: Banco[] = [
  {
    id: "facta",
    nome: "Facta Financeira",
    logo: "🏦",
    taxaMensal: 1.35,
    cor: "#1e3a5f",
    destaque: "Menor taxa"
  },
  {
    id: "safra",
    nome: "Banco Safra",
    logo: "🏦",
    taxaMensal: 1.45,
    cor: "#FFD700",
    destaque: null
  },
  {
    id: "pan",
    nome: "Banco Pan",
    logo: "🏦",
    taxaMensal: 1.49,
    cor: "#FF6B00",
    destaque: "Mais rápido"
  },
  {
    id: "bmg",
    nome: "Banco BMG",
    logo: "🏦",
    taxaMensal: 1.52,
    cor: "#E31837",
    destaque: null
  },
  {
    id: "itau",
    nome: "Banco Itaú",
    logo: "🏦",
    taxaMensal: 1.55,
    cor: "#FF6600",
    destaque: null
  },
  {
    id: "bradesco",
    nome: "Bradesco",
    logo: "🏦",
    taxaMensal: 1.58,
    cor: "#CC092F",
    destaque: null
  }
];

// Ordenar por menor taxa
export const BANCOS_ORDENADOS = [...BANCOS].sort((a, b) => a.taxaMensal - b.taxaMensal);

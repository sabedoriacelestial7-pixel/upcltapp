export interface Banco {
  id: string;
  nome: string;
  logo: string;
  sigla: string;
  taxaMensal: number;
  cor: string;
  destaque: string | null;
}

export const BANCOS: Banco[] = [
  {
    id: "facta",
    nome: "Facta Financeira",
    logo: "/logos/facta.png",
    sigla: "FA",
    taxaMensal: 1.35,
    cor: "#1e3a5f",
    destaque: "Menor taxa"
  },
  {
    id: "mercantil",
    nome: "Banco Mercantil",
    logo: "/logos/mercantil.png",
    sigla: "BM",
    taxaMensal: 1.42,
    cor: "#00529B",
    destaque: null
  },
  {
    id: "happy",
    nome: "Happy",
    logo: "/logos/happy.png",
    sigla: "HP",
    taxaMensal: 1.45,
    cor: "#FF6B00",
    destaque: null
  },
  {
    id: "v8",
    nome: "V8 Digital",
    logo: "/logos/v8.png",
    sigla: "V8",
    taxaMensal: 1.48,
    cor: "#8B5CF6",
    destaque: null
  },
  {
    id: "prata",
    nome: "Banco Prata",
    logo: "/logos/prata.png",
    sigla: "PR",
    taxaMensal: 1.49,
    cor: "#6B7280",
    destaque: null
  },
  {
    id: "hub",
    nome: "HUB Financeira",
    logo: "/logos/hub.png",
    sigla: "HB",
    taxaMensal: 1.50,
    cor: "#10B981",
    destaque: null
  },
  {
    id: "hendmais",
    nome: "Hendmais",
    logo: "/logos/hendmais.png",
    sigla: "HM",
    taxaMensal: 1.52,
    cor: "#F59E0B",
    destaque: null
  },
  {
    id: "c6",
    nome: "Banco C6",
    logo: "/logos/c6.png",
    sigla: "C6",
    taxaMensal: 1.55,
    cor: "#1A1A1A",
    destaque: null
  },
  {
    id: "pan",
    nome: "Banco Pan",
    logo: "/logos/pan.png",
    sigla: "PN",
    taxaMensal: 1.58,
    cor: "#FF6600",
    destaque: "Mais rápido"
  },
  {
    id: "bmg",
    nome: "Banco BMG",
    logo: "/logos/bmg.png",
    sigla: "BG",
    taxaMensal: 1.60,
    cor: "#E31837",
    destaque: null
  }
];

// Ordenar por menor taxa
export const BANCOS_ORDENADOS = [...BANCOS].sort((a, b) => a.taxaMensal - b.taxaMensal);

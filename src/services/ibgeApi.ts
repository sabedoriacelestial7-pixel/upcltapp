// Serviço para buscar códigos de cidades do IBGE
// A API Facta exige código numérico IBGE para cidade_natural

export interface CidadeIBGE {
  id: number;
  nome: string;
}

export interface EstadoIBGE {
  id: number;
  sigla: string;
  nome: string;
}

// Cache para evitar requisições repetidas
const cidadesCache: Record<string, CidadeIBGE[]> = {};

export async function buscarCidadesPorEstado(uf: string): Promise<CidadeIBGE[]> {
  if (cidadesCache[uf]) {
    return cidadesCache[uf];
  }

  try {
    const response = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`
    );
    
    if (!response.ok) {
      throw new Error('Erro ao buscar cidades');
    }

    const data = await response.json();
    const cidades: CidadeIBGE[] = data.map((cidade: any) => ({
      id: cidade.id,
      nome: cidade.nome
    }));

    cidadesCache[uf] = cidades;
    return cidades;
  } catch (error) {
    console.error('Erro ao buscar cidades do IBGE:', error);
    return [];
  }
}

export async function buscarCodigoCidade(uf: string, nomeCidade: string): Promise<number | null> {
  const cidades = await buscarCidadesPorEstado(uf);
  
  // Normaliza para comparação
  const nomeNormalizado = nomeCidade
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  const cidade = cidades.find(c => 
    c.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === nomeNormalizado
  );
  
  return cidade?.id || null;
}

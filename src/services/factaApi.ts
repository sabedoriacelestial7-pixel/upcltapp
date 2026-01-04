import { TrabalhadorData } from '@/contexts/AppContext';

// Mock data for demonstration (since we can't call external APIs directly)
const MOCK_TRABALHADORES: Record<string, TrabalhadorData> = {
  '12345678901': {
    nome: 'João da Silva',
    cpf: '12345678901',
    valorMargemDisponivel: 4500,
    valorBaseMargem: 3500,
    valorTotalVencimentos: 8500,
    nomeEmpregador: 'Empresa Exemplo LTDA',
    dataAdmissao: '2020-03-15',
    elegivel: true,
    atualizadoEm: new Date().toISOString()
  },
  '98765432100': {
    nome: 'Maria Santos',
    cpf: '98765432100',
    valorMargemDisponivel: 6200,
    valorBaseMargem: 4800,
    valorTotalVencimentos: 12000,
    nomeEmpregador: 'Tech Solutions SA',
    dataAdmissao: '2019-08-20',
    elegivel: true,
    atualizadoEm: new Date().toISOString()
  },
  '11122233344': {
    nome: 'Pedro Oliveira',
    cpf: '11122233344',
    valorMargemDisponivel: 0,
    valorBaseMargem: 2800,
    valorTotalVencimentos: 5600,
    nomeEmpregador: 'Comércio Central LTDA',
    dataAdmissao: '2022-01-10',
    elegivel: false,
    atualizadoEm: new Date().toISOString()
  }
};

export interface ConsultaResult {
  sucesso: boolean;
  mensagem: string;
  dados: TrabalhadorData | null;
}

// Simulate API delay
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function consultarMargem(cpf: string): Promise<ConsultaResult> {
  // Simulate API call delay
  await delay(2000 + Math.random() * 1000);

  const cpfLimpo = cpf.replace(/\D/g, '');

  // Check if CPF exists in mock data
  const trabalhador = MOCK_TRABALHADORES[cpfLimpo];

  if (!trabalhador) {
    return {
      sucesso: false,
      mensagem: "CPF não encontrado na base",
      dados: null
    };
  }

  if (!trabalhador.elegivel) {
    return {
      sucesso: false,
      mensagem: "Cliente não elegível para consignado. Margem já comprometida ou contrato ativo.",
      dados: trabalhador
    };
  }

  return {
    sucesso: true,
    mensagem: "Margem disponível!",
    dados: trabalhador
  };
}

/*
// Real API implementation (for production with backend)
const FACTA_CONFIG = {
  baseUrl: "https://cltoff.facta.com.br",
  authBasic: "OTUwOTU6dXV2MjY4eTI2cjcybTBmc2hwcGY="
};

let tokenCache: { token: string; expira: Date } | null = null;

async function getToken(): Promise<string> {
  if (tokenCache && new Date() < tokenCache.expira) {
    return tokenCache.token;
  }

  const response = await fetch(`${FACTA_CONFIG.baseUrl}/gera-token`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${FACTA_CONFIG.authBasic}`
    }
  });

  const data = await response.json();
  
  if (data.erro) {
    throw new Error(data.mensagem);
  }

  tokenCache = {
    token: data.token,
    expira: new Date(Date.now() + 55 * 60 * 1000)
  };

  return data.token;
}

export async function consultarMargemReal(cpf: string): Promise<ConsultaResult> {
  const token = await getToken();
  const cpfLimpo = cpf.replace(/\D/g, '');

  const response = await fetch(
    `${FACTA_CONFIG.baseUrl}/clt/base-offline/debug?cpf=${cpfLimpo}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const data = await response.json();

  if (data.erro) {
    return {
      sucesso: false,
      mensagem: data.mensagem,
      dados: null
    };
  }

  if (!data.dados || data.dados.length === 0) {
    return {
      sucesso: false,
      mensagem: "CPF não encontrado na base",
      dados: null
    };
  }

  const trabalhador = data.dados[0];

  if (trabalhador.elegivel !== "S" && trabalhador.elegivel !== "1" && trabalhador.elegivel !== true) {
    return {
      sucesso: false,
      mensagem: trabalhador.motivoInelegibilidade_descricao || "Cliente não elegível",
      dados: trabalhador
    };
  }

  return {
    sucesso: true,
    mensagem: "Margem disponível!",
    dados: {
      nome: trabalhador.nome,
      cpf: trabalhador.cpf,
      valorMargemDisponivel: parseFloat(trabalhador.valorMargemDisponivel) || 0,
      valorBaseMargem: parseFloat(trabalhador.valorBaseMargem) || 0,
      valorTotalVencimentos: parseFloat(trabalhador.valorTotalVencimentos) || 0,
      nomeEmpregador: trabalhador.nomeEmpregador,
      dataAdmissao: trabalhador.dataAdmissao,
      elegivel: true,
      atualizadoEm: trabalhador.updated_at
    }
  };
}
*/

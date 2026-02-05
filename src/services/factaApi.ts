import { TrabalhadorData } from '@/contexts/AppContext';

// Proxy via Cloudflare Tunnel
const PROXY_BASE_URL = 'https://theft-auctions-fabulous-lloyd.trycloudflare.com';

export interface ConsultaResult {
  sucesso: boolean;
  mensagem: string;
  dados: TrabalhadorData | null;
}

/**
 * Consulta margem via proxy local na porta 3001
 */
export async function consultarMargem(cpf: string): Promise<ConsultaResult> {
  const cpfLimpo = cpf.replace(/\D/g, '');

  try {
    const response = await fetch(`${PROXY_BASE_URL}/api/facta/consulta-margem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cpf: cpfLimpo })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error calling proxy consulta-margem:', data);
      return {
        sucesso: false,
        mensagem: data.mensagem || data.error || 'Erro ao consultar margem',
        dados: null
      };
    }

    return data as ConsultaResult;
  } catch (err) {
    console.error('Exception calling proxy consulta-margem:', err);
    return {
      sucesso: false,
      mensagem: 'Erro de conexão com o servidor. Verifique se o túnel Cloudflare está ativo.',
      dados: null
    };
  }
}

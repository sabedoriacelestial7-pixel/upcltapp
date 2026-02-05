import { TrabalhadorData } from '@/contexts/AppContext';

// Proxy via Cloudflare Tunnel
const PROXY_BASE_URL = 'https://theft-auctions-fabulous-lloyd.trycloudflare.com';

export interface AutorizacaoResult {
  sucesso: boolean;
  mensagem: string;
  protocolo?: string;
  status?: 'code_sent' | 'already_authorized';
}

export interface ConsultaAutorizadaResult {
  sucesso: boolean;
  mensagem: string;
  status: 'pending' | 'authorized' | 'ineligible' | 'not_found' | 'error' | 'expired';
  dados: TrabalhadorData | null;
}

/**
 * Solicita autorização do cliente via SMS ou WhatsApp
 * Usa o proxy local na porta 3001
 */
export async function solicitarAutorizacao(
  cpf: string, 
  celular: string, 
  canal: 'S' | 'W' = 'S',
  nome?: string
): Promise<AutorizacaoResult> {
  const cpfLimpo = cpf.replace(/\D/g, '');
  const celularLimpo = celular.replace(/\D/g, '');

  try {
    const response = await fetch(`${PROXY_BASE_URL}/api/facta/autorizar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        cpf: cpfLimpo, 
        celular: celularLimpo, 
        canal,
        nome: nome || 'Cliente'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error calling proxy facta-autorizar:', data);
      return {
        sucesso: false,
        mensagem: data.mensagem || data.error || 'Erro ao solicitar autorização'
      };
    }

    return data as AutorizacaoResult;
  } catch (err) {
    console.error('Exception calling proxy facta-autorizar:', err);
    return {
      sucesso: false,
      mensagem: 'Erro de conexão com o servidor. Verifique se o túnel Cloudflare está ativo.'
    };
  }
}

/**
 * Verifica se o cliente autorizou e retorna os dados de margem
 * Usa o proxy local na porta 3001
 */
export async function verificarAutorizacao(
  cpf: string, 
  celular: string
): Promise<ConsultaAutorizadaResult> {
  const cpfLimpo = cpf.replace(/\D/g, '');
  const celularLimpo = celular.replace(/\D/g, '');

  try {
    const response = await fetch(`${PROXY_BASE_URL}/api/facta/consultar-autorizado`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        cpf: cpfLimpo, 
        celular: celularLimpo 
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error calling proxy facta-consultar-autorizado:', data);
      return {
        sucesso: false,
        mensagem: data.mensagem || data.error || 'Erro ao verificar autorização',
        status: 'error',
        dados: null
      };
    }

    return data as ConsultaAutorizadaResult;
  } catch (err) {
    console.error('Exception calling proxy facta-consultar-autorizado:', err);
    return {
      sucesso: false,
      mensagem: 'Erro de conexão com o servidor. Verifique se o túnel Cloudflare está ativo.',
      status: 'error',
      dados: null
    };
  }
}

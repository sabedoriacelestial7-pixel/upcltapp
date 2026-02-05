import { supabase } from '@/integrations/supabase/client';
import { TrabalhadorData } from '@/contexts/AppContext';

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
    const { data, error } = await supabase.functions.invoke('facta-autorizar', {
      body: { 
        cpf: cpfLimpo, 
        celular: celularLimpo, 
        canal,
        nome: nome || 'Cliente'
      }
    });

    if (error) {
      console.error('Error calling facta-autorizar:', error);
      
      // Check for specific error types
      if (error.message?.includes('non-2xx') || error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        return {
          sucesso: false,
          mensagem: 'Sessão expirada. Por favor, faça login novamente.'
        };
      }
      
      return {
        sucesso: false,
        mensagem: error.message || 'Erro ao solicitar autorização. Tente novamente.'
      };
    }

    return data as AutorizacaoResult;
  } catch (err) {
    console.error('Exception calling facta-autorizar:', err);
    return {
      sucesso: false,
      mensagem: 'Erro de conexão. Verifique sua internet e tente novamente.'
    };
  }
}

/**
 * Verifica se o cliente autorizou e retorna os dados de margem
 */
export async function verificarAutorizacao(
  cpf: string, 
  celular: string
): Promise<ConsultaAutorizadaResult> {
  const cpfLimpo = cpf.replace(/\D/g, '');
  const celularLimpo = celular.replace(/\D/g, '');

  const { data, error } = await supabase.functions.invoke('facta-consultar-autorizado', {
    body: { 
      cpf: cpfLimpo, 
      celular: celularLimpo 
    }
  });

  if (error) {
    console.error('Error calling facta-consultar-autorizado:', error);
    return {
      sucesso: false,
      mensagem: error.message || 'Erro ao verificar autorização',
      status: 'error',
      dados: null
    };
  }

  return data as ConsultaAutorizadaResult;
}

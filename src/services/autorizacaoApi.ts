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
 * Usa a Edge Function facta-autorizar
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
      return {
        sucesso: false,
        mensagem: error.message || 'Erro ao solicitar autorização'
      };
    }

    return data as AutorizacaoResult;
  } catch (err) {
    console.error('Exception calling facta-autorizar:', err);
    return {
      sucesso: false,
      mensagem: 'Erro de conexão com o servidor.'
    };
  }
}

/**
 * Verifica se o cliente autorizou e retorna os dados de margem
 * Usa a Edge Function facta-consultar-autorizado
 */
export async function verificarAutorizacao(
  cpf: string, 
  celular: string
): Promise<ConsultaAutorizadaResult> {
  const cpfLimpo = cpf.replace(/\D/g, '');
  const celularLimpo = celular.replace(/\D/g, '');

  try {
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
  } catch (err) {
    console.error('Exception calling facta-consultar-autorizado:', err);
    return {
      sucesso: false,
      mensagem: 'Erro de conexão com o servidor.',
      status: 'error',
      dados: null
    };
  }
}

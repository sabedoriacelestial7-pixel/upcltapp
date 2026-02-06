import { supabase } from '@/integrations/supabase/client';
import { TrabalhadorData } from '@/contexts/AppContext';

export interface ConsultaResult {
  sucesso: boolean;
  mensagem: string;
  dados: TrabalhadorData | null;
}

/**
 * Consulta margem via Edge Function
 */
export async function consultarMargem(cpf: string): Promise<ConsultaResult> {
  const cpfLimpo = cpf.replace(/\D/g, '');

  try {
    const { data, error } = await supabase.functions.invoke('consulta-margem', {
      body: { cpf: cpfLimpo }
    });

    if (error) {
      console.error('Error calling consulta-margem:', error);
      return {
        sucesso: false,
        mensagem: error.message || 'Erro ao consultar margem',
        dados: null
      };
    }

    return data as ConsultaResult;
  } catch (err) {
    console.error('Exception calling consulta-margem:', err);
    return {
      sucesso: false,
      mensagem: 'Erro de conexão com o servidor.',
      dados: null
    };
  }
}

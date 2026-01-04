import { TrabalhadorData } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';

export interface ConsultaResult {
  sucesso: boolean;
  mensagem: string;
  dados: TrabalhadorData | null;
}

export async function consultarMargem(cpf: string): Promise<ConsultaResult> {
  const cpfLimpo = cpf.replace(/\D/g, '');

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
}

import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  telefone: string | null;
  cpf: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Busca o perfil do usuário logado
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Erro ao buscar perfil:', error);
    return null;
  }

  return data as Profile;
}

/**
 * Verifica se o usuário é admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('is_admin', { _user_id: userId });

  if (error) {
    console.error('Erro ao verificar se é admin:', error);
    return false;
  }

  return data === true;
}

/**
 * Vincula um CPF ao perfil do usuário (apenas se ainda não tiver CPF vinculado)
 */
export async function vincularCPF(userId: string, cpf: string): Promise<{ success: boolean; error?: string }> {
  // Primeiro verifica se o usuário já tem CPF vinculado
  const profile = await getProfile(userId);
  
  if (profile?.cpf) {
    return { 
      success: false, 
      error: 'Você já possui um CPF vinculado à sua conta' 
    };
  }

  // Limpa o CPF (remove formatação)
  const cpfLimpo = cpf.replace(/\D/g, '');

  // Verifica se o CPF já está vinculado a outro usuário
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('cpf', cpfLimpo)
    .single();

  if (existingProfile) {
    return { 
      success: false, 
      error: 'Este CPF já está vinculado a outra conta' 
    };
  }

  // Vincula o CPF ao perfil
  const { error } = await supabase
    .from('profiles')
    .update({ cpf: cpfLimpo })
    .eq('user_id', userId);

  if (error) {
    console.error('Erro ao vincular CPF:', error);
    return { 
      success: false, 
      error: 'Erro ao vincular CPF. Tente novamente.' 
    };
  }

  return { success: true };
}

/**
 * Verifica se o usuário pode consultar um determinado CPF
 */
export async function podeConsultarCPF(userId: string, cpf: string): Promise<{ 
  permitido: boolean; 
  motivo?: string;
  cpfVinculado?: string | null;
  isAdmin?: boolean;
}> {
  const profile = await getProfile(userId);
  
  if (!profile) {
    return { 
      permitido: false, 
      motivo: 'Perfil não encontrado' 
    };
  }

  // Verifica se é admin - admins podem consultar qualquer CPF
  const admin = await isUserAdmin(userId);
  
  if (admin) {
    return { 
      permitido: true,
      cpfVinculado: profile.cpf,
      isAdmin: true
    };
  }

  const cpfLimpo = cpf.replace(/\D/g, '');

  // Se o usuário ainda não tem CPF vinculado, pode consultar qualquer CPF (será vinculado)
  if (!profile.cpf) {
    return { 
      permitido: true,
      cpfVinculado: null,
      isAdmin: false
    };
  }

  // Se já tem CPF vinculado, só pode consultar o próprio CPF
  if (profile.cpf === cpfLimpo) {
    return { 
      permitido: true,
      cpfVinculado: profile.cpf,
      isAdmin: false
    };
  }

  return { 
    permitido: false, 
    motivo: 'Você só pode consultar o CPF vinculado à sua conta',
    cpfVinculado: profile.cpf,
    isAdmin: false
  };
}

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface TrabalhadorData {
  nome: string;
  cpf: string;
  valorMargemDisponivel: number;
  valorBaseMargem: number;
  valorTotalVencimentos: number;
  nomeEmpregador: string;
  dataAdmissao: string;
  elegivel: boolean;
  atualizadoEm: string;
}

interface AppState {
  consulta: TrabalhadorData | null;
  simulacao: {
    valor: number;
    parcelas: number;
    bancoSelecionado: string | null;
  };
}

interface AppContextType extends AppState {
  usuario: { nome: string; email: string; telefone: string | null } | null;
  setConsulta: (consulta: TrabalhadorData | null) => void;
  setSimulacao: (simulacao: AppState['simulacao']) => void;
  logout: () => void;
  isLoggedIn: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'upclt_state';

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  
  const [consulta, setConsultaState] = useState<TrabalhadorData | null>(null);
  const [simulacao, setSimulacaoState] = useState<AppState['simulacao']>({
    valor: 5000,
    parcelas: 48,
    bancoSelecionado: null
  });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.consulta) setConsultaState(parsed.consulta);
        if (parsed.simulacao) setSimulacaoState(parsed.simulacao);
      }
    } catch (error) {
      console.error('Error loading state from localStorage:', error);
    }
  }, []);

  // Save to localStorage on state change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        consulta,
        simulacao
      }));
    } catch (error) {
      console.error('Error saving state to localStorage:', error);
    }
  }, [consulta, simulacao]);

  // Clear state on logout
  useEffect(() => {
    if (!user) {
      setConsultaState(null);
      setSimulacaoState({ valor: 5000, parcelas: 48, bancoSelecionado: null });
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const setConsulta = (newConsulta: TrabalhadorData | null) => {
    setConsultaState(newConsulta);
  };

  const setSimulacao = (newSimulacao: AppState['simulacao']) => {
    setSimulacaoState(newSimulacao);
  };

  const logout = async () => {
    await signOut();
  };

  // Derive usuario from Supabase user
  const usuario = user ? {
    nome: user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuário',
    email: user.email || '',
    telefone: user.user_metadata?.telefone || null
  } : null;

  const isLoggedIn = user !== null;

  return (
    <AppContext.Provider value={{
      usuario,
      consulta,
      simulacao,
      setConsulta,
      setSimulacao,
      logout,
      isLoggedIn
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

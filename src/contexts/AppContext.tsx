import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Usuario {
  nome: string;
  email: string;
  telefone: string;
}

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
  usuario: Usuario | null;
  consulta: TrabalhadorData | null;
  simulacao: {
    valor: number;
    parcelas: number;
    bancoSelecionado: string | null;
  };
}

interface AppContextType extends AppState {
  setUsuario: (usuario: Usuario | null) => void;
  setConsulta: (consulta: TrabalhadorData | null) => void;
  setSimulacao: (simulacao: AppState['simulacao']) => void;
  logout: () => void;
  isLoggedIn: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'upclt_state';

export function AppProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuarioState] = useState<Usuario | null>(null);
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
        if (parsed.usuario) setUsuarioState(parsed.usuario);
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
        usuario,
        consulta,
        simulacao
      }));
    } catch (error) {
      console.error('Error saving state to localStorage:', error);
    }
  }, [usuario, consulta, simulacao]);

  const setUsuario = (newUsuario: Usuario | null) => {
    setUsuarioState(newUsuario);
  };

  const setConsulta = (newConsulta: TrabalhadorData | null) => {
    setConsultaState(newConsulta);
  };

  const setSimulacao = (newSimulacao: AppState['simulacao']) => {
    setSimulacaoState(newSimulacao);
  };

  const logout = () => {
    setUsuarioState(null);
    setConsultaState(null);
    setSimulacaoState({ valor: 5000, parcelas: 48, bancoSelecionado: null });
    localStorage.removeItem(STORAGE_KEY);
  };

  const isLoggedIn = usuario !== null;

  return (
    <AppContext.Provider value={{
      usuario,
      consulta,
      simulacao,
      setUsuario,
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

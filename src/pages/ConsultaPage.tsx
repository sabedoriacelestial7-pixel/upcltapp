import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertTriangle, XCircle, AlertCircle, MessageCircle, Lock } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { InputMask } from '@/components/InputMask';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { consultarMargem } from '@/services/factaApi';
import { getProfile, vincularCPF, podeConsultarCPF } from '@/services/profileService';
import { validarCPF, formatarCPF } from '@/utils/formatters';
import { abrirWhatsAppConsulta } from '@/utils/whatsapp';

type ConsultaState = 'idle' | 'loading' | 'not-found' | 'ineligible' | 'error' | 'cpf-blocked';

export default function ConsultaPage() {
  const navigate = useNavigate();
  const { setConsulta, usuario } = useApp();
  const { user } = useAuth();

  const [cpf, setCpf] = useState('');
  const [cpfVinculado, setCpfVinculado] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [state, setState] = useState<ConsultaState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Carrega o perfil para verificar CPF vinculado
  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setLoadingProfile(false);
        return;
      }

      const profile = await getProfile(user.id);
      if (profile?.cpf) {
        setCpfVinculado(profile.cpf);
        setCpf(formatarCPF(profile.cpf));
      }
      setLoadingProfile(false);
    }

    loadProfile();
  }, [user]);

  const isValidCPF = validarCPF(cpf);
  const cpfLimpo = cpf.replace(/\D/g, '');
  const isCpfBloqueado = cpfVinculado && cpfLimpo !== cpfVinculado;

  const handleConsulta = async () => {
    if (!isValidCPF || !user) return;

    // Verifica se pode consultar este CPF
    const verificacao = await podeConsultarCPF(user.id, cpf);
    
    if (!verificacao.permitido) {
      setState('cpf-blocked');
      setErrorMessage(verificacao.motivo || 'CPF não permitido');
      return;
    }

    setState('loading');
    setErrorMessage('');

    try {
      const result = await consultarMargem(cpf);

      if (result.sucesso && result.dados) {
        // Se o usuário ainda não tem CPF vinculado, vincula agora
        if (!cpfVinculado) {
          const vinculacao = await vincularCPF(user.id, cpf);
          if (vinculacao.success) {
            setCpfVinculado(cpfLimpo);
          }
        }
        
        setConsulta(result.dados);
        navigate('/resultado');
      } else if (result.mensagem.includes('não encontrado')) {
        setState('not-found');
      } else if (result.dados && !result.dados.elegivel) {
        setState('ineligible');
        setErrorMessage(result.mensagem);
      } else {
        setState('error');
        setErrorMessage(result.mensagem);
      }
    } catch (error) {
      setState('error');
      setErrorMessage('Erro ao consultar. Tente novamente.');
    }
  };

  const handleWhatsApp = () => {
    abrirWhatsAppConsulta(usuario?.nome || 'Cliente', cpf);
  };

  const handleRetry = () => {
    setState('idle');
    setErrorMessage('');
    // Se tem CPF vinculado, restaura ele
    if (cpfVinculado) {
      setCpf(formatarCPF(cpfVinculado));
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen min-h-[100dvh] gradient-primary pb-20">
        <Header title="Consultar Margem" />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" text="Carregando..." />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] gradient-primary pb-20">
      <Header title="Consultar Margem" />

      <main className="max-w-md mx-auto px-5 py-6">
        {state === 'idle' && (
          <div className="text-center">
            <div 
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#22c55e] to-[#16a34a] mx-auto mb-5 flex items-center justify-center shadow-lg shadow-green-500/25 animate-fade-in opacity-0"
              style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}
            >
              <Search size={32} className="text-white" />
            </div>
            <h2 
              className="text-lg font-bold text-foreground mb-1.5 animate-fade-in opacity-0"
              style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
            >
              {cpfVinculado ? 'Seu CPF' : 'Informe seu CPF'}
            </h2>
            <p 
              className="text-sm text-muted-foreground mb-6 animate-fade-in opacity-0"
              style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}
            >
              {cpfVinculado 
                ? 'CPF vinculado à sua conta' 
                : 'Este CPF será vinculado permanentemente à sua conta'}
            </p>

            <div 
              className="bg-white/5 border border-[#22c55e]/30 rounded-2xl p-5 backdrop-blur-sm animate-fade-in opacity-0"
              style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
            >
              {cpfVinculado ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-white/80 mb-2">CPF Vinculado</label>
                  <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-3">
                    <Lock size={18} className="text-[#22c55e]" />
                    <span className="text-white font-mono">{formatarCPF(cpfVinculado)}</span>
                  </div>
                </div>
              ) : (
                <InputMask
                  label="CPF"
                  placeholder="000.000.000-00"
                  mask="cpf"
                  value={cpf}
                  onChange={setCpf}
                  error={
                    cpf.length === 14 && !isValidCPF 
                      ? 'CPF inválido' 
                      : isCpfBloqueado 
                        ? 'Você só pode consultar seu próprio CPF' 
                        : undefined
                  }
                />
              )}

              <Button
                onClick={handleConsulta}
                disabled={!isValidCPF || isCpfBloqueado}
                className="w-full h-12 mt-5 bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white font-semibold text-base shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:shadow-none touch-manipulation transition-all duration-300"
              >
                Consultar Margem
              </Button>
            </div>

            {!cpfVinculado && (
              <p 
                className="text-xs text-amber-400/80 mt-5 animate-fade-in opacity-0"
                style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
              >
                ⚠️ Atenção: O CPF consultado será vinculado à sua conta
              </p>
            )}
          </div>
        )}

        {state === 'cpf-blocked' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 mx-auto mb-5 flex items-center justify-center border border-amber-500/30">
              <Lock size={32} className="text-amber-400" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1.5">
              CPF não permitido
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              {errorMessage}
            </p>
            {cpfVinculado && (
              <p className="text-sm text-white/70 mb-6">
                Seu CPF vinculado: <span className="font-mono text-[#22c55e]">{formatarCPF(cpfVinculado)}</span>
              </p>
            )}

            <Button
              onClick={handleRetry}
              className="w-full h-12 bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white font-semibold shadow-lg shadow-green-500/25 touch-manipulation transition-all duration-300"
            >
              Consultar Meu CPF
            </Button>
          </div>
        )}

        {state === 'loading' && (
          <div className="text-center py-12">
            <LoadingSpinner
              size="lg"
              text="Consultando sua margem..."
              subtext="Isso pode levar alguns segundos"
            />
          </div>
        )}

        {state === 'not-found' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 mx-auto mb-5 flex items-center justify-center border border-amber-500/30">
              <AlertTriangle size={32} className="text-amber-400" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1.5">
              CPF não encontrado
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              Seu CPF ainda não está em nossa base. Entre em contato para consulta completa.
            </p>

            <Button
              onClick={handleWhatsApp}
              className="w-full h-12 bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white font-semibold shadow-lg shadow-green-500/25 touch-manipulation transition-all duration-300"
            >
              <MessageCircle size={20} />
              Falar com Consultor
            </Button>

            <Button
              onClick={handleRetry}
              variant="ghost"
              className="w-full mt-3 text-white/70 hover:text-white hover:bg-white/10 touch-manipulation"
            >
              Voltar
            </Button>
          </div>
        )}

        {state === 'ineligible' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 mx-auto mb-5 flex items-center justify-center border border-red-500/30">
              <XCircle size={32} className="text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1.5">
              Margem não disponível
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              {errorMessage}
            </p>

            <Button
              onClick={handleWhatsApp}
              className="w-full h-12 bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white font-semibold shadow-lg shadow-green-500/25 touch-manipulation transition-all duration-300"
            >
              <MessageCircle size={20} />
              Falar com Consultor
            </Button>

            <Button
              onClick={handleRetry}
              variant="ghost"
              className="w-full mt-3 text-white/70 hover:text-white hover:bg-white/10 touch-manipulation"
            >
              Voltar
            </Button>
          </div>
        )}

        {state === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 mx-auto mb-5 flex items-center justify-center border border-red-500/30">
              <AlertCircle size={32} className="text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1.5">
              Erro ao consultar
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              {errorMessage || 'Tente novamente em alguns segundos'}
            </p>

            <Button
              onClick={handleRetry}
              className="w-full h-12 bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white font-semibold shadow-lg shadow-green-500/25 touch-manipulation transition-all duration-300"
            >
              Tentar Novamente
            </Button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

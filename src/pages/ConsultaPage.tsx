import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { FloatingButton } from '@/components/FloatingButton';
import { LoadingScreen } from '@/components/LoadingScreen';
import { InputMask } from '@/components/InputMask';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { consultarMargem } from '@/services/factaApi';
import { getProfile, vincularCPF, podeConsultarCPF, isUserAdmin } from '@/services/profileService';
import { validarCPF, formatarCPF } from '@/utils/formatters';
import { Lock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { abrirWhatsAppConsulta } from '@/utils/whatsapp';

type ConsultaState = 'idle' | 'loading' | 'not-found' | 'ineligible' | 'error' | 'cpf-blocked';

export default function ConsultaPage() {
  const navigate = useNavigate();
  const { setConsulta, usuario } = useApp();
  const { user } = useAuth();

  const [cpf, setCpf] = useState('');
  const [cpfVinculado, setCpfVinculado] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [state, setState] = useState<ConsultaState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('Buscando as melhores taxas...');

  // Load profile to check for linked CPF and admin status
  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setLoadingProfile(false);
        return;
      }

      const [profile, adminStatus] = await Promise.all([
        getProfile(user.id),
        isUserAdmin(user.id)
      ]);

      setIsAdmin(adminStatus);

      if (profile?.cpf && !adminStatus) {
        setCpfVinculado(profile.cpf);
        setCpf(formatarCPF(profile.cpf));
      }
      setLoadingProfile(false);
    }

    loadProfile();
  }, [user]);

  const isValidCPF = validarCPF(cpf);
  const cpfLimpo = cpf.replace(/\D/g, '');
  const isCpfBloqueado = !isAdmin && cpfVinculado && cpfLimpo !== cpfVinculado;

  const handleConsulta = async () => {
    if (!isValidCPF || !user) return;

    // Verify if user can consult this CPF (admins always can)
    const verificacao = await podeConsultarCPF(user.id, cpf);
    
    if (!verificacao.permitido) {
      setState('cpf-blocked');
      setErrorMessage(verificacao.motivo || 'CPF não permitido');
      return;
    }

    setState('loading');
    setErrorMessage('');

    // Animate loading messages
    const messages = [
      'Buscando as melhores taxas...',
      'Avaliando redução de taxas',
      'Finalizando análise...'
    ];
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      setLoadingMessage(messages[messageIndex]);
    }, 2000);

    try {
      const result = await consultarMargem(cpf);

      clearInterval(messageInterval);

      if (result.sucesso && result.dados) {
        // Link CPF only if not admin and not already linked
        if (!isAdmin && !cpfVinculado) {
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
      clearInterval(messageInterval);
      setState('error');
      setErrorMessage('Erro ao consultar. Tente novamente.');
    }
  };

  const handleRetry = () => {
    setState('idle');
    setErrorMessage('');
    // Admin keeps the field editable, regular user reverts to linked CPF
    if (!isAdmin && cpfVinculado) {
      setCpf(formatarCPF(cpfVinculado));
    }
  };

  const handleWhatsApp = () => {
    abrirWhatsAppConsulta(usuario?.nome || 'Cliente', cpf);
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (state === 'loading') {
    return <LoadingScreen variant="searching" message={loadingMessage} />;
  }

  // Error states
  if (state === 'not-found' || state === 'ineligible' || state === 'error' || state === 'cpf-blocked') {
    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <Header showChat />
        <main className="max-w-md mx-auto px-5 py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 mx-auto mb-5 flex items-center justify-center">
            <Lock size={32} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            {state === 'not-found' && 'CPF não encontrado'}
            {state === 'ineligible' && 'Margem não disponível'}
            {state === 'error' && 'Erro ao consultar'}
            {state === 'cpf-blocked' && 'CPF não permitido'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {errorMessage || 'Tente novamente ou entre em contato.'}
          </p>

          <div className="space-y-3">
            <Button
              onClick={handleWhatsApp}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold"
            >
              Falar com Consultor
            </Button>
            <Button
              onClick={handleRetry}
              variant="outline"
              className="w-full h-12"
            >
              Tentar Novamente
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header progress={25} showChat />

      <main className="max-w-md mx-auto px-5 py-6">
        {/* Admin Badge */}
        {isAdmin && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-lg mb-4">
            <Shield size={16} />
            <span className="text-sm font-medium">Modo Administrador - Consulta livre de CPFs</span>
          </div>
        )}

        <h1 className="text-2xl font-bold text-foreground mb-2">
          Vamos começar
        </h1>
        <p className="text-muted-foreground mb-6">
          {isAdmin 
            ? 'Consulte qualquer CPF.' 
            : cpfVinculado 
              ? 'Seu CPF está vinculado à sua conta.' 
              : 'Nos informe seu CPF.'}
        </p>

        {/* Admin ou sem CPF vinculado: input editável */}
        {isAdmin || !cpfVinculado ? (
          <InputMask
            label="CPF"
            placeholder="000.000.000-00"
            mask="cpf"
            value={cpf}
            onChange={setCpf}
            error={
              cpf.length === 14 && !isValidCPF 
                ? 'CPF inválido' 
                : undefined
            }
          />
        ) : (
          /* Usuário comum com CPF vinculado: exibe bloqueado */
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              CPF Vinculado
            </label>
            <div className="flex items-center gap-3">
              <Lock size={18} className="text-primary" />
              <span className="text-foreground font-mono text-lg">
                {formatarCPF(cpfVinculado)}
              </span>
            </div>
          </div>
        )}
      </main>

      <FloatingButton 
        onClick={handleConsulta}
        disabled={!isValidCPF || !!isCpfBloqueado}
      />
    </div>
  );
}

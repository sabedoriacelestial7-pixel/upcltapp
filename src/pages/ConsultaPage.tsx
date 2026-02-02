import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { FloatingButton } from '@/components/FloatingButton';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { getProfile, vincularCPF, podeConsultarCPF, isUserAdmin } from '@/services/profileService';
import { solicitarAutorizacao, verificarAutorizacao } from '@/services/autorizacaoApi';
import { validarCPF, formatarCPF } from '@/utils/formatters';
import { abrirWhatsAppConsulta } from '@/utils/whatsapp';
import { CpfInputStep } from '@/components/consulta/CpfInputStep';
import { AuthorizationStep } from '@/components/consulta/AuthorizationStep';
import { ConsultaError } from '@/components/consulta/ConsultaError';
import { toast } from 'sonner';

type ConsultaStep = 'cpf' | 'authorization' | 'loading' | 'error';
type ErrorType = 'not-found' | 'ineligible' | 'error' | 'cpf-blocked';

const MAX_TENTATIVAS = 10;
const POLLING_INTERVAL = 5000; // 5 seconds

export default function ConsultaPage() {
  const navigate = useNavigate();
  const { setConsulta, usuario } = useApp();
  const { user } = useAuth();

  // Profile state
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpfVinculado, setCpfVinculado] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Flow state
  const [step, setStep] = useState<ConsultaStep>('cpf');
  const [errorType, setErrorType] = useState<ErrorType>('error');
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('Buscando as melhores taxas...');

  // Authorization state
  const [authRequested, setAuthRequested] = useState(false);
  const [canalEnvio, setCanalEnvio] = useState<'S' | 'W'>('S');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [tentativas, setTentativas] = useState(0);
  const [pollingActive, setPollingActive] = useState(false);

  // Load profile on mount
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
      
      if (profile?.telefone) {
        setTelefone(profile.telefone);
      }
      
      setLoadingProfile(false);
    }

    loadProfile();
  }, [user]);

  // Polling for authorization
  useEffect(() => {
    if (!pollingActive || tentativas >= MAX_TENTATIVAS) {
      return;
    }

    const interval = setInterval(async () => {
      await checkAuthorization();
    }, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [pollingActive, tentativas, cpf, telefone]);

  const isValidCPF = validarCPF(cpf);
  const cpfLimpo = cpf.replace(/\D/g, '');
  const isCpfBloqueado = !isAdmin && cpfVinculado && cpfLimpo !== cpfVinculado;

  // Request authorization via SMS/WhatsApp
  const handleSolicitarAutorizacao = async (canal: 'S' | 'W') => {
    if (!user) return;

    setIsRequesting(true);
    setCanalEnvio(canal);

    try {
      const result = await solicitarAutorizacao(cpf, telefone, canal);

      if (result.sucesso) {
        setAuthRequested(true);
        setPollingActive(true);
        toast.success(`Código enviado por ${canal === 'W' ? 'WhatsApp' : 'SMS'}!`);
      } else {
        toast.error(result.mensagem || 'Erro ao enviar código');
      }
    } catch (error) {
      toast.error('Erro ao solicitar autorização');
    } finally {
      setIsRequesting(false);
    }
  };

  // Check if authorization was granted
  const checkAuthorization = useCallback(async () => {
    if (!user || isChecking) return;

    setIsChecking(true);
    setTentativas(prev => prev + 1);

    try {
      const result = await verificarAutorizacao(cpf, telefone);

      if (result.status === 'authorized' && result.sucesso && result.dados) {
        setPollingActive(false);
        
        // Link CPF if not admin and not already linked
        if (!isAdmin && !cpfVinculado) {
          const vinculacao = await vincularCPF(user.id, cpf);
          if (vinculacao.success) {
            setCpfVinculado(cpfLimpo);
          }
        }

        setConsulta(result.dados);
        navigate('/resultado');
        return;
      }

      if (result.status === 'pending') {
        // Still waiting - continue polling
        if (tentativas >= MAX_TENTATIVAS) {
          setPollingActive(false);
          setErrorType('error');
          setErrorMessage('Tempo de autorização expirado. Solicite um novo código.');
          setStep('error');
        }
        return;
      }

      if (result.status === 'ineligible') {
        setPollingActive(false);
        setErrorType('ineligible');
        setErrorMessage(result.mensagem);
        setStep('error');
        return;
      }

      if (result.status === 'not_found') {
        setPollingActive(false);
        setErrorType('not-found');
        setErrorMessage(result.mensagem);
        setStep('error');
        return;
      }

      // Other errors
      setPollingActive(false);
      setErrorType('error');
      setErrorMessage(result.mensagem);
      setStep('error');
    } catch (error) {
      console.error('Error checking authorization:', error);
    } finally {
      setIsChecking(false);
    }
  }, [cpf, telefone, user, isAdmin, cpfVinculado, tentativas, navigate, setConsulta]);

  // Proceed to authorization step
  const handleProsseguir = async () => {
    if (!isValidCPF || !user) return;

    // Verify if user can consult this CPF
    const verificacao = await podeConsultarCPF(user.id, cpf);
    
    if (!verificacao.permitido) {
      setErrorType('cpf-blocked');
      setErrorMessage(verificacao.motivo || 'CPF não permitido');
      setStep('error');
      return;
    }

    // If admin, skip authorization and use legacy flow
    if (isAdmin) {
      setStep('loading');
      // For admin, use the old direct consultation
      const { consultarMargem } = await import('@/services/factaApi');
      
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
          setConsulta(result.dados);
          navigate('/resultado');
        } else if (result.mensagem.includes('não encontrado')) {
          setErrorType('not-found');
          setErrorMessage(result.mensagem);
          setStep('error');
        } else if (result.dados && !result.dados.elegivel) {
          setErrorType('ineligible');
          setErrorMessage(result.mensagem);
          setStep('error');
        } else {
          setErrorType('error');
          setErrorMessage(result.mensagem);
          setStep('error');
        }
      } catch (error) {
        clearInterval(messageInterval);
        setErrorType('error');
        setErrorMessage('Erro ao consultar. Tente novamente.');
        setStep('error');
      }
      return;
    }

    // Regular users go through authorization flow
    setStep('authorization');
  };

  const handleRetry = () => {
    setStep('cpf');
    setErrorMessage('');
    setAuthRequested(false);
    setPollingActive(false);
    setTentativas(0);
    
    // Regular user reverts to linked CPF
    if (!isAdmin && cpfVinculado) {
      setCpf(formatarCPF(cpfVinculado));
    }
  };

  const handleWhatsApp = () => {
    abrirWhatsAppConsulta(usuario?.nome || 'Cliente', cpf);
  };

  // Loading state
  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Loading screen during consultation
  if (step === 'loading') {
    return <LoadingScreen variant="searching" message={loadingMessage} />;
  }

  // Error state
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <Header showChat />
        <ConsultaError
          type={errorType}
          message={errorMessage}
          onRetry={handleRetry}
          onWhatsApp={handleWhatsApp}
        />
      </div>
    );
  }

  // Authorization step
  if (step === 'authorization') {
    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <Header progress={50} showChat />
        <main className="max-w-md mx-auto px-5 py-6">
          <AuthorizationStep
            cpf={formatarCPF(cpf)}
            telefone={telefone}
            onTelefoneChange={setTelefone}
            onSolicitarAutorizacao={handleSolicitarAutorizacao}
            onVerificarAutorizacao={checkAuthorization}
            isRequesting={isRequesting}
            isChecking={isChecking}
            authRequested={authRequested}
            canalEnvio={canalEnvio}
            tentativas={tentativas}
            maxTentativas={MAX_TENTATIVAS}
          />
        </main>
      </div>
    );
  }

  // CPF input step (default)
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header progress={25} showChat />

      <main className="max-w-md mx-auto px-5 py-6">
        <CpfInputStep
          cpf={cpf}
          onCpfChange={setCpf}
          isAdmin={isAdmin}
          cpfVinculado={cpfVinculado}
          isValidCPF={isValidCPF}
        />
      </main>

      <FloatingButton 
        onClick={handleProsseguir}
        disabled={!isValidCPF || !!isCpfBloqueado}
      />
    </div>
  );
}

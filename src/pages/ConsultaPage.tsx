import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
 import { PageTransition } from '@/components/PageTransition';
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

const MAX_TENTATIVAS = 20;
const POLLING_INTERVAL = 6000; // 6 seconds
const POLLING_INITIAL_DELAY = 15000; // 15 seconds before first poll

export default function ConsultaPage() {
  const navigate = useNavigate();
  const { setConsulta, usuario } = useApp();
  const { user } = useAuth();

  // Profile state
  const [cpf, setCpf] = useState('');
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState<Date | undefined>(undefined);
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

  // Track if profile was already loaded to prevent overwriting user input
  const profileLoadedRef = useRef(false);

  // Load profile on mount (only once)
  useEffect(() => {
    if (profileLoadedRef.current) return;

    async function loadProfile() {
      if (!user) {
        setLoadingProfile(false);
        return;
      }

      profileLoadedRef.current = true;

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

      if (profile?.nome) {
        setNome(profile.nome);
      }
      
      setLoadingProfile(false);
    }

    loadProfile();
  }, [user]);

  

  const isValidCPF = validarCPF(cpf);
  const cpfLimpo = cpf.replace(/\D/g, '');
  const telefoneLimpo = telefone.replace(/\D/g, '');
  const isTelefoneValido = telefoneLimpo.length >= 10;
  const isNomeValido = nome.trim().length >= 3;
  const isDataNascimentoValida = dataNascimento !== undefined;
  const isCpfBloqueado = !isAdmin && cpfVinculado && cpfLimpo !== cpfVinculado;
  const isFormValid = isValidCPF && isTelefoneValido && isNomeValido && isDataNascimentoValida && !isCpfBloqueado;

  // Keep a ref to the latest telefone to avoid stale closures
  const telefoneRef = useRef(telefone);
  telefoneRef.current = telefone;

  // Request authorization via SMS/WhatsApp
  const handleSolicitarAutorizacao = async (canal: 'S' | 'W') => {
    if (!user) {
      toast.error('Sessão expirada. Faça login novamente.');
      navigate('/login');
      return;
    }

    // Capture current telefone value immediately
    const currentTelefone = telefoneRef.current;

    setIsRequesting(true);
    setCanalEnvio(canal);

    try {
      // Pass user name for Facta API
      const nomeUsuario = usuario?.nome || user.email?.split('@')[0] || 'Cliente';
      const result = await solicitarAutorizacao(cpf, currentTelefone, canal, nomeUsuario);

      if (result.sucesso) {
        // Check if already authorized - go directly to verification
        if (result.status === 'already_authorized') {
          toast.success('CPF já autorizado! Consultando dados...');
          // Immediately check authorization (which will fetch the data)
          setAuthRequested(true);
          await checkAuthorization();
          return;
        }
        
        // Normal flow - code was sent
        setAuthRequested(true);
        setPollingActive(true);
        toast.success(`Código enviado por ${canal === 'W' ? 'WhatsApp' : 'SMS'}!`);
      } else {
        // Mostrar mensagem de erro específica
        const errorMsg = result.mensagem || 'Erro ao enviar código';
        toast.error(errorMsg);
        console.error('Erro ao solicitar autorização:', errorMsg);
      }
    } catch (error) {
      console.error('Erro na solicitação de autorização:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao solicitar autorização';
      
      // Check for session/auth errors
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
        toast.error('Sessão expirada. Faça login novamente.');
        navigate('/login');
      } else {
        toast.error(errorMessage);
      }
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

        // Show loading screen with bank carousel before navigating
        setStep('loading');
        setLoadingMessage('Estamos analisando as melhores condições para você...');

        // Wait to show the loading animation with bank logos
        await new Promise(resolve => setTimeout(resolve, 4000));

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

      // Token expired - if early attempts, treat as pending (user may not have responded yet)
      if (result.status === 'expired') {
        if (tentativas <= 3) {
          // Still early - don't kick user out, keep waiting
          return;
        }
        setPollingActive(false);
        setAuthRequested(false);
        setTentativas(0);
        toast.error('Código expirado. Solicite um novo código.');
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

      // Other errors - in early attempts keep polling
      if (tentativas <= 3) {
        return;
      }
      setPollingActive(false);
      setErrorType('error');
      setErrorMessage(result.mensagem);
      setStep('error');
    } catch (error) {
      console.error('Error checking authorization:', error);
    } finally {
      setIsChecking(false);
    }
  }, [cpf, telefone, user, isAdmin, cpfVinculado, cpfLimpo, tentativas, navigate, setConsulta, isChecking]);

  // Polling for authorization - with initial delay to give user time
  useEffect(() => {
    if (!pollingActive || tentativas >= MAX_TENTATIVAS) {
      return;
    }

    const delay = tentativas === 0 ? POLLING_INITIAL_DELAY : POLLING_INTERVAL;
    const timeout = setTimeout(async () => {
      await checkAuthorization();
    }, delay);

    return () => clearTimeout(timeout);
  }, [pollingActive, tentativas, checkAuthorization]);

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
      <div className="min-h-screen bg-background flex items-center justify-center">
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
       <PageTransition className="min-h-screen bg-background">
        <Header showChat />
        <ConsultaError
          type={errorType}
          message={errorMessage}
          onRetry={handleRetry}
          onWhatsApp={handleWhatsApp}
        />
       </PageTransition>
    );
  }

  // Authorization step
  if (step === 'authorization') {
    return (
       <PageTransition className="min-h-screen bg-background">
        <Header progress={50} showChat />
        <main className="max-w-md mx-auto px-4 py-5">
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
       </PageTransition>
    );
  }

  // CPF input step (default)
  return (
     <PageTransition className="min-h-screen bg-background">
      <Header progress={25} showChat />

      <main className="max-w-md mx-auto px-4 py-5">
        <CpfInputStep
          cpf={cpf}
          onCpfChange={setCpf}
          nome={nome}
          onNomeChange={setNome}
          dataNascimento={dataNascimento}
          onDataNascimentoChange={setDataNascimento}
          celular={telefone}
          onCelularChange={setTelefone}
          isAdmin={isAdmin}
          cpfVinculado={cpfVinculado}
          isValidCPF={isValidCPF}
        />
      </main>

      {isFormValid && (
        <FloatingButton 
          onClick={handleProsseguir}
          disabled={false}
        />
      )}
     </PageTransition>
  );
}

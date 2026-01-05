import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertTriangle, XCircle, AlertCircle, MessageCircle } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { InputMask } from '@/components/InputMask';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { consultarMargem } from '@/services/factaApi';
import { validarCPF } from '@/utils/formatters';
import { abrirWhatsAppConsulta } from '@/utils/whatsapp';

type ConsultaState = 'idle' | 'loading' | 'not-found' | 'ineligible' | 'error';

export default function ConsultaPage() {
  const navigate = useNavigate();
  const { setConsulta, usuario } = useApp();

  const [cpf, setCpf] = useState('');
  const [state, setState] = useState<ConsultaState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const isValidCPF = validarCPF(cpf);

  const handleConsulta = async () => {
    if (!isValidCPF) return;

    setState('loading');
    setErrorMessage('');

    try {
      const result = await consultarMargem(cpf);

      if (result.sucesso && result.dados) {
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
  };

  return (
    <div className="min-h-screen min-h-[100dvh] gradient-primary pb-20">
      <Header title="Consultar Margem" />

      <main className="max-w-md mx-auto px-4 py-6 animate-fade-in">
        {state === 'idle' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary/10 mx-auto mb-5 flex items-center justify-center">
              <Search size={32} className="text-secondary" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1.5">
              Informe seu CPF
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Vamos verificar sua margem disponível
            </p>

            <div className="bg-card rounded-2xl p-5 shadow-card">
              <InputMask
                label="CPF"
                placeholder="000.000.000-00"
                mask="cpf"
                value={cpf}
                onChange={setCpf}
                error={cpf.length === 14 && !isValidCPF ? 'CPF inválido' : undefined}
              />

              <Button
                onClick={handleConsulta}
                disabled={!isValidCPF}
                className="w-full h-12 mt-5 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold text-base shadow-button disabled:opacity-50 disabled:shadow-none touch-manipulation"
              >
                Consultar
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-5">
              CPFs de teste: 123.456.789-01, 987.654.321-00, 111.222.333-44
            </p>
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
            <div className="w-16 h-16 rounded-2xl bg-accent/10 mx-auto mb-5 flex items-center justify-center">
              <AlertTriangle size={32} className="text-accent" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1.5">
              CPF não encontrado
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              Seu CPF ainda não está em nossa base. Entre em contato para consulta completa.
            </p>

            <Button
              onClick={handleWhatsApp}
              className="w-full h-12 bg-whatsapp hover:bg-whatsapp/90 text-whatsapp-foreground font-semibold shadow-button touch-manipulation"
            >
              <MessageCircle size={20} />
              Falar com Consultor
            </Button>

            <Button
              onClick={handleRetry}
              variant="ghost"
              className="w-full mt-3 text-foreground touch-manipulation"
            >
              Tentar outro CPF
            </Button>
          </div>
        )}

        {state === 'ineligible' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 mx-auto mb-5 flex items-center justify-center">
              <XCircle size={32} className="text-destructive" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1.5">
              Margem não disponível
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              {errorMessage}
            </p>

            <Button
              onClick={handleWhatsApp}
              className="w-full h-12 bg-whatsapp hover:bg-whatsapp/90 text-whatsapp-foreground font-semibold shadow-button touch-manipulation"
            >
              <MessageCircle size={20} />
              Falar com Consultor
            </Button>

            <Button
              onClick={handleRetry}
              variant="ghost"
              className="w-full mt-3 text-foreground touch-manipulation"
            >
              Tentar outro CPF
            </Button>
          </div>
        )}

        {state === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 mx-auto mb-5 flex items-center justify-center">
              <AlertCircle size={32} className="text-destructive" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1.5">
              Erro ao consultar
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              {errorMessage || 'Tente novamente em alguns segundos'}
            </p>

            <Button
              onClick={handleRetry}
              className="w-full h-12 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold shadow-button touch-manipulation"
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

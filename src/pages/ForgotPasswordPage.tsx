import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { InputMask } from '@/components/InputMask';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { validarEmail } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';
import { PageTransition } from '@/components/PageTransition';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError('Email é obrigatório');
      return;
    }

    if (!validarEmail(email)) {
      setError('Email inválido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (resetError) {
        toast({
          title: 'Erro ao enviar email',
          description: resetError.message,
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      setEmailSent(true);
      toast({
        title: 'Email enviado!',
        description: 'Verifique sua caixa de entrada.'
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <PageTransition className="min-h-screen min-h-[100dvh] theme-dark bg-[hsl(220,13%,10%)] flex flex-col items-center justify-center p-5">
        <div className="w-full max-w-sm animate-fade-in text-center">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Email Enviado!</h2>
            <p className="text-white/70 mb-6">
              Enviamos um link de recuperação para <span className="text-primary font-medium">{email}</span>
            </p>
            <p className="text-white/50 text-sm mb-6">
              Verifique sua caixa de entrada e spam. O link expira em 1 hora.
            </p>
            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              Voltar para o login
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen min-h-[100dvh] theme-dark bg-[hsl(220,13%,10%)] flex flex-col items-center justify-center p-5 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo size="xl" variant="dark" className="justify-center mb-3" />
          <p className="text-white/70 text-base">
            Recupere sua senha
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-white text-center mb-2">
            Esqueceu sua senha?
          </h2>
          <p className="text-white/60 text-sm text-center mb-5">
            Digite seu email e enviaremos um link para redefinir sua senha.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <InputMask
              label="Email"
              type="email"
              placeholder="seu@email.com"
              icon={<Mail size={18} />}
              value={email}
              onChange={(v) => {
                setEmail(v);
                if (error) setError('');
              }}
              error={error}
              variant="dark"
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-5 bg-primary hover:bg-primary/90 text-white font-semibold text-base shadow-button touch-manipulation transition-all duration-300"
            >
              {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
            </Button>
          </form>
        </div>

        {/* Back to login */}
        <button
          onClick={() => navigate('/login')}
          className="flex items-center justify-center gap-2 w-full text-white/60 text-sm mt-5 hover:text-white/80 transition-colors touch-manipulation"
        >
          <ArrowLeft size={16} />
          Voltar para o login
        </button>
      </div>
    </PageTransition>
  );
}

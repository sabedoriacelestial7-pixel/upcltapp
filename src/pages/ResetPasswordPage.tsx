import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { InputMask } from '@/components/InputMask';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (error) {
        toast({
          title: 'Erro ao redefinir senha',
          description: error.message,
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      setSuccess(true);
      toast({
        title: 'Senha redefinida!',
        description: 'Sua senha foi alterada com sucesso.'
      });

      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
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

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (success) {
    return (
      <div className="min-h-screen min-h-[100dvh] theme-dark bg-[hsl(220,13%,10%)] flex flex-col items-center justify-center p-5">
        <div className="w-full max-w-sm animate-fade-in text-center">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Senha Redefinida!</h2>
            <p className="text-white/70">Redirecionando para o app...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] theme-dark bg-[hsl(220,13%,10%)] flex flex-col items-center justify-center p-5 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo size="xl" variant="dark" className="justify-center mb-3" />
          <p className="text-white/70 text-base">
            Defina sua nova senha
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-white text-center mb-5">
            Nova Senha
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="relative">
              <InputMask
                label="Nova senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={<Lock size={18} />}
                value={formData.password}
                onChange={(v) => updateField('password', v)}
                error={errors.password}
                variant="dark"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-white/50 p-1.5 touch-manipulation hover:text-white/70 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="relative">
              <InputMask
                label="Confirmar nova senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={<Lock size={18} />}
                value={formData.confirmPassword}
                onChange={(v) => updateField('confirmPassword', v)}
                error={errors.confirmPassword}
                variant="dark"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-5 bg-primary hover:bg-primary/90 text-white font-semibold text-base shadow-button touch-manipulation transition-all duration-300"
            >
              {loading ? 'Salvando...' : 'Salvar Nova Senha'}
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
    </div>
  );
}

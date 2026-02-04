import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Phone, User, Eye, EyeOff } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { InputMask } from '@/components/InputMask';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { validarEmail, validarTelefone } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';

type AuthMode = 'login' | 'cadastro';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    senha: '',
    confirmarSenha: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (mode === 'cadastro') {
      if (!formData.nome.trim()) {
        newErrors.nome = 'Nome é obrigatório';
      } else if (formData.nome.trim().length < 3) {
        newErrors.nome = 'Nome deve ter pelo menos 3 caracteres';
      }

      if (!formData.telefone) {
        newErrors.telefone = 'Telefone é obrigatório';
      } else if (!validarTelefone(formData.telefone)) {
        newErrors.telefone = 'Telefone inválido';
      }

      if (formData.senha !== formData.confirmarSenha) {
        newErrors.confirmarSenha = 'Senhas não coincidem';
      }

      if (!acceptedTerms) {
        newErrors.terms = 'Você deve aceitar os termos';
      }
    }

    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!validarEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.senha) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (formData.senha.length < 6) {
      newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (mode === 'cadastro') {
        const { error } = await signUp(formData.email, formData.senha, {
          nome: formData.nome,
          telefone: formData.telefone
        });

        if (error) {
          if (error.message.includes('already registered')) {
            setErrors({ email: 'Este email já está cadastrado' });
          } else {
            toast({
              title: 'Erro ao criar conta',
              description: error.message,
              variant: 'destructive'
            });
          }
          setLoading(false);
          return;
        }

        toast({
          title: 'Conta criada com sucesso!',
          description: 'Você já está logado.'
        });
      } else {
        const { error } = await signIn(formData.email, formData.senha);

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setErrors({ senha: 'Email ou senha incorretos' });
          } else {
            toast({
              title: 'Erro ao entrar',
              description: error.message,
              variant: 'destructive'
            });
          }
          setLoading(false);
          return;
        }

        toast({
          title: 'Bem-vindo de volta!',
          description: 'Login realizado com sucesso.'
        });
      }

      navigate('/');
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

  if (authLoading) {
    return (
      <div className="min-h-screen min-h-[100dvh] theme-dark bg-[hsl(220,13%,10%)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
            Crédito CLT sem burocracia
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-white text-center mb-5">
            {mode === 'login' ? 'Entrar' : 'Criar Conta'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'cadastro' && (
              <InputMask
                label="Nome completo"
                placeholder="Seu nome"
                icon={<User size={18} />}
                value={formData.nome}
                onChange={(v) => updateField('nome', v)}
                error={errors.nome}
                variant="dark"
              />
            )}

            <InputMask
              label="Email"
              type="email"
              placeholder="seu@email.com"
              icon={<Mail size={18} />}
              value={formData.email}
              onChange={(v) => updateField('email', v)}
              error={errors.email}
              variant="dark"
            />

            {mode === 'cadastro' && (
              <InputMask
                label="Telefone"
                placeholder="(99) 99999-9999"
                mask="telefone"
                icon={<Phone size={18} />}
                value={formData.telefone}
                onChange={(v) => updateField('telefone', v)}
                error={errors.telefone}
                variant="dark"
              />
            )}

            <div className="relative">
              <InputMask
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={<Lock size={18} />}
                value={formData.senha}
                onChange={(v) => updateField('senha', v)}
                error={errors.senha}
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

            {mode === 'cadastro' && (
              <>
                <div className="relative">
                  <InputMask
                    label="Confirmar senha"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    icon={<Lock size={18} />}
                    value={formData.confirmarSenha}
                    onChange={(v) => updateField('confirmarSenha', v)}
                    error={errors.confirmarSenha}
                    variant="dark"
                  />
                </div>

                <div className="flex items-start gap-2.5 pt-1.5">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    className="mt-0.5 border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <label 
                    htmlFor="terms" 
                    className="text-sm text-white/80 cursor-pointer leading-snug"
                  >
                    Aceito os <span className="text-primary font-medium">Termos de Uso</span> e{' '}
                    <span className="text-primary font-medium">Política de Privacidade</span>
                  </label>
                </div>
                {errors.terms && (
                  <p className="text-sm text-red-400">{errors.terms}</p>
                )}
              </>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-5 bg-primary hover:bg-primary/90 text-white font-semibold text-base shadow-button touch-manipulation transition-all duration-300"
            >
              {loading ? 'Carregando...' : mode === 'login' ? 'Entrar' : 'Criar Conta'}
            </Button>
          </form>

          {mode === 'login' && (
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="w-full text-center text-sm text-white/50 mt-3 hover:text-white/70 transition-colors touch-manipulation py-1"
            >
              Esqueci minha senha
            </button>
          )}
        </div>

        {/* Toggle mode */}
        <p className="text-center text-white/60 text-sm mt-5">
          {mode === 'login' ? (
            <>
              Não tem conta?{' '}
              <button
                onClick={() => setMode('cadastro')}
                className="text-primary font-semibold hover:underline touch-manipulation"
              >
                Criar conta grátis
              </button>
            </>
          ) : (
            <>
              Já tem conta?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-primary font-semibold hover:underline touch-manipulation"
              >
                Entrar
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
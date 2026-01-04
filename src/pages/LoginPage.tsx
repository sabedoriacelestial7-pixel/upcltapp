import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Phone, User, Eye, EyeOff } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { InputMask } from '@/components/InputMask';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useApp } from '@/contexts/AppContext';
import { validarEmail, validarTelefone } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';

type AuthMode = 'login' | 'cadastro';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUsuario } = useApp();
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

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setUsuario({
      nome: formData.nome || formData.email.split('@')[0],
      email: formData.email,
      telefone: formData.telefone
    });

    toast({
      title: mode === 'cadastro' ? 'Conta criada!' : 'Bem-vindo de volta!',
      description: 'Redirecionando...'
    });

    setLoading(false);
    navigate('/');
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen gradient-primary flex flex-col items-center justify-center p-6 safe-top safe-bottom">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo size="xl" className="justify-center mb-4" />
          <p className="text-muted-foreground text-lg">
            Crédito CLT sem burocracia
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-card rounded-3xl p-6 shadow-card animate-slide-up">
          <h2 className="text-xl font-bold text-card-foreground text-center mb-6">
            {mode === 'login' ? 'Entrar' : 'Criar Conta'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'cadastro' && (
              <InputMask
                label="Nome completo"
                placeholder="Seu nome"
                icon={<User size={20} />}
                value={formData.nome}
                onChange={(v) => updateField('nome', v)}
                error={errors.nome}
              />
            )}

            <InputMask
              label="Email"
              type="email"
              placeholder="seu@email.com"
              icon={<Mail size={20} />}
              value={formData.email}
              onChange={(v) => updateField('email', v)}
              error={errors.email}
            />

            {mode === 'cadastro' && (
              <InputMask
                label="Telefone"
                placeholder="(99) 99999-9999"
                mask="telefone"
                icon={<Phone size={20} />}
                value={formData.telefone}
                onChange={(v) => updateField('telefone', v)}
                error={errors.telefone}
              />
            )}

            <div className="relative">
              <InputMask
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={<Lock size={20} />}
                value={formData.senha}
                onChange={(v) => updateField('senha', v)}
                error={errors.senha}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[42px] text-muted-foreground"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {mode === 'cadastro' && (
              <>
                <div className="relative">
                  <InputMask
                    label="Confirmar senha"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    icon={<Lock size={20} />}
                    value={formData.confirmarSenha}
                    onChange={(v) => updateField('confirmarSenha', v)}
                    error={errors.confirmarSenha}
                  />
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                  />
                  <label 
                    htmlFor="terms" 
                    className="text-sm text-card-foreground cursor-pointer leading-tight"
                  >
                    Aceito os <span className="text-secondary font-medium">Termos de Uso</span> e{' '}
                    <span className="text-secondary font-medium">Política de Privacidade</span>
                  </label>
                </div>
                {errors.terms && (
                  <p className="text-sm text-destructive">{errors.terms}</p>
                )}
              </>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 mt-6 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold text-lg shadow-button"
            >
              {loading ? 'Carregando...' : mode === 'login' ? 'Entrar' : 'Criar Conta'}
            </Button>
          </form>

          {mode === 'login' && (
            <button className="w-full text-center text-sm text-muted-foreground mt-4 hover:text-card-foreground transition-colors">
              Esqueci minha senha
            </button>
          )}
        </div>

        {/* Toggle mode */}
        <p className="text-center text-muted-foreground mt-6">
          {mode === 'login' ? (
            <>
              Não tem conta?{' '}
              <button
                onClick={() => setMode('cadastro')}
                className="text-secondary font-semibold hover:underline"
              >
                Criar conta grátis
              </button>
            </>
          ) : (
            <>
              Já tem conta?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-secondary font-semibold hover:underline"
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

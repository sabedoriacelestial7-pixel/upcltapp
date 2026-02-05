import { Lock, AlertCircle, XCircle, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ErrorType = 'not-found' | 'ineligible' | 'error' | 'cpf-blocked';

interface ConsultaErrorProps {
  type: ErrorType;
  message: string;
  onRetry: () => void;
  onWhatsApp: () => void;
}

export function ConsultaError({ type, message, onRetry, onWhatsApp }: ConsultaErrorProps) {
  const config = {
    'not-found': {
      icon: AlertCircle,
      iconColor: 'text-primary',
      bgColor: 'bg-accent',
      title: 'CPF não encontrado'
    },
    'ineligible': {
      icon: XCircle,
      iconColor: 'text-destructive',
      bgColor: 'bg-destructive/10',
      title: 'Margem não disponível'
    },
    'error': {
      icon: AlertCircle,
      iconColor: 'text-destructive',
      bgColor: 'bg-destructive/10',
      title: 'Erro ao consultar'
    },
    'cpf-blocked': {
      icon: ShieldOff,
      iconColor: 'text-destructive',
      bgColor: 'bg-destructive/10',
      title: 'CPF não permitido'
    }
  };

  const { icon: Icon, iconColor, bgColor, title } = config[type];

  return (
    <div className="max-w-md mx-auto px-4 py-8 text-center">
      <div className={`w-16 h-16 rounded-full ${bgColor} mx-auto mb-5 flex items-center justify-center`}>
        <Icon size={32} className={iconColor} />
      </div>
      <h2 className="text-lg font-bold text-foreground mb-2">
        {title}
      </h2>
      <p className="text-muted-foreground mb-6">
        {message || 'Tente novamente ou entre em contato.'}
      </p>

      <div className="space-y-3">
        <Button
          onClick={onWhatsApp}
          className="w-full h-13 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        >
          Falar com Consultor
        </Button>
        <Button
          onClick={onRetry}
          variant="outline"
          className="w-full h-13"
        >
          Tentar Novamente
        </Button>
      </div>
    </div>
  );
}

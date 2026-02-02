import { useState, useEffect, useCallback } from 'react';
import { Smartphone, MessageCircle, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputMask } from '@/components/InputMask';
import { cn } from '@/lib/utils';

interface AuthorizationStepProps {
  cpf: string;
  telefone: string;
  onTelefoneChange: (value: string) => void;
  onSolicitarAutorizacao: (canal: 'S' | 'W') => Promise<void>;
  onVerificarAutorizacao: () => Promise<void>;
  isRequesting: boolean;
  isChecking: boolean;
  authRequested: boolean;
  canalEnvio: 'S' | 'W';
  tentativas: number;
  maxTentativas: number;
}

export function AuthorizationStep({
  cpf,
  telefone,
  onTelefoneChange,
  onSolicitarAutorizacao,
  onVerificarAutorizacao,
  isRequesting,
  isChecking,
  authRequested,
  canalEnvio,
  tentativas,
  maxTentativas
}: AuthorizationStepProps) {
  const [countdown, setCountdown] = useState(0);
  const telefoneLimpo = telefone.replace(/\D/g, '');
  const isTelefoneValido = telefoneLimpo.length >= 10;

  // Countdown timer for retry
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSolicitar = async (canal: 'S' | 'W') => {
    await onSolicitarAutorizacao(canal);
    setCountdown(30); // 30 seconds before can request again
  };

  if (!authRequested) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
            <Smartphone size={32} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            Autorização Necessária
          </h2>
          <p className="text-muted-foreground text-sm">
            Para consultar sua margem, você precisa autorizar o acesso aos seus dados 
            através de um código enviado por SMS ou WhatsApp.
          </p>
        </div>

        <InputMask
          label="Celular para receber o código"
          placeholder="(00) 00000-0000"
          mask="telefone"
          value={telefone}
          onChange={onTelefoneChange}
          error={
            telefone.length > 0 && !isTelefoneValido 
              ? 'Telefone inválido' 
              : undefined
          }
        />

        <div className="space-y-3">
          <Button
            onClick={() => handleSolicitar('S')}
            disabled={!isTelefoneValido || isRequesting}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold"
          >
            {isRequesting ? (
              <RefreshCw className="animate-spin mr-2" size={18} />
            ) : (
              <Smartphone className="mr-2" size={18} />
            )}
            Enviar código por SMS
          </Button>

          <Button
            onClick={() => handleSolicitar('W')}
            disabled={!isTelefoneValido || isRequesting}
            variant="outline"
            className="w-full h-12 border-green-500 text-green-600 hover:bg-green-50"
          >
            {isRequesting ? (
              <RefreshCw className="animate-spin mr-2" size={18} />
            ) : (
              <MessageCircle className="mr-2" size={18} />
            )}
            Enviar código por WhatsApp
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          CPF: {cpf}
        </p>
      </div>
    );
  }

  // Authorization requested - show waiting state
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-amber-100 mx-auto mb-4 flex items-center justify-center">
          <Clock size={32} className="text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          Aguardando Autorização
        </h2>
        <p className="text-muted-foreground text-sm">
          Enviamos um código para seu {canalEnvio === 'W' ? 'WhatsApp' : 'SMS'}.
          <br />
          <strong className="text-foreground">Responda com o código</strong> para autorizar a consulta.
        </p>
      </div>

      <div className="bg-muted/50 rounded-xl p-4 text-center">
        <p className="text-sm text-muted-foreground mb-2">
          Telefone: <span className="font-mono">{telefone}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Tentativas: {tentativas}/{maxTentativas}
        </p>
      </div>

      <div className="space-y-3">
        <Button
          onClick={onVerificarAutorizacao}
          disabled={isChecking}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold"
        >
          {isChecking ? (
            <>
              <RefreshCw className="animate-spin mr-2" size={18} />
              Verificando...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2" size={18} />
              Já autorizei, verificar
            </>
          )}
        </Button>

        <Button
          onClick={() => handleSolicitar(canalEnvio)}
          disabled={countdown > 0 || isRequesting}
          variant="outline"
          className="w-full h-12"
        >
          {countdown > 0 ? (
            `Reenviar em ${countdown}s`
          ) : (
            <>
              <RefreshCw className="mr-2" size={18} />
              Reenviar código
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

import { Lock, Shield } from 'lucide-react';
import { InputMask } from '@/components/InputMask';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatarCPF } from '@/utils/formatters';

interface CpfInputStepProps {
  cpf: string;
  onCpfChange: (value: string) => void;
  nome: string;
  onNomeChange: (value: string) => void;
  celular: string;
  onCelularChange: (value: string) => void;
  isAdmin: boolean;
  cpfVinculado: string | null;
  isValidCPF: boolean;
}

export function CpfInputStep({
  cpf,
  onCpfChange,
  nome,
  onNomeChange,
  celular,
  onCelularChange,
  isAdmin,
  cpfVinculado,
  isValidCPF
}: CpfInputStepProps) {
  const celularLimpo = celular.replace(/\D/g, '');
  const isCelularValido = celularLimpo.length >= 10;

  return (
    <div className="space-y-6">
      {/* Admin Badge */}
      {isAdmin && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-lg">
          <Shield size={16} />
          <span className="text-sm font-medium">Modo Administrador - Consulta livre de CPFs</span>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Vamos começar
        </h1>
        <p className="text-muted-foreground">
          {isAdmin 
            ? 'Preencha os dados para consultar.' 
            : cpfVinculado 
              ? 'Complete seus dados para consultar.' 
              : 'Preencha seus dados para consultar.'}
        </p>
      </div>

      {/* Nome */}
      <div className="space-y-2">
        <Label htmlFor="nome" className="text-sm font-medium text-foreground">
          Nome completo
        </Label>
        <Input
          id="nome"
          type="text"
          placeholder="Digite seu nome completo"
          value={nome}
          onChange={(e) => onNomeChange(e.target.value)}
          className="h-12 text-base"
        />
      </div>

      {/* CPF */}
      {isAdmin || !cpfVinculado ? (
        <InputMask
          label="CPF"
          placeholder="000.000.000-00"
          mask="cpf"
          value={cpf}
          onChange={onCpfChange}
          error={
            cpf.length === 14 && !isValidCPF 
              ? 'CPF inválido' 
              : undefined
          }
        />
      ) : (
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

      {/* Celular */}
      <InputMask
        label="Celular (para receber o código)"
        placeholder="(00) 00000-0000"
        mask="telefone"
        value={celular}
        onChange={onCelularChange}
        error={
          celular.length > 0 && !isCelularValido 
            ? 'Celular inválido' 
            : undefined
        }
      />

      <p className="text-xs text-muted-foreground text-center">
        Você receberá um código de autorização no celular informado.
      </p>
    </div>
  );
}

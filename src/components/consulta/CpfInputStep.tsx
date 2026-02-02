import { Lock, Shield } from 'lucide-react';
import { InputMask } from '@/components/InputMask';
import { formatarCPF } from '@/utils/formatters';

interface CpfInputStepProps {
  cpf: string;
  onCpfChange: (value: string) => void;
  isAdmin: boolean;
  cpfVinculado: string | null;
  isValidCPF: boolean;
}

export function CpfInputStep({
  cpf,
  onCpfChange,
  isAdmin,
  cpfVinculado,
  isValidCPF
}: CpfInputStepProps) {
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
            ? 'Consulte qualquer CPF.' 
            : cpfVinculado 
              ? 'Seu CPF está vinculado à sua conta.' 
              : 'Nos informe seu CPF.'}
        </p>
      </div>

      {/* Admin ou sem CPF vinculado: input editável */}
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
        /* Usuário comum com CPF vinculado: exibe bloqueado */
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
    </div>
  );
}

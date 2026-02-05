import { Lock, Shield, Calendar } from 'lucide-react';
import { InputMask } from '@/components/InputMask';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatarCPF } from '@/utils/formatters';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CpfInputStepProps {
  cpf: string;
  onCpfChange: (value: string) => void;
  nome: string;
  onNomeChange: (value: string) => void;
  dataNascimento: Date | undefined;
  onDataNascimentoChange: (value: Date | undefined) => void;
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
  dataNascimento,
  onDataNascimentoChange,
  celular,
  onCelularChange,
  isAdmin,
  cpfVinculado,
  isValidCPF
}: CpfInputStepProps) {
  const celularLimpo = celular.replace(/\D/g, '');
  const isCelularValido = celularLimpo.length >= 10;

  return (
    <div className="space-y-5">
      {/* Admin Badge */}
      {isAdmin && (
        <div className="flex items-center gap-2 bg-accent/50 border border-accent text-accent-foreground px-3 py-2.5 rounded-lg">
          <Shield size={16} />
          <span className="text-sm font-medium">Modo Administrador - Consulta livre de CPFs</span>
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold text-foreground mb-1.5">
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
      <div className="space-y-1.5">
        <Label htmlFor="nome" className="text-sm font-medium text-foreground">
          Nome completo
        </Label>
        <Input
          id="nome"
          type="text"
          placeholder="Digite seu nome completo"
          value={nome}
          onChange={(e) => onNomeChange(e.target.value)}
          className="h-13 text-base"
          autoComplete="name"
          enterKeyHint="next"
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
        <div className="bg-card rounded-xl border border-border p-4">
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">
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

      {/* Data de Nascimento */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">
          Data de nascimento
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full h-13 justify-start text-left font-normal text-base",
                !dataNascimento && "text-muted-foreground"
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {dataNascimento ? (
                format(dataNascimento, "dd/MM/yyyy", { locale: ptBR })
              ) : (
                <span>Selecione a data</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={dataNascimento}
              onSelect={onDataNascimentoChange}
              disabled={(date) =>
                date > new Date() || date < new Date("1900-01-01")
              }
              initialFocus
              captionLayout="dropdown-buttons"
              fromYear={1930}
              toYear={new Date().getFullYear()}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

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
        Você receberá um código de autorização no celular.
      </p>
    </div>
  );
}

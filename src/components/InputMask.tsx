import { forwardRef, InputHTMLAttributes, useState } from 'react';
import { cn } from '@/lib/utils';
import { formatarCPF, formatarTelefone } from '@/utils/formatters';

interface InputMaskProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  mask?: 'cpf' | 'telefone' | 'none';
  icon?: React.ReactNode;
  onChange?: (value: string) => void;
}

export const InputMask = forwardRef<HTMLInputElement, InputMaskProps>(
  ({ label, error, mask = 'none', icon, onChange, className, value, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;

      switch (mask) {
        case 'cpf':
          newValue = formatarCPF(newValue);
          break;
        case 'telefone':
          newValue = formatarTelefone(newValue);
          break;
      }

      onChange?.(newValue);
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              'w-full h-14 px-4 rounded-xl text-card-foreground',
              'bg-card border-2 transition-all duration-200',
              'placeholder:text-muted-foreground',
              'focus:outline-none',
              icon && 'pl-12',
              isFocused 
                ? 'border-secondary shadow-lg shadow-secondary/20' 
                : 'border-transparent',
              error && 'border-destructive',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-2 text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

InputMask.displayName = 'InputMask';

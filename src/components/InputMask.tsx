import { forwardRef, InputHTMLAttributes, useState, useId, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatarCPF, formatarTelefone } from '@/utils/formatters';

interface InputMaskProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  mask?: 'cpf' | 'telefone' | 'none';
  icon?: React.ReactNode;
  variant?: 'light' | 'dark';
  onChange?: (value: string) => void;
}

export const InputMask = forwardRef<HTMLInputElement, InputMaskProps>(
  ({ label, error, mask = 'none', icon, variant = 'light', onChange, className, value, id: providedId, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const isDark = variant === 'dark';
    const generatedId = useId();
    const inputId = providedId || generatedId;
    const errorId = `${inputId}-error`;

    // Mobile keyboard optimizations
    const inputProps = useMemo(() => {
      switch (mask) {
        case 'cpf':
          return {
            inputMode: 'numeric' as const,
            autoComplete: 'off',
            pattern: '[0-9]*',
            maxLength: 14,
            enterKeyHint: 'next' as const,
          };
        case 'telefone':
          return {
            inputMode: 'tel' as const,
            autoComplete: 'tel',
            maxLength: 16, // (99) 99999-9999 = 15 chars, +1 for safety
            enterKeyHint: 'next' as const,
          };
        default:
          return {};
      }
    }, [mask]);

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
          <label 
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium mb-2',
              isDark ? 'text-white/80' : 'text-foreground'
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div 
              className={cn(
                'absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none',
                isDark ? 'text-white/50' : 'text-muted-foreground'
              )}
              aria-hidden="true"
            >
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            {...inputProps}
            className={cn(
              'w-full h-14 px-4 rounded-xl transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              'text-base', // Prevents zoom on iOS
              icon && 'pl-12',
              isDark ? [
                'bg-white/90 border border-white/30 text-black',
                'placeholder:text-gray-500',
                isFocused && 'border-primary ring-2 ring-primary/20 bg-white',
                error && 'border-red-500'
              ] : [
                'bg-white border border-gray-200 text-foreground',
                'placeholder:text-muted-foreground',
                isFocused && 'border-primary ring-2 ring-primary/20',
                error && 'border-red-500'
              ],
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} className="mt-2 text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

InputMask.displayName = 'InputMask';
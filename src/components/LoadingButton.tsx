import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
}

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ isLoading, loadingText, children, disabled, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn('relative', className)}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && (
          <Loader2 
            className="mr-2 h-4 w-4 animate-spin" 
            aria-hidden="true" 
          />
        )}
        <span className={cn(isLoading && !loadingText && 'opacity-0')}>
          {children}
        </span>
        {isLoading && loadingText && (
          <span>{loadingText}</span>
        )}
        {isLoading && !loadingText && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          </span>
        )}
        <span className="sr-only">
          {isLoading ? (loadingText || 'Carregando...') : ''}
        </span>
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';

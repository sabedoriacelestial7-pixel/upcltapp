import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
  subtext?: string;
}

const sizes = {
  sm: 'w-6 h-6 border-2',
  md: 'w-10 h-10 border-3',
  lg: 'w-14 h-14 border-4'
};

export function LoadingSpinner({ size = 'md', className, text, subtext }: LoadingSpinnerProps) {
  return (
    <div 
      className={cn('flex flex-col items-center justify-center gap-4', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className={cn(
          'rounded-full border-secondary/30 border-t-secondary animate-spin',
          sizes[size]
        )}
        aria-hidden="true"
      />
      {text && (
        <div className="text-center">
          <p className="text-foreground font-medium animate-pulse-soft">{text}</p>
          {subtext && (
            <p className="text-muted-foreground text-sm mt-1">{subtext}</p>
          )}
        </div>
      )}
      <span className="sr-only">{text || 'Carregando...'}</span>
    </div>
  );
}

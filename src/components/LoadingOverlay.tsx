import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  subMessage?: string;
  variant?: 'fullscreen' | 'inline';
}

export function LoadingOverlay({ 
  isLoading, 
  message = 'Processando...', 
  subMessage,
  variant = 'inline' 
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  if (variant === 'fullscreen') {
    return (
      <div 
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-card shadow-lg border border-border">
          <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden="true" />
          <div className="text-center">
            <p className="font-medium text-foreground">{message}</p>
            {subMessage && (
              <p className="text-sm text-muted-foreground mt-1">{subMessage}</p>
            )}
          </div>
        </div>
        <span className="sr-only">{message}</span>
      </div>
    );
  }

  return (
    <div 
      className="absolute inset-0 z-10 bg-background/60 backdrop-blur-[2px] flex items-center justify-center rounded-inherit"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
        <span className="text-sm font-medium text-foreground">{message}</span>
      </div>
      <span className="sr-only">{message}</span>
    </div>
  );
}

// Toast-style loading notification
interface LoadingToastProps {
  isLoading: boolean;
  message: string;
}

export function LoadingToast({ isLoading, message }: LoadingToastProps) {
  if (!isLoading) return null;

  return (
    <div 
      className={cn(
        "fixed bottom-20 left-1/2 -translate-x-1/2 z-50",
        "bg-foreground text-background px-4 py-3 rounded-full shadow-lg",
        "flex items-center gap-3 animate-fade-in"
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

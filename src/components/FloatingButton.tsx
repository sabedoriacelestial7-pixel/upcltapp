import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function FloatingButton({ onClick, disabled, className, label = 'Continuar' }: FloatingButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'fixed bottom-[88px] right-5 w-14 h-14 rounded-full',
        'bg-primary hover:bg-primary/90',
        'flex items-center justify-center',
        'shadow-lg shadow-primary/30',
        'transition-all duration-150 active:scale-90 touch-manipulation',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      <ArrowRight size={24} className="text-primary-foreground" />
    </button>
  );
}
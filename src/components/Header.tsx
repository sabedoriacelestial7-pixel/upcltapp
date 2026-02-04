import { ChevronLeft, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showChat?: boolean;
  variant?: 'light' | 'transparent';
  className?: string;
  rightElement?: React.ReactNode;
  progress?: number; // 0 to 100
}

export function Header({ 
  title, 
  showBack = true, 
  showChat = false,
  variant = 'light',
  className, 
  rightElement,
  progress 
}: HeaderProps) {
  const navigate = useNavigate();
  const isLight = variant === 'light';

  return (
    <header 
      className={cn(
        'sticky top-0 z-40',
        isLight ? 'bg-[#f5f5f5]' : 'bg-transparent',
        className
      )}
      role="banner"
    >
      {/* Progress bar */}
      {progress !== undefined && (
        <div 
          className="progress-bar" 
          role="progressbar" 
          aria-valuenow={progress} 
          aria-valuemin={0} 
          aria-valuemax={100}
          aria-label="Progresso do formulário"
        >
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      )}

      <div className="px-4 h-14 pt-[env(safe-area-inset-top)] flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-[44px]">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              aria-label="Voltar para página anterior"
              className={cn(
                'p-2 -ml-2 rounded-full transition-colors active:scale-95 touch-manipulation',
                'min-w-[44px] min-h-[44px] flex items-center justify-center',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                isLight ? 'text-primary hover:bg-gray-100' : 'text-primary hover:bg-white/10'
              )}
            >
              <ChevronLeft size={28} strokeWidth={2} aria-hidden="true" />
            </button>
          )}
        </div>

        {title && (
          <h1 className={cn(
            'text-lg font-semibold truncate absolute left-1/2 -translate-x-1/2',
            isLight ? 'text-foreground' : 'text-white'
          )}>
            {title}
          </h1>
        )}

        <div className="flex items-center gap-2 min-w-[44px] justify-end">
          {showChat && (
            <button
              aria-label="Abrir chat de suporte"
              className={cn(
                'p-2 rounded-full transition-colors active:scale-95 touch-manipulation',
                'min-w-[44px] min-h-[44px] flex items-center justify-center',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                isLight ? 'text-primary hover:bg-gray-100' : 'text-primary hover:bg-white/10'
              )}
            >
              <MessageSquare size={24} aria-hidden="true" />
            </button>
          )}
          {rightElement}
        </div>
      </div>
    </header>
  );
}
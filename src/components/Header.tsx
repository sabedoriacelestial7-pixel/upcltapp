import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  className?: string;
  rightElement?: React.ReactNode;
}

export function Header({ title, showBack = true, className, rightElement }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className={cn(
      'sticky top-0 z-40 bg-primary/95 backdrop-blur-lg border-b border-border',
      'px-4 h-14 pt-[env(safe-area-inset-top)] flex items-center justify-between',
      className
    )}>
      <div className="flex items-center gap-2">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 -ml-2 rounded-full hover:bg-muted/20 transition-colors active:scale-95 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ChevronLeft size={24} className="text-foreground" />
          </button>
        )}
        <h1 className="text-lg font-semibold text-foreground truncate">{title}</h1>
      </div>
      {rightElement && <div>{rightElement}</div>}
    </header>
  );
}

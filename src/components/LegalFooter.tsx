import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LegalFooterProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export function LegalFooter({ className, variant = 'light' }: LegalFooterProps) {
  const textColor = variant === 'dark' ? 'text-white/50' : 'text-muted-foreground';
  const linkColor = variant === 'dark' ? 'text-white/70 hover:text-white' : 'text-foreground hover:text-primary';
  
  return (
    <footer className={cn('text-center text-xs', textColor, className)}>
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <Link 
          to="/termos-uso" 
          className={cn('transition-colors', linkColor)}
        >
          Termos de Uso
        </Link>
        <span>•</span>
        <Link 
          to="/politica-privacidade" 
          className={cn('transition-colors', linkColor)}
        >
          Política de Privacidade
        </Link>
      </div>
      <p className="mt-2">
        © {new Date().getFullYear()} I9 Consultoria e Negócios LTDA
      </p>
    </footer>
  );
}

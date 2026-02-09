import { MessageSquare } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
const SUPPORT_WHATSAPP = 'https://wa.me/5527981377033?text=Ol%C3%A1!%20Preciso%20de%20suporte%20no%20app%20UpCLT.';

const HIDDEN_ROUTES = ['/welcome', '/login', '/forgot-password', '/reset-password', '/sobre', '/install'];

export function SupportBanner() {
  const location = useLocation();

  const shouldHide = HIDDEN_ROUTES.some(route => location.pathname.startsWith(route));
  if (shouldHide) return null;

  return (
    <button
      onClick={() => window.open(SUPPORT_WHATSAPP, '_blank')}
      className={cn(
        'w-full flex items-center justify-center gap-2 py-2 px-4',
        'bg-primary/5 border-b border-primary/10',
        'text-xs text-muted-foreground',
        'hover:bg-primary/10 transition-colors',
        'touch-manipulation'
      )}
    >
      <MessageSquare size={14} className="text-primary shrink-0" />
      <span>Dúvidas ou precisa de suporte? <strong className="text-primary">Fale conosco</strong></span>
    </button>
  );
}

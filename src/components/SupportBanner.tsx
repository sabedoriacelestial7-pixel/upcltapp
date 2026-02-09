import { MessageSquare } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { abrirWhatsAppSimples } from '@/utils/whatsapp';

const HIDDEN_ROUTES = ['/welcome', '/login', '/forgot-password', '/reset-password', '/sobre', '/install'];

export function SupportBanner() {
  const location = useLocation();

  const shouldHide = HIDDEN_ROUTES.some(route => location.pathname.startsWith(route));
  if (shouldHide) return null;

  return (
    <button
      onClick={abrirWhatsAppSimples}
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

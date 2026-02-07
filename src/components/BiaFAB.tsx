import { MessageSquare } from 'lucide-react';
import { useBiaChat } from '@/contexts/BiaChatContext';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Páginas onde o FAB não deve aparecer (rotas públicas/auth)
const HIDDEN_ROUTES = ['/welcome', '/login', '/forgot-password', '/reset-password', '/sobre'];

// O FAB agora aparece em todas as rotas protegidas para facilitar o acesso à Bia
// Removida a lista HAS_HEADER_CHAT para garantir visibilidade máxima da assistente

export function BiaFAB() {
  const { open, isOpen } = useBiaChat();
  const location = useLocation();

  // Não mostra em rotas ocultas ou quando o drawer já está aberto
  const shouldHide = HIDDEN_ROUTES.some(route => location.pathname.startsWith(route)) || isOpen;

  return (
    <AnimatePresence>
      {!shouldHide && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onClick={open}
          aria-label="Falar com a Bia"
          className={cn(
            'fixed z-40',
            'bottom-[88px] right-4',
            'w-14 h-14 rounded-full',
            'bg-primary text-primary-foreground',
            'flex items-center justify-center',
            'shadow-lg shadow-primary/30',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'touch-manipulation'
          )}
        >
          <MessageSquare size={24} />
          
          {/* Pulse ring animation */}
          <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: '2s' }} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

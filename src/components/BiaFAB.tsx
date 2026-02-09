import { MessageSquare } from 'lucide-react';
import { useBiaChat } from '@/contexts/BiaChatContext';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

const HIDDEN_ROUTES = ['/welcome', '/login', '/forgot-password', '/reset-password', '/sobre'];

export function BiaFAB() {
  const { open, isOpen } = useBiaChat();
  const location = useLocation();
  const constraintsRef = useRef<HTMLDivElement>(null);
  const [showHint, setShowHint] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const dragTimeout = useRef<NodeJS.Timeout>();

  const shouldHide = HIDDEN_ROUTES.some(route => location.pathname.startsWith(route)) || isOpen;

  // Show hint tooltip periodically for new users
  useEffect(() => {
    if (shouldHide) return;
    const seen = sessionStorage.getItem('bia-hint-seen');
    if (!seen) {
      const t = setTimeout(() => {
        setShowHint(true);
        setTimeout(() => {
          setShowHint(false);
          sessionStorage.setItem('bia-hint-seen', '1');
        }, 4000);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [shouldHide, location.pathname]);

  return (
    <>
      {/* Full-screen drag constraints */}
      <div
        ref={constraintsRef}
        className="fixed inset-0 pointer-events-none z-30"
        style={{ top: 'env(safe-area-inset-top)', bottom: 'env(safe-area-inset-bottom)' }}
      />

      <AnimatePresence>
        {!shouldHide && (
          <>
            {/* Hint tooltip */}
            <AnimatePresence>
              {showHint && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.9 }}
                  className="fixed z-50 bottom-[220px] right-4 bg-card text-foreground text-xs rounded-lg px-3 py-2 shadow-lg border border-border max-w-[180px] pointer-events-none"
                >
                  <p className="font-medium">Precisa de ajuda? 💬</p>
                  <p className="text-muted-foreground mt-0.5">Toque na Bia ou arraste para onde quiser!</p>
                  <div className="absolute -bottom-1.5 right-5 w-3 h-3 bg-card border-b border-r border-border rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              drag
              dragConstraints={constraintsRef}
              dragElastic={0.1}
              dragMomentum={false}
              onDragStart={() => {
                setHasDragged(true);
                setShowHint(false);
              }}
              onDragEnd={() => {
                // Reset drag state after a short delay to prevent click firing
                dragTimeout.current = setTimeout(() => setHasDragged(false), 200);
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={() => {
                if (!hasDragged) open();
              }}
              aria-label="Falar com a Bia — Suporte e ajuda"
              className={cn(
                'fixed z-40',
                'bottom-[160px] right-4',
                'w-14 h-14 rounded-full',
                'bg-primary text-primary-foreground',
                'flex items-center justify-center',
                'shadow-lg shadow-primary/30',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'touch-manipulation cursor-grab active:cursor-grabbing'
              )}
            >
              <MessageSquare size={24} />
              <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: '2s' }} />
            </motion.button>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

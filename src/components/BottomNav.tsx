import { Home, FileText, HelpCircle, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { memo, useCallback } from 'react';

const navItems = [
  { path: '/', icon: Home, label: 'Início' },
  { path: '/propostas', icon: FileText, label: 'Operações' },
  { path: '/ajuda', icon: HelpCircle, label: 'Ajuda' },
  { path: '/perfil', icon: Settings, label: 'Ajustes' }
] as const;

// Memoized to prevent re-renders on route changes in parent
export const BottomNav = memo(function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 backdrop-blur-sm bg-background/95"
      role="navigation"
      aria-label="Navegação principal"
    >
      <div className="max-w-md mx-auto flex justify-around items-center h-[68px] pb-[env(safe-area-inset-bottom)]">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path || 
            (path === '/propostas' && location.pathname.startsWith('/propostas'));
          
          return (
            <button
              key={path}
              onClick={() => handleNavClick(path)}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-w-[72px] min-h-[52px] py-2 px-3',
                'transition-colors duration-150',
                'touch-manipulation active:scale-90',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon 
                size={24} 
                strokeWidth={isActive ? 2.5 : 2}
                aria-hidden="true"
                className={cn(
                  'transition-transform duration-150',
                  isActive && 'scale-110 -translate-y-0.5'
                )}
              />
              <span className={cn(
                'text-[10px] leading-none mt-0.5',
                isActive ? 'font-semibold' : 'font-medium'
              )}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
});
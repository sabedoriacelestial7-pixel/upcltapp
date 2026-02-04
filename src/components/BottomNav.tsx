import { Home, FileText, HelpCircle, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: Home, label: 'Início' },
  { path: '/propostas', icon: FileText, label: 'Operações' },
  { path: '/ajuda', icon: HelpCircle, label: 'Ajuda' },
  { path: '/perfil', icon: Settings, label: 'Ajustes' }
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-[#f5f5f5] border-t border-gray-200 z-50"
      role="navigation"
      aria-label="Navegação principal"
    >
      <div className="max-w-md mx-auto flex justify-around items-center h-16 pb-[env(safe-area-inset-bottom)]">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path || 
            (path === '/propostas' && location.pathname.startsWith('/propostas'));
          
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[48px] py-1.5 px-3',
                'transition-all duration-200',
                'active:scale-95 touch-manipulation',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg',
                isActive 
                  ? 'text-primary' 
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Icon 
                size={22} 
                strokeWidth={isActive ? 2.5 : 2}
                aria-hidden="true"
              />
              <span className={cn(
                'text-[11px] leading-tight',
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
}
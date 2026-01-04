import { Home, Calculator, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: Home, label: 'Início' },
  { path: '/simulador', icon: Calculator, label: 'Simular' },
  { path: '/perfil', icon: User, label: 'Perfil' }
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-primary/95 backdrop-blur-lg border-t border-border safe-bottom z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-6 py-2 rounded-lg transition-all duration-200',
                'active:scale-95',
                isActive 
                  ? 'text-secondary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn(
                'text-xs font-medium',
                isActive && 'font-semibold'
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

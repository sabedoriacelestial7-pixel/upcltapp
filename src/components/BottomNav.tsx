import { Home, Calculator, User, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: Home, label: 'Início' },
  { path: '/consulta', icon: Search, label: 'Consulta' },
  { path: '/simulador', icon: Calculator, label: 'Simular' },
  { path: '/perfil', icon: User, label: 'Perfil' }
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0f172a]/95 backdrop-blur-xl border-t border-white/10 z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-16 pb-[env(safe-area-inset-bottom)]">
        {navItems.map(({ path, icon: Icon, label }, index) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-[48px] py-1.5 px-3 rounded-xl',
                'transition-all duration-300 ease-out',
                'active:scale-90 touch-manipulation group',
                isActive 
                  ? 'text-[#22c55e]' 
                  : 'text-white/50 hover:text-white/80'
              )}
              style={{ 
                animationDelay: `${index * 50}ms`
              }}
            >
              {/* Active indicator */}
              {isActive && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-full shadow-lg shadow-green-500/50" />
              )}
              
              {/* Icon container */}
              <div className={cn(
                'relative transition-all duration-300',
                isActive && 'scale-110 -translate-y-0.5',
                'group-hover:scale-110'
              )}>
                <Icon 
                  size={22} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={cn(
                    'transition-all duration-300',
                    isActive && 'drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                  )}
                />
              </div>
              
              {/* Label */}
              <span className={cn(
                'text-[10px] leading-tight transition-all duration-300',
                isActive ? 'font-semibold' : 'font-medium',
                isActive && 'text-[#22c55e]'
              )}>
                {label}
              </span>

              {/* Hover glow effect */}
              <span className={cn(
                'absolute inset-0 rounded-xl transition-all duration-300 -z-10',
                'bg-[#22c55e]/0 group-hover:bg-[#22c55e]/5',
                isActive && 'bg-[#22c55e]/10'
              )} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}

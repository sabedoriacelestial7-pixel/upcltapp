import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  FileText, 
  Shield, 
  CreditCard, 
  LogOut,
  ChevronRight
} from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Logo } from '@/components/Logo';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const menuItems = [
  { icon: MessageSquare, label: 'Deixar sugestão', action: 'sugestao' },
  { icon: FileText, label: 'Termos de Uso', action: 'termos' },
  { icon: Shield, label: 'Política de Privacidade', action: 'privacidade' },
  { icon: CreditCard, label: 'Dados trabalhistas e financeiros', action: 'dados' },
];

export default function PerfilPage() {
  const navigate = useNavigate();
  const { logout } = useApp();

  const handleMenuClick = (action: string) => {
    if (action === 'termos') {
      navigate('/termos-uso');
      return;
    }
    if (action === 'privacidade') {
      navigate('/politica-privacidade');
      return;
    }
    if (action === 'dados') {
      navigate('/dados-trabalhistas');
      return;
    }
    toast.info('Em breve!', { description: 'Esta funcionalidade estará disponível em breve.' });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-20">
      <main className="max-w-md mx-auto px-5 pt-[calc(env(safe-area-inset-top)+3rem)]">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Logo size="lg" variant="light" />
        </div>

        {/* Menu Items */}
        <div className="space-y-1">
          {menuItems.map(({ icon: Icon, label, action }) => (
            <button
              key={action}
              onClick={() => handleMenuClick(action)}
              className={cn(
                'w-full flex items-center justify-between p-4',
                'bg-transparent border-b border-gray-200',
                'hover:bg-gray-100 transition-colors',
                'active:bg-gray-200 touch-manipulation'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-primary" />
                </div>
                <span className="font-medium text-foreground text-sm">{label}</span>
              </div>
              <ChevronRight size={20} className="text-primary" />
            </button>
          ))}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={cn(
              'w-full flex items-center gap-3 p-4',
              'bg-transparent border-b border-gray-200',
              'hover:bg-gray-100 transition-colors',
              'active:bg-gray-200 touch-manipulation'
            )}
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <LogOut size={20} className="text-primary" />
            </div>
            <span className="font-medium text-foreground text-sm">Sair</span>
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
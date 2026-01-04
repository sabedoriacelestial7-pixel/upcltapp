import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  History, 
  Edit, 
  FileText, 
  Shield, 
  Info, 
  LogOut,
  ChevronRight
} from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: History, label: 'Minhas Consultas', action: 'consultas' },
  { icon: Edit, label: 'Editar Perfil', action: 'editar' },
  { icon: FileText, label: 'Termos de Uso', action: 'termos' },
  { icon: Shield, label: 'Política de Privacidade', action: 'privacidade' },
  { icon: Info, label: 'Sobre o UpCLT', action: 'sobre' }
];

export default function PerfilPage() {
  const navigate = useNavigate();
  const { usuario, logout } = useApp();

  const handleMenuClick = (action: string) => {
    // For now, just show a toast or navigate
    switch (action) {
      case 'consultas':
        navigate('/consulta');
        break;
      default:
        // Could navigate to specific pages
        break;
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitial = () => {
    return usuario?.nome?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <div className="min-h-screen gradient-primary pb-24">
      <Header title="Meu Perfil" showBack={false} />

      <main className="max-w-md mx-auto px-4 py-6 space-y-6 animate-fade-in">
        {/* User Card */}
        <div className="bg-card rounded-3xl p-6 shadow-card">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
              <span className="text-2xl font-bold text-secondary-foreground">
                {getInitial()}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-card-foreground">
                {usuario?.nome || 'Usuário'}
              </h2>
              <p className="text-muted-foreground text-sm">Cliente UpCLT</p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-muted-foreground" />
              <span className="text-card-foreground">
                {usuario?.email || 'email@exemplo.com'}
              </span>
            </div>
            {usuario?.telefone && (
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-muted-foreground" />
                <span className="text-card-foreground">{usuario.telefone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Menu */}
        <div className="bg-card rounded-3xl shadow-card overflow-hidden">
          {menuItems.map(({ icon: Icon, label, action }, index) => (
            <button
              key={action}
              onClick={() => handleMenuClick(action)}
              className={cn(
                'w-full flex items-center justify-between p-4',
                'hover:bg-muted/50 transition-colors active:bg-muted/70',
                index < menuItems.length - 1 && 'border-b border-border'
              )}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <Icon size={20} className="text-secondary" />
                </div>
                <span className="font-medium text-card-foreground">{label}</span>
              </div>
              <ChevronRight size={20} className="text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={cn(
            'w-full bg-card rounded-2xl p-4 shadow-card',
            'flex items-center justify-center gap-3',
            'text-destructive font-medium',
            'hover:bg-destructive/5 transition-colors active:scale-[0.99]'
          )}
        >
          <LogOut size={20} />
          Sair da conta
        </button>

        {/* Version */}
        <p className="text-center text-xs text-muted-foreground">
          UpCLT v1.0.0 • 3F Promotora
        </p>
      </main>

      <BottomNav />
    </div>
  );
}

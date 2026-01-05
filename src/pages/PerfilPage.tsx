import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  History, 
  Edit, 
  FileText, 
  Shield, 
  Info, 
  LogOut,
  ChevronRight,
  Calculator,
  Trash2,
  HelpCircle
} from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const menuItems = [
  { icon: History, label: 'Histórico de consultas', action: 'consultas' },
  { icon: Calculator, label: 'Minhas simulações salvas', action: 'simulacoes' },
  { icon: Edit, label: 'Editar dados', action: 'editar' },
  { icon: HelpCircle, label: 'Ajuda / FAQ', action: 'ajuda' },
  { icon: FileText, label: 'Termos de uso', action: 'termos' },
  { icon: Shield, label: 'Política de privacidade', action: 'privacidade' },
  { icon: Info, label: 'Sobre o app', action: 'sobre' }
];

export default function PerfilPage() {
  const navigate = useNavigate();
  const { usuario, logout } = useApp();

  const handleMenuClick = (action: string) => {
    switch (action) {
      case 'consultas':
        navigate('/consulta');
        break;
      case 'simulacoes':
        navigate('/simulador');
        break;
      case 'ajuda':
        navigate('/ajuda');
        break;
      default:
        toast.info('Em breve!', { description: 'Esta funcionalidade estará disponível em breve.' });
        break;
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeleteAccount = () => {
    toast.info('Solicitação enviada', { 
      description: 'Sua solicitação de exclusão será processada em até 48 horas conforme a LGPD.' 
    });
  };

  const getInitial = () => {
    return usuario?.nome?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <div className="min-h-screen min-h-[100dvh] gradient-primary pb-20">
      <Header title="Meu Perfil" showBack={false} />

      <main className="max-w-md mx-auto px-4 py-5 space-y-4 animate-fade-in">
        {/* User Card */}
        <div className="bg-card rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-secondary-foreground">
                {getInitial()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-card-foreground truncate">
                {usuario?.nome || 'Usuário'}
              </h2>
              <p className="text-muted-foreground text-sm">Cliente UpCLT</p>
            </div>
          </div>

          <div className="space-y-2.5 pt-3.5 border-t border-border">
            <div className="flex items-center gap-2.5">
              <Mail size={16} className="text-muted-foreground shrink-0" />
              <span className="text-sm text-card-foreground truncate">
                {usuario?.email || 'email@exemplo.com'}
              </span>
            </div>
            {usuario?.telefone && (
              <div className="flex items-center gap-2.5">
                <Phone size={16} className="text-muted-foreground shrink-0" />
                <span className="text-sm text-card-foreground">{usuario.telefone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Menu */}
        <div className="bg-card rounded-2xl shadow-card overflow-hidden">
          {menuItems.map(({ icon: Icon, label, action }, index) => (
            <button
              key={action}
              onClick={() => handleMenuClick(action)}
              className={cn(
                'w-full flex items-center justify-between p-3.5 min-h-[52px]',
                'hover:bg-muted/50 transition-colors active:bg-muted/70 touch-manipulation',
                index < menuItems.length - 1 && 'border-b border-border'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-secondary" />
                </div>
                <span className="font-medium text-card-foreground text-sm">{label}</span>
              </div>
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Delete Account */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className={cn(
                'w-full bg-card rounded-xl p-3.5 shadow-card min-h-[52px]',
                'flex items-center justify-center gap-2.5',
                'text-destructive font-medium text-sm',
                'hover:bg-destructive/5 transition-colors active:scale-[0.99] touch-manipulation'
              )}
            >
              <Trash2 size={18} />
              Excluir minha conta (LGPD)
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir conta</AlertDialogTitle>
              <AlertDialogDescription>
                Conforme a LGPD, você tem o direito de solicitar a exclusão dos seus dados. 
                Esta ação é irreversível e todos os seus dados serão removidos permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Confirmar exclusão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={cn(
            'w-full bg-card rounded-xl p-3.5 shadow-card min-h-[52px]',
            'flex items-center justify-center gap-2.5',
            'text-muted-foreground font-medium text-sm',
            'hover:bg-muted/50 transition-colors active:scale-[0.99] touch-manipulation'
          )}
        >
          <LogOut size={18} />
          Sair da conta
        </button>

        {/* Version */}
        <p className="text-center text-xs text-muted-foreground pt-2">
          UpCLT v1.0.0 • 3F Promotora
        </p>
      </main>

      <BottomNav />
    </div>
  );
}
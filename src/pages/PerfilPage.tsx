import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  FileText, 
  Shield, 
  CreditCard, 
   LogOut,
   ChevronRight,
   Trash2
} from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Logo } from '@/components/Logo';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const menuItems = [
  { icon: MessageSquare, label: 'Deixar sugestão', action: 'sugestao' },
  { icon: FileText, label: 'Termos de Uso', action: 'termos' },
  { icon: Shield, label: 'Política de Privacidade', action: 'privacidade' },
  { icon: CreditCard, label: 'Dados trabalhistas e financeiros', action: 'dados' },
];

export default function PerfilPage() {
  const navigate = useNavigate();
  const { logout } = useApp();
   const { deleteAccount } = useAuth();
   const [showDeleteDialog, setShowDeleteDialog] = useState(false);
   const [isDeleting, setIsDeleting] = useState(false);

  const handleMenuClick = (action: string) => {
    if (action === 'sugestao') {
      navigate('/sugestao');
      return;
    }
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
  };

   const handleDeleteAccount = async () => {
     setIsDeleting(true);
     try {
       const { error } = await deleteAccount();
       if (error) {
         toast.error('Erro ao excluir conta. Tente novamente.');
         return;
       }
       toast.success('Seus dados foram excluídos com sucesso.');
       logout();
       navigate('/login');
     } catch {
       toast.error('Erro inesperado. Tente novamente.');
     } finally {
       setIsDeleting(false);
       setShowDeleteDialog(false);
     }
   };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="max-w-md mx-auto px-4 pt-[calc(env(safe-area-inset-top)+2.5rem)]">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" variant="light" />
        </div>

        {/* Menu Items */}
        <div className="space-y-0.5">
          {menuItems.map(({ icon: Icon, label, action }) => (
            <button
              key={action}
              onClick={() => handleMenuClick(action)}
              className={cn(
                'w-full flex items-center justify-between py-3.5 px-4',
                'bg-transparent border-b border-border',
                'hover:bg-muted transition-colors',
                'active:bg-muted/80 touch-manipulation min-h-[52px]'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
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
              'w-full flex items-center gap-3 py-3.5 px-4',
              'bg-transparent border-b border-border',
              'hover:bg-muted transition-colors',
              'active:bg-muted/80 touch-manipulation min-h-[52px]'
            )}
          >
            <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <LogOut size={20} className="text-primary" />
            </div>
            <span className="font-medium text-foreground text-sm">Sair</span>
          </button>

           {/* Delete Account */}
           <button
             onClick={() => setShowDeleteDialog(true)}
             className={cn(
               'w-full flex items-center gap-3 py-3.5 px-4',
               'bg-transparent',
               'hover:bg-destructive/10 transition-colors',
               'active:bg-destructive/20 touch-manipulation min-h-[52px]'
             )}
           >
             <div className="w-11 h-11 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
               <Trash2 size={20} className="text-destructive" />
             </div>
             <span className="font-medium text-destructive text-sm">Excluir minha conta</span>
           </button>
        </div>
      </main>

      <BottomNav />

       {/* Delete Account Confirmation Dialog */}
       <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
         <AlertDialogContent className="max-w-sm mx-4">
           <AlertDialogHeader>
             <AlertDialogTitle className="text-destructive">
               Excluir conta permanentemente?
             </AlertDialogTitle>
             <AlertDialogDescription>
               Esta ação não pode ser desfeita. Todos os seus dados, incluindo 
               consultas, propostas e informações pessoais serão permanentemente 
               removidos dos nossos servidores.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
             <AlertDialogCancel disabled={isDeleting}>
               Cancelar
             </AlertDialogCancel>
             <AlertDialogAction
               onClick={handleDeleteAccount}
               disabled={isDeleting}
               className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
             >
               {isDeleting ? 'Excluindo...' : 'Sim, excluir minha conta'}
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
    </div>
  );
}
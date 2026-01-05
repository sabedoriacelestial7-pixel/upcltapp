import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Calculator, 
  MessageCircle, 
  ShieldCheck, 
  Clock, 
  Wallet, 
  Calendar,
  User
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { BottomNav } from '@/components/BottomNav';
import { useApp } from '@/contexts/AppContext';
import { abrirWhatsAppSimples } from '@/utils/whatsapp';
import { cn } from '@/lib/utils';

const beneficios = [
  { icon: ShieldCheck, label: 'Sem consulta SPC/Serasa' },
  { icon: Clock, label: 'Aprovação em até 24h' },
  { icon: Wallet, label: 'Desconto em folha' },
  { icon: Calendar, label: 'Até 84x para pagar' }
];

export default function HomePage() {
  const navigate = useNavigate();
  const { usuario } = useApp();

  const firstName = usuario?.nome?.split(' ')[0] || 'Usuário';

  return (
    <div className="min-h-screen min-h-[100dvh] gradient-primary pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-primary/95 backdrop-blur-lg border-b border-border pt-[env(safe-area-inset-top)]">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <Logo size="md" />
          <button 
            onClick={() => navigate('/perfil')}
            className="w-11 h-11 rounded-full bg-muted/20 flex items-center justify-center hover:bg-muted/30 transition-colors touch-manipulation active:scale-95"
          >
            <User size={20} className="text-foreground" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 space-y-5 animate-fade-in">
        {/* Hero */}
        <div className="text-center py-3">
          <div className="w-14 h-14 rounded-2xl gradient-card mx-auto mb-3 flex items-center justify-center shadow-button">
            <Search size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1">
            Olá, {firstName}!
          </h1>
          <p className="text-sm text-muted-foreground">
            Consulte sua margem e compare ofertas
          </p>
        </div>

        {/* Main CTA Card */}
        <button
          onClick={() => navigate('/consulta')}
          className={cn(
            'w-full bg-card rounded-2xl p-5 shadow-card text-left',
            'transition-all duration-200 hover:shadow-card-hover active:scale-[0.98]',
            'touch-manipulation group'
          )}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors shrink-0">
              <Search size={24} className="text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-card-foreground">
                Consultar Minha Margem
              </h2>
              <p className="text-muted-foreground text-sm">
                Descubra quanto você pode contratar
              </p>
            </div>
          </div>
        </button>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/simulador')}
            className={cn(
              'bg-card rounded-2xl p-4 shadow-card text-left',
              'transition-all duration-200 hover:shadow-card-hover active:scale-[0.98]',
              'touch-manipulation'
            )}
          >
            <Calculator size={24} className="text-secondary mb-2" />
            <h3 className="font-semibold text-card-foreground text-sm">Simulador</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Calcule suas parcelas
            </p>
          </button>

          <button
            onClick={abrirWhatsAppSimples}
            className={cn(
              'bg-card rounded-2xl p-4 shadow-card text-left',
              'transition-all duration-200 hover:shadow-card-hover active:scale-[0.98]',
              'touch-manipulation'
            )}
          >
            <MessageCircle size={24} className="text-whatsapp mb-2" />
            <h3 className="font-semibold text-card-foreground text-sm">WhatsApp</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fale com consultor
            </p>
          </button>
        </div>

        {/* Benefits Section */}
        <section>
          <h2 className="text-base font-bold text-foreground mb-3">
            Vantagens UpCLT
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {beneficios.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="bg-muted/30 rounded-xl p-3 flex items-center gap-2.5"
              >
                <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-secondary" />
                </div>
                <span className="text-xs font-medium text-foreground leading-tight">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pt-2 pb-1">
          <p className="text-xs text-muted-foreground">
            3F Promotora • Correspondente Autorizado
          </p>
        </footer>
      </main>

      <BottomNav />
    </div>
  );
}

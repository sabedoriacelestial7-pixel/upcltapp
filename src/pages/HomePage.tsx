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
    <div className="min-h-screen gradient-primary pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-primary/95 backdrop-blur-lg border-b border-border safe-top">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <Logo size="md" />
          <button 
            onClick={() => navigate('/perfil')}
            className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center hover:bg-muted/30 transition-colors"
          >
            <User size={20} className="text-foreground" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6 animate-fade-in">
        {/* Hero */}
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-2xl gradient-card mx-auto mb-4 flex items-center justify-center shadow-button">
            <Search size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Olá, {firstName}!
          </h1>
          <p className="text-muted-foreground">
            Consulte sua margem e compare ofertas
          </p>
        </div>

        {/* Main CTA Card */}
        <button
          onClick={() => navigate('/consulta')}
          className={cn(
            'w-full bg-card rounded-3xl p-6 shadow-card text-left',
            'transition-all duration-200 hover:shadow-card-hover active:scale-[0.99]',
            'group'
          )}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
              <Search size={28} className="text-secondary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-card-foreground">
                Consultar Minha Margem
              </h2>
              <p className="text-muted-foreground text-sm">
                Descubra quanto você pode contratar
              </p>
            </div>
          </div>
        </button>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/simulador')}
            className={cn(
              'bg-card rounded-2xl p-5 shadow-card text-left',
              'transition-all duration-200 hover:shadow-card-hover active:scale-[0.98]'
            )}
          >
            <Calculator size={28} className="text-secondary mb-3" />
            <h3 className="font-semibold text-card-foreground">Simulador</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Calcule suas parcelas
            </p>
          </button>

          <button
            onClick={abrirWhatsAppSimples}
            className={cn(
              'bg-card rounded-2xl p-5 shadow-card text-left',
              'transition-all duration-200 hover:shadow-card-hover active:scale-[0.98]'
            )}
          >
            <MessageCircle size={28} className="text-whatsapp mb-3" />
            <h3 className="font-semibold text-card-foreground">WhatsApp</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Fale com consultor
            </p>
          </button>
        </div>

        {/* Benefits Section */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4">
            Vantagens UpCLT
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {beneficios.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="bg-muted/30 rounded-xl p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-secondary" />
                </div>
                <span className="text-sm font-medium text-foreground leading-tight">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pt-4 pb-2">
          <p className="text-xs text-muted-foreground">
            3F Promotora • Correspondente Autorizado
          </p>
        </footer>
      </main>

      <BottomNav />
    </div>
  );
}

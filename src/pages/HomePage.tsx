import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Calculator, 
  MessageCircle, 
  ShieldCheck, 
  Clock, 
  Wallet, 
  Calendar,
  User,
  ArrowRight
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
        <div className="max-w-md mx-auto px-5 h-14 flex items-center justify-between">
          <Logo size="md" />
          <button 
            onClick={() => navigate('/perfil')}
            className="w-11 h-11 rounded-full bg-muted/20 flex items-center justify-center hover:bg-muted/30 transition-colors touch-manipulation active:scale-95"
          >
            <User size={20} className="text-foreground" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 py-5 space-y-4">
        {/* Hero */}
        <div className="text-center py-3 animate-fade-in" style={{ animationDelay: '0ms' }}>
          <h1 className="text-xl font-bold text-foreground mb-1">
            Olá, {firstName}!
          </h1>
          <p className="text-sm text-muted-foreground">
            Consulte sua margem e compare ofertas
          </p>
        </div>

        {/* Main CTA Card - Premium Green Gradient */}
        <button
          onClick={() => navigate('/consulta')}
          className={cn(
            'w-full rounded-2xl p-5 text-left',
            'bg-gradient-to-r from-[#22c55e] to-[#16a34a]',
            'shadow-lg shadow-green-500/25',
            'transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/30',
            'active:scale-[0.98] touch-manipulation group',
            'animate-fade-in opacity-0'
          )}
          style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
              <Search size={24} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-white">
                Consultar Minha Margem
              </h2>
              <p className="text-white/80 text-sm">
                Descubra quanto você pode contratar
              </p>
            </div>
            <ArrowRight size={22} className="text-white/90 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </button>

        {/* Quick Actions - Glass Effect */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/simulador')}
            className={cn(
              'rounded-xl p-4 text-left',
              'bg-white/5 border border-[#22c55e]/50',
              'transition-all duration-300 hover:border-[#22c55e] hover:bg-white/10',
              'active:scale-[0.98] touch-manipulation group',
              'animate-fade-in opacity-0'
            )}
            style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
          >
            <div className="w-10 h-10 rounded-lg bg-[#22c55e]/10 flex items-center justify-center mb-3 group-hover:bg-[#22c55e]/20 transition-colors">
              <Calculator size={22} className="text-[#22c55e]" />
            </div>
            <h3 className="font-semibold text-white text-sm">Simulador</h3>
            <p className="text-xs text-white/60 mt-0.5">
              Calcule suas parcelas
            </p>
          </button>

          <button
            onClick={abrirWhatsAppSimples}
            className={cn(
              'rounded-xl p-4 text-left',
              'bg-white/5 border border-[#22c55e]/50',
              'transition-all duration-300 hover:border-[#22c55e] hover:bg-white/10',
              'active:scale-[0.98] touch-manipulation group',
              'animate-fade-in opacity-0'
            )}
            style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
          >
            <div className="w-10 h-10 rounded-lg bg-[#22c55e]/10 flex items-center justify-center mb-3 group-hover:bg-[#22c55e]/20 transition-colors">
              <MessageCircle size={22} className="text-[#22c55e]" />
            </div>
            <h3 className="font-semibold text-white text-sm">WhatsApp</h3>
            <p className="text-xs text-white/60 mt-0.5">
              Fale com consultor
            </p>
          </button>
        </div>

        {/* Benefits Section */}
        <section className="pt-2 animate-fade-in opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
          <h2 className="text-base font-bold text-foreground mb-3">
            Vantagens UpCLT
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {beneficios.map(({ icon: Icon, label }, index) => (
              <div
                key={label}
                className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-2.5 transition-all duration-300 hover:bg-white/10 animate-fade-in opacity-0"
                style={{ animationDelay: `${500 + index * 100}ms`, animationFillMode: 'forwards' }}
              >
                <div className="w-9 h-9 rounded-lg bg-[#22c55e]/10 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-[#22c55e]" />
                </div>
                <span className="text-xs font-medium text-white/90 leading-tight">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pt-3 pb-1">
          <p className="text-xs text-muted-foreground">
            3F Promotora • Correspondente Autorizado
          </p>
        </footer>
      </main>

      <BottomNav />
    </div>
  );
}
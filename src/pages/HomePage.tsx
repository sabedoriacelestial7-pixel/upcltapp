import { useNavigate } from 'react-router-dom';
import { User, Bell, Banknote, Sparkles } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { useApp } from '@/contexts/AppContext';
import { formatarMoeda } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/EmptyState';

export default function HomePage() {
  const navigate = useNavigate();
  const { usuario, consulta } = useApp();

  const firstName = usuario?.nome?.split(' ')[0] || 'Usuário';
  const valorDisponivel = consulta?.valorMargemDisponivel 
    ? consulta.valorMargemDisponivel * 10 // Approximate loan value
    : null;

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#f5f5f5] pb-20">
      {/* Header */}
      <header className="bg-primary pt-[env(safe-area-inset-top)]">
        <div className="px-5 py-4 flex items-center justify-between">
          <p className="text-white text-lg font-medium">
            Olá, {firstName}
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/perfil')}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:bg-white/10 transition-colors touch-manipulation"
            >
              <User size={22} />
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:bg-white/10 transition-colors touch-manipulation">
              <Bell size={22} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 py-5">
        {/* Credit Opportunities Section */}
        <section>
          <h2 className="text-muted-foreground text-sm mb-3">
            Oportunidades de crédito
          </h2>

          <button
            onClick={() => navigate('/consulta')}
            className={cn(
              'w-full bg-white rounded-xl p-4 shadow-card group',
              'flex items-center gap-4 text-left',
              'hover:shadow-card-hover transition-all duration-200',
              'active:scale-[0.99] touch-manipulation'
            )}
          >
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
              <Banknote size={24} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground text-base group-hover:text-primary transition-colors">
                Consignado CLT
              </h3>
              <p className="text-primary font-bold text-lg">
                {valorDisponivel 
                  ? formatarMoeda(valorDisponivel)
                  : 'Consultar margem'}
              </p>
            </div>
          </button>
        </section>

        {/* Empty state hint */}
        {!consulta && (
          <div className="mt-8 text-center">
            <p className="text-muted-foreground text-sm">
              Consulte sua margem para ver ofertas personalizadas
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
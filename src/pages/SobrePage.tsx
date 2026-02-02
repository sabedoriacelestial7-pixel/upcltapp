import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Banknote, Building2, ShieldCheck, Clock, TrendingDown } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import welcomeHero from '@/assets/welcome-hero.png';

export default function SobrePage() {
  const navigate = useNavigate();

  const stats = [
    { icon: Users, value: '+50 mil', label: 'pessoas', description: 'já compararam taxas no UpCLT' },
    { icon: Banknote, value: '+R$ 100 mi', label: 'em crédito', description: 'contratados com as melhores taxas' },
    { icon: Building2, value: '10+', label: 'bancos parceiros', description: 'disputando para oferecer a melhor taxa' },
  ];

  const features = [
    { icon: ShieldCheck, title: 'Seguro e confiável', description: 'Seus dados protegidos com criptografia' },
    { icon: Clock, title: 'Rápido e fácil', description: 'Consulta em menos de 2 minutos' },
    { icon: TrendingDown, title: 'Menores taxas', description: 'Economize até 40% nos juros' },
  ];

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex flex-col">
      {/* Header with back button */}
      <header className="relative z-10 pt-[env(safe-area-inset-top)] px-4 pt-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-6 pb-32">
        {/* Logo and Title */}
        <div className="flex items-center justify-center gap-2 mt-4 mb-6">
          <Logo size="sm" variant="light" />
          <h1 className="text-2xl font-bold text-foreground">Quem somos</h1>
        </div>

        {/* Description */}
        <p className="text-center text-muted-foreground leading-relaxed mb-8">
          Mais que um aplicativo, o UpCLT é a forma mais rápida e transparente de garantir seu{' '}
          <span className="text-primary font-semibold">empréstimo consignado CLT</span>{' '}
          com a{' '}
          <span className="text-primary font-semibold">menor taxa do mercado</span>.
        </p>

        {/* Hero Image with Circle Background */}
        <div className="relative flex justify-center mb-10">
          {/* Background circles */}
          <div className="absolute w-48 h-48 bg-primary/20 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute w-36 h-36 bg-primary/30 rounded-full top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2" />
          
          {/* Image */}
          <div className="relative z-10 w-52 h-52 rounded-full overflow-hidden border-4 border-background shadow-xl">
            <img
              src={welcomeHero}
              alt="Pessoa usando o UpCLT"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={index} 
                className="text-center p-3 rounded-2xl bg-card border border-border"
                style={{ animation: `fade-in 0.5s ease-out ${0.2 + index * 0.1}s both` }}
              >
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="text-xs font-medium text-foreground">
                  {stat.label}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 leading-tight">
                  {stat.description}
                </div>
              </div>
            );
          })}
        </div>

        {/* Features List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground text-center mb-4">
            Por que escolher o UpCLT?
          </h2>
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index} 
                className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border"
                style={{ animation: `fade-in 0.5s ease-out ${0.5 + index * 0.1}s both` }}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">
                    {feature.title}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {feature.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Fixed CTA Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] bg-gradient-to-t from-background via-background to-transparent">
        <Button
          onClick={() => navigate('/login')}
          className="w-full h-14 text-lg font-semibold rounded-full shadow-button hover:scale-[1.02] active:scale-[0.98] transition-transform"
          size="lg"
        >
          Vamos começar
        </Button>
      </div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Banknote, Building2, ShieldCheck, Clock, TrendingDown, Star, Quote } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { PageTransition } from '@/components/PageTransition';
import welcomeHero from '@/assets/welcome-hero.png';

export default function SobrePage() {
  const navigate = useNavigate();

  const stats = [
    { icon: Users, value: 50, prefix: '+', suffix: ' mil', label: 'pessoas', description: 'já compararam taxas', color: 'from-emerald-500 to-emerald-600', stringColor: 'from-emerald-500/50', glowColor: 'rgba(16, 185, 129, 0.4)' },
    { icon: Banknote, value: 100, prefix: '+R$ ', suffix: ' mi', label: 'em crédito', description: 'contratados', color: 'from-violet-500 to-violet-600', stringColor: 'from-violet-500/50', glowColor: 'rgba(139, 92, 246, 0.4)' },
    { icon: Building2, value: 10, prefix: '+', suffix: '', label: 'bancos', description: 'parceiros', color: 'from-amber-500 to-amber-600', stringColor: 'from-amber-500/50', glowColor: 'rgba(245, 158, 11, 0.4)' },
  ];

  const features = [
    { icon: ShieldCheck, title: 'Seguro e confiável', description: 'Seus dados protegidos com criptografia' },
    { icon: Clock, title: 'Rápido e fácil', description: 'Consulta em menos de 2 minutos' },
    { icon: TrendingDown, title: 'Menores taxas', description: 'Economize até 40% nos juros' },
  ];

  const testimonials = [
    { 
      name: 'Carlos Silva', 
      role: 'Operador de Logística',
      text: 'Consegui um empréstimo com taxa muito menor do que o meu banco oferecia. Economizei mais de R$ 2.000!',
      rating: 5
    },
    { 
      name: 'Ana Rodrigues', 
      role: 'Assistente Administrativa',
      text: 'Processo super rápido e transparente. Em menos de 10 minutos já tinha as propostas na mão.',
      rating: 5
    },
    { 
      name: 'Pedro Santos', 
      role: 'Técnico de Manutenção',
      text: 'Finalmente um app que mostra todas as opções de uma vez. Recomendo demais!',
      rating: 5
    },
    { 
      name: 'Maria Oliveira', 
      role: 'Recepcionista',
      text: 'Atendimento excelente e consegui a menor taxa do mercado. Muito satisfeita!',
      rating: 5
    },
  ];

  return (
    <PageTransition className="min-h-screen min-h-[100dvh] bg-background flex flex-col">
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

        {/* Floating Stats Balloons */}
        <div className="flex justify-center gap-3 mb-10">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const riseDelay = 0.2 + index * 0.15;
            const floatDelay = 0.8 + index * 0.3;
            return (
              <div 
                key={index} 
                className="relative group"
                style={{ 
                  animation: `balloon-rise 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${riseDelay}s both`
                }}
              >
                {/* Balloon */}
                <div 
                  className={`w-24 h-24 rounded-full bg-gradient-to-br ${stat.color} flex flex-col items-center justify-center text-white relative overflow-hidden`}
                  style={{
                    animation: `float 3s ease-in-out ${floatDelay}s infinite, glow-pulse 2s ease-in-out ${floatDelay + 0.5}s infinite`,
                    boxShadow: `0 0 25px 0 ${stat.glowColor}`,
                  }}
                >
                  {/* Shine effect */}
                  <div className="absolute top-2 left-3 w-4 h-4 bg-white/30 rounded-full blur-sm" />
                  <div className="absolute top-4 left-5 w-2 h-2 bg-white/50 rounded-full" />
                  
                  <Icon className="w-5 h-5 mb-1 opacity-90" />
                  <div className="text-lg font-bold leading-none">
                    <AnimatedCounter 
                      end={stat.value} 
                      prefix={stat.prefix} 
                      suffix={stat.suffix}
                      duration={1500}
                    />
                  </div>
                  <div className="text-[10px] opacity-80 mt-0.5">
                    {stat.label}
                  </div>
                </div>
                
                {/* Balloon string */}
                <div className={`absolute left-1/2 -translate-x-1/2 top-full w-px h-6 bg-gradient-to-b ${stat.stringColor} to-transparent`} />
                
                {/* Description tooltip on hover */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-muted-foreground text-center opacity-70">
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

        {/* Testimonials Carousel */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-foreground text-center mb-4">
            O que dizem nossos clientes
          </h2>
          <Carousel
            opts={{
              align: 'start',
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2">
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="pl-2 basis-[85%]">
                  <div className="p-4 rounded-2xl bg-card border border-border h-full">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Quote className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-foreground text-sm">
                          {testimonial.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                      "{testimonial.text}"
                    </p>
                    <div className="flex gap-0.5">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                      ))}
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
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
    </PageTransition>
  );
}

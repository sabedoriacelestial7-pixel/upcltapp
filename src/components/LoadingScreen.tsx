import { useEffect, useState } from 'react';
import { Wallet, Search, TrendingDown, Calculator, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const bankLogos = [
  { id: 'facta', name: 'FACTA', logo: '/logos/facta.png' },
  { id: 'c6', name: 'C6 Bank', logo: '/logos/c6.png' },
  { id: 'pan', name: 'Banco Pan', logo: '/logos/pan.png' },
  { id: 'bmg', name: 'BMG', logo: '/logos/bmg.png' },
  { id: 'mercantil', name: 'Mercantil', logo: '/logos/mercantil.png' },
  { id: 'prata', name: 'Prata', logo: '/logos/prata.png' },
  { id: 'hub', name: 'Hub', logo: '/logos/hub.png' },
  { id: 'v8', name: 'V8', logo: '/logos/v8.png' },
  { id: 'happy', name: 'Happy', logo: '/logos/happy.png' },
];

const loadingMessages = [
  { text: 'Buscando as melhores taxas...', icon: Search },
  { text: 'Analisando viabilidade de simulações...', icon: Calculator },
  { text: 'Avaliando redução de taxas...', icon: TrendingDown },
  { text: 'Consultando bancos parceiros...', icon: Search },
  { text: 'Analisando seu perfil...', icon: CheckCircle },
  { text: 'Comparando ofertas disponíveis...', icon: Calculator },
  { text: 'Verificando condições especiais...', icon: TrendingDown },
  { text: 'Finalizando análise...', icon: CheckCircle },
];

interface LoadingScreenProps {
  variant: 'searching' | 'verifying';
  message?: string;
}

export function LoadingScreen({ variant, message }: LoadingScreenProps) {
  const [currentBankIndex, setCurrentBankIndex] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Rotate bank logos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBankIndex((prev) => (prev + 1) % bankLogos.length);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  // Rotate messages
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Progress bar animation
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 3;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  if (variant === 'verifying') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-6">
          <Wallet size={36} className="text-primary-foreground" />
        </div>
        
        <h2 className="text-xl font-bold text-foreground text-center mb-2">
          Verificando a autorização de consulta dos dados
        </h2>
        <p className="text-muted-foreground text-center text-sm max-w-xs">
          Todo o processo pode levar um tempo, vamos entrar em contato assim que o processo for finalizado.
        </p>

        <div className="mt-8">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const CurrentIcon = loadingMessages[currentMessageIndex].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-emerald-700 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/5 rounded-full animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-white/5 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 right-10 w-40 h-40 bg-white/3 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Animated logo ring */}
        <div className="relative w-28 h-28 mb-8">
          {/* Outer spinning ring */}
          <div className="absolute inset-0 border-4 border-white/20 rounded-full" />
          <div 
            className="absolute inset-0 border-4 border-transparent border-t-white border-r-white/50 rounded-full animate-spin"
            style={{ animationDuration: '1.5s' }}
          />
          {/* Inner pulsing ring */}
          <div className="absolute inset-2 border-2 border-white/30 rounded-full animate-pulse" />
          
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <CurrentIcon size={36} className="text-white animate-pulse" />
          </div>
        </div>

        {/* Bank logos carousel - larger and more visible */}
        <div className="flex items-center justify-center gap-4 mb-8 h-24">
          {bankLogos.map((bank, index) => {
            const distance = Math.abs(index - currentBankIndex);
            const wrappedDistance = Math.min(distance, bankLogos.length - distance);
            const isActive = wrappedDistance === 0;
            const isNear = wrappedDistance <= 2;
            
            if (!isNear) return null;
            
            return (
              <div
                key={bank.id}
                className={cn(
                  'rounded-2xl flex items-center justify-center p-3 transition-all duration-500 ease-out',
                  isActive 
                    ? 'w-20 h-20 bg-white scale-110 shadow-2xl shadow-black/30' 
                    : wrappedDistance === 1
                      ? 'w-16 h-16 bg-white/90 scale-95'
                      : 'w-14 h-14 bg-white/70 scale-85 opacity-70'
                )}
                style={{
                  transform: `translateX(${(index - currentBankIndex) * 10}px) scale(${isActive ? 1.1 : wrappedDistance === 1 ? 0.95 : 0.85})`,
                }}
              >
                <img 
                  src={bank.logo} 
                  alt={bank.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* All bank logos in a row - subtle display */}
        <div className="flex items-center justify-center gap-2 mb-8 opacity-60">
          {bankLogos.map((bank, index) => (
            <div
              key={`dot-${bank.id}`}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-300',
                index === currentBankIndex ? 'bg-white w-6' : 'bg-white/50'
              )}
            />
          ))}
        </div>

        {/* Dynamic message with animation */}
        <div className="text-center mb-8 min-h-[60px]">
          <p 
            key={currentMessageIndex}
            className="text-xl font-bold text-white animate-fade-in"
          >
            {message || loadingMessages[currentMessageIndex].text}
          </p>
          <p className="text-white/70 text-sm mt-2">
            Aguarde enquanto consultamos os bancos
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-white/60 text-xs mt-2">{Math.round(progress)}% concluído</p>
      </div>
    </div>
  );
}

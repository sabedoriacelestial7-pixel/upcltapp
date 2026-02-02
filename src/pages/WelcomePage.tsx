import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import welcomeHero from '@/assets/welcome-hero.png';

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="theme-dark min-h-screen min-h-[100dvh] bg-background flex flex-col">
      {/* Header with Logo */}
      <header className="pt-[env(safe-area-inset-top)] px-6 pt-8">
        <Logo size="md" variant="dark" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {/* Hero Image with Diamond Shape */}
        <div className="relative mb-12">
          {/* Background diamond shape */}
          <div 
            className="absolute bg-primary rounded-3xl"
            style={{
              width: '220px',
              height: '220px',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(45deg)',
            }}
          />
          
          {/* Image container with diamond clip */}
          <div 
            className="relative z-10 w-64 h-64 overflow-hidden"
            style={{
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
            }}
          >
            <img 
              src={welcomeHero} 
              alt="App financeiro" 
              className="w-full h-full object-cover grayscale"
            />
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-3xl md:text-4xl font-bold text-foreground text-center leading-tight mb-12">
          Compare e contrate o empréstimo consignado CLT mais barato do Brasil
        </h1>

        {/* CTA Buttons */}
        <div className="w-full max-w-sm space-y-4">
          <Button
            onClick={() => navigate('/login')}
            className="w-full h-14 text-lg font-semibold rounded-full shadow-button"
            size="lg"
          >
            Vamos começar
          </Button>

          <button
            onClick={() => navigate('/login')}
            className="w-full text-center text-foreground/80 underline underline-offset-4 hover:text-foreground transition-colors py-2"
          >
            Conheça a UpCLT
          </button>
        </div>
      </main>
    </div>
  );
}

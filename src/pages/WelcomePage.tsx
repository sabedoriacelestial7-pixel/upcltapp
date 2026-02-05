import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/ParticleBackground';
import { PageTransition } from '@/components/PageTransition';
import welcomeHero from '@/assets/welcome-hero.png';

export default function WelcomePage() {
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);
  const [logoAnimated, setLogoAnimated] = useState(false);

  useEffect(() => {
    // Start logo animation after mount
    const logoTimer = setTimeout(() => {
      setLogoAnimated(true);
    }, 100);

    // Hide splash after logo animation
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 1800);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(splashTimer);
    };
  }, []);

  return (
    <div className="theme-dark min-h-screen min-h-[100dvh] bg-background flex flex-col overflow-hidden relative">
      {/* Particle Background */}
      <ParticleBackground />

      {/* Splash Screen */}
      {showSplash && (
        <div 
          className={`fixed inset-0 z-50 bg-background flex items-center justify-center transition-opacity duration-500 ${
            !showSplash ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div 
            className={`transform transition-all duration-700 ease-out ${
              logoAnimated 
                ? 'scale-100 opacity-100' 
                : 'scale-75 opacity-0'
            }`}
          >
            <Logo size="xl" variant="dark" />
            
            {/* Animated underline */}
            <div className="mt-4 h-1 bg-primary/20 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-primary rounded-full transition-all duration-1000 ease-out ${
                  logoAnimated ? 'w-full' : 'w-0'
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content - appears after splash */}
      <PageTransition 
        className={`flex flex-col flex-1 transition-all duration-500 ${
          showSplash ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}
      >
        {/* Header with Logo */}
        <header 
          className="relative z-10 pt-[env(safe-area-inset-top)] px-6 pt-8"
          style={{ 
            animation: showSplash ? 'none' : 'fade-in 0.5s ease-out 0.1s both'
          }}
        >
          <Logo size="md" variant="dark" />
        </header>

        {/* Main Content */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-8">
          {/* Hero Image with Diamond Shape */}
          <div 
            className="relative mb-12"
            style={{ 
              animation: showSplash ? 'none' : 'scale-in 0.5s ease-out 0.3s both'
            }}
          >
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
                alt="Profissional sorrindo" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Headline */}
          <h1 
            className="text-3xl md:text-4xl font-bold text-foreground text-center leading-tight mb-12"
            style={{ 
              animation: showSplash ? 'none' : 'fade-in 0.5s ease-out 0.5s both'
            }}
          >
            Compare e contrate o empréstimo consignado CLT mais barato do Brasil
          </h1>

          {/* CTA Buttons */}
          <div 
            className="w-full max-w-sm space-y-4"
            style={{ 
              animation: showSplash ? 'none' : 'slide-up 0.5s ease-out 0.7s both'
            }}
          >
            <Button
              onClick={() => navigate('/login')}
              className="w-full h-14 text-lg font-semibold rounded-full shadow-button hover:scale-[1.02] active:scale-[0.98] transition-transform"
              size="lg"
            >
              Vamos começar
            </Button>

            <button
              onClick={() => navigate('/sobre')}
              className="w-full text-center text-foreground/80 underline underline-offset-4 hover:text-foreground transition-colors py-2"
            >
              Conheça a UpCLT
            </button>
          </div>
        </main>
      </PageTransition>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Share, MoreVertical, Check, Smartphone, ArrowLeft, ExternalLink, ChevronsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/PageTransition';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPage() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);
    
    // Detect platform
    const ua = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));
    setIsAndroid(/android/.test(ua));

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    'Acesso rápido direto da tela inicial',
    'Funciona mesmo sem internet',
    'Notificações sobre suas operações',
    'Experiência de app nativo',
  ];

  if (isStandalone) {
    return (
      <PageTransition className="min-h-screen min-h-[100dvh] theme-dark bg-[hsl(220,13%,10%)] flex flex-col items-center justify-center p-5">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <Check size={40} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            App já instalado!
          </h1>
          <p className="text-white/70 mb-8">
            Você está usando o UpCLT como aplicativo.
          </p>
          <Button
            onClick={() => navigate('/')}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold"
          >
            Ir para o início
          </Button>
        </div>
      </PageTransition>
    );
  }

  if (isInstalled) {
    return (
      <PageTransition className="min-h-screen min-h-[100dvh] theme-dark bg-[hsl(220,13%,10%)] flex flex-col items-center justify-center p-5">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <Check size={40} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            Instalação concluída!
          </h1>
          <p className="text-white/70 mb-8">
            O UpCLT foi adicionado à sua tela inicial. Agora você pode acessar o app rapidamente.
          </p>
          <Button
            onClick={() => navigate('/')}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold"
          >
            Continuar no navegador
          </Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen min-h-[100dvh] theme-dark bg-[hsl(220,13%,10%)] flex flex-col p-5 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:bg-white/10 transition-colors touch-manipulation"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold text-white">Instalar App</h1>
      </div>

      <div className="flex-1 flex flex-col">
        {/* App Preview */}
        <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shrink-0">
            <ChevronsUp size={32} className="text-white" strokeWidth={3} />
          </div>
          <div>
            <h2 className="font-bold text-white text-lg">UpCLT</h2>
            <p className="text-white/60 text-sm">Empréstimo Consignado CLT</p>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white/5 rounded-2xl p-5 mb-6">
          <h3 className="font-semibold text-white mb-4">Por que instalar?</h3>
          <ul className="space-y-3">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Check size={14} className="text-primary" />
                </div>
                <span className="text-white/80 text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Install Instructions */}
        <div className="flex-1">
          {deferredPrompt ? (
            // Native install prompt available (Chrome/Edge Android)
            <Button
              onClick={handleInstall}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-semibold text-base gap-2"
            >
              <Download size={20} />
              Instalar UpCLT
            </Button>
          ) : isIOS ? (
            // iOS Instructions
            <div className="bg-white/5 rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Smartphone size={18} />
                Como instalar no iPhone/iPad
              </h3>
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center shrink-0">1</span>
                  <div>
                    <p className="text-white/90 text-sm">
                      Toque no botão <strong>Compartilhar</strong>
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-white/60">
                      <Share size={16} />
                      <span className="text-xs">na barra inferior do Safari</span>
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center shrink-0">2</span>
                  <div>
                    <p className="text-white/90 text-sm">
                      Role e toque em <strong>"Adicionar à Tela de Início"</strong>
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center shrink-0">3</span>
                  <div>
                    <p className="text-white/90 text-sm">
                      Toque em <strong>"Adicionar"</strong> para confirmar
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          ) : isAndroid ? (
            // Android Instructions (when prompt not available)
            <div className="bg-white/5 rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Smartphone size={18} />
                Como instalar no Android
              </h3>
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center shrink-0">1</span>
                  <div>
                    <p className="text-white/90 text-sm">
                      Toque no menu <strong>⋮</strong>
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-white/60">
                      <MoreVertical size={16} />
                      <span className="text-xs">no canto superior direito</span>
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center shrink-0">2</span>
                  <div>
                    <p className="text-white/90 text-sm">
                      Toque em <strong>"Instalar app"</strong> ou <strong>"Adicionar à tela inicial"</strong>
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center shrink-0">3</span>
                  <div>
                    <p className="text-white/90 text-sm">
                      Confirme tocando em <strong>"Instalar"</strong>
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          ) : (
            // Desktop or unknown
            <div className="bg-white/5 rounded-2xl p-5 text-center">
              <Smartphone size={40} className="text-white/40 mx-auto mb-4" />
              <p className="text-white/70 text-sm mb-4">
                Para a melhor experiência, acesse este site pelo seu celular e instale o app.
              </p>
              <p className="text-white/50 text-xs">
                Você também pode continuar usando pelo navegador.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Skip button */}
      <button
        onClick={() => navigate('/login')}
        className="w-full text-center text-white/50 text-sm mt-6 py-2 hover:text-white/70 transition-colors touch-manipulation"
      >
        Continuar no navegador
      </button>
    </PageTransition>
  );
}

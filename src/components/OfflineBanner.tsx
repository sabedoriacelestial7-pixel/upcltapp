import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OfflineBanner() {
  const { isOnline, wasOffline } = useOnlineStatus();

  // Show reconnection message briefly
  if (isOnline && wasOffline) {
    return (
      <div 
        className="fixed top-0 left-0 right-0 z-[100] bg-primary text-white px-4 py-2.5 flex items-center justify-center gap-2 animate-fade-in safe-area-top"
        role="status"
        aria-live="polite"
      >
        <Wifi size={18} aria-hidden="true" />
        <span className="text-sm font-medium">Conexão restabelecida!</span>
      </div>
    );
  }

  // Show offline banner
  if (!isOnline) {
    return (
      <div 
        className="fixed top-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground px-4 py-2.5 flex items-center justify-center gap-2 animate-fade-in safe-area-top"
        role="alert"
        aria-live="assertive"
      >
        <WifiOff size={18} aria-hidden="true" />
        <span className="text-sm font-medium">Sem conexão com a internet</span>
      </div>
    );
  }

  return null;
}

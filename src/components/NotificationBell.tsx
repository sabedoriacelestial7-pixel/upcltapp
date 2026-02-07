import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
  variant?: 'light' | 'transparent';
}

export function NotificationBell({ unreadCount, onClick, variant = 'light' }: NotificationBellProps) {
  const isLight = variant === 'light';
  
  return (
    <button
      onClick={onClick}
      aria-label={`Notificações${unreadCount > 0 ? `, ${unreadCount} não lidas` : ''}`}
      className={cn(
        'p-2 rounded-full transition-colors active:scale-95 touch-manipulation relative',
        'min-w-[48px] min-h-[48px] flex items-center justify-center',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        isLight ? 'text-primary hover:bg-muted' : 'text-primary hover:bg-primary-foreground/10'
      )}
    >
      <Bell size={24} aria-hidden="true" />
      {unreadCount > 0 && (
        <span 
          className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center"
          aria-hidden="true"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}

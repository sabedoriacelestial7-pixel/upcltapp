import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { 
  FolderX, 
  Search, 
  FileText, 
  Wallet, 
  Sparkles,
  type LucideIcon 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type EmptyStateVariant = 'proposals' | 'search' | 'documents' | 'wallet' | 'default';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
  className?: string;
  children?: ReactNode;
}

const variantConfig: Record<EmptyStateVariant, { icon: LucideIcon; gradient: string }> = {
  proposals: { 
    icon: FolderX, 
    gradient: 'from-primary/20 to-primary/5' 
  },
  search: { 
    icon: Search, 
    gradient: 'from-blue-500/20 to-blue-500/5' 
  },
  documents: { 
    icon: FileText, 
    gradient: 'from-amber-500/20 to-amber-500/5' 
  },
  wallet: { 
    icon: Wallet, 
    gradient: 'from-emerald-500/20 to-emerald-500/5' 
  },
  default: { 
    icon: Sparkles, 
    gradient: 'from-primary/20 to-primary/5' 
  },
};

export function EmptyState({
  variant = 'default',
  title,
  description,
  actionLabel,
  onAction,
  icon: CustomIcon,
  className,
  children,
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const Icon = CustomIcon || config.icon;

  return (
    <div 
      className={cn(
        'flex flex-col items-center justify-center py-12 px-6 text-center',
        'animate-fade-in',
        className
      )}
    >
      {/* Animated Icon Container */}
      <div 
        className={cn(
          'relative w-24 h-24 rounded-full mb-6',
          'bg-gradient-to-br',
          config.gradient,
          'flex items-center justify-center',
          'before:absolute before:inset-0 before:rounded-full before:bg-primary/10',
          'before:animate-ping before:opacity-30',
          'group'
        )}
      >
        <div 
          className={cn(
            'w-20 h-20 rounded-full bg-primary',
            'flex items-center justify-center',
            'shadow-lg shadow-primary/30',
            'group-hover:scale-110 transition-transform duration-300'
          )}
        >
          <Icon 
            size={36} 
            className="text-primary-foreground animate-bounce-soft" 
          />
        </div>
      </div>

      {/* Title */}
      <h2 className="text-xl font-bold text-foreground mb-2">
        {title}
      </h2>

      {/* Description */}
      {description && (
        <p className="text-muted-foreground text-sm mb-6 max-w-xs leading-relaxed">
          {description}
        </p>
      )}

      {/* Action Button */}
      {actionLabel && onAction && (
        <Button 
          onClick={onAction}
          className={cn(
            'h-12 px-6 font-semibold',
            'bg-gradient-to-r from-primary to-primary/80',
            'hover:from-primary/90 hover:to-primary/70',
            'shadow-lg shadow-primary/25',
            'transition-all duration-300 hover:scale-105',
            'active:scale-95'
          )}
        >
          {actionLabel}
        </Button>
      )}

      {/* Custom children */}
      {children}
    </div>
  );
}

import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
  className?: string;
}

const sizes = {
  sm: { text: 'text-xl', icon: 16 },
  md: { text: 'text-2xl', icon: 20 },
  lg: { text: 'text-4xl', icon: 28 },
  xl: { text: 'text-5xl', icon: 36 }
};

export function Logo({ size = 'md', showIcon = true, className }: LogoProps) {
  const { text, icon } = sizes[size];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showIcon && (
        <TrendingUp 
          size={icon} 
          className="text-secondary animate-bounce-soft" 
          strokeWidth={2.5}
        />
      )}
      <span className={cn('font-extrabold tracking-tight', text)}>
        <span className="text-secondary">Up</span>
        <span className="text-foreground">CLT</span>
      </span>
    </div>
  );
}

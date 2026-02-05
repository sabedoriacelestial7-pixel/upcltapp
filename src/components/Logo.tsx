import { ChevronsUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'dark' | 'light';
  className?: string;
}

const sizes = {
  sm: { text: 'text-xl', icon: 20 },
  md: { text: 'text-2xl', icon: 24 },
  lg: { text: 'text-4xl', icon: 32 },
  xl: { text: 'text-5xl', icon: 40 }
};

export function Logo({ size = 'md', variant = 'light', className }: LogoProps) {
  const { text, icon } = sizes[size];
  const isDark = variant === 'dark';

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex">
        <ChevronsUp 
          size={icon} 
          className="text-primary" 
          strokeWidth={3}
        />
      </div>
      <span className={cn('font-extrabold tracking-tight', text)}>
        <span className="text-primary">Up</span>
        <span className={isDark ? 'text-white' : 'text-foreground'}>CLT</span>
      </span>
    </div>
  );
}
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

function Skeleton({ className }: SkeletonProps) {
  return (
    <div 
      className={cn(
        'animate-pulse rounded-lg bg-muted/60',
        className
      )} 
    />
  );
}

// Skeleton for bank/simulation cards
export function SimulationCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-card border border-border animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="w-20 h-4" />
        </div>
        <Skeleton className="w-12 h-12 rounded-lg" />
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="flex justify-between">
          <Skeleton className="w-24 h-3" />
          <Skeleton className="w-20 h-5" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="w-28 h-3" />
          <Skeleton className="w-16 h-5" />
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <Skeleton className="w-28 h-7" />
        <Skeleton className="w-6 h-6 rounded-full" />
      </div>
    </div>
  );
}

// Skeleton for proposal cards
export function ProposalCardSkeleton() {
  return (
    <div className="bg-card rounded-xl p-4 shadow-card border border-border animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-5 h-5 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="w-32 h-4" />
            <Skeleton className="w-20 h-3" />
          </div>
        </div>
        <Skeleton className="w-5 h-5" />
      </div>
      
      <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Skeleton className="w-12 h-3" />
          <Skeleton className="w-20 h-4" />
        </div>
        <div className="space-y-1">
          <Skeleton className="w-16 h-3" />
          <Skeleton className="w-24 h-4" />
        </div>
      </div>
      
      <div className="mt-3 flex items-center justify-between">
        <Skeleton className="w-24 h-6 rounded-full" />
      </div>
    </div>
  );
}

// Skeleton for profile page
export function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Avatar section */}
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="w-20 h-20 rounded-full" />
        <Skeleton className="w-32 h-5" />
        <Skeleton className="w-24 h-4" />
      </div>
      
      {/* Info cards */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-xl p-4 shadow-card border border-border">
            <Skeleton className="w-20 h-3 mb-2" />
            <Skeleton className="w-40 h-5" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton for home page credit card
export function CreditCardSkeleton() {
  return (
    <div className="bg-card rounded-xl p-4 shadow-card border border-border animate-fade-in">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-28 h-4" />
          <Skeleton className="w-24 h-6" />
        </div>
      </div>
    </div>
  );
}

// Full page loading skeleton
export function PageLoadingSkeleton({ title }: { title?: string }) {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-card border-b border-border px-5 py-4">
        <Skeleton className="w-32 h-6" />
      </div>
      
      <main className="max-w-md mx-auto px-5 py-6">
        {title && <h1 className="text-xl font-bold mb-4">{title}</h1>}
        
        <div className="space-y-4">
          <SimulationCardSkeleton />
          <SimulationCardSkeleton />
          <SimulationCardSkeleton />
        </div>
      </main>
    </div>
  );
}

export { Skeleton };

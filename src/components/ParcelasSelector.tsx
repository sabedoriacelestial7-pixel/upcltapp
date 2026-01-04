import { cn } from '@/lib/utils';

interface ParcelasSelectorProps {
  value: number;
  onChange: (value: number) => void;
  options?: number[];
}

const DEFAULT_OPTIONS = [12, 24, 36, 48, 60, 72, 84];

export function ParcelasSelector({ 
  value, 
  onChange, 
  options = DEFAULT_OPTIONS 
}: ParcelasSelectorProps) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-foreground mb-3">
        Em quantas vezes?
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((parcela) => (
          <button
            key={parcela}
            onClick={() => onChange(parcela)}
            className={cn(
              'px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200',
              'active:scale-95',
              value === parcela
                ? 'bg-secondary text-secondary-foreground shadow-button'
                : 'bg-card text-card-foreground hover:bg-secondary/20'
            )}
          >
            {parcela}x
          </button>
        ))}
      </div>
    </div>
  );
}

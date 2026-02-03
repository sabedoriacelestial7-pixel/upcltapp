import { cn } from '@/lib/utils';
import { getParcelasDisponiveis } from '@/utils/calculos';

interface ParcelasSelectorProps {
  value: number;
  onChange: (value: number) => void;
  options?: number[];
}

// Opções padrão baseadas nos fatores da Facta (máximo 36x)
const DEFAULT_OPTIONS = [6, 12, 18, 24, 30, 36];

export function ParcelasSelector({ 
  value, 
  onChange, 
  options = DEFAULT_OPTIONS 
}: ParcelasSelectorProps) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-foreground mb-3">
        Em quantas vezes? <span className="text-muted-foreground font-normal">(máx. 36x)</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((parcela) => (
          <button
            key={parcela}
            onClick={() => onChange(parcela)}
            className={cn(
              'px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300',
              'active:scale-95 touch-manipulation',
              value === parcela
                ? 'bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white shadow-lg shadow-green-500/25'
                : 'bg-card border border-border text-foreground hover:bg-muted hover:border-primary/50'
            )}
          >
            {parcela}x
          </button>
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Trophy, ArrowRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatarMoeda } from '@/utils/formatters';
import { BancoCalculado } from '@/utils/calculos';
import { Button } from '@/components/ui/button';

interface BankCardProps {
  banco: BancoCalculado;
  isFirst?: boolean;
  onContratar: () => void;
}

export function BankCard({ banco, isFirst = false, onContratar }: BankCardProps) {
  const [logoError, setLogoError] = useState(false);

  return (
    <div
      className={cn(
        'relative rounded-2xl p-4 transition-all duration-300 group',
        'bg-card border border-border shadow-card',
        'hover:bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10',
        'hover:-translate-y-1 active:scale-[0.98] touch-manipulation',
        isFirst && 'ring-2 ring-primary bg-primary/5'
      )}
    >
      {isFirst && (
        <div className="absolute -top-3 left-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg shadow-primary/25">
          <Trophy size={12} className="animate-pulse" />
          MELHOR TAXA
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden bg-card border border-border',
              'transition-all duration-300 group-hover:scale-110 group-hover:rotate-3'
            )}
          >
            {!logoError ? (
              <img 
                src={banco.logo} 
                alt={banco.nome} 
                className="w-full h-full object-contain p-1"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span 
                className="font-bold text-sm"
                style={{ color: banco.cor }}
              >
                {banco.sigla}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
              {banco.nome}
            </h3>
            {banco.destaque && (
              <span className="text-xs text-primary font-medium">{banco.destaque}</span>
            )}
          </div>
        </div>
        <ArrowUpRight 
          size={18} 
          className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" 
        />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="group-hover:translate-x-0.5 transition-transform duration-300">
          <p className="text-xs text-muted-foreground">Liberado</p>
          <p className="font-semibold text-primary">{formatarMoeda(banco.valorLiberado)}</p>
        </div>
        <div className="group-hover:translate-x-0.5 transition-transform duration-300 delay-75">
          <p className="text-xs text-muted-foreground">Parcela</p>
          <p className="font-semibold text-foreground">{formatarMoeda(banco.valorParcela)}</p>
        </div>
        <div className="group-hover:translate-x-0.5 transition-transform duration-300 delay-100">
          <p className="text-xs text-muted-foreground">{banco.parcelas}x</p>
          <p className="font-semibold text-foreground">{formatarMoeda(banco.valorTotal)}</p>
        </div>
      </div>

      <Button 
        onClick={onContratar}
        className={cn(
          'w-full h-11 font-semibold touch-manipulation',
          'bg-gradient-to-r from-primary to-primary/80',
          'hover:from-primary/90 hover:to-primary/70',
          'shadow-lg shadow-primary/20',
          'transition-all duration-300',
          'group-hover:shadow-xl group-hover:shadow-primary/30'
        )}
      >
        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
        Contratar Agora
      </Button>
    </div>
  );
}

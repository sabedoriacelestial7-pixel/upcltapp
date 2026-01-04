import { Trophy, MessageCircle } from 'lucide-react';
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
  return (
    <div
      className={cn(
        'relative bg-card rounded-2xl p-4 shadow-card transition-all duration-200',
        'hover:shadow-card-hover active:scale-[0.99]',
        isFirst && 'ring-2 ring-secondary'
      )}
    >
      {isFirst && (
        <div className="absolute -top-3 left-4 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
          <Trophy size={12} />
          MELHOR TAXA
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ backgroundColor: `${banco.cor}20` }}
          >
            {banco.logo}
          </div>
          <div>
            <h3 className="font-semibold text-card-foreground">{banco.nome}</h3>
            {banco.destaque && (
              <span className="text-xs text-secondary font-medium">{banco.destaque}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Taxa</p>
          <p className="font-semibold text-card-foreground">{banco.taxaMensal.toFixed(2)}% a.m.</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Parcela</p>
          <p className="font-semibold text-card-foreground">{formatarMoeda(banco.valorParcela)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="font-semibold text-card-foreground">{formatarMoeda(banco.valorTotal)}</p>
        </div>
      </div>

      <Button 
        onClick={onContratar}
        className="w-full bg-whatsapp hover:bg-whatsapp/90 text-whatsapp-foreground shadow-button"
      >
        <MessageCircle size={18} />
        Contratar
      </Button>
    </div>
  );
}

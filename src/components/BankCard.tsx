import { Trophy, MessageCircle, ArrowUpRight } from 'lucide-react';
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
        'relative rounded-2xl p-4 transition-all duration-300 group',
        'bg-white/5 border border-white/10 backdrop-blur-sm',
        'hover:bg-white/10 hover:border-[#22c55e]/50 hover:shadow-lg hover:shadow-green-500/10',
        'hover:-translate-y-1 active:scale-[0.98] touch-manipulation',
        isFirst && 'ring-2 ring-[#22c55e] bg-[#22c55e]/5'
      )}
    >
      {isFirst && (
        <div className="absolute -top-3 left-4 bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg shadow-green-500/25">
          <Trophy size={12} className="animate-pulse" />
          MELHOR TAXA
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center',
              'transition-all duration-300 group-hover:scale-110 group-hover:rotate-3',
              'font-bold text-sm text-white'
            )}
            style={{ backgroundColor: banco.cor }}
          >
            {banco.sigla}
          </div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-[#22c55e] transition-colors duration-300">
              {banco.nome}
            </h3>
            {banco.destaque && (
              <span className="text-xs text-[#22c55e] font-medium">{banco.destaque}</span>
            )}
          </div>
        </div>
        <ArrowUpRight 
          size={18} 
          className="text-white/30 group-hover:text-[#22c55e] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" 
        />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="group-hover:translate-x-0.5 transition-transform duration-300">
          <p className="text-xs text-white/50">Liberado</p>
          <p className="font-semibold text-[#22c55e]">{formatarMoeda(banco.valorLiberado)}</p>
        </div>
        <div className="group-hover:translate-x-0.5 transition-transform duration-300 delay-75">
          <p className="text-xs text-white/50">Parcela</p>
          <p className="font-semibold text-white">{formatarMoeda(banco.valorParcela)}</p>
        </div>
        <div className="group-hover:translate-x-0.5 transition-transform duration-300 delay-100">
          <p className="text-xs text-white/50">{banco.parcelas}x</p>
          <p className="font-semibold text-white">{formatarMoeda(banco.valorTotal)}</p>
        </div>
      </div>

      <Button 
        onClick={onContratar}
        className={cn(
          'w-full h-11 font-semibold touch-manipulation',
          'bg-gradient-to-r from-[#22c55e] to-[#16a34a]',
          'hover:from-[#16a34a] hover:to-[#15803d]',
          'shadow-lg shadow-green-500/20',
          'transition-all duration-300',
          'group-hover:shadow-xl group-hover:shadow-green-500/30'
        )}
      >
        <MessageCircle size={18} className="group-hover:scale-110 transition-transform duration-300" />
        Contratar
      </Button>
    </div>
  );
}

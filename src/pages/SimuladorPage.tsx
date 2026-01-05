import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Info, Search } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { BankCard } from '@/components/BankCard';
import { ParcelasSelector } from '@/components/ParcelasSelector';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { calcularTodosBancos } from '@/utils/calculos';
import { formatarMoeda } from '@/utils/formatters';
import { abrirWhatsApp, abrirWhatsAppSimples } from '@/utils/whatsapp';

export default function SimuladorPage() {
  const navigate = useNavigate();
  const { consulta, simulacao, setSimulacao } = useApp();

  const margemDisponivel = consulta?.valorMargemDisponivel || 5000;
  const [parcelas, setParcelas] = useState(simulacao.parcelas);

  useEffect(() => {
    setSimulacao({ ...simulacao, valor: margemDisponivel, parcelas });
  }, [parcelas]);

  // Calcula baseado na margem disponível
  const bancosCalculados = calcularTodosBancos(margemDisponivel, parcelas);
  const melhorBanco = bancosCalculados[0];

  const handleContratar = (bancoId: string) => {
    const banco = bancosCalculados.find(b => b.id === bancoId);
    if (!banco) return;

    if (consulta) {
      abrirWhatsApp({
        nome: consulta.nome,
        cpf: consulta.cpf,
        margem: consulta.valorMargemDisponivel,
        bancoEscolhido: banco.nome,
        valor: banco.valorLiberado,
        parcelas: banco.parcelas,
        valorParcela: banco.valorParcela
      });
    } else {
      abrirWhatsAppSimples();
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] gradient-primary pb-36">
      <Header title="Simulador" />

      <main className="max-w-md mx-auto px-5 py-5 space-y-4 animate-fade-in">
        {/* Margin Info */}
        {consulta ? (
          <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/60">Sua margem mensal</p>
              <p className="text-lg font-bold text-[#22c55e]">
                {formatarMoeda(margemDisponivel)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/consulta')}
              className="text-[#22c55e] hover:bg-[#22c55e]/10 touch-manipulation"
            >
              Atualizar
            </Button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/consulta')}
            className="w-full bg-white/5 border border-[#22c55e]/30 rounded-xl p-3.5 flex items-center gap-3 text-left hover:bg-white/10 hover:border-[#22c55e]/50 transition-all duration-300 active:scale-[0.99] touch-manipulation"
          >
            <div className="w-10 h-10 rounded-lg bg-[#22c55e]/10 flex items-center justify-center shrink-0">
              <Search size={20} className="text-[#22c55e]" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white text-sm">
                Consultar margem primeiro
              </p>
              <p className="text-xs text-white/60">
                Descubra seu limite disponível
              </p>
            </div>
          </button>
        )}

        {/* Parcelas */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
          <ParcelasSelector
            value={parcelas}
            onChange={setParcelas}
          />
        </div>

        {/* Result Preview */}
        <div className="bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-2xl p-5 shadow-lg shadow-green-500/25 text-center">
          <p className="text-white/80 text-xs mb-1">
            Valor liberado
          </p>
          <p className="text-3xl font-extrabold text-white mb-1">
            {formatarMoeda(melhorBanco.valorLiberado)}
          </p>
          <p className="text-white/80 text-sm">
            {parcelas}x de {formatarMoeda(melhorBanco.valorParcela)}
          </p>
          <p className="text-xs text-white/60 mt-1.5">
            Melhor taxa: {melhorBanco.nome} ({melhorBanco.taxaMensal.toFixed(2)}% a.m.)
          </p>
        </div>

        {/* Parcelas - Second */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
          <ParcelasSelector
            value={parcelas}
            onChange={setParcelas}
          />
        </div>

        {/* Result Preview - Parcela */}
        <div className="bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-2xl p-5 shadow-lg shadow-green-500/25 text-center">
          <p className="text-white/80 text-xs mb-1">
            Parcela mensal
          </p>
          <p className="text-3xl font-extrabold text-white mb-1">
            {formatarMoeda(melhorBanco.valorParcela)}
          </p>
          <p className="text-white/80 text-sm">
            {parcelas}x de {formatarMoeda(melhorBanco.valorParcela)}
          </p>
          <p className="text-xs text-white/60 mt-1.5">
            Melhor taxa: {melhorBanco.nome} ({melhorBanco.taxaMensal.toFixed(2)}% a.m.)
          </p>
        </div>

        {/* Banks List */}
        <section>
          <h3 className="text-base font-bold text-foreground mb-3">
            Compare os bancos
          </h3>
          <div className="space-y-3">
            {bancosCalculados.map((banco, index) => (
              <BankCard
                key={banco.id}
                banco={banco}
                isFirst={index === 0}
                onContratar={() => handleContratar(banco.id)}
              />
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <div className="flex items-start gap-2.5 bg-white/5 border border-white/10 rounded-xl p-3.5">
          <Info size={16} className="text-white/50 shrink-0 mt-0.5" />
          <p className="text-xs text-white/60 leading-relaxed">
            Valores calculados com base no Sistema Price. Taxas e condições sujeitas à aprovação.
          </p>
        </div>
      </main>

      {/* Fixed CTA */}
      <div className="fixed bottom-16 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-[#0f172a] via-[#0f172a] to-transparent">
        <div className="max-w-md mx-auto">
          <Button
            onClick={() => handleContratar(melhorBanco.id)}
            className="w-full h-12 bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white font-semibold text-base shadow-lg shadow-green-500/25 touch-manipulation transition-all duration-300"
          >
            <MessageCircle size={20} />
            Contratar pelo WhatsApp
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

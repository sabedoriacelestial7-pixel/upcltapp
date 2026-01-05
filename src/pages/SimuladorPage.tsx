import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Info, Search } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { BankCard } from '@/components/BankCard';
import { ParcelasSelector } from '@/components/ParcelasSelector';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useApp } from '@/contexts/AppContext';
import { calcularTodosBancos } from '@/utils/calculos';
import { formatarMoeda } from '@/utils/formatters';
import { abrirWhatsApp, abrirWhatsAppSimples } from '@/utils/whatsapp';

export default function SimuladorPage() {
  const navigate = useNavigate();
  const { consulta, simulacao, setSimulacao } = useApp();

  const maxValor = consulta?.valorMargemDisponivel || 50000;
  const [valor, setValor] = useState(Math.min(simulacao.valor, maxValor));
  const [parcelas, setParcelas] = useState(simulacao.parcelas);

  useEffect(() => {
    setSimulacao({ ...simulacao, valor, parcelas });
  }, [valor, parcelas]);

  const bancosCalculados = calcularTodosBancos(valor, parcelas);
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
        valor: valor,
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

      <main className="max-w-md mx-auto px-4 py-5 space-y-4 animate-fade-in">
        {/* Margin Info */}
        {consulta ? (
          <div className="bg-secondary/10 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Sua margem</p>
              <p className="text-lg font-bold text-secondary">
                {formatarMoeda(consulta.valorMargemDisponivel)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/consulta')}
              className="text-secondary touch-manipulation"
            >
              Atualizar
            </Button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/consulta')}
            className="w-full bg-card rounded-xl p-3.5 shadow-card flex items-center gap-3 text-left hover:shadow-card-hover transition-all active:scale-[0.99] touch-manipulation"
          >
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
              <Search size={20} className="text-secondary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-card-foreground text-sm">
                Consultar margem primeiro
              </p>
              <p className="text-xs text-muted-foreground">
                Descubra seu limite disponível
              </p>
            </div>
          </button>
        )}

        {/* Value Slider */}
        <div className="bg-card rounded-2xl p-5 shadow-card">
          <label className="block text-sm font-medium text-card-foreground mb-3">
            Quanto você precisa?
          </label>

          <div className="text-center mb-5">
            <span className="text-3xl font-bold text-card-foreground">
              {formatarMoeda(valor)}
            </span>
          </div>

          <Slider
            value={[valor]}
            onValueChange={([v]) => setValor(v)}
            min={500}
            max={maxValor}
            step={100}
            className="mb-3"
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>R$ 500</span>
            <span>{formatarMoeda(maxValor)}</span>
          </div>
        </div>

        {/* Parcelas */}
        <div className="bg-card rounded-2xl p-5 shadow-card">
          <ParcelasSelector
            value={parcelas}
            onChange={setParcelas}
          />
        </div>

        {/* Result Preview */}
        <div className="bg-gradient-to-br from-secondary to-green-600 rounded-2xl p-5 shadow-card text-center">
          <p className="text-secondary-foreground/80 text-xs mb-1">
            Parcela mensal
          </p>
          <p className="text-3xl font-extrabold text-secondary-foreground mb-1">
            {formatarMoeda(melhorBanco.valorParcela)}
          </p>
          <p className="text-secondary-foreground/80 text-sm">
            {parcelas}x de {formatarMoeda(melhorBanco.valorParcela)}
          </p>
          <p className="text-xs text-secondary-foreground/60 mt-1.5">
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
        <div className="flex items-start gap-2.5 bg-muted/20 rounded-xl p-3.5">
          <Info size={16} className="text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Valores calculados com base no Sistema Price. Taxas e condições sujeitas à aprovação.
          </p>
        </div>
      </main>

      {/* Fixed CTA */}
      <div className="fixed bottom-16 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-md mx-auto">
          <Button
            onClick={() => handleContratar(melhorBanco.id)}
            className="w-full h-12 bg-whatsapp hover:bg-whatsapp/90 text-whatsapp-foreground font-semibold text-base shadow-button touch-manipulation"
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

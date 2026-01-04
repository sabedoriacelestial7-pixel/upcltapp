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
    <div className="min-h-screen gradient-primary pb-32">
      <Header title="Simulador" />

      <main className="max-w-md mx-auto px-4 py-6 space-y-6 animate-fade-in">
        {/* Margin Info */}
        {consulta ? (
          <div className="bg-secondary/10 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Sua margem</p>
              <p className="text-xl font-bold text-secondary">
                {formatarMoeda(consulta.valorMargemDisponivel)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/consulta')}
              className="text-secondary"
            >
              Atualizar
            </Button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/consulta')}
            className="w-full bg-card rounded-2xl p-4 shadow-card flex items-center gap-4 text-left hover:shadow-card-hover transition-all active:scale-[0.99]"
          >
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
              <Search size={24} className="text-secondary" />
            </div>
            <div>
              <p className="font-semibold text-card-foreground">
                Consultar margem primeiro
              </p>
              <p className="text-sm text-muted-foreground">
                Descubra seu limite disponível
              </p>
            </div>
          </button>
        )}

        {/* Value Slider */}
        <div className="bg-card rounded-3xl p-6 shadow-card">
          <label className="block text-sm font-medium text-card-foreground mb-4">
            Quanto você precisa?
          </label>

          <div className="text-center mb-6">
            <span className="text-4xl font-bold text-card-foreground">
              {formatarMoeda(valor)}
            </span>
          </div>

          <Slider
            value={[valor]}
            onValueChange={([v]) => setValor(v)}
            min={500}
            max={maxValor}
            step={100}
            className="mb-4"
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>R$ 500</span>
            <span>{formatarMoeda(maxValor)}</span>
          </div>
        </div>

        {/* Parcelas */}
        <div className="bg-card rounded-3xl p-6 shadow-card">
          <ParcelasSelector
            value={parcelas}
            onChange={setParcelas}
          />
        </div>

        {/* Result Preview */}
        <div className="bg-gradient-to-br from-secondary to-green-600 rounded-3xl p-6 shadow-card text-center">
          <p className="text-secondary-foreground/80 text-sm mb-2">
            Parcela mensal
          </p>
          <p className="text-4xl font-extrabold text-secondary-foreground mb-2">
            {formatarMoeda(melhorBanco.valorParcela)}
          </p>
          <p className="text-secondary-foreground/80">
            {parcelas}x de {formatarMoeda(melhorBanco.valorParcela)}
          </p>
          <p className="text-xs text-secondary-foreground/60 mt-2">
            Melhor taxa: {melhorBanco.nome} ({melhorBanco.taxaMensal.toFixed(2)}% a.m.)
          </p>
        </div>

        {/* Banks List */}
        <section>
          <h3 className="text-lg font-bold text-foreground mb-4">
            Compare os bancos
          </h3>
          <div className="space-y-4">
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
        <div className="flex items-start gap-3 bg-muted/20 rounded-xl p-4">
          <Info size={18} className="text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Valores calculados com base no Sistema Price. Taxas e condições sujeitas à aprovação do banco escolhido.
          </p>
        </div>
      </main>

      {/* Fixed CTA */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-md mx-auto">
          <Button
            onClick={() => handleContratar(melhorBanco.id)}
            className="w-full h-14 bg-whatsapp hover:bg-whatsapp/90 text-whatsapp-foreground font-semibold text-lg shadow-button"
          >
            <MessageCircle size={22} />
            Contratar pelo WhatsApp
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

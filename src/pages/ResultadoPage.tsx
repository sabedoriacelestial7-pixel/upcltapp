import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Building2, Calendar, Wallet, Clock, Info, Calculator } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { BankCard } from '@/components/BankCard';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { calcularTodosBancos } from '@/utils/calculos';
import { formatarMoeda, formatarData, formatarCPF } from '@/utils/formatters';
import { abrirWhatsApp } from '@/utils/whatsapp';

export default function ResultadoPage() {
  const navigate = useNavigate();
  const { consulta, simulacao, setSimulacao } = useApp();

  useEffect(() => {
    if (!consulta) {
      navigate('/consulta');
    }
  }, [consulta, navigate]);

  if (!consulta) return null;

  const valorSimulacao = Math.min(consulta.valorMargemDisponivel, simulacao.valor);
  const bancosCalculados = calcularTodosBancos(valorSimulacao, simulacao.parcelas);

  const handleContratar = (bancoId: string) => {
    const banco = bancosCalculados.find(b => b.id === bancoId);
    if (!banco) return;

    abrirWhatsApp({
      nome: consulta.nome,
      cpf: consulta.cpf,
      margem: consulta.valorMargemDisponivel,
      bancoEscolhido: banco.nome,
      valor: valorSimulacao,
      parcelas: banco.parcelas,
      valorParcela: banco.valorParcela
    });
  };

  return (
    <div className="min-h-screen gradient-primary pb-24">
      <Header title="Sua Margem" />

      <main className="max-w-md mx-auto px-4 py-6 space-y-6 animate-fade-in">
        {/* Success Card */}
        <div className="gradient-card rounded-3xl p-6 shadow-card text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 mx-auto mb-4 flex items-center justify-center">
            <CheckCircle size={36} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">
            Parabéns, {consulta.nome.split(' ')[0]}!
          </h2>
          <p className="text-white/80 mb-4">Você tem margem disponível</p>
          <p className="text-5xl font-extrabold text-white animate-count">
            {formatarMoeda(consulta.valorMargemDisponivel)}
          </p>
          <p className="text-white/70 text-sm mt-2">
            Margem disponível para empréstimo
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-card rounded-2xl p-5 shadow-card">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Empresa</p>
                <p className="text-sm font-semibold text-card-foreground truncate max-w-[120px]">
                  {consulta.nomeEmpregador}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Admissão</p>
                <p className="text-sm font-semibold text-card-foreground">
                  {formatarData(consulta.dataAdmissao)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Salário base</p>
                <p className="text-sm font-semibold text-card-foreground">
                  {formatarMoeda(consulta.valorBaseMargem)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Atualizado em</p>
                <p className="text-sm font-semibold text-card-foreground">
                  {formatarData(consulta.atualizadoEm)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Banks Comparison */}
        <section>
          <h3 className="text-lg font-bold text-foreground mb-2">
            Compare e escolha o melhor banco
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Valores calculados para {simulacao.parcelas}x de{' '}
            {formatarMoeda(valorSimulacao)}
          </p>

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

        {/* Simulator Button */}
        <Button
          onClick={() => {
            setSimulacao({
              ...simulacao,
              valor: consulta.valorMargemDisponivel
            });
            navigate('/simulador');
          }}
          variant="outline"
          className="w-full h-14 border-secondary text-secondary hover:bg-secondary/10"
        >
          <Calculator size={20} />
          Simular outros valores
        </Button>

        {/* Disclaimer */}
        <div className="flex items-start gap-3 bg-muted/20 rounded-xl p-4">
          <Info size={18} className="text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Valores sujeitos à análise de crédito do banco escolhido. As taxas podem variar de acordo com o perfil do cliente.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

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

  // Calcula baseado na margem disponível
  const bancosCalculados = calcularTodosBancos(consulta.valorMargemDisponivel, simulacao.parcelas);
  const melhorBanco = bancosCalculados[0];

  const handleContratar = (bancoId: string) => {
    const banco = bancosCalculados.find(b => b.id === bancoId);
    if (!banco) return;

    abrirWhatsApp({
      nome: consulta.nome,
      cpf: consulta.cpf,
      margem: consulta.valorMargemDisponivel,
      bancoEscolhido: banco.nome,
      valor: banco.valorLiberado,
      parcelas: banco.parcelas,
      valorParcela: banco.valorParcela
    });
  };

  return (
    <div className="min-h-screen min-h-[100dvh] gradient-primary pb-20">
      <Header title="Sua Margem" />

      <main className="max-w-md mx-auto px-5 py-5 space-y-4 animate-fade-in">
        {/* Success Card */}
        <div className="bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-2xl p-5 shadow-lg shadow-green-500/25 text-center">
          <div className="w-14 h-14 rounded-full bg-white/20 mx-auto mb-3 flex items-center justify-center backdrop-blur-sm">
            <CheckCircle size={28} className="text-white" />
          </div>
          <h2 className="text-lg font-bold text-white mb-0.5">
            Parabéns, {consulta.nome.split(' ')[0]}!
          </h2>
          <p className="text-white/80 text-sm mb-3">Você tem margem disponível</p>
          <p className="text-4xl font-extrabold text-white animate-count">
            {formatarMoeda(melhorBanco.valorLiberado)}
          </p>
          <p className="text-white/70 text-xs mt-1.5">
            Valor liberado em {simulacao.parcelas}x de {formatarMoeda(melhorBanco.valorParcela)}
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#22c55e]/10 flex items-center justify-center shrink-0">
                <Building2 size={16} className="text-[#22c55e]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-white/50">Empresa</p>
                <p className="text-xs font-semibold text-white truncate">
                  {consulta.nomeEmpregador}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#22c55e]/10 flex items-center justify-center shrink-0">
                <Calendar size={16} className="text-[#22c55e]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-white/50">Admissão</p>
                <p className="text-xs font-semibold text-white">
                  {formatarData(consulta.dataAdmissao)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#22c55e]/10 flex items-center justify-center shrink-0">
                <Wallet size={16} className="text-[#22c55e]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-white/50">Salário base</p>
                <p className="text-xs font-semibold text-white">
                  {formatarMoeda(consulta.valorBaseMargem)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#22c55e]/10 flex items-center justify-center shrink-0">
                <Clock size={16} className="text-[#22c55e]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-white/50">Atualizado em</p>
                <p className="text-xs font-semibold text-white">
                  {formatarData(consulta.atualizadoEm)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Banks Comparison */}
        <section>
          <h3 className="text-base font-bold text-foreground mb-1.5">
            Compare e escolha o melhor banco
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Parcela de {formatarMoeda(melhorBanco.valorParcela)} em {simulacao.parcelas}x
          </p>

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
          className="w-full h-12 border-[#22c55e]/50 text-[#22c55e] hover:bg-[#22c55e]/10 hover:border-[#22c55e] touch-manipulation transition-all duration-300"
        >
          <Calculator size={18} />
          Simular outros valores
        </Button>

        {/* Disclaimer */}
        <div className="flex items-start gap-2.5 bg-white/5 border border-white/10 rounded-xl p-3.5">
          <Info size={16} className="text-white/50 shrink-0 mt-0.5" />
          <p className="text-xs text-white/60 leading-relaxed">
            Valores sujeitos à análise de crédito. As taxas podem variar de acordo com o perfil.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

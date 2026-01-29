import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Building2, Calendar, Wallet, Clock, Info, Calculator, AlertCircle } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { formatarMoeda, formatarData } from '@/utils/formatters';
import { consultarOperacoesDisponiveis, TabelaFacta, getPrazosDisponiveis, getMelhorTabelaParaPrazo } from '@/services/factaOperacoesApi';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ResultadoPage() {
  const navigate = useNavigate();
  const { consulta, simulacao, setSimulacao } = useApp();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabelas, setTabelas] = useState<TabelaFacta[]>([]);
  const [prazoSelecionado, setPrazoSelecionado] = useState<number | null>(null);
  const [tabelaSelecionada, setTabelaSelecionada] = useState<TabelaFacta | null>(null);

  useEffect(() => {
    if (!consulta) {
      navigate('/consulta');
      return;
    }

    // Buscar operações disponíveis da API Facta
    const fetchOperacoes = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Usa 90% da margem disponível com 2 casas decimais (padrão Facta)
        const parcelaMaxima = Math.floor(consulta.valorMargemDisponivel * 0.90 * 100) / 100;
        
        const result = await consultarOperacoesDisponiveis({
          cpf: consulta.cpf,
          dataNascimento: consulta.dataNascimento,
          valorRenda: consulta.valorTotalVencimentos,
          valorParcela: parcelaMaxima
        });

        if (result.erro || !result.tabelas || result.tabelas.length === 0) {
          setError(result.mensagem || 'Nenhuma operação disponível para este CPF');
          return;
        }

        setTabelas(result.tabelas);
        
        // Seleciona o maior prazo disponível por padrão
        const prazos = getPrazosDisponiveis(result.tabelas);
        const maiorPrazo = prazos[prazos.length - 1];
        setPrazoSelecionado(maiorPrazo);
        
        const melhorTabela = getMelhorTabelaParaPrazo(result.tabelas, maiorPrazo);
        setTabelaSelecionada(melhorTabela || null);
        
      } catch (err) {
        console.error('Erro ao buscar operações:', err);
        setError('Erro ao buscar operações disponíveis');
      } finally {
        setLoading(false);
      }
    };

    fetchOperacoes();
  }, [consulta, navigate]);

  // Atualiza tabela quando muda o prazo
  useEffect(() => {
    if (prazoSelecionado && tabelas.length > 0) {
      const melhorTabela = getMelhorTabelaParaPrazo(tabelas, prazoSelecionado);
      setTabelaSelecionada(melhorTabela || null);
    }
  }, [prazoSelecionado, tabelas]);

  if (!consulta) return null;

  if (loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] gradient-primary pb-20">
        <Header title="Sua Margem" />
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <LoadingSpinner />
          <p className="text-white/70 text-sm">Buscando melhores ofertas...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (error || !tabelaSelecionada) {
    return (
      <div className="min-h-screen min-h-[100dvh] gradient-primary pb-20">
        <Header title="Sua Margem" />
        <main className="max-w-md mx-auto px-5 py-5">
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
            <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-white mb-2">Ops!</h2>
            <p className="text-white/70 text-sm mb-4">{error || 'Nenhuma operação disponível'}</p>
            <Button 
              onClick={() => navigate('/consulta')}
              className="bg-white/10 hover:bg-white/20 text-white"
            >
              Tentar novamente
            </Button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  const prazosDisponiveis = getPrazosDisponiveis(tabelas);

  const handleContratar = () => {
    if (!tabelaSelecionada) return;

    navigate('/contratacao', {
      state: {
        banco: {
          id: 'facta',
          nome: 'Facta Financeira',
          logo: '/logos/facta.png',
          sigla: 'FACTA',
          taxaMensal: tabelaSelecionada.taxa,
          cor: '#22c55e',
          destaque: null,
          valorParcela: tabelaSelecionada.parcela,
          valorLiberado: tabelaSelecionada.valor_liquido,
          valorTotal: tabelaSelecionada.contrato,
          parcelas: tabelaSelecionada.prazo
        },
        codigoTabela: tabelaSelecionada.codigoTabela,
        coeficiente: tabelaSelecionada.coeficiente.toString(),
        tabela: tabelaSelecionada
      }
    });
  };

  return (
    <div className="min-h-screen min-h-[100dvh] gradient-primary pb-20">
      <Header title="Sua Margem" />

      <main className="max-w-md mx-auto px-5 py-5 space-y-4">
        {/* Success Card */}
        <div 
          className="bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-2xl p-5 shadow-lg shadow-green-500/25 text-center animate-fade-in opacity-0"
          style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}
        >
          <div className="w-14 h-14 rounded-full bg-white/20 mx-auto mb-3 flex items-center justify-center backdrop-blur-sm">
            <CheckCircle size={28} className="text-white" />
          </div>
          <h2 className="text-lg font-bold text-white mb-0.5">
            Parabéns, {consulta.nome.split(' ')[0]}!
          </h2>
          <p className="text-white/80 text-sm mb-3">Você tem margem disponível</p>
          <p className="text-4xl font-extrabold text-white animate-count">
            {formatarMoeda(tabelaSelecionada.valor_liquido)}
          </p>
          <p className="text-white/70 text-xs mt-1.5">
            Valor liberado em {tabelaSelecionada.prazo}x de {formatarMoeda(tabelaSelecionada.parcela)}
          </p>
        </div>

        {/* Info Card */}
        <div 
          className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm animate-fade-in opacity-0"
          style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
        >
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

        {/* Prazo Selector */}
        <div 
          className="animate-fade-in opacity-0"
          style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
        >
          <label className="text-sm font-medium text-white/70 mb-2 block">
            Escolha o prazo:
          </label>
          <Select 
            value={prazoSelecionado?.toString()} 
            onValueChange={(value) => setPrazoSelecionado(Number(value))}
          >
            <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Selecione o prazo" />
            </SelectTrigger>
            <SelectContent>
              {prazosDisponiveis.map((prazo) => {
                const tabela = getMelhorTabelaParaPrazo(tabelas, prazo);
                return (
                  <SelectItem key={prazo} value={prazo.toString()}>
                    {prazo}x - {tabela ? formatarMoeda(tabela.valor_liquido) : ''} (taxa {tabela?.taxa}%)
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Option Details */}
        <div 
          className="bg-white/10 border border-white/20 rounded-2xl p-5 animate-fade-in opacity-0"
          style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <img 
              src="/logos/facta.png" 
              alt="Facta" 
              className="w-12 h-12 rounded-xl object-contain bg-white p-1"
            />
            <div>
              <h3 className="text-white font-bold">Facta Financeira</h3>
              <p className="text-white/60 text-xs">{tabelaSelecionada.tabela}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-white/50 text-xs">Valor Liberado</p>
              <p className="text-white font-bold text-lg">{formatarMoeda(tabelaSelecionada.valor_liquido)}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs">Parcela</p>
              <p className="text-white font-bold text-lg">{formatarMoeda(tabelaSelecionada.parcela)}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs">Taxa Mensal</p>
              <p className="text-white font-semibold">{tabelaSelecionada.taxa}% a.m.</p>
            </div>
            <div>
              <p className="text-white/50 text-xs">Prazo</p>
              <p className="text-white font-semibold">{tabelaSelecionada.prazo} meses</p>
            </div>
          </div>

          {tabelaSelecionada.valor_seguro > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
              <p className="text-yellow-300 text-xs">
                ⚠️ Inclui seguro de R$ {tabelaSelecionada.valor_seguro.toFixed(2)}
              </p>
            </div>
          )}

          <Button
            onClick={handleContratar}
            className="w-full h-12 bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold"
          >
            Contratar Agora
          </Button>
        </div>

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
          className="w-full h-12 border-[#22c55e]/50 text-[#22c55e] hover:bg-[#22c55e]/10 hover:border-[#22c55e] touch-manipulation transition-all duration-300 animate-fade-in opacity-0"
          style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
        >
          <Calculator size={18} />
          Simular outros valores
        </Button>

        {/* Disclaimer */}
        <div 
          className="flex items-start gap-2.5 bg-white/5 border border-white/10 rounded-xl p-3.5 animate-fade-in opacity-0"
          style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}
        >
          <Info size={16} className="text-white/50 shrink-0 mt-0.5" />
          <p className="text-xs text-white/60 leading-relaxed">
            Valores consultados em tempo real da Facta Financeira. Sujeitos à análise de crédito.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

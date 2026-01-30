import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import { formatarMoeda } from '@/utils/formatters';
import { consultarOperacoesDisponiveis, TabelaFacta, getPrazosDisponiveis, getMelhorTabelaParaPrazo } from '@/services/factaOperacoesApi';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Clock, RefreshCw, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ResultadoPage() {
  const navigate = useNavigate();
  const { consulta } = useApp();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabelas, setTabelas] = useState<TabelaFacta[]>([]);
  const [prazoSelecionado, setPrazoSelecionado] = useState<number | null>(null);
  const [tabelaSelecionada, setTabelaSelecionada] = useState<TabelaFacta | null>(null);
  
  // Estado para edição de parcela
  const [editandoParcela, setEditandoParcela] = useState(false);
  const [parcelaDesejada, setParcelaDesejada] = useState<string>('');
  const [parcelaMaxima, setParcelaMaxima] = useState<number>(0);

  const fetchOperacoes = useCallback(async (valorParcela?: number) => {
    if (!consulta) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const parcelaMax = Math.floor(consulta.valorMargemDisponivel * 0.90 * 10) / 10;
      setParcelaMaxima(parcelaMax);
      
      const parcelaParaConsulta = valorParcela || parcelaMax;
      
      const result = await consultarOperacoesDisponiveis({
        cpf: consulta.cpf,
        dataNascimento: consulta.dataNascimento,
        valorRenda: consulta.valorTotalVencimentos,
        valorParcela: parcelaParaConsulta
      });

      if (result.erro || !result.tabelas || result.tabelas.length === 0) {
        setError(result.mensagem || 'Nenhuma operação disponível para este CPF');
        return;
      }

      setTabelas(result.tabelas);
      
      // Inicializa parcela desejada se ainda não definida
      if (!parcelaDesejada) {
        setParcelaDesejada(parcelaParaConsulta.toFixed(2).replace('.', ','));
      }
      
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
  }, [consulta, parcelaDesejada]);

  useEffect(() => {
    if (!consulta) {
      navigate('/consulta');
      return;
    }
    fetchOperacoes();
  }, [consulta, navigate]);

  useEffect(() => {
    if (prazoSelecionado && tabelas.length > 0) {
      const melhorTabela = getMelhorTabelaParaPrazo(tabelas, prazoSelecionado);
      setTabelaSelecionada(melhorTabela || null);
    }
  }, [prazoSelecionado, tabelas]);

  const handleNovaSimulacao = () => {
    const valorNumerico = parseFloat(parcelaDesejada.replace(',', '.'));
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      return;
    }
    
    // Limita ao máximo permitido
    const valorFinal = Math.min(valorNumerico, parcelaMaxima);
    setParcelaDesejada(valorFinal.toFixed(2).replace('.', ','));
    setEditandoParcela(false);
    fetchOperacoes(valorFinal);
  };

  if (!consulta) return null;

  if (loading) {
    return <LoadingScreen variant="searching" message="Buscando as melhores taxas..." />;
  }

  if (error || !tabelaSelecionada) {
    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <Header showChat />
        <main className="max-w-md mx-auto px-5 py-8 text-center">
          <p className="text-red-500">{error}</p>
          <Button onClick={() => navigate('/consulta')} className="mt-4">
            Tentar novamente
          </Button>
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
          cor: '#10b981',
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
    <div className="min-h-screen bg-[#f5f5f5] pb-24">
      <Header showBack showChat />

      <main className="max-w-md mx-auto px-5 py-5">
        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Consignado CLT
        </h1>
        <p className="text-muted-foreground text-sm mb-5">
          Taxas acessíveis e sem burocracia
        </p>

        {/* Parcela Editor */}
        <div className="bg-white rounded-2xl p-4 shadow-card mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Parcela desejada</span>
            <span className="text-xs text-muted-foreground">
              Máx: {formatarMoeda(parcelaMaxima)}
            </span>
          </div>
          
          {editandoParcela ? (
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  type="text"
                  value={parcelaDesejada}
                  onChange={(e) => setParcelaDesejada(e.target.value)}
                  className="pl-10 h-12 text-lg font-semibold"
                  placeholder="0,00"
                />
              </div>
              <Button 
                onClick={handleNovaSimulacao}
                className="h-12 px-4 bg-primary hover:bg-primary/90"
              >
                <RefreshCw size={18} />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setEditandoParcela(true)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <span className="text-xl font-bold text-foreground">
                {formatarMoeda(tabelaSelecionada.parcela)}
              </span>
              <Edit3 size={18} className="text-primary" />
            </button>
          )}
        </div>

        {/* Prazo Selector */}
        <div className="bg-white rounded-2xl p-4 shadow-card mb-4">
          <span className="text-sm text-muted-foreground mb-3 block">
            Escolha o prazo
          </span>
          <div className="flex flex-wrap gap-2">
            {prazosDisponiveis.map((prazo) => {
              const tabelaDoPrazo = getMelhorTabelaParaPrazo(tabelas, prazo);
              return (
                <button
                  key={prazo}
                  onClick={() => setPrazoSelecionado(prazo)}
                  className={cn(
                    'flex flex-col items-center px-4 py-3 rounded-xl transition-all min-w-[70px]',
                    prazoSelecionado === prazo
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-gray-50 text-foreground hover:bg-gray-100'
                  )}
                >
                  <span className="text-lg font-bold">{prazo}x</span>
                  <span className={cn(
                    'text-xs',
                    prazoSelecionado === prazo ? 'text-white/80' : 'text-muted-foreground'
                  )}>
                    {tabelaDoPrazo?.taxa.toFixed(2)}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Result Card */}
        <div className="bg-white rounded-2xl p-6 shadow-card mb-5 text-center">
          <p className="text-muted-foreground text-sm mb-2">
            Em <span className="text-primary font-semibold">{tabelaSelecionada.prazo} meses</span>,{' '}
            pagando <span className="text-primary font-semibold">{formatarMoeda(tabelaSelecionada.parcela)}</span> por mês,
          </p>
          <p className="text-muted-foreground text-sm mb-3">
            estimamos que você receba
          </p>
          
          <p className="text-4xl font-extrabold text-foreground mb-2">
            {formatarMoeda(tabelaSelecionada.valor_liquido)}
          </p>
          
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Clock size={14} />
            <span>Em 1 dia útil</span>
          </div>

          <p className="text-muted-foreground text-xs mt-4 max-w-xs mx-auto">
            Com a taxa de <span className="font-semibold">{tabelaSelecionada.taxa}% a.m.</span> de acordo com as nossas estimativas, de todos os bancos em nosso catálogo, o <span className="font-semibold">FACTA</span> é o que traz a melhor proposta.
          </p>

          {/* Bank logo */}
          <div className="mt-4">
            <img 
              src="/logos/facta.png" 
              alt="Facta" 
              className="w-16 h-16 mx-auto object-contain"
            />
          </div>

          <button 
            onClick={() => navigate('/resultado/detalhes', { state: { tabela: tabelaSelecionada } })}
            className="text-primary text-sm font-medium mt-4 hover:underline"
          >
            Ver detalhes completos
          </button>
        </div>

        {/* Summary Table */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-5">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <span className="text-sm font-medium text-foreground">Resumo das opções</span>
          </div>
          <div className="divide-y divide-gray-100">
            {prazosDisponiveis.map((prazo) => {
              const tabelaDoPrazo = getMelhorTabelaParaPrazo(tabelas, prazo);
              if (!tabelaDoPrazo) return null;
              
              const isSelected = prazo === prazoSelecionado;
              
              return (
                <button
                  key={prazo}
                  onClick={() => setPrazoSelecionado(prazo)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 transition-colors',
                    isSelected ? 'bg-primary/5' : 'hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold',
                      isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-foreground'
                    )}>
                      {prazo}x
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">
                        {formatarMoeda(tabelaDoPrazo.valor_liquido)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Parcela: {formatarMoeda(tabelaDoPrazo.parcela)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      'text-sm font-semibold',
                      isSelected ? 'text-primary' : 'text-foreground'
                    )}>
                      {tabelaDoPrazo.taxa.toFixed(2)}% a.m.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total: {formatarMoeda(tabelaDoPrazo.contrato)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* CTA Button */}
        <Button
          onClick={handleContratar}
          className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-semibold text-base shadow-button mb-3"
        >
          Quero essa proposta!
        </Button>

        <button 
          onClick={() => navigate('/simulacoes')}
          className="w-full text-center text-primary font-medium py-3 hover:underline"
        >
          Ver outras simulações
        </button>
      </main>

      <BottomNav />
    </div>
  );
}

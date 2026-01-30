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
import { Clock, ChevronRight, ChevronDown, RefreshCw, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ResultadoPage() {
  const navigate = useNavigate();
  const { consulta } = useApp();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabelas, setTabelas] = useState<TabelaFacta[]>([]);
  const [prazoExpandido, setPrazoExpandido] = useState<number | null>(null);
  
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

  const handleContratar = (tabela: TabelaFacta) => {
    navigate('/contratacao', {
      state: {
        banco: {
          id: 'facta',
          nome: 'Facta Financeira',
          logo: '/logos/facta.png',
          sigla: 'FACTA',
          taxaMensal: tabela.taxa,
          cor: '#10b981',
          destaque: null,
          valorParcela: tabela.parcela,
          valorLiberado: tabela.valor_liquido,
          valorTotal: tabela.contrato,
          parcelas: tabela.prazo
        },
        codigoTabela: tabela.codigoTabela,
        coeficiente: tabela.coeficiente.toString(),
        tabela: tabela
      }
    });
  };

  const handleVerDetalhes = (tabela: TabelaFacta) => {
    navigate('/resultado/detalhes', { state: { tabela } });
  };

  if (!consulta) return null;

  if (loading) {
    return <LoadingScreen variant="searching" message="Buscando as melhores taxas..." />;
  }

  if (error) {
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

  // Pega os prazos disponíveis da API (reais)
  const prazosDisponiveis = getPrazosDisponiveis(tabelas);

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-24">
      <Header showBack showChat />

      <main className="max-w-md mx-auto px-5 py-5">
        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Outras simulações
        </h1>
        <p className="text-muted-foreground text-sm mb-5">
          Taxas acessíveis e sem burocracia
        </p>

        {/* Parcela Editor */}
        <div className="bg-white rounded-2xl p-4 shadow-card mb-5">
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
                {formatarMoeda(parseFloat(parcelaDesejada.replace(',', '.')) || 0)}
              </span>
              <Edit3 size={18} className="text-primary" />
            </button>
          )}
        </div>

        {/* Cards de Prazos - Dados reais da API Facta */}
        <div className="space-y-4">
          {prazosDisponiveis.map((prazo) => {
            const tabela = getMelhorTabelaParaPrazo(tabelas, prazo);
            if (!tabela) return null;
            
            const isExpanded = prazoExpandido === prazo;
            
            return (
              <div 
                key={prazo}
                className="bg-white rounded-2xl shadow-card overflow-hidden"
              >
                {/* Card Header - Clicável */}
                <button
                  onClick={() => setPrazoExpandido(isExpanded ? null : prazo)}
                  className="w-full p-4"
                >
                  {/* Badge + Logo */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-medium">
                      <Clock size={12} />
                      <span>1 dia útil</span>
                    </div>
                    <img 
                      src="/logos/facta.png" 
                      alt="Facta" 
                      className="w-12 h-12 object-contain"
                    />
                  </div>

                  {/* Info */}
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Valor da parcela</span>
                      <span className="font-semibold text-foreground">{formatarMoeda(tabela.parcela)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Número de parcelas</span>
                      <span className="font-semibold text-foreground">{tabela.prazo}</span>
                    </div>
                  </div>

                  {/* Valor Líquido + Arrow */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <span className="text-xl font-bold text-primary">
                      {formatarMoeda(tabela.valor_liquido)}
                    </span>
                    {isExpanded ? (
                      <ChevronDown size={24} className="text-primary" />
                    ) : (
                      <ChevronRight size={24} className="text-primary" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    {/* Detalhes extras */}
                    <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Taxa mensal</span>
                        <span className="font-medium text-foreground">{tabela.taxa.toFixed(2)}% a.m.</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Taxa anual</span>
                        <span className="font-medium text-foreground">
                          {((Math.pow(1 + tabela.taxa / 100, 12) - 1) * 100).toFixed(2)}% a.a.
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Valor total</span>
                        <span className="font-medium text-foreground">{formatarMoeda(tabela.contrato)}</span>
                      </div>
                      {tabela.valor_seguro > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Seguro incluso</span>
                          <span className="font-medium text-foreground">{formatarMoeda(tabela.valor_seguro)}</span>
                        </div>
                      )}
                    </div>

                    {/* Botões */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleVerDetalhes(tabela)}
                        className="flex-1 h-12"
                      >
                        Ver detalhes
                      </Button>
                      <Button
                        onClick={() => handleContratar(tabela)}
                        className="flex-1 h-12 bg-primary hover:bg-primary/90"
                      >
                        Contratar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Info text */}
        <p className="text-center text-muted-foreground text-xs mt-6 px-4">
          Valores e prazos calculados de acordo com sua margem consignável.
          Sujeito a análise de crédito.
        </p>
      </main>

      <BottomNav />
    </div>
  );
}

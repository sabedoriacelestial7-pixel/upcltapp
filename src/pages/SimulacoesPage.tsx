import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { useApp } from '@/contexts/AppContext';
import { formatarMoeda } from '@/utils/formatters';
import { consultarOperacoesDisponiveis, TabelaFacta, getPrazosDisponiveis, getMelhorTabelaParaPrazo } from '@/services/factaOperacoesApi';
import { ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SimulationCardSkeleton } from '@/components/SkeletonLoaders';
import { EmptyState } from '@/components/EmptyState';
import { PageTransition } from '@/components/PageTransition';

interface SimulacaoCard {
  banco: string;
  logo: string;
  valorParcela: number;
  parcelas: number;
  valorLiberado: number;
  prazoLiberacao: string;
  tabela: TabelaFacta;
}

export default function SimulacoesPage() {
  const navigate = useNavigate();
  const { consulta } = useApp();
  
  const [loading, setLoading] = useState(true);
  const [simulacoes, setSimulacoes] = useState<SimulacaoCard[]>([]);

  useEffect(() => {
    if (!consulta) {
      navigate('/consulta');
      return;
    }

    const fetchOperacoes = async () => {
      setLoading(true);
      
      try {
        const parcelaMaxima = Math.floor(consulta.valorMargemDisponivel * 0.90 * 10) / 10;
        
        const result = await consultarOperacoesDisponiveis({
          cpf: consulta.cpf,
          dataNascimento: consulta.dataNascimento,
          valorRenda: consulta.valorTotalVencimentos,
          valorParcela: parcelaMaxima
        });

        if (!result.erro && result.tabelas) {
          // Group by prazo and get best for each
          const prazos = getPrazosDisponiveis(result.tabelas);
          const cards: SimulacaoCard[] = [];
          
          prazos.forEach(prazo => {
            const melhor = getMelhorTabelaParaPrazo(result.tabelas!, prazo);
            if (melhor) {
              cards.push({
                banco: 'Facta',
                logo: '/logos/facta.png',
                valorParcela: melhor.parcela,
                parcelas: melhor.prazo,
                valorLiberado: melhor.valor_liquido,
                prazoLiberacao: '1 dia útil',
                tabela: melhor
              });
            }
          });

          // Sort by valor_liberado descending
          cards.sort((a, b) => b.valorLiberado - a.valorLiberado);
          setSimulacoes(cards);
        }
      } catch (err) {
        console.error('Erro:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOperacoes();
  }, [consulta, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header showBack showChat title="" />
        <main className="max-w-md mx-auto px-5 py-5">
          <h1 className="text-2xl font-bold text-foreground mb-1">Outras simulações</h1>
          <p className="text-muted-foreground text-sm mb-5">Taxas acessíveis e sem burocracia</p>
          <div className="space-y-4">
            <SimulationCardSkeleton />
            <SimulationCardSkeleton />
            <SimulationCardSkeleton />
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  const handleSelect = (sim: SimulacaoCard) => {
    navigate('/contratacao', {
      state: {
        banco: {
          id: 'facta',
          nome: 'Facta Financeira',
          logo: sim.logo,
          sigla: 'FACTA',
          taxaMensal: sim.tabela.taxa,
          cor: '#10b981',
          destaque: null,
          valorParcela: sim.valorParcela,
          valorLiberado: sim.valorLiberado,
          valorTotal: sim.tabela.contrato,
          parcelas: sim.parcelas
        },
        codigoTabela: sim.tabela.codigoTabela,
        coeficiente: sim.tabela.coeficiente.toString(),
        tabela: sim.tabela
      }
    });
  };

  return (
    <PageTransition className="min-h-screen bg-[#f5f5f5] pb-20">
      <Header showBack showChat title="" />

      <main className="max-w-md mx-auto px-5 py-5">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Outras simulações
        </h1>
        <p className="text-muted-foreground text-sm mb-5">
          Taxas acessíveis e sem burocracia
        </p>

        {simulacoes.length === 0 ? (
          <EmptyState
            variant="search"
            title="Nenhuma simulação disponível"
            description="Não encontramos ofertas para seu perfil no momento."
            actionLabel="Tentar novamente"
            onAction={() => navigate('/consulta')}
          />
        ) : (
          <div className="space-y-4">
            {simulacoes.map((sim, index) => (
              <button
                key={`${sim.parcelas}-${index}`}
                onClick={() => handleSelect(sim)}
                className={cn(
                  'w-full bg-white rounded-xl p-4 shadow-card text-left group',
                  'hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200',
                  'active:scale-[0.99] touch-manipulation'
                )}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-primary text-xs font-medium">
                  <Clock size={14} />
                  <span>{sim.prazoLiberacao}</span>
                </div>
                <img 
                  src={sim.logo} 
                  alt={sim.banco}
                  className="h-10 w-auto object-contain"
                />
              </div>

              {/* Details */}
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-muted-foreground text-xs">Valor da parcela</p>
                  <p className="text-foreground font-semibold">{formatarMoeda(sim.valorParcela)}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs">Número de parcelas</p>
                  <p className="text-foreground font-semibold">{sim.parcelas}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <p className="text-primary font-bold text-xl">
                  {formatarMoeda(sim.valorLiberado)}
                </p>
                <ChevronRight size={20} className="text-primary" />
              </div>
            </button>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </PageTransition>
  );
}
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { formatarMoeda, formatarData } from '@/utils/formatters';
import { consultarOperacoesDisponiveis, TabelaFacta, getPrazosDisponiveis, getMelhorTabelaParaPrazo } from '@/services/factaOperacoesApi';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ChevronRight, Clock, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

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

    const fetchOperacoes = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const parcelaMaxima = Math.floor(consulta.valorMargemDisponivel * 0.90 * 10) / 10;
        
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

  useEffect(() => {
    if (prazoSelecionado && tabelas.length > 0) {
      const melhorTabela = getMelhorTabelaParaPrazo(tabelas, prazoSelecionado);
      setTabelaSelecionada(melhorTabela || null);
    }
  }, [prazoSelecionado, tabelas]);

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
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header showBack showChat />

      <main className="max-w-md mx-auto px-5 py-5">
        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Consignado CLT
        </h1>
        <p className="text-muted-foreground text-sm mb-5">
          Taxas acessíveis e sem burocracia
        </p>

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
            Detalhes
          </button>
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
import { useNavigate, useLocation } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { formatarMoeda } from '@/utils/formatters';
import { TabelaFacta } from '@/services/factaOperacoesApi';

export default function ResultadoDetalhesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { consulta } = useApp();
  
  // Get tabela from location state
  const tabela = location.state?.tabela as TabelaFacta | undefined;

  if (!consulta || !tabela) {
    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <Header showBack showChat />
        <main className="max-w-md mx-auto px-5 py-8 text-center">
          <p className="text-muted-foreground">Dados não encontrados</p>
          <Button onClick={() => navigate('/resultado')} className="mt-4">
            Voltar
          </Button>
        </main>
        <BottomNav />
      </div>
    );
  }

  // Calculate values
  const valorParcela = tabela.parcela;
  const prazo = tabela.prazo;
  const valorLiquido = tabela.valor_liquido;
  const valorContrato = tabela.contrato;
  const taxaMensal = tabela.taxa;
  const valorSeguro = tabela.valor_seguro || 0;
  
  // Calculate IOF (approximately 3% of loan value + 0.38% flat)
  const iofEstimado = valorContrato * 0.03 + valorContrato * 0.0038;
  
  // Calculate annual rate: (1 + taxaMensal/100)^12 - 1
  const taxaAnual = (Math.pow(1 + taxaMensal / 100, 12) - 1) * 100;
  
  // Calculate CET (Custo Efetivo Total) - estimated with IOF and fees
  // CET monthly ≈ taxa + (IOF / prazo / valorLiquido * 100)
  const cetMensal = taxaMensal + ((iofEstimado / prazo) / valorLiquido) * 100;
  const cetAnual = (Math.pow(1 + cetMensal / 100, 12) - 1) * 100;
  
  // Total a pagar
  const totalPagar = valorParcela * prazo;

  const handleContratar = () => {
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

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-32">
      <Header showBack showChat />

      <main className="max-w-md mx-auto px-5 py-5">
        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Consignado CLT
        </h1>
        <p className="text-muted-foreground text-sm mb-5">
          Nova condição
        </p>

        {/* Details Card */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          {/* Bank Logo */}
          <div className="p-5 pb-4">
            <img 
              src="/logos/facta.png" 
              alt="Facta" 
              className="w-14 h-14 object-contain"
            />
          </div>

          {/* Details List */}
          <div className="px-5">
            {/* Parcela */}
            <div className="flex justify-between items-center py-4 border-b border-gray-100">
              <span className="text-muted-foreground text-sm">Quanto vai pagar por mês</span>
              <span className="font-semibold text-foreground">{formatarMoeda(valorParcela)}</span>
            </div>

            {/* Prazo */}
            <div className="flex justify-between items-center py-4 border-b border-gray-100">
              <span className="text-muted-foreground text-sm">Por quantos meses vai pagar</span>
              <span className="font-semibold text-foreground">{prazo}</span>
            </div>

            {/* IOF */}
            <div className="flex justify-between items-center py-4 border-b border-gray-100">
              <span className="text-muted-foreground text-sm">IOF</span>
              <span className="font-semibold text-foreground">{formatarMoeda(iofEstimado)}</span>
            </div>

            {/* Seguro (if applicable) */}
            {valorSeguro > 0 && (
              <div className="flex justify-between items-center py-4 border-b border-gray-100">
                <span className="text-muted-foreground text-sm">Seguro</span>
                <span className="font-semibold text-foreground">{formatarMoeda(valorSeguro)}</span>
              </div>
            )}

            {/* Taxas de juros */}
            <div className="flex justify-between items-center py-4 border-b border-gray-100">
              <span className="text-muted-foreground text-sm">Taxas de juros</span>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-foreground">{taxaMensal.toFixed(2)}% a.m.</span>
                <div className="w-px h-4 bg-gray-300" />
                <span className="font-semibold text-foreground">{taxaAnual.toFixed(2)}% a.a.</span>
              </div>
            </div>

            {/* CET */}
            <div className="flex justify-between items-center py-4 border-b border-gray-100">
              <span className="text-muted-foreground text-sm">Custo efetivo total</span>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-foreground">{cetMensal.toFixed(2)}% a.m.</span>
                <div className="w-px h-4 bg-gray-300" />
                <span className="font-semibold text-foreground">{cetAnual.toFixed(2)}% a.a.</span>
              </div>
            </div>

            {/* Total a pagar */}
            <div className="flex justify-between items-center py-4">
              <span className="text-muted-foreground text-sm">Total a pagar</span>
              <span className="font-semibold text-foreground">{formatarMoeda(totalPagar)}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-100 border-t border-gray-200 p-4 safe-area-pb">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-3">
            <span className="text-muted-foreground">Você vai receber até</span>
            <span className="text-2xl font-bold text-primary">{formatarMoeda(valorLiquido)}</span>
          </div>
          <Button
            onClick={handleContratar}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-semibold text-base"
          >
            Quero essa proposta!
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

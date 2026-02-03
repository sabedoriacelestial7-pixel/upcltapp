import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, CheckCircle, XCircle, RefreshCw, ExternalLink, ChevronRight, FolderX } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { listarPropostas, atualizarStatusPropostas, Proposta, getStatusInfo } from '@/services/contratacaoApi';
import { formatarMoeda, formatarData } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { ProposalCardSkeleton } from '@/components/SkeletonLoaders';
import { EmptyState } from '@/components/EmptyState';

export default function PropostasPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useApp();
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarPropostas = async (atualizar = false) => {
    try {
      if (atualizar) {
        setRefreshing(true);
        const result = await atualizarStatusPropostas();
        if (!result.erro && result.propostas) {
          setPropostas(result.propostas);
        }
      } else {
        setLoading(true);
        const result = await listarPropostas();
        if (result.erro) {
          setError(result.mensagem || 'Erro ao carregar propostas');
        } else {
          setPropostas(result.propostas || []);
        }
      }
    } catch (err) {
      setError('Erro ao carregar propostas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      carregarPropostas();
    }
  }, [isLoggedIn]);

  const getStatusIcon = (status: string | null) => {
    if (!status) return <Clock className="text-gray-400" size={20} />;
    
    if (status.includes('EFETIVADA') || status.includes('PAGA') || status.includes('sucesso')) {
      return <CheckCircle className="text-green-500" size={20} />;
    }
    if (status.includes('CANCELADO') || status.includes('erro')) {
      return <XCircle className="text-red-500" size={20} />;
    }
    return <Clock className="text-blue-500" size={20} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <main className="max-w-md mx-auto px-5 pt-[calc(env(safe-area-inset-top)+1rem)]">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-1">Contratações</h1>
            <p className="text-muted-foreground text-sm">Acompanhe o status de cada operação.</p>
          </div>
          <div className="space-y-3">
            <ProposalCardSkeleton />
            <ProposalCardSkeleton />
            <ProposalCardSkeleton />
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-20">
      <main className="max-w-md mx-auto px-5 pt-[calc(env(safe-area-inset-top)+1rem)]">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Contratações
          </h1>
          <p className="text-muted-foreground text-sm">
            Acompanhe o status de cada operação simulada.
          </p>
        </div>

        {/* Refresh button */}
        {propostas.length > 0 && (
          <div className="flex justify-end mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => carregarPropostas(true)}
              disabled={refreshing}
              className="text-muted-foreground"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {propostas.length === 0 && !error && (
          <EmptyState
            variant="proposals"
            title="Você não possui contratações"
            description="Que tal dar uma olhada nas oportunidades disponíveis para você?"
            actionLabel="Ver oportunidades"
            onAction={() => navigate('/consulta')}
          />
        )}

        {/* Proposals list */}
        <div className="space-y-3">
          {propostas.map((proposta) => {
            const statusInfo = getStatusInfo(proposta.status_facta || proposta.status);
            
            return (
              <button
                key={proposta.id}
                className={cn(
                  'w-full bg-white rounded-xl p-4 text-left shadow-card',
                  'hover:shadow-card-hover transition-all duration-200',
                  'active:scale-[0.99] touch-manipulation'
                )}
                onClick={() => navigate(`/propostas/${proposta.id}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(proposta.status_facta || proposta.status)}
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {proposta.banco_nome}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatarData(proposta.created_at)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Valor</p>
                    <p className="text-sm font-semibold text-foreground">
                      {formatarMoeda(proposta.valor_operacao)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Parcelas</p>
                    <p className="text-sm font-semibold text-foreground">
                      {proposta.parcelas}x de {formatarMoeda(proposta.valor_parcela)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    statusInfo.color
                  )}>
                    {statusInfo.label}
                  </span>
                  
                  {proposta.url_formalizacao && proposta.status === 'aguardando_assinatura' && (
                    <a
                      href={`https://${proposta.url_formalizacao}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-primary text-xs font-medium hover:underline"
                    >
                      <ExternalLink size={12} />
                      Assinar
                    </a>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
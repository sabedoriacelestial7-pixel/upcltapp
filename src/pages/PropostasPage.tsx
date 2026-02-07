import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '@/components/PageTransition';
import { PullToRefresh } from '@/components/PullToRefresh';
import { Clock, CheckCircle, XCircle, RefreshCw, ExternalLink, ChevronRight, Users, User } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { listarPropostas, atualizarStatusPropostas, Proposta, getStatusInfo } from '@/services/contratacaoApi';
import { listarTodasPropostas } from '@/services/adminPropostasApi';
import { formatarMoeda, formatarData, formatarCPF } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { ProposalCardSkeleton } from '@/components/SkeletonLoaders';
import { EmptyState } from '@/components/EmptyState';
import { useAdminRole } from '@/hooks/useAdminRole';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export default function PropostasPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useApp();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'personal' | 'all'>('personal');

  const carregarPropostas = useCallback(async (atualizar = false) => {
    try {
      if (atualizar) {
        setRefreshing(true);
        const result = await atualizarStatusPropostas();
        if (!result.erro && result.propostas) {
          // Se for admin e estiver vendo todas, recarrega todas
          if (isAdmin && viewMode === 'all') {
            const allResult = await listarTodasPropostas();
            if (!allResult.erro && allResult.propostas) {
              setPropostas(allResult.propostas);
            }
          } else {
            setPropostas(result.propostas);
          }
        }
        toast.success('Lista atualizada!');
      } else {
        setLoading(true);
        
        if (isAdmin && viewMode === 'all') {
          const result = await listarTodasPropostas();
          if (result.erro) {
            setError(result.mensagem || 'Erro ao carregar propostas');
          } else {
            setPropostas(result.propostas || []);
          }
        } else {
          const result = await listarPropostas();
          if (result.erro) {
            setError(result.mensagem || 'Erro ao carregar propostas');
          } else {
            setPropostas(result.propostas || []);
          }
        }
      }
    } catch (err) {
      setError('Erro ao carregar propostas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin, viewMode]);

  // Pull-to-refresh handler
  const handlePullRefresh = useCallback(async () => {
    await carregarPropostas(true);
  }, [carregarPropostas]);

  useEffect(() => {
    if (isLoggedIn && !adminLoading) {
      carregarPropostas();
    }
  }, [isLoggedIn, adminLoading, viewMode, isAdmin]);

  const getStatusIcon = (status: string | null) => {
    if (!status) return <Clock className="text-muted-foreground" size={20} />;
    
    if (status.includes('EFETIVADA') || status.includes('PAGA') || status.includes('sucesso')) {
      return <CheckCircle className="text-green-500" size={20} />;
    }
    if (status.includes('CANCELADO') || status.includes('erro')) {
      return <XCircle className="text-red-500" size={20} />;
    }
    return <Clock className="text-blue-500" size={20} />;
  };

  if (loading || adminLoading) {
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

  // Admin Table View
  const AdminTableView = () => (
    <ScrollArea className="w-full whitespace-nowrap rounded-xl border bg-card shadow-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[150px]">Cliente</TableHead>
            <TableHead className="min-w-[120px]">CPF</TableHead>
            <TableHead className="min-w-[100px]">Banco</TableHead>
            <TableHead className="min-w-[110px] text-right">Valor</TableHead>
            <TableHead className="min-w-[130px] text-right">Parcela</TableHead>
            <TableHead className="min-w-[90px]">Data</TableHead>
            <TableHead className="min-w-[140px]">Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {propostas.map((proposta) => {
            const statusInfo = getStatusInfo(proposta.status_facta || proposta.status);
            
            return (
              <TableRow 
                key={proposta.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(`/propostas/${proposta.id}`)}
              >
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="truncate max-w-[140px]">{proposta.nome}</span>
                    {proposta.celular && (
                      <span className="text-xs text-muted-foreground">{proposta.celular}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm font-mono">
                  {formatarCPF(proposta.cpf)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {proposta.banco_nome}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold text-primary">
                  {formatarMoeda(proposta.valor_operacao)}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {proposta.parcelas}x {formatarMoeda(proposta.valor_parcela)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatarData(proposta.created_at)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(proposta.status_facta || proposta.status)}
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium truncate max-w-[100px]',
                      statusInfo.color.replace('bg-', 'bg-opacity-20 text-').replace('-500', '-700').replace('-600', '-700')
                    )}>
                      {statusInfo.label}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );

  // User Card View
  const UserCardView = () => (
    <div className="space-y-3">
      {propostas.map((proposta) => {
        const statusInfo = getStatusInfo(proposta.status_facta || proposta.status);
        
        return (
          <button
            key={proposta.id}
            className={cn(
              'w-full !bg-white rounded-xl p-4 text-left shadow-card',
              'hover:shadow-card-hover transition-all duration-200',
              'active:scale-[0.99] touch-manipulation'
            )}
            onClick={() => navigate(`/propostas/${proposta.id}`)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {getStatusIcon(proposta.status_facta || proposta.status)}
                <div>
                  <p className="text-sm font-semibold !text-gray-900">
                    {proposta.banco_nome}
                  </p>
                  <p className="text-xs !text-gray-500">
                    {formatarData(proposta.created_at)}
                  </p>
                </div>
              </div>
              <ChevronRight size={20} className="!text-gray-400" />
            </div>

            <div className="mt-3 pt-3 border-t !border-gray-200 grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs !text-gray-500">Valor</p>
                <p className="text-sm font-semibold !text-gray-900">
                  {formatarMoeda(proposta.valor_operacao)}
                </p>
              </div>
              <div>
                <p className="text-xs !text-gray-500">Parcelas</p>
                <p className="text-sm font-semibold !text-gray-900">
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
  );

  return (
    <PageTransition className="min-h-screen bg-background pb-24">
      <PullToRefresh 
        onRefresh={handlePullRefresh} 
        disabled={loading || adminLoading}
        className="min-h-screen"
      >
        <main className={cn(
          "px-4 pt-[calc(env(safe-area-inset-top)+1rem)]",
          isAdmin && viewMode === 'all' ? "max-w-4xl mx-auto" : "max-w-md mx-auto"
        )}>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Contratações
          </h1>
          <p className="text-muted-foreground text-sm">
            {isAdmin && viewMode === 'all' 
              ? 'Visualizando todas as operações do sistema.' 
              : 'Acompanhe o status de cada operação simulada.'
            }
          </p>
        </div>

        {/* Admin Toggle */}
        {isAdmin && (
          <div className="flex gap-2 mb-4">
            <Button
              variant={viewMode === 'personal' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('personal')}
              className="gap-2"
            >
              <User size={16} />
              Minhas
            </Button>
            <Button
              variant={viewMode === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('all')}
              className="gap-2"
            >
              <Users size={16} />
              Todas ({propostas.length})
            </Button>
          </div>
        )}

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
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-center mb-4">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {propostas.length === 0 && !error && (
          <EmptyState
            variant="proposals"
            title={isAdmin && viewMode === 'all' 
              ? "Nenhuma contratação no sistema" 
              : "Você não possui contratações"
            }
            description={isAdmin && viewMode === 'all'
              ? "Ainda não existem operações registradas."
              : "Que tal dar uma olhada nas oportunidades disponíveis para você?"
            }
            actionLabel={isAdmin && viewMode === 'all' ? undefined : "Ver oportunidades"}
            onAction={isAdmin && viewMode === 'all' ? undefined : () => navigate('/consulta')}
          />
        )}

        {/* Proposals list */}
        {propostas.length > 0 && (
          isAdmin && viewMode === 'all' ? <AdminTableView /> : <UserCardView />
        )}
        </main>
      </PullToRefresh>

      <BottomNav />
    </PageTransition>
  );
}

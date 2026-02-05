import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, XCircle, ExternalLink, RefreshCw, Building2, Calendar, Wallet, FileText } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { listarPropostas, consultarOcorrencias, Proposta, Ocorrencia, getStatusInfo } from '@/services/contratacaoApi';
import { formatarMoeda, formatarData, formatarCPF } from '@/utils/formatters';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PageTransition } from '@/components/PageTransition';

export default function PropostaDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [proposta, setProposta] = useState<Proposta | null>(null);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOcorrencias, setLoadingOcorrencias] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const result = await listarPropostas();
      if (!result.erro && result.propostas) {
        const found = result.propostas.find(p => p.id === id);
        if (found) {
          setProposta(found);
          
          // Load occurrences if has codigo_af
          if (found.codigo_af) {
            setLoadingOcorrencias(true);
            const ocResult = await consultarOcorrencias(found.codigo_af);
            if (!ocResult.erro && ocResult.ocorrencias) {
              setOcorrencias(ocResult.ocorrencias);
            }
            setLoadingOcorrencias(false);
          }
        }
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!proposta) {
    return (
      <PageTransition className="min-h-screen min-h-[100dvh] bg-background pb-20">
        <Header title="Proposta" showBack />
        <main className="max-w-md mx-auto px-5 py-5">
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground">Proposta não encontrada</p>
          </div>
        </main>
        <BottomNav />
      </PageTransition>
    );
  }

  const statusInfo = getStatusInfo(proposta.status_facta || proposta.status);

  return (
    <PageTransition className="min-h-screen min-h-[100dvh] bg-background pb-20">
      <Header title="Detalhes da Proposta" showBack />

      <main className="max-w-md mx-auto px-5 py-5 space-y-4">
        {/* Status Card */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <span className={`px-3 py-1.5 rounded-full text-xs font-medium text-white ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            {proposta.codigo_af && (
              <span className="text-xs text-muted-foreground">
                AF: {proposta.codigo_af}
              </span>
            )}
          </div>

          <h2 className="text-lg font-bold text-foreground mb-1">{proposta.banco_nome}</h2>
          <p className="text-sm text-muted-foreground">
            Criada em {formatarData(proposta.created_at)}
          </p>

          {proposta.url_formalizacao && proposta.status === 'aguardando_assinatura' && (
            <a
              href={`https://${proposta.url_formalizacao}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 w-full flex items-center justify-center gap-2 bg-[#22c55e] hover:bg-[#16a34a] text-white py-3 rounded-lg font-medium transition-colors"
            >
              <ExternalLink size={18} />
              Assinar Contrato
            </a>
          )}
        </div>

        {/* Valores */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-card">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Wallet size={16} className="text-primary" />
            Valores da Operação
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-muted-foreground">Valor Liberado</p>
              <p className="text-lg font-bold text-primary">
                {formatarMoeda(proposta.valor_operacao)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Parcelas</p>
              <p className="text-sm font-semibold text-foreground">
                {proposta.parcelas}x de {formatarMoeda(proposta.valor_parcela)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Total a Pagar</p>
              <p className="text-sm font-semibold text-foreground">
                {formatarMoeda(proposta.valor_parcela * proposta.parcelas)}
              </p>
            </div>
            {proposta.taxa_mensal && (
              <div>
                <p className="text-[10px] text-muted-foreground">Taxa Mensal</p>
                <p className="text-sm font-semibold text-foreground">
                  {proposta.taxa_mensal.toFixed(2)}%
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Dados do Cliente */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-card">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Building2 size={16} className="text-primary" />
            Dados do Cliente
          </h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nome</span>
              <span className="text-foreground">{proposta.nome}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CPF</span>
              <span className="text-foreground">{formatarCPF(proposta.cpf)}</span>
            </div>
            {proposta.celular && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Celular</span>
                <span className="text-foreground">{proposta.celular}</span>
              </div>
            )}
            {proposta.email && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="text-foreground text-right max-w-[60%] truncate">{proposta.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Histórico / Ocorrências */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-card">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <FileText size={16} className="text-primary" />
            Histórico
          </h3>

          {loadingOcorrencias ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          ) : ocorrencias.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              Nenhuma ocorrência registrada
            </p>
          ) : (
            <div className="space-y-3">
              {ocorrencias.map((oc, index) => (
                <div key={oc.item || index} className="border-l-2 border-primary/30 pl-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock size={12} />
                    {oc.data.split(' ')[0]} às {oc.hora}
                  </div>
                  <p className="text-sm font-medium text-foreground mt-1">
                    {oc.status}
                  </p>
                  {oc.obs && (
                    <p className="text-xs text-muted-foreground mt-0.5">{oc.obs}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </PageTransition>
  );
}

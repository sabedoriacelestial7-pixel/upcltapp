import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Calendar, CreditCard, User, Briefcase, DollarSign, RefreshCw } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/components/PageTransition';

interface MarginQueryData {
  id: string;
  cpf: string;
  nome_trabalhador: string | null;
  nome_empregador: string | null;
  valor_margem_disponivel: number | null;
  valor_base_margem: number | null;
  valor_total_vencimentos: number | null;
  data_admissao: string | null;
  elegivel: boolean | null;
  created_at: string;
}

function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  } catch {
    return 'N/A';
  }
}

function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'N/A';
  }
}

interface DataItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

function DataItem({ icon: Icon, label, value }: DataItemProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={18} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-medium text-foreground break-words">{value}</p>
      </div>
    </div>
  );
}

export default function DadosTrabalhistas() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<MarginQueryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data: queryData, error: queryError } = await supabase
        .from('margin_queries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (queryError) {
        if (queryError.code === 'PGRST116') {
          // No data found
          setData(null);
        } else {
          throw queryError;
        }
      } else {
        setData(queryData);
      }
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError('Não foi possível carregar seus dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  return (
    <PageTransition className="min-h-screen bg-[#f5f5f5] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate('/perfil')}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Dados Trabalhistas</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6">
        {loading ? (
          <div className="bg-white rounded-xl p-4 space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="w-9 h-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl p-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchData} variant="outline" size="sm">
              <RefreshCw size={16} className="mr-2" />
              Tentar novamente
            </Button>
          </div>
        ) : !data ? (
          <div className="bg-white rounded-xl p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Briefcase size={28} className="text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma consulta realizada
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Faça sua primeira consulta de margem para visualizar seus dados trabalhistas aqui.
            </p>
            <Button onClick={() => navigate('/consulta')} className="w-full">
              Fazer consulta
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Card Principal */}
            <div className="bg-white rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground">Dados do Trabalhador</h2>
                <span className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full",
                  data.elegivel 
                    ? "bg-green-100 text-green-700" 
                    : "bg-red-100 text-red-700"
                )}>
                  {data.elegivel ? 'Elegível' : 'Não elegível'}
                </span>
              </div>
              
              <DataItem 
                icon={User} 
                label="Nome Completo" 
                value={data.nome_trabalhador || 'N/A'} 
              />
              <DataItem 
                icon={CreditCard} 
                label="CPF" 
                value={formatCPF(data.cpf)} 
              />
              <DataItem 
                icon={Building2} 
                label="Empregador" 
                value={data.nome_empregador || 'N/A'} 
              />
              <DataItem 
                icon={Calendar} 
                label="Data de Admissão" 
                value={formatDate(data.data_admissao)} 
              />
            </div>

            {/* Card Financeiro */}
            <div className="bg-white rounded-xl p-4">
              <h2 className="text-sm font-semibold text-foreground mb-3">Dados Financeiros</h2>
              
              <DataItem 
                icon={DollarSign} 
                label="Margem Disponível" 
                value={formatCurrency(data.valor_margem_disponivel)} 
              />
              <DataItem 
                icon={DollarSign} 
                label="Base de Margem" 
                value={formatCurrency(data.valor_base_margem)} 
              />
              <DataItem 
                icon={DollarSign} 
                label="Total de Vencimentos" 
                value={formatCurrency(data.valor_total_vencimentos)} 
              />
            </div>

            {/* Última atualização */}
            <p className="text-xs text-center text-muted-foreground">
              Última consulta em {formatDateTime(data.created_at)}
            </p>

            {/* Botão atualizar */}
            <Button 
              onClick={() => navigate('/consulta')} 
              variant="outline" 
              className="w-full"
            >
              <RefreshCw size={16} className="mr-2" />
              Atualizar dados
            </Button>
          </div>
        )}
      </main>

      <BottomNav />
    </PageTransition>
  );
}

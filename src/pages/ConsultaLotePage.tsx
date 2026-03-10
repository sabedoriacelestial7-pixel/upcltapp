import { useState, useCallback } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, XCircle, Search, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';

interface ResultadoLote {
  cpf: string;
  status: 'elegivel' | 'inelegivel' | 'nao_encontrado' | 'erro';
  mensagem: string;
  dados: {
    nome: string;
    matricula: string;
    valorMargemDisponivel: number;
    valorBaseMargem: number;
    valorTotalVencimentos: number;
    nomeEmpregador: string;
    cnpjEmpregador: string;
    dataAdmissao: string;
    dataNascimento: string;
    elegivel: boolean;
  } | null;
}

interface Resumo {
  total: number;
  elegiveis: number;
  inelegiveis: number;
  naoEncontrados: number;
  erros: number;
}

function parseCpfsFromText(text: string): string[] {
  const cpfs: string[] = [];
  const lines = text.split(/[\r\n]+/).filter(l => l.trim());

  // Try to detect header row and CPF column index
  let cpfColIndex = -1;
  const firstLine = lines[0]?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';
  const firstParts = firstLine.split(/[;,\t]/);

  for (let i = 0; i < firstParts.length; i++) {
    const col = firstParts[i].trim();
    if (col === 'cpf' || col.startsWith('cpf') || col.includes('cpf')) {
      cpfColIndex = i;
      break;
    }
  }

  const startLine = cpfColIndex >= 0 ? 1 : 0; // skip header if found

  for (let li = startLine; li < lines.length; li++) {
    const line = lines[li];
    const parts = line.split(/[;,\t]/);

    // If we know the CPF column, use it; otherwise scan all columns
    const columnsToScan = cpfColIndex >= 0 ? [parts[cpfColIndex]] : parts;

    for (const part of columnsToScan) {
      if (!part) continue;
      const cleaned = part.trim().replace(/[\.\-\/\s]/g, '').replace(/\D/g, '');
      if (cleaned.length === 11) {
        cpfs.push(cleaned);
        break;
      }
      // Handle CPFs stored as numbers (may lose leading zeros)
      if (/^\d{9,11}$/.test(cleaned)) {
        const padded = cleaned.padStart(11, '0');
        if (padded.length === 11) {
          cpfs.push(padded);
          break;
        }
      }
    }
  }

  // Also extract CPFs from free text (regex pattern for formatted CPFs)
  if (cpfs.length === 0) {
    const allText = text.replace(/[\r\n]+/g, ' ');
    const cpfPattern = /\d{3}[\.\s]?\d{3}[\.\s]?\d{3}[\-\s]?\d{2}/g;
    const matches = allText.match(cpfPattern) || [];
    for (const m of matches) {
      const cleaned = m.replace(/\D/g, '');
      if (cleaned.length === 11) cpfs.push(cleaned);
    }
    // Also try raw 11-digit sequences
    const rawPattern = /\b\d{11}\b/g;
    const rawMatches = allText.match(rawPattern) || [];
    for (const m of rawMatches) cpfs.push(m);
  }

  return [...new Set(cpfs)];
}

function formatCpf(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function exportCsv(resultados: ResultadoLote[]) {
  const headers = ['CPF', 'Status', 'Nome', 'Empregador', 'CNPJ Empregador', 'Margem Disponível', 'Base Margem', 'Total Vencimentos', 'Data Admissão', 'Data Nascimento', 'Matrícula', 'Mensagem'];
  const rows = resultados.map(r => [
    formatCpf(r.cpf),
    r.status,
    r.dados?.nome || '',
    r.dados?.nomeEmpregador || '',
    r.dados?.cnpjEmpregador || '',
    r.dados?.valorMargemDisponivel?.toString().replace('.', ',') || '',
    r.dados?.valorBaseMargem?.toString().replace('.', ',') || '',
    r.dados?.valorTotalVencimentos?.toString().replace('.', ',') || '',
    r.dados?.dataAdmissao || '',
    r.dados?.dataNascimento || '',
    r.dados?.matricula || '',
    r.mensagem
  ]);

  const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `consulta-lote-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

const statusConfig = {
  elegivel: { label: 'Elegível', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle2 },
  inelegivel: { label: 'Inelegível', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', icon: XCircle },
  nao_encontrado: { label: 'Não encontrado', color: 'bg-muted text-muted-foreground', icon: AlertCircle },
  erro: { label: 'Erro', color: 'bg-destructive/10 text-destructive', icon: AlertCircle },
};

export default function ConsultaLotePage() {
  const [cpfs, setCpfs] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState<ResultadoLote[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [progress, setProgress] = useState(0);
  const [textInput, setTextInput] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadCpfs = useCallback((parsed: string[], source: string) => {
    if (parsed.length === 0) {
      toast({ title: 'Nenhum CPF encontrado', description: 'Nenhum CPF válido (11 dígitos) foi detectado.', variant: 'destructive' });
      return;
    }
    if (parsed.length > 500) {
      toast({ title: 'Limite excedido', description: 'Máximo de 500 CPFs por lote.', variant: 'destructive' });
      return;
    }
    setCpfs(parsed);
    setResultados([]);
    setResumo(null);
    toast({ title: `${parsed.length} CPFs carregados`, description: source });
  }, [toast]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCpfsFromText(text);
      loadCpfs(parsed, `Arquivo: ${file.name}`);
      setFileName(file.name);
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [loadCpfs]);

  const handleTextSubmit = useCallback(() => {
    if (!textInput.trim()) return;
    const parsed = parseCpfsFromText(textInput);
    loadCpfs(parsed, 'Colado manualmente');
    setFileName('');
  }, [textInput, loadCpfs]);

  const handleConsultar = async () => {
    if (cpfs.length === 0) return;
    setLoading(true);
    setProgress(10);
    setResultados([]);
    setResumo(null);

    try {
      // Split into batches of 50 to avoid timeout
      const BATCH_SIZE = 50;
      const allResults: ResultadoLote[] = [];

      for (let i = 0; i < cpfs.length; i += BATCH_SIZE) {
        const batch = cpfs.slice(i, i + BATCH_SIZE);
        setProgress(Math.round(((i + batch.length) / cpfs.length) * 90) + 10);

        const { data, error } = await supabase.functions.invoke('consulta-lote', {
          body: { cpfs: batch }
        });

        if (error) throw error;
        if (data.erro) throw new Error(data.mensagem);

        allResults.push(...data.resultados);
      }

      setResultados(allResults);
      setResumo({
        total: allResults.length,
        elegiveis: allResults.filter(r => r.status === 'elegivel').length,
        inelegiveis: allResults.filter(r => r.status === 'inelegivel').length,
        naoEncontrados: allResults.filter(r => r.status === 'nao_encontrado').length,
        erros: allResults.filter(r => r.status === 'erro').length,
      });
      setProgress(100);
      toast({ title: 'Consulta concluída!', description: `${allResults.length} CPFs processados.` });
    } catch (err: any) {
      toast({ title: 'Erro na consulta', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background">
      <Header />
      <main className="container max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Back */}
        <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm">
          <ArrowLeft size={16} /> Voltar
        </button>

        <div>
          <h1 className="text-2xl font-bold text-foreground">Consulta em Lote</h1>
          <p className="text-muted-foreground">Upload de CSV ou cole CPFs para consulta na base offline Facta</p>
        </div>

        {/* Upload Area */}
        <Card>
          <CardContent className="pt-6">
            <label
              htmlFor="csv-upload"
              className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
            >
              <Upload className="h-10 w-10 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium text-foreground">
                  {fileName || 'Clique para enviar arquivo CSV'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  CSV ou TXT — aceita CPFs com pontos/traços (até 500)
                </p>
              </div>
              {cpfs.length > 0 && (
                <Badge variant="secondary" className="mt-2">
                  <FileSpreadsheet size={14} className="mr-1" />
                  {cpfs.length} CPFs prontos
                </Badge>
              )}
              <input
                id="csv-upload"
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>

            <div className="mt-4">
              <p className="text-sm font-medium text-foreground mb-2">Ou cole os CPFs aqui:</p>
              <textarea
                className="w-full h-28 rounded-lg border border-border bg-background p-3 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder={"021.669.719-03\n238.871.388-99\n12345678901\n..."}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
              <Button variant="secondary" size="sm" className="mt-2" onClick={handleTextSubmit} disabled={!textInput.trim()}>
                Carregar CPFs do texto
              </Button>
            </div>

            {cpfs.length > 0 && (
              <div className="mt-4 flex gap-3">
                <Button
                  onClick={handleConsultar}
                  disabled={loading}
                  className="flex-1"
                  size="lg"
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Consultando...</>
                  ) : (
                    <><Search className="mr-2 h-4 w-4" /> Consultar {cpfs.length} CPFs</>
                  )}
                </Button>
              </div>
            )}

            {loading && (
              <div className="mt-4 space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">{progress}% concluído</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        {resumo && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{resumo.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{resumo.elegiveis}</p>
                <p className="text-xs text-muted-foreground">Elegíveis</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">{resumo.inelegiveis}</p>
                <p className="text-xs text-muted-foreground">Inelegíveis</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-muted-foreground">{resumo.naoEncontrados}</p>
                <p className="text-xs text-muted-foreground">Não encontrados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-destructive">{resumo.erros}</p>
                <p className="text-xs text-muted-foreground">Erros</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Export */}
        {resultados.length > 0 && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => exportCsv(resultados)}>
              <Download className="mr-2 h-4 w-4" /> Exportar CSV
            </Button>
          </div>
        )}

        {/* Results Table */}
        {resultados.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resultados</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-3 font-medium">CPF</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Nome</th>
                      <th className="text-left p-3 font-medium">Empregador</th>
                      <th className="text-right p-3 font-medium">Margem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultados.map((r, i) => {
                      const config = statusConfig[r.status];
                      const Icon = config.icon;
                      return (
                        <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="p-3 font-mono text-xs">{formatCpf(r.cpf)}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${config.color}`}>
                              <Icon size={12} />
                              {config.label}
                            </span>
                          </td>
                          <td className="p-3 truncate max-w-[200px]">{r.dados?.nome || '-'}</td>
                          <td className="p-3 truncate max-w-[200px]">{r.dados?.nomeEmpregador || '-'}</td>
                          <td className="p-3 text-right font-medium">
                            {r.dados?.valorMargemDisponivel ? formatCurrency(r.dados.valorMargemDisponivel) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

import { useState, useCallback, useMemo } from 'react';
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
  telefone?: string;
  dados: {
    nome: string;
    matricula: string;
    valorMargemDisponivel: number;
    valorBaseMargem: number;
    valorTotalVencimentos: number;
    valorLiberado: number;
    valorParcela: number;
    parcelas: number;
    codigoTabela: number | null;
    coeficiente: string | null;
    nomeTabela: string | null;
    nomeEmpregador: string;
    cnpjEmpregador: string;
    dataAdmissao: string;
    dataNascimento: string;
    elegivel: boolean;
    simulacaoReal: boolean;
  } | null;
}

interface Resumo {
  total: number;
  elegiveis: number;
  inelegiveis: number;
  naoEncontrados: number;
  erros: number;
}

interface ParsedCpfEntry {
  cpf: string;
  telefone?: string;
}

function parseCpfsFromText(text: string): ParsedCpfEntry[] {
  const entries: ParsedCpfEntry[] = [];
  const seenCpfs = new Set<string>();
  const lines = text.split(/[\r\n]+/).filter(l => l.trim());

  // Try to detect header row and column indices
  let cpfColIndex = -1;
  let telColIndex = -1;
  const firstLine = lines[0]?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';
  const firstParts = firstLine.split(/[;,\t]/);

  for (let i = 0; i < firstParts.length; i++) {
    const col = firstParts[i].trim();
    if (cpfColIndex === -1 && (col === 'cpf' || col.startsWith('cpf') || col.includes('cpf'))) {
      cpfColIndex = i;
    }
    if (telColIndex === -1 && (col.includes('telefone') || col.includes('celular') || col.includes('fone') || col.includes('tel'))) {
      telColIndex = i;
    }
  }

  const startLine = cpfColIndex >= 0 ? 1 : 0; // skip header if found

  for (let li = startLine; li < lines.length; li++) {
    const line = lines[li];
    const parts = line.split(/[;,\t]/);

    let foundCpf: string | null = null;

    // If we know the CPF column, use it; otherwise scan all columns
    const columnsToScan = cpfColIndex >= 0 ? [parts[cpfColIndex]] : parts;

    for (const part of columnsToScan) {
      if (!part) continue;
      const cleaned = part.trim().replace(/[\.\-\/\s]/g, '').replace(/\D/g, '');
      if (cleaned.length === 11) {
        foundCpf = cleaned;
        break;
      }
      if (/^\d{9,11}$/.test(cleaned)) {
        const padded = cleaned.padStart(11, '0');
        if (padded.length === 11) {
          foundCpf = padded;
          break;
        }
      }
    }

    if (foundCpf && !seenCpfs.has(foundCpf)) {
      seenCpfs.add(foundCpf);
      const telefone = telColIndex >= 0 ? parts[telColIndex]?.trim() || undefined : undefined;
      entries.push({ cpf: foundCpf, telefone });
    }
  }

  // Fallback: extract CPFs from free text
  if (entries.length === 0) {
    const allText = text.replace(/[\r\n]+/g, ' ');
    const cpfPattern = /\d{3}[\.\s]?\d{3}[\.\s]?\d{3}[\-\s]?\d{2}/g;
    const matches = allText.match(cpfPattern) || [];
    for (const m of matches) {
      const cleaned = m.replace(/\D/g, '');
      if (cleaned.length === 11 && !seenCpfs.has(cleaned)) {
        seenCpfs.add(cleaned);
        entries.push({ cpf: cleaned });
      }
    }
    const rawPattern = /\b\d{11}\b/g;
    const rawMatches = allText.match(rawPattern) || [];
    for (const m of rawMatches) {
      if (!seenCpfs.has(m)) {
        seenCpfs.add(m);
        entries.push({ cpf: m });
      }
    }
  }

  return entries;
}

function formatCpf(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function exportCsv(resultados: ResultadoLote[]) {
  const headers = ['CPF', 'Status', 'Nome', 'Empregador', 'CNPJ Empregador', 'Parcela Máx', 'Valor Liberado', 'Parcelas', 'Tabela', 'Simulação Real', 'Base Margem', 'Total Vencimentos', 'Data Admissão', 'Data Nascimento', 'Matrícula', 'Telefone', 'Mensagem'];
  const rows = resultados.map(r => [
    formatCpf(r.cpf),
    r.status,
    r.dados?.nome || '',
    r.dados?.nomeEmpregador || '',
    r.dados?.cnpjEmpregador || '',
    r.dados?.valorParcela?.toFixed(2).replace('.', ',') || '',
    r.dados?.valorLiberado?.toFixed(2).replace('.', ',') || '',
    r.dados?.parcelas?.toString() || '',
    r.dados?.nomeTabela || '',
    r.dados?.simulacaoReal ? 'Sim' : 'Estimativa',
    r.dados?.valorBaseMargem?.toFixed(2).replace('.', ',') || '',
    r.dados?.valorTotalVencimentos?.toFixed(2).replace('.', ',') || '',
    r.dados?.dataAdmissao || '',
    r.dados?.dataNascimento || '',
    r.dados?.matricula || '',
    r.telefone || '',
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
  const [entries, setEntries] = useState<ParsedCpfEntry[]>([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState<ResultadoLote[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [progress, setProgress] = useState(0);
  const [textInput, setTextInput] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const { toast } = useToast();
  const navigate = useNavigate();

  const cpfs = useMemo(() => entries.map(e => e.cpf), [entries]);
  const telefoneMap = useMemo(() => {
    const map = new Map<string, string>();
    entries.forEach(e => { if (e.telefone) map.set(e.cpf, e.telefone); });
    return map;
  }, [entries]);

  const resultadosFiltrados = useMemo(() => {
    if (filtroStatus === 'todos') return resultados;
    return resultados.filter(r => r.status === filtroStatus);
  }, [resultados, filtroStatus]);

  const loadEntries = useCallback((parsed: ParsedCpfEntry[], source: string) => {
    if (parsed.length === 0) {
      toast({ title: 'Nenhum CPF encontrado', description: 'Nenhum CPF válido (11 dígitos) foi detectado.', variant: 'destructive' });
      return;
    }
    if (parsed.length > 500) {
      toast({ title: 'Limite excedido', description: 'Máximo de 500 CPFs por lote.', variant: 'destructive' });
      return;
    }
    setEntries(parsed);
    setResultados([]);
    setResumo(null);
    const telCount = parsed.filter(p => p.telefone).length;
    const desc = telCount > 0 ? `${source} (${telCount} telefones detectados)` : source;
    toast({ title: `${parsed.length} CPFs carregados`, description: desc });
  }, [toast]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCpfsFromText(text);
      loadEntries(parsed, `Arquivo: ${file.name}`);
      setFileName(file.name);
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [loadEntries]);

  const handleTextSubmit = useCallback(() => {
    if (!textInput.trim()) return;
    const parsed = parseCpfsFromText(textInput);
    loadEntries(parsed, 'Colado manualmente');
    setFileName('');
  }, [textInput, loadEntries]);

  const resultadosRef = useCallback((node: HTMLDivElement | null) => {
    if (node && resultados.length > 0 && !loading) {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [resultados.length, loading]);

  const handleConsultar = async () => {
    if (cpfs.length === 0) return;
    setLoading(true);
    setProgress(10);
    setResultados([]);
    setResumo(null);

    try {
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

        // Pre-fill telefone from uploaded data
        const resultsWithTel = (data.resultados as ResultadoLote[]).map(r => ({
          ...r,
          telefone: r.telefone || telefoneMap.get(r.cpf) || ''
        }));
        allResults.push(...resultsWithTel);
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
          <div ref={resultadosRef} className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className={`cursor-pointer transition-all ${filtroStatus === 'todos' ? 'ring-2 ring-primary' : ''}`} onClick={() => setFiltroStatus('todos')}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{resumo.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            <Card className={`cursor-pointer transition-all ${filtroStatus === 'elegivel' ? 'ring-2 ring-primary' : ''}`} onClick={() => setFiltroStatus('elegivel')}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{resumo.elegiveis}</p>
                <p className="text-xs text-muted-foreground">Elegíveis</p>
              </CardContent>
            </Card>
            <Card className={`cursor-pointer transition-all ${filtroStatus === 'inelegivel' ? 'ring-2 ring-primary' : ''}`} onClick={() => setFiltroStatus('inelegivel')}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">{resumo.inelegiveis}</p>
                <p className="text-xs text-muted-foreground">Inelegíveis</p>
              </CardContent>
            </Card>
            <Card className={`cursor-pointer transition-all ${filtroStatus === 'nao_encontrado' ? 'ring-2 ring-primary' : ''}`} onClick={() => setFiltroStatus('nao_encontrado')}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-muted-foreground">{resumo.naoEncontrados}</p>
                <p className="text-xs text-muted-foreground">Não encontrados</p>
              </CardContent>
            </Card>
            <Card className={`cursor-pointer transition-all ${filtroStatus === 'erro' ? 'ring-2 ring-primary' : ''}`} onClick={() => setFiltroStatus('erro')}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-destructive">{resumo.erros}</p>
                <p className="text-xs text-muted-foreground">Erros</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Export */}
        {resultados.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {resultadosFiltrados.length} de {resultados.length} resultados
              {filtroStatus !== 'todos' && (
                <button onClick={() => setFiltroStatus('todos')} className="ml-2 text-primary underline">Limpar filtro</button>
              )}
            </p>
            <Button variant="outline" onClick={() => exportCsv(resultados)}>
              <Download className="mr-2 h-4 w-4" /> Exportar CSV
            </Button>
          </div>
        )}

        {/* Results Table */}
        {resultadosFiltrados.length > 0 && (
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
                      <th className="text-right p-3 font-medium">Margem (Parcela)</th>
                      <th className="text-right p-3 font-medium">Valor Liberado</th>
                      <th className="text-center p-3 font-medium">Parcelas</th>
                      <th className="text-left p-3 font-medium">Telefone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultadosFiltrados.map((r, i) => {
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
                            {r.dados?.valorParcela ? formatCurrency(r.dados.valorParcela) : '-'}
                          </td>
                          <td className="p-3 text-right font-medium text-primary">
                            <div className="flex flex-col items-end">
                              <span>{r.dados?.valorLiberado ? formatCurrency(r.dados.valorLiberado) : '-'}</span>
                              {r.dados?.simulacaoReal && (
                                <span className="text-[10px] text-green-600 font-normal">✓ Real</span>
                              )}
                              {r.dados && !r.dados.simulacaoReal && r.dados.valorLiberado > 0 && (
                                <span className="text-[10px] text-muted-foreground font-normal">≈ Estimativa</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center text-muted-foreground">
                            {r.dados?.parcelas ? `${r.dados.parcelas}x` : '-'}
                          </td>
                          <td className="p-3">
                            <input
                              type="tel"
                              className="w-[130px] rounded border border-border bg-background px-2 py-1 text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                              placeholder="(00) 00000-0000"
                              value={r.telefone || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                const originalIdx = resultados.indexOf(r);
                                setResultados(prev => prev.map((item, idx) =>
                                  idx === originalIdx ? { ...item, telefone: val } : item
                                ));
                              }}
                            />
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

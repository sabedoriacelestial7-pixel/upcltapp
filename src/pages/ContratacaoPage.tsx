import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, MapPin, CreditCard, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { realizarContratacao, DadosPessoaisContratacao } from '@/services/contratacaoApi';
import { BancoCalculado } from '@/utils/calculos';
import { formatarMoeda } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';
import { buscarCidadesPorEstado, CidadeIBGE } from '@/services/ibgeApi';

interface LocationState {
  banco: BancoCalculado;
  codigoTabela?: number;
  coeficiente?: string;
}

const ESTADOS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const ESTADO_CIVIL_OPTIONS = [
  { value: '1', label: 'Solteiro(a)' },
  { value: '2', label: 'Casado(a)' },
  { value: '3', label: 'Divorciado(a)' },
  { value: '4', label: 'Viúvo(a)' },
  { value: '5', label: 'União Estável' },
];

const TIPO_CONTA_OPTIONS = [
  { value: 'C', label: 'Conta Corrente' },
  { value: 'P', label: 'Conta Poupança' },
];

const TIPO_CHAVE_PIX_OPTIONS = [
  { value: '1', label: 'CPF' },
  { value: '2', label: 'CNPJ' },
  { value: '3', label: 'E-mail' },
  { value: '4', label: 'Telefone' },
  { value: '5', label: 'Chave Aleatória' },
];

export default function ContratacaoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { consulta, usuario } = useApp();
  const { toast } = useToast();
  
  const state = location.state as LocationState | null;
  const banco = state?.banco;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cidadesNaturais, setCidadesNaturais] = useState<CidadeIBGE[]>([]);
  const [cidadesEndereco, setCidadesEndereco] = useState<CidadeIBGE[]>([]);
  const [loadingCidades, setLoadingCidades] = useState(false);
  const [loadingCidadesEndereco, setLoadingCidadesEndereco] = useState(false);
  const [propostaUrl, setPropostaUrl] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    // Dados pessoais
    sexo: '',
    estadoCivil: '',
    rg: '',
    estadoRg: '',
    orgaoEmissor: '',
    dataExpedicao: '',
    estadoNatural: '',
    cidadeNatural: '',
    celular: usuario?.telefone || '',
    email: usuario?.email || '',
    
    // Endereço
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '', // Código IBGE da cidade
    estado: '',
    
    // Filiação
    nomeMae: '',
    nomePai: '',
    
    // Bancários
    tipoConta: 'C',
    banco: '',
    agencia: '',
    conta: '',
    tipoChavePix: '1',
    chavePix: '',
    
    // Envio
    tipoEnvio: 'whatsapp' as 'sms' | 'whatsapp',
  });

  useEffect(() => {
    if (!consulta || !banco) {
      navigate('/resultado');
    }
  }, [consulta, banco, navigate]);

  // Auto-fill PIX with CPF if type is CPF
  useEffect(() => {
    if (formData.tipoChavePix === '1' && consulta?.cpf) {
      setFormData(prev => ({ ...prev, chavePix: consulta.cpf }));
    }
  }, [formData.tipoChavePix, consulta?.cpf]);

  // Carregar cidades quando estado natural mudar
  useEffect(() => {
    if (formData.estadoNatural) {
      setLoadingCidades(true);
      buscarCidadesPorEstado(formData.estadoNatural)
        .then(cidades => {
          setCidadesNaturais(cidades);
          // Limpa cidade se não existir na nova lista
          if (formData.cidadeNatural && !cidades.some(c => c.id.toString() === formData.cidadeNatural)) {
            setFormData(prev => ({ ...prev, cidadeNatural: '' }));
          }
        })
        .finally(() => setLoadingCidades(false));
    } else {
      setCidadesNaturais([]);
    }
  }, [formData.estadoNatural]);

  // Carregar cidades quando estado do endereço mudar
  useEffect(() => {
    if (formData.estado) {
      setLoadingCidadesEndereco(true);
      buscarCidadesPorEstado(formData.estado)
        .then(cidades => {
          setCidadesEndereco(cidades);
          // Limpa cidade se não existir na nova lista
          if (formData.cidade && !cidades.some(c => c.id.toString() === formData.cidade)) {
            setFormData(prev => ({ ...prev, cidade: '' }));
          }
        })
        .finally(() => setLoadingCidadesEndereco(false));
    } else {
      setCidadesEndereco([]);
    }
  }, [formData.estado]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCepBlur = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        const uf = data.uf || '';
        const nomeCidade = data.localidade || '';
        
        // Atualiza o formulário com dados do CEP
        setFormData(prev => ({
          ...prev,
          endereco: data.logradouro || '',
          bairro: data.bairro || '',
          estado: uf,
          cidade: '', // Será preenchido após carregar cidades
        }));
        
        // Busca as cidades do estado e encontra o código IBGE
        if (uf && nomeCidade) {
          const cidades = await buscarCidadesPorEstado(uf);
          setCidadesEndereco(cidades);
          
          const cidadeNormalizada = nomeCidade
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
          
          const cidadeEncontrada = cidades.find(c => 
            c.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === cidadeNormalizada
          );
          
          if (cidadeEncontrada) {
            setFormData(prev => ({
              ...prev,
              cidade: cidadeEncontrada.id.toString()
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching CEP:', error);
    }
  };

  const validateStep1 = () => {
    const required = ['sexo', 'estadoCivil', 'rg', 'estadoRg', 'orgaoEmissor', 'dataExpedicao', 'estadoNatural', 'cidadeNatural', 'celular', 'email'];
    return required.every(field => formData[field as keyof typeof formData]);
  };

  const validateStep2 = () => {
    const required = ['cep', 'endereco', 'numero', 'bairro', 'cidade', 'estado', 'nomeMae'];
    return required.every(field => formData[field as keyof typeof formData]);
  };

  const validateStep3 = () => {
    const required = ['tipoConta', 'tipoChavePix', 'chavePix'];
    return required.every(field => formData[field as keyof typeof formData]);
  };

  const handleSubmit = async () => {
    if (!consulta || !banco) return;

    setLoading(true);

    try {
      // Format date from consulta
      const formatDate = (dateStr: string) => {
        if (dateStr.includes('/')) return dateStr;
        const date = new Date(dateStr);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      };

      const dados: DadosPessoaisContratacao = {
        cpf: consulta.cpf.replace(/\D/g, ''),
        dataNascimento: formatDate(consulta.dataNascimento),
        valorRenda: consulta.valorTotalVencimentos,
        matricula: consulta.matricula || '0',
        cnpjEmpregador: '',
        dataAdmissao: consulta.dataAdmissao ? formatDate(consulta.dataAdmissao) : undefined,
        
        codigoTabela: state?.codigoTabela || 112726, // Default table
        prazo: banco.parcelas,
        valorOperacao: banco.valorLiberado,
        valorParcela: banco.valorParcela,
        coeficiente: state?.coeficiente || '0.077260',
        bancoId: banco.id,
        bancoNome: banco.nome,
        
        nome: consulta.nome,
        sexo: formData.sexo,
        estadoCivil: formData.estadoCivil,
        rg: formData.rg,
        estadoRg: formData.estadoRg,
        orgaoEmissor: formData.orgaoEmissor,
        dataExpedicao: formData.dataExpedicao,
        estadoNatural: formData.estadoNatural,
        cidadeNatural: formData.cidadeNatural,
        cidadeNaturalNome: cidadesNaturais.find(c => c.id.toString() === formData.cidadeNatural)?.nome || '',
        celular: formData.celular,
        email: formData.email,
        
        cep: formData.cep.replace(/\D/g, ''),
        endereco: formData.endereco,
        numero: formData.numero,
        complemento: formData.complemento || undefined,
        bairro: formData.bairro,
        cidade: formData.cidade,
        cidadeNome: cidadesEndereco.find(c => c.id.toString() === formData.cidade)?.nome || '',
        estado: formData.estado,
        
        nomeMae: formData.nomeMae,
        nomePai: formData.nomePai || undefined,
        
        tipoConta: formData.tipoConta,
        banco: formData.banco || undefined,
        agencia: formData.agencia || undefined,
        conta: formData.conta || undefined,
        tipoChavePix: formData.tipoChavePix,
        chavePix: formData.chavePix,
        
        tipoEnvio: formData.tipoEnvio,
      };

      const result = await realizarContratacao(dados);

      if (result.erro) {
        toast({
          title: 'Erro na contratação',
          description: result.mensagem,
          variant: 'destructive',
        });
      } else {
        setSuccess(true);
        setPropostaUrl(result.proposta?.urlFormalizacao || null);
        toast({
          title: 'Proposta criada!',
          description: 'Link de assinatura enviado para seu celular.',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao processar contratação. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!consulta || !banco) return null;

  if (success) {
    return (
      <div className="min-h-screen min-h-[100dvh] gradient-primary">
        <Header title="Contratação" showBack />
        
        <main className="max-w-md mx-auto px-5 py-8">
          <div className="bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-2xl p-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-white/20 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle size={32} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Proposta Criada!</h2>
            <p className="text-white/80 text-sm mb-4">
              Enviamos o link de assinatura para o seu {formData.tipoEnvio === 'whatsapp' ? 'WhatsApp' : 'SMS'}.
            </p>
            
            {propostaUrl && (
              <a
                href={`https://${propostaUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-white text-[#22c55e] font-semibold py-3 px-6 rounded-lg mb-4 hover:bg-white/90 transition-colors"
              >
                Assinar Agora
              </a>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <Button
              onClick={() => navigate('/propostas')}
              className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
            >
              Ver Minhas Propostas
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="w-full text-white/60"
            >
              Voltar ao Início
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] gradient-primary pb-8">
      <Header title="Contratação" showBack />

      <main className="max-w-md mx-auto px-5 py-5 space-y-4">
        {/* Resumo da operação */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
              <img src={banco.logo} alt={banco.nome} className="w-6 h-6 object-contain" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{banco.nome}</p>
              <p className="text-xs text-muted-foreground">{banco.parcelas}x de {formatarMoeda(banco.valorParcela)}</p>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-white/10">
            <span className="text-sm text-white/60">Valor a receber</span>
            <span className="text-lg font-bold text-[#22c55e]">{formatarMoeda(banco.valorLiberado)}</span>
          </div>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                step >= s ? 'bg-[#22c55e] text-white' : 'bg-white/10 text-white/50'
              }`}>
                {s}
              </div>
              {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-[#22c55e]' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Dados Pessoais */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <User size={18} className="text-[#22c55e]" />
              Dados Pessoais
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-white/60">Sexo *</Label>
                <Select value={formData.sexo} onValueChange={(v) => handleChange('sexo', v)}>
                  <SelectTrigger className="bg-white border-gray-300 text-black">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300 z-[100]">
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-white/60">Estado Civil *</Label>
                <Select value={formData.estadoCivil} onValueChange={(v) => handleChange('estadoCivil', v)}>
                  <SelectTrigger className="bg-white border-gray-300 text-black">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300 z-[100]">
                    {ESTADO_CIVIL_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-white/60">RG *</Label>
                <Input
                  value={formData.rg}
                  onChange={(e) => handleChange('rg', e.target.value)}
                  className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                  placeholder="Número do RG"
                />
              </div>

              <div>
                <Label className="text-xs text-white/60">Estado do RG *</Label>
                <Select value={formData.estadoRg} onValueChange={(v) => handleChange('estadoRg', v)}>
                  <SelectTrigger className="bg-white border-gray-300 text-black">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300 z-[100]">
                    {ESTADOS.map(uf => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-white/60">Órgão Emissor *</Label>
                <Input
                  value={formData.orgaoEmissor}
                  onChange={(e) => handleChange('orgaoEmissor', e.target.value.toUpperCase())}
                  className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                  placeholder="SSP, DETRAN..."
                  maxLength={10}
                />
              </div>

              <div>
                <Label className="text-xs text-white/60">Data Expedição *</Label>
                <Input
                  value={formData.dataExpedicao}
                  onChange={(e) => handleChange('dataExpedicao', e.target.value)}
                  className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                  placeholder="DD/MM/AAAA"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-white/60">Estado Natural *</Label>
                <Select value={formData.estadoNatural} onValueChange={(v) => handleChange('estadoNatural', v)}>
                  <SelectTrigger className="bg-white border-gray-300 text-black">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300 z-[100]">
                    {ESTADOS.map(uf => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-white/60">Cidade Natural *</Label>
                <Select 
                  value={formData.cidadeNatural} 
                  onValueChange={(v) => handleChange('cidadeNatural', v)}
                  disabled={!formData.estadoNatural || loadingCidades}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-black">
                    <SelectValue placeholder={loadingCidades ? "Carregando..." : "Selecione"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300 z-[100] max-h-60">
                    {cidadesNaturais.map(cidade => (
                      <SelectItem key={cidade.id} value={cidade.id.toString()}>{cidade.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs text-white/60">Celular *</Label>
              <Input
                value={formData.celular}
                onChange={(e) => handleChange('celular', e.target.value)}
                className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <Label className="text-xs text-white/60">E-mail *</Label>
              <Input
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                placeholder="seu@email.com"
                type="email"
              />
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!validateStep1()}
              className="w-full bg-[#22c55e] hover:bg-[#16a34a] h-12"
            >
              Continuar
            </Button>
          </div>
        )}

        {/* Step 2: Endereço */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <MapPin size={18} className="text-[#22c55e]" />
              Endereço
            </h3>

            <div>
              <Label className="text-xs text-white/60">CEP *</Label>
              <Input
                value={formData.cep}
                onChange={(e) => handleChange('cep', e.target.value)}
                onBlur={handleCepBlur}
                className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                placeholder="00000-000"
                maxLength={9}
              />
            </div>

            <div>
              <Label className="text-xs text-white/60">Endereço *</Label>
              <Input
                value={formData.endereco}
                onChange={(e) => handleChange('endereco', e.target.value)}
                className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                placeholder="Rua, Avenida..."
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-white/60">Número *</Label>
                <Input
                  value={formData.numero}
                  onChange={(e) => handleChange('numero', e.target.value)}
                  className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                  placeholder="Nº"
                />
              </div>

              <div className="col-span-2">
                <Label className="text-xs text-white/60">Complemento</Label>
                <Input
                  value={formData.complemento}
                  onChange={(e) => handleChange('complemento', e.target.value)}
                  className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                  placeholder="Apto, Bloco..."
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-white/60">Bairro *</Label>
              <Input
                value={formData.bairro}
                onChange={(e) => handleChange('bairro', e.target.value)}
                className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                placeholder="Bairro"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-white/60">Estado *</Label>
                <Select value={formData.estado} onValueChange={(v) => handleChange('estado', v)}>
                  <SelectTrigger className="bg-white border-gray-300 text-black">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300 z-[100]">
                    {ESTADOS.map(uf => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label className="text-xs text-white/60">Cidade *</Label>
                <Select 
                  value={formData.cidade} 
                  onValueChange={(v) => handleChange('cidade', v)}
                  disabled={!formData.estado || loadingCidadesEndereco}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-black">
                    <SelectValue placeholder={loadingCidadesEndereco ? "Carregando..." : "Selecione"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300 z-[100] max-h-60">
                    {cidadesEndereco.map(cidade => (
                      <SelectItem key={cidade.id} value={cidade.id.toString()}>{cidade.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs text-white/60">Nome da Mãe *</Label>
              <Input
                value={formData.nomeMae}
                onChange={(e) => handleChange('nomeMae', e.target.value.toUpperCase())}
                className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                placeholder="Nome completo da mãe"
              />
            </div>

            <div>
              <Label className="text-xs text-white/60">Nome do Pai</Label>
              <Input
                value={formData.nomePai}
                onChange={(e) => handleChange('nomePai', e.target.value.toUpperCase())}
                className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                placeholder="Nome completo do pai (opcional)"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1 border-white/20"
              >
                Voltar
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!validateStep2()}
                className="flex-1 bg-[#22c55e] hover:bg-[#16a34a]"
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Dados Bancários e Confirmação */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <CreditCard size={18} className="text-[#22c55e]" />
              Dados para Pagamento (PIX)
            </h3>

            <div>
              <Label className="text-xs text-white/60">Tipo de Conta *</Label>
              <Select value={formData.tipoConta} onValueChange={(v) => handleChange('tipoConta', v)}>
                <SelectTrigger className="bg-white border-gray-300 text-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-300 z-[100]">
                  {TIPO_CONTA_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-white/60">Banco</Label>
                <Input
                  value={formData.banco}
                  onChange={(e) => handleChange('banco', e.target.value)}
                  className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                  placeholder="Código"
                />
              </div>

              <div>
                <Label className="text-xs text-white/60">Agência</Label>
                <Input
                  value={formData.agencia}
                  onChange={(e) => handleChange('agencia', e.target.value)}
                  className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                  placeholder="0000"
                />
              </div>

              <div>
                <Label className="text-xs text-white/60">Conta</Label>
                <Input
                  value={formData.conta}
                  onChange={(e) => handleChange('conta', e.target.value)}
                  className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                  placeholder="00000-0"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-white/60">Tipo de Chave PIX *</Label>
              <Select value={formData.tipoChavePix} onValueChange={(v) => handleChange('tipoChavePix', v)}>
                <SelectTrigger className="bg-white border-gray-300 text-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-300 z-[100]">
                  {TIPO_CHAVE_PIX_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-white/60">Chave PIX *</Label>
              <Input
                value={formData.chavePix}
                onChange={(e) => handleChange('chavePix', e.target.value)}
                className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                placeholder="Sua chave PIX"
                disabled={formData.tipoChavePix === '1'} // Disabled if CPF
              />
              {formData.tipoChavePix === '1' && (
                <p className="text-xs text-white/50 mt-1">Usando seu CPF como chave PIX</p>
              )}
            </div>

            <div>
              <Label className="text-xs text-white/60">Receber link de assinatura via *</Label>
              <div className="flex gap-3 mt-2">
                <Button
                  type="button"
                  variant={formData.tipoEnvio === 'whatsapp' ? 'default' : 'outline'}
                  className={formData.tipoEnvio === 'whatsapp' ? 'flex-1 bg-[#22c55e]' : 'flex-1 border-white/20'}
                  onClick={() => handleChange('tipoEnvio', 'whatsapp')}
                >
                  WhatsApp
                </Button>
                <Button
                  type="button"
                  variant={formData.tipoEnvio === 'sms' ? 'default' : 'outline'}
                  className={formData.tipoEnvio === 'sms' ? 'flex-1 bg-[#22c55e]' : 'flex-1 border-white/20'}
                  onClick={() => handleChange('tipoEnvio', 'sms')}
                >
                  SMS
                </Button>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <AlertCircle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-200">
                Ao continuar, você receberá um link para assinar digitalmente o contrato. 
                Verifique se os dados estão corretos antes de prosseguir.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setStep(2)}
                variant="outline"
                className="flex-1 border-white/20"
              >
                Voltar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!validateStep3() || loading}
                className="flex-1 bg-[#22c55e] hover:bg-[#16a34a] h-12"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Processando...
                  </>
                ) : (
                  'Finalizar Contratação'
                )}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

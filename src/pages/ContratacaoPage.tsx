import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, MapPin, CreditCard, FileText, AlertCircle, CheckCircle, Loader2, MessageCircle, HeadphonesIcon, RefreshCw } from 'lucide-react';
import { abrirWhatsAppSimples } from '@/utils/whatsapp';
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
import { Confetti } from '@/components/Confetti';
import { PageTransition } from '@/components/PageTransition';

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
  const [creditPolicyError, setCreditPolicyError] = useState(false);
  const [policyLimits, setPolicyLimits] = useState<{ prestacaoMaxima: number | null; prazoMaximo: number | null; prazoMinimo: number | null } | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    // Dados pessoais
    sexo: '',
    estadoCivil: '',
    cpfConjuge: '',
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
    const baseValid = required.every(field => formData[field as keyof typeof formData]);
    // CPF do cônjuge obrigatório para casado(a) ou união estável
    if (baseValid && (formData.estadoCivil === '2' || formData.estadoCivil === '5')) {
      return formData.cpfConjuge.length === 11;
    }
    return baseValid;
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
        cpfConjuge: formData.cpfConjuge || undefined,
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
      console.log('Contratação result:', JSON.stringify(result));

      if (result.erro) {
        const mensagem = result.mensagem || '';
        
        // Verifica se o erro é sobre parcela máxima excedida (margem volatilidade)
        const matchParcela = mensagem.match(/valor Máximo de Prestação disponível é de R\$ ([\d.,]+)/i);
        
        // Verifica se a Facta retornou limites de política de crédito
        const hasLimits = result.limites && (result.limites.prestacaoMaxima || result.limites.prazoMaximo || result.limites.prazoMinimo);
        
        // Verifica se é erro genérico de política de crédito sem limites
        const isPoliticaCredito = !hasLimits && (
          mensagem.toLowerCase().includes('política de crédito') || 
          mensagem.toLowerCase().includes('politica de credito') ||
          mensagem.toLowerCase().includes('fora da política') ||
          mensagem.toLowerCase().includes('reprovado') ||
          mensagem.toLowerCase().includes('crivo')
        );
        
        if (matchParcela) {
          const parcelaMaxReal = matchParcela[1];
          toast({
            title: 'Margem atualizada',
            description: `Sua margem foi atualizada. O valor máximo de parcela agora é R$ ${parcelaMaxReal}. Por favor, refaça a simulação.`,
            variant: 'destructive',
          });
          setTimeout(() => navigate('/consulta'), 3000);
        } else if (hasLimits) {
          // Política de crédito COM limites - mostrar tela com valores permitidos
          console.warn('[POLICY_LIMIT]', {
            cpf: consulta?.cpf,
            limites: result.limites,
            mensagemOriginal: mensagem,
          });
          setPolicyLimits(result.limites!);
          setCreditPolicyError(true);
        } else if (isPoliticaCredito) {
          // Política de crédito SEM limites - tela genérica
          console.error('[POLICY_REJECTED]', {
            cpf: consulta?.cpf,
            mensagemOriginal: mensagem,
          });
          setCreditPolicyError(true);
        } else {
          toast({
            title: 'Erro na contratação',
            description: result.mensagem,
            variant: 'destructive',
          });
        }
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

  // Tela de erro de política de crédito - amigável para o usuário
  if (creditPolicyError) {
    const hasLimitsToShow = policyLimits && (policyLimits.prestacaoMaxima || policyLimits.prazoMaximo || policyLimits.prazoMinimo);
    
    return (
      <PageTransition className="min-h-screen min-h-[100dvh] bg-background">
        <Header title="Contratação" showBack />
        
        <main className="max-w-md mx-auto px-5 py-8">
          <div className="bg-card rounded-2xl p-6 text-center animate-fade-in shadow-card border border-border">
            {hasLimitsToShow ? (
              <>
                <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto mb-5 flex items-center justify-center">
                  <AlertCircle size={40} className="text-primary" />
                </div>
                
                <h2 className="text-xl font-bold text-foreground mb-3">
                  Ajuste necessário
                </h2>
                
                <p className="text-muted-foreground text-sm mb-5 leading-relaxed">
                  O banco informou alguns limites para esta operação. 
                  Ajuste os valores e tente novamente:
                </p>

                <div className="bg-muted/50 rounded-xl p-4 mb-5 space-y-3">
                  {policyLimits.prestacaoMaxima && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Valor máximo da operação</span>
                      <span className="text-lg font-bold text-primary">{formatarMoeda(policyLimits.prestacaoMaxima)}</span>
                    </div>
                  )}
                  {policyLimits.prazoMinimo && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Prazo mínimo</span>
                      <span className="text-lg font-bold text-primary">{policyLimits.prazoMinimo}x</span>
                    </div>
                  )}
                  {policyLimits.prazoMaximo && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Prazo máximo</span>
                      <span className="text-lg font-bold text-primary">{policyLimits.prazoMaximo}x</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <Button
                    onClick={() => navigate('/resultado', { state: { policyLimits } })}
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base gap-2"
                  >
                    <RefreshCw size={20} />
                    Refazer Simulação com Novo Valor
                  </Button>
                  
                  <Button
                    onClick={() => abrirWhatsAppSimples()}
                    variant="outline"
                    className="w-full h-12 border-border text-foreground hover:bg-muted gap-2"
                  >
                    <MessageCircle size={18} />
                    Falar com Consultor
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-amber-100 mx-auto mb-5 flex items-center justify-center">
                  <HeadphonesIcon size={40} className="text-amber-600" />
                </div>
                
                <h2 className="text-xl font-bold text-foreground mb-3">
                  Ops! Consulta não processada
                </h2>
                
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                  Não se preocupe! Nossa equipe está pronta para ajudar você a descobrir 
                  o valor disponível para seu empréstimo. Clique no botão abaixo e fale 
                  diretamente com um de nossos consultores especializados.
                </p>
                
                <div className="space-y-3">
                  <Button
                    onClick={() => abrirWhatsAppSimples()}
                    className="w-full h-14 bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold text-base gap-2"
                  >
                    <MessageCircle size={22} />
                    Falar com Consultor Agora
                  </Button>
                  
                  <Button
                    onClick={() => navigate('/consulta')}
                    variant="outline"
                    className="w-full h-12 border-border text-foreground hover:bg-muted"
                  >
                    Fazer Nova Consulta
                  </Button>
                </div>
                
                <p className="text-muted-foreground text-xs mt-6">
                  Atendimento rápido via WhatsApp • Segunda a Sexta, 8h às 18h
                </p>
              </>
            )}
          </div>
        </main>
      </PageTransition>
    );
  }

  if (success) {
    return (
      <PageTransition className="min-h-screen min-h-[100dvh] bg-background">
        <Confetti trigger={true} duration={3000} />
        <Header title="Contratação" showBack />
        
        <main className="max-w-md mx-auto px-5 py-8">
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-center animate-fade-in shadow-lg shadow-primary/25">
            <div className="w-20 h-20 rounded-full bg-white/20 mx-auto mb-5 flex items-center justify-center animate-bounce-soft">
              <CheckCircle size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">🎉 Proposta Criada!</h2>
            <p className="text-white/90 text-sm mb-5">
              Enviamos o link de assinatura para o seu {formData.tipoEnvio === 'whatsapp' ? 'WhatsApp' : 'SMS'}.
            </p>
            
            {propostaUrl && (
              <a
                href={`https://${propostaUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-white text-primary font-semibold py-3 px-8 rounded-xl mb-4 hover:bg-white/90 hover:scale-105 transition-all duration-200 shadow-lg"
              >
                Assinar Agora
              </a>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <Button
              onClick={() => navigate('/propostas')}
              className="w-full h-12 bg-card hover:bg-muted text-foreground border border-border transition-all duration-200 hover:scale-[1.02]"
            >
              Ver Minhas Propostas
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="w-full h-12 text-muted-foreground hover:text-foreground"
            >
              Voltar ao Início
            </Button>
          </div>
        </main>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen min-h-[100dvh] bg-background pb-8">
      <Header title="Contratação" showBack />

      <main className="max-w-md mx-auto px-5 py-5 space-y-4">
        {/* Resumo da operação */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <img src={banco.logo} alt={banco.nome} className="w-6 h-6 object-contain" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{banco.nome}</p>
              <p className="text-xs text-muted-foreground">{banco.parcelas}x de {formatarMoeda(banco.valorParcela)}</p>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">Valor a receber</span>
            <span className="text-lg font-bold text-primary">{formatarMoeda(banco.valorLiberado)}</span>
          </div>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {s}
              </div>
              {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Dados Pessoais */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <User size={18} className="text-primary" />
              Dados Pessoais
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-foreground font-medium mb-1 block">Sexo *</Label>
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
                <Label className="text-xs text-foreground font-medium mb-1 block">Estado Civil *</Label>
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
              
              {(formData.estadoCivil === '2' || formData.estadoCivil === '5') && (
                <div>
                  <Label className="text-xs text-foreground font-medium mb-1 block">CPF do Cônjuge *</Label>
                  <Input
                    value={formData.cpfConjuge}
                    onChange={(e) => handleChange('cpfConjuge', e.target.value.replace(/\D/g, '').slice(0, 11))}
                    placeholder="000.000.000-00"
                    className="bg-white border-gray-300 text-black"
                    maxLength={11}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-foreground font-medium mb-1 block">RG *</Label>
                <Input
                  value={formData.rg}
                  onChange={(e) => handleChange('rg', e.target.value)}
                  className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                  placeholder="Número do RG"
                />
              </div>

              <div>
                <Label className="text-xs text-foreground font-medium mb-1 block">Estado do RG *</Label>
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
                <Label className="text-xs text-foreground font-medium mb-1 block">Órgão Emissor *</Label>
                <Input
                  value={formData.orgaoEmissor}
                  onChange={(e) => handleChange('orgaoEmissor', e.target.value.toUpperCase())}
                  className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                  placeholder="SSP, DETRAN..."
                  maxLength={10}
                />
              </div>

              <div>
                <Label className="text-xs text-foreground font-medium mb-1 block">Data Expedição *</Label>
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
                <Label className="text-xs text-foreground font-medium mb-1 block">Estado Natural *</Label>
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
                <Label className="text-xs text-foreground font-medium mb-1 block">Cidade Natural *</Label>
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
              <Label className="text-xs text-foreground font-medium mb-1 block">Celular *</Label>
              <Input
                value={formData.celular}
                onChange={(e) => handleChange('celular', e.target.value)}
                className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <Label className="text-xs text-foreground font-medium mb-1 block">E-mail *</Label>
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
              className="w-full bg-primary hover:bg-primary/90 h-12"
            >
              Continuar
            </Button>
          </div>
        )}

        {/* Step 2: Endereço */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <MapPin size={18} className="text-primary" />
              Endereço
            </h3>

            <div>
              <Label className="text-xs text-foreground font-medium mb-1 block">CEP *</Label>
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
              <Label className="text-xs text-foreground font-medium mb-1 block">Endereço *</Label>
              <Input
                value={formData.endereco}
                onChange={(e) => handleChange('endereco', e.target.value)}
                className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                placeholder="Rua, Avenida..."
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-foreground font-medium mb-1 block">Número *</Label>
                <Input
                  value={formData.numero}
                  onChange={(e) => handleChange('numero', e.target.value)}
                  className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                  placeholder="Nº"
                />
              </div>

              <div className="col-span-2">
                <Label className="text-xs text-foreground font-medium mb-1 block">Complemento</Label>
                <Input
                  value={formData.complemento}
                  onChange={(e) => handleChange('complemento', e.target.value)}
                  className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                  placeholder="Apto, Bloco..."
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-foreground font-medium mb-1 block">Bairro *</Label>
              <Input
                value={formData.bairro}
                onChange={(e) => handleChange('bairro', e.target.value)}
                className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                placeholder="Bairro"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-foreground font-medium mb-1 block">Estado *</Label>
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
                <Label className="text-xs text-foreground font-medium mb-1 block">Cidade *</Label>
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
              <Label className="text-xs text-foreground font-medium mb-1 block">Nome da Mãe *</Label>
              <Input
                value={formData.nomeMae}
                onChange={(e) => handleChange('nomeMae', e.target.value.toUpperCase())}
                className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                placeholder="Nome completo da mãe"
              />
            </div>

            <div>
              <Label className="text-xs text-foreground font-medium mb-1 block">Nome do Pai</Label>
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
                className="flex-1 border-border text-foreground"
              >
                Voltar
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!validateStep2()}
                className="flex-1 bg-primary hover:bg-primary/90"
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
              <CreditCard size={18} className="text-primary" />
              Dados para Pagamento (PIX)
            </h3>

            <div>
              <Label className="text-xs text-foreground font-medium mb-1 block">Tipo de Conta *</Label>
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
                <Label className="text-xs text-foreground font-medium mb-1 block">Banco</Label>
                <Input
                  value={formData.banco}
                  onChange={(e) => handleChange('banco', e.target.value)}
                  className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                  placeholder="Código"
                />
              </div>

              <div>
                <Label className="text-xs text-foreground font-medium mb-1 block">Agência</Label>
                <Input
                  value={formData.agencia}
                  onChange={(e) => handleChange('agencia', e.target.value)}
                  className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                  placeholder="0000"
                />
              </div>

              <div>
                <Label className="text-xs text-foreground font-medium mb-1 block">Conta</Label>
                <Input
                  value={formData.conta}
                  onChange={(e) => handleChange('conta', e.target.value)}
                  className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                  placeholder="00000-0"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-foreground font-medium mb-1 block">Tipo de Chave PIX *</Label>
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
              <Label className="text-xs text-foreground font-medium mb-1 block">Chave PIX *</Label>
              <Input
                value={formData.chavePix}
                onChange={(e) => handleChange('chavePix', e.target.value)}
                className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                placeholder="Sua chave PIX"
                disabled={formData.tipoChavePix === '1'} // Disabled if CPF
              />
              {formData.tipoChavePix === '1' && (
                <p className="text-xs text-muted-foreground mt-1">Usando seu CPF como chave PIX</p>
              )}
            </div>

            <div>
              <Label className="text-xs text-foreground font-medium mb-1 block">Receber link de assinatura via *</Label>
              <div className="flex gap-3 mt-2">
                <Button
                  type="button"
                  variant={formData.tipoEnvio === 'whatsapp' ? 'default' : 'outline'}
                  className={formData.tipoEnvio === 'whatsapp' ? 'flex-1 bg-primary' : 'flex-1 border-border text-foreground'}
                  onClick={() => handleChange('tipoEnvio', 'whatsapp')}
                >
                  WhatsApp
                </Button>
                <Button
                  type="button"
                  variant={formData.tipoEnvio === 'sms' ? 'default' : 'outline'}
                  className={formData.tipoEnvio === 'sms' ? 'flex-1 bg-primary' : 'flex-1 border-border text-foreground'}
                  onClick={() => handleChange('tipoEnvio', 'sms')}
                >
                  SMS
                </Button>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Ao continuar, você receberá um link para assinar digitalmente o contrato. 
                Verifique se os dados estão corretos antes de prosseguir.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setStep(2)}
                variant="outline"
                className="flex-1 border-border text-foreground"
              >
                Voltar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!validateStep3() || loading}
                className="flex-1 bg-primary hover:bg-primary/90 h-12"
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
    </PageTransition>
  );
}

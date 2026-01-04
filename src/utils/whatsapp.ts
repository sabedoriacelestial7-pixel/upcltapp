import { formatarCPF, formatarMoeda } from './formatters';

const WHATSAPP_NUMERO = "5527981389039";

interface DadosContratacao {
  nome: string;
  cpf: string;
  margem: number;
  bancoEscolhido: string;
  valor: number;
  parcelas: number;
  valorParcela: number;
}

export function abrirWhatsApp(dados: DadosContratacao) {
  const mensagem = `🚀 *UpCLT - Solicitação de Crédito CLT*

👤 *Dados do Cliente:*
• Nome: ${dados.nome}
• CPF: ${formatarCPF(dados.cpf)}
• Margem Disponível: ${formatarMoeda(dados.margem)}

🏦 *Banco Escolhido:*
• ${dados.bancoEscolhido}

💰 *Simulação:*
• Valor Solicitado: ${formatarMoeda(dados.valor)}
• Parcelas: ${dados.parcelas}x de ${formatarMoeda(dados.valorParcela)}
• Total: ${formatarMoeda(dados.valorParcela * dados.parcelas)}

📋 *Valores sujeitos à análise do banco*

Aguardo contato para prosseguir! ✅`;

  const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank');
}

export function abrirWhatsAppSimples() {
  const mensagem = `Olá! Vim pelo app UpCLT e gostaria de mais informações sobre crédito consignado CLT.`;
  const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank');
}

export function abrirWhatsAppConsulta(nome: string, cpf: string) {
  const mensagem = `Olá! Sou ${nome}, CPF ${formatarCPF(cpf)}. Vim pelo app UpCLT e gostaria de consultar minha margem para crédito consignado CLT.`;
  const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank');
}

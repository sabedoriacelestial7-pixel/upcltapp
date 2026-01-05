import { HelpCircle } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqItems = [
  {
    id: 'credito-clt',
    question: 'O que é crédito CLT?',
    answer: 'O crédito CLT é uma modalidade de empréstimo consignado exclusiva para trabalhadores com carteira assinada. As parcelas são descontadas diretamente da folha de pagamento, garantindo taxas de juros mais baixas e maior segurança para ambas as partes.'
  },
  {
    id: 'desconto-folha',
    question: 'Como funciona o desconto em folha?',
    answer: 'O desconto é feito automaticamente pelo empregador antes do pagamento do salário. Por lei, o valor da parcela não pode ultrapassar 35% da sua margem consignável (calculada sobre seu salário líquido). Isso garante que você sempre terá o restante do seu salário disponível.'
  },
  {
    id: 'tempo-liberacao',
    question: 'Quanto tempo demora para liberar?',
    answer: 'Após a aprovação do empréstimo, o valor é liberado em até 24 a 48 horas úteis diretamente na sua conta bancária. A consulta de margem é instantânea e a análise de crédito é feita em poucos minutos.'
  },
  {
    id: 'negativado',
    question: 'Posso contratar estando negativado?',
    answer: 'Sim! Como o crédito CLT tem garantia de desconto em folha, pessoas com restrições no CPF (nome negativado) podem ser aprovadas. A análise é feita com base na sua margem consignável e não no seu histórico de crédito.'
  },
  {
    id: 'margem',
    question: 'O que é margem consignável?',
    answer: 'A margem consignável é o valor máximo que pode ser comprometido do seu salário para pagamento de empréstimos consignados. Por lei, esse limite é de 35% do seu salário líquido, garantindo que você tenha 65% disponível para suas despesas.'
  },
  {
    id: 'documentos',
    question: 'Quais documentos preciso?',
    answer: 'Para consultar sua margem, você só precisa do seu CPF. Para contratar o empréstimo, será necessário: documento de identidade (RG ou CNH), comprovante de residência atualizado e dados bancários para receber o valor.'
  }
];

export default function AjudaPage() {
  return (
    <div className="min-h-screen min-h-[100dvh] gradient-primary pb-20">
      <Header title="Ajuda" showBack />

      <main className="max-w-md mx-auto px-5 py-5 space-y-4 animate-fade-in">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-2xl p-5 shadow-lg shadow-green-500/25 text-center">
          <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
            <HelpCircle size={28} className="text-white" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">
            Perguntas Frequentes
          </h2>
          <p className="text-sm text-white/80">
            Tire suas dúvidas sobre crédito consignado CLT
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item) => (
              <AccordionItem key={item.id} value={item.id} className="border-white/10">
                <AccordionTrigger className="px-4 py-3.5 text-left text-sm font-medium text-white hover:no-underline hover:bg-white/5">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-sm text-white/70 leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Contact Section */}
        <div className="bg-white/5 border border-[#22c55e]/30 rounded-2xl p-5 backdrop-blur-sm">
          <h3 className="font-semibold text-white mb-2">
            Ainda tem dúvidas?
          </h3>
          <p className="text-sm text-white/70">
            Entre em contato conosco pelo WhatsApp ou e-mail que teremos prazer em ajudar.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

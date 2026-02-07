import { MessageCircle, ChevronRight } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { abrirWhatsAppSimples } from '@/utils/whatsapp';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/components/PageTransition';

const faqItems = [
  {
    id: 'quem-pode',
    question: 'Quem pode contratar conosco?',
    answer: 'Trabalhadores CLT com mais de 3 meses de carteira assinada, maiores de 18 anos, que possuam margem consignável disponível em sua folha de pagamento.'
  },
  {
    id: 'produtos',
    question: 'Quais os nossos produtos e serviços?',
    answer: 'Oferecemos crédito consignado CLT com as melhores taxas do mercado, parcelamento em até 36 vezes e aprovação em até 24 horas.'
  },
  {
    id: 'prazo',
    question: 'Qual é o prazo para concluir a minha operação?',
    answer: 'Após a aprovação e assinatura do contrato, o valor é liberado em até 1 dia útil diretamente na sua conta bancária.'
  },
  {
    id: 'cancelar',
    question: 'Posso cancelar uma operação de crédito após ser efetivada?',
    answer: 'Sim, você tem até 7 dias corridos após a contratação para solicitar o cancelamento, conforme o Código de Defesa do Consumidor.'
  },
  {
    id: 'variacao-margem',
    question: 'O Troco pode sofrer alterações caso ocorra alguma variação na minha margem durante a operação?',
    answer: 'Sim, se houver alteração na sua margem entre a simulação e a efetivação, o valor liberado pode ser ajustado proporcionalmente.'
  },
  {
    id: 'variacao-operacao',
    question: 'O Troco pode mudar caso ocorra alguma variação durante a operação?',
    answer: 'Sim, taxas e valores podem sofrer pequenas variações até a efetivação final do contrato, dependendo das condições do mercado.'
  }
];

export default function AjudaPage() {
  return (
    <PageTransition className="min-h-screen bg-background pb-20">
      <main className="max-w-md mx-auto px-5 pt-[calc(env(safe-area-inset-top)+1rem)]">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">
            FAQ
          </h1>
          <p className="text-muted-foreground text-sm">
            Dúvidas Frequentes.
          </p>
        </div>

        {/* WhatsApp CTA */}
        <Button
          onClick={abrirWhatsAppSimples}
          className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-button mb-6"
        >
          <MessageCircle size={20} />
          Converse com a gente
        </Button>

        {/* FAQ Accordion */}
        <Accordion type="single" collapsible className="space-y-3">
          {faqItems.map((item) => (
            <AccordionItem 
              key={item.id} 
              value={item.id} 
              className="bg-card rounded-xl border-none shadow-card overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-4 text-left text-sm font-medium text-foreground hover:no-underline hover:bg-muted transition-colors [&[data-state=open]>svg]:rotate-180">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>

      <BottomNav />
    </PageTransition>
  );
}
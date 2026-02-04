import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { cn } from '@/lib/utils';

export default function TermosUsoPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate('/perfil')}
            className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-semibold">Termos de Uso</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 py-6">
        <div className="bg-white rounded-xl p-5 shadow-sm space-y-6">
          {/* Title */}
          <h2 className="text-xl font-bold text-foreground text-center">
            TERMOS DE USO – APLICATIVO UP CLT
          </h2>

          {/* Section 1 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground">1. Introdução e aceitação do Termo</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              1.1 O aplicativo <strong>Up CLT</strong> (doravante denominado "PLATAFORMA Up CLT") é fornecido pela empresa <strong>I9 CONSULTORIA E NEGÓCIOS LTDA – ME</strong>, inscrita no CNPJ sob o nº <strong>32.119.748/0001‑02</strong>, com sede na <strong>Avenida Mario Gurgel, 5353 – São Gabriel, Cariacica – ES, CEP 29.154‑000</strong>, doravante simplesmente "Empresa".
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              1.2 Ao baixar, instalar ou utilizar a PLATAFORMA Up CLT, o usuário declara, de forma expressa, que leu, compreendeu e concorda com os presentes <strong>Termos de Uso</strong> e com a <strong>Política de Privacidade</strong> da PLATAFORMA, que são vinculantes e passam a reger a utilização do serviço.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              1.3 O uso da PLATAFORMA Up CLT é facultativo, gratuito e sujeito à aceitação destes Termos, além das políticas aplicáveis da <strong>Google Play Store</strong> e da <strong>Apple App Store</strong>, que também se aplicam à instalação e uso do aplicativo.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground">2. Objetivo da PLATAFORMA</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              2.1 A PLATAFORMA Up CLT tem como objetivo auxiliar o usuário a <strong>simular, comparar e contratar empréstimo consignado CLT</strong>, portabilidade, refinanciamento e outras modalidades de crédito consignado, de acordo com o perfil do usuário e as instituições financeiras parceiras.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              2.2 A PLATAFORMA não concede, em hipótese alguma, o crédito por conta própria, sendo sempre a <strong>instituição financeira parceira</strong> responsável pela análise, aprovação, contratação e gestão do contrato firmado com o usuário.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground">3. Autorização de acesso a dados</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              3.1 Ao se cadastrar na PLATAFORMA Up CLT, o usuário autoriza a Empresa e seus parceiros a acessarem e consultarem, por meio de integrações seguras, seus dados cadastrais, dados bancários, vínculo empregatício (CLT), contracheque, margem consignável e demais informações estritamente necessárias para a análise de crédito e formalização de operações de empréstimo consignado CLT.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              3.2 Esta autorização é dada com base legal adequada à LGPD (como consentimento, contrato e interesse legítimo), e garante que as instituições parceiras possam verificar a elegibilidade, margem disponível e demais condições do crédito.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              3.3 O usuário pode revogar esta autorização a qualquer momento, mediante solicitação formal à Empresa, devendo comunicar com antecedência de pelo menos 5 (cinco) dias úteis, assumindo eventuais prejuízos operacionais e financeiros decorrentes da sua revogação.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground">4. Cadastro, requisitos de uso e limites de acesso</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              4.1 Para utilizar a PLATAFORMA Up CLT, o usuário deve ser maior de 18 (dezoito) anos e juridicamente capaz, criar uma conta fornecendo dados corretos, completos e atualizados, e enviar os documentos solicitados, tais como RG/CNH, CPF, comprovante de vínculo empregatício CLT e comprovante bancário.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              4.2 A PLATAFORMA poderá recusar ou não aprovar cadastros que não apresentem dados verdadeiros, completos ou que não se enquadrem nas regras de elegibilidade, bem como bloquear, suspender ou cancelar a conta do usuário em caso de fraude, uso indevido ou violação destes Termos, sem prejuízo das medidas legais cabíveis.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              4.3 O usuário é responsável pela veracidade dos dados informados e, em caso de falsidade, estará sujeito às sanções civis, administrativas e criminais previstas em lei.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground">5. Autenticação, segurança e responsabilidades do usuário</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              5.1 O usuário deve criar uma senha segura, com mínimo de 6 (seis) caracteres, sem sequências óbvias, e não deve reutilizá‑la em outros serviços.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              5.2 É obrigação do usuário manter a confidencialidade de sua senha, biometria facial e demais mecanismos de autenticação, não compartilhar, emprestar ou permitir o uso de sua conta por terceiros, além de comunicar imediatamente qualquer suspeita de acesso indevido pelos canais oficiais da PLATAFORMA.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              5.3 Todos os acessos e operações realizadas após a autenticação serão considerados de responsabilidade do usuário, inclusive quando derivados de uso indevido ou divulgação de credenciais a terceiros.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground">6. Funcionalidades da PLATAFORMA</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              6.1 A PLATAFORMA Up CLT permite ao usuário realizar simulações de empréstimo consignado CLT, portabilidade, refinanciamento e outras modalidades de crédito; comparar taxas, prazos e condições de propostas de bancos e instituições financeiras parceiras; visualizar histórico de simulações, cotações e operações acompanhadas; e acompanhar o status de propostas e contratos em andamento.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              6.2 Para contratar qualquer produto financeiro (empréstimo consignado CLT, portabilidade, refinanciamento etc.), o usuário deverá aceitar o <strong>contrato específico firmado com a instituição financeira parceira</strong>, que será disponibilizado diretamente na própria PLATAFORMA.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground">7. Uso ético, limitações e conduta do usuário</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              7.1 O usuário compromete‑se a utilizar a PLATAFORMA Up CLT de forma ética, transparente e lícita, respeitando a legislação brasileira, a moral, os bons costumes e a ordem pública.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              7.2 Fica vedado ao usuário acessar, alterar ou tentar acessar áreas de programação, banco de dados, códigos fonte ou ambientes internos da PLATAFORMA; utilizar ferramentas de engenharia reversa, mineração de dados, automação ou qualquer outro recurso que viole estes Termos; reproduzir, distribuir ou utilizar indevidamente marcas, logotipos, layout ou conteúdo da PLATAFORMA sem autorização expressa.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              7.3 O descumprimento destas regras pode acarretar bloqueio, suspensão ou cancelamento da conta, bem como o ressarcimento de danos causados à Empresa, parceiros ou terceiros.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground">8. Licença de uso, propriedade intelectual e limites de responsabilidade</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              8.1 A Empresa concede ao usuário uma licença pessoal, não exclusiva, intransferível e limitada para usar o aplicativo Up CLT, exclusivamente para fins de simulação e contratação de empréstimos consignados CLT, nos termos deste Termo.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              8.2 Exceptuando os dados do usuário, toda a propriedade intelectual da PLATAFORMA (códigos, marca, layout, textos e design) é de titularidade da Empresa ou de terceiros licenciadores, não podendo ser copiada, modificada, sublicenciada ou usada de forma indevida.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              8.3 A PLATAFORMA é disponibilizada "no estado em que se encontra", e a Empresa não garante a disponibilidade ininterrupta, nem isenção de erros, bugs ou falhas de sistema; não se responsabiliza por indisponibilidade temporária decorrente de manutenção, falhas de internet, força maior ou atos de terceiros; danos causados por vírus, malwares ou outros problemas decorrentes de dispositivos do usuário; e conteúdos, taxas ou condições de crédito oferecidos por instituições financeiras parceiras, que são de responsabilidade exclusiva de cada instituição.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground">9. Privacidade e proteção de dados (LGPD)</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              9.1 A PLATAFORMA Up CLT trata dados pessoais em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD)</strong> e demais normas aplicáveis, conforme detalhado em sua Política de Privacidade, que integra este Termo como parte inseparável.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              9.2 Os tipos de dados que podem ser coletados incluem dados cadastrais e de contato; dados bancários e de pagamento; dados de vínculo empregatício CLT, contracheque e margem consignável; logs de acesso, uso da PLATAFORMA, localização e dispositivos utilizados.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              9.3 O usuário tem direito de acessar, corrigir, atualizar, excluir ou restringir o tratamento de seus dados, bem como solicitar a portabilidade, por meio dos canais de atendimento oficiais da PLATAFORMA, dentro das hipóteses permitidas pela LGPD.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              9.4 Em caso de conflito, prevalece a Política de Privacidade em relação a qualquer cláusula menos específica deste Termo.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground">10. Comunicação, alterações e disposições finais</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              10.1 A qualquer tempo, a Empresa poderá alterar estes Termos de Uso ou a Política de Privacidade, mediante publicação na PLATAFORMA Up CLT e/ou comunicação por e‑mail e outros canais de contato informados pelo usuário.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              10.2 O usuário compromete‑se a verificar periodicamente a versão vigente dos Termos e da Política de Privacidade, ficando sujeito às alterações após a continuidade do uso da PLATAFORMA.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              10.3 A comunicação eletrônica enviada para o e‑mail informado no cadastro é considerada válida, eficaz e suficiente para fins de notificação, inclusive de alterações contratuais, isenções e eventuais suspensões.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              10.4 O descumprimento das obrigações aqui previstas pode acarretar, a exclusivo critério da Empresa, suspensão temporária ou permanente da conta, sem prejuízo de ações legais cabíveis.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              10.5 Este Termo é regido pela legislação brasileira, em língua portuguesa, sendo eleito o <strong>foro da Comarca de Cariacica – ES</strong> para dirimir quaisquer disputas ou controvérsias, salvo competência legal especial diferente.
            </p>
          </section>

          {/* Section 11 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground">11. Play Store e Apple App Store</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              11.1 O uso da PLATAFORMA Up CLT está sujeito, ainda, às <strong>Políticas de Programa para Desenvolvedores da Google Play Store</strong> e aos <strong>Termos e Diretrizes da Apple App Store</strong>, que regem a instalação, atualização e distribuição de aplicativos em seus respectivos ecossistemas.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              11.2 O usuário reconhece que a Empresa e a PLATAFORMA aplicam e complementam tais políticas, sem prejuízo da responsabilidade da Empresa por aspectos específicos do serviço financeiro e de tratamento de dados pessoais.
            </p>
          </section>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

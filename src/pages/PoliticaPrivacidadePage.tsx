import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { PageTransition } from '@/components/PageTransition';

export default function PoliticaPrivacidadePage() {
  const navigate = useNavigate();

  return (
    <PageTransition className="min-h-screen bg-[#f5f5f5] pb-20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate('/perfil')}
            className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-semibold">Política de Privacidade</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 py-6">
        <div className="bg-white rounded-xl p-5 shadow-sm space-y-6">
          {/* Title */}
          <h2 className="text-xl font-bold text-foreground text-center">
            POLÍTICA DE PRIVACIDADE – APLICATIVO UP CLT
          </h2>

          {/* Section 1 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground">1. Objetivo e aceitação</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              1.1 Esta Política de Privacidade explica como a <strong>I9 CONSULTORIA E NEGÓCIOS LTDA – ME</strong> (CNPJ 32.119.748/0001‑02), com sede na <strong>Avenida Mario Gurgel, 5353 – São Gabriel, Cariacica – ES, CEP 29.154‑000</strong>, doravante "Empresa", <strong>coleta, usa, armazena, compartilha e protege</strong> os dados pessoais de usuários do aplicativo <strong>Up CLT</strong> (PLATAFORMA Up CLT).
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              1.2 Ao utilizar a PLATAFORMA Up CLT, o usuário declara que leu, entendeu e concorda expressamente com esta Política de Privacidade, que se integra como parte inseparável dos <strong>Termos de Uso</strong> da PLATAFORMA.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground">2. Base legal e finalidades do tratamento</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              2.1 O tratamento de dados pessoais é realizado com base legal adequada à <strong>Lei Geral de Proteção de Dados (LGPD)</strong>, entre elas: <strong>consentimento</strong>, <strong>execução de contrato</strong>, <strong>interesse legítimo da Empresa</strong> e <strong>cumprimento de obrigação legal</strong>.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">2.2 Os dados são tratados para as seguintes finalidades:</p>
            <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1 ml-2">
              <li>criar e gerenciar a conta do usuário na PLATAFORMA;</li>
              <li>realizar simulações de empréstimo consignado CLT, portabilidade, refinanciamento e outras modalidades de crédito;</li>
              <li>permitir a análise de crédito e verificação da margem consignável junto a instituições financeiras parceiras;</li>
              <li>enviar comunicações importantes sobre serviços, transações, atualizações e segurança;</li>
              <li>cumprir obrigações legais, tributárias e regulatórias;</li>
              <li>melhorar a PLATAFORMA, personalizar a experiência do usuário e aprimorar sistemas de segurança.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground">3. Tipos de dados que coletamos</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">3.1 Coletamos dados diretamente fornecidos pelo usuário, tais como:</p>
            <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1 ml-2">
              <li><strong>dados cadastrais</strong>: nome completo, CPF, RG ou CNH, data de nascimento, gênero, estado civil;</li>
              <li><strong>dados de contato</strong>: telefone, e‑mail e, se necessário, número de WhatsApp;</li>
              <li><strong>dados bancários</strong>: dados da conta bancária, agência, número da conta;</li>
              <li><strong>dados de vínculo empregatício CLT</strong>: CNPJ/Nome do empregador, cargo, salário, contracheque e margem consignável;</li>
              <li><strong>credenciais de acesso</strong>: senha, biometria facial e dados de login.</li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">3.2 Também coletamos dados automaticamente durante o uso da PLATAFORMA, como:</p>
            <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1 ml-2">
              <li><strong>logs de acesso</strong>: IP, dispositivo, sistema operacional, navegador, data/hora de acesso, páginas visitadas;</li>
              <li><strong>dados de uso</strong>: páginas acessadas, recursos utilizados, tempo de permanência, cliques e ações dentro da PLATAFORMA;</li>
              <li><strong>cookies e tecnologias semelhantes</strong>: para melhorar desempenho, segurança e experiência do usuário.</li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              3.3 Em alguns casos, podem ser tratados <strong>dados sensíveis</strong>, como vida financeira (crédito, margem consignável), sempre com base legal específica da LGPD e com adequado controle de acesso.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground">4. Cookies e tecnologias de rastreamento</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              4.1 A PLATAFORMA pode utilizar <strong>cookies</strong>, <strong>pixel tags</strong>, <strong>identificadores de dispositivos</strong> e outras tecnologias de rastreamento para otimizar a navegação, garantir segurança e analisar o desempenho de marketing e publicidade.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              4.2 O usuário pode ajustar as configurações do seu navegador ou dispositivo para restringir ou bloquear cookies, mas isso pode impactar o funcionamento da PLATAFORMA e de alguns recursos.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground">5. Compartilhamento de dados</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">5.1 A Empresa <strong>não vende dados pessoais</strong>. Os dados podem ser compartilhados apenas nas seguintes situações:</p>
            <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1 ml-2">
              <li>com <strong>instituições financeiras parceiras</strong>, exclusivamente para análise de crédito, concessão de empréstimo consignado CLT, portabilidade e refinanciamento;</li>
              <li>com <strong>prestadores de serviços terceirizados</strong>, como serviços de nuvem, suporte técnico, segurança, suporte ao cliente, cobrança e análise de dados, sempre obrigados por contratos de confidencialidade;</li>
              <li>com <strong>autoridades competentes</strong>, em cumprimento de obrigação legal, decisão judicial ou administrativa;</li>
              <li>com <strong>empresas do grupo econômico</strong>, nos casos permitidos por lei e com base legal adequada.</li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              5.2 Todos os parceiros que tratam dados na sua cadeia de serviços cumprem requisitos de segurança e são obrigados a seguir as diretrizes da LGPD.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground">6. Armazenamento e segurança dos dados</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              6.1 Os dados coletados são armazenados em <strong>servidores em nuvem seguros</strong>, com criptografia de ponta a ponta, controle de acesso, backups periódicos e monitoramento contra acessos indevidos.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              6.2 Os dados são armazenados pelo tempo necessário para as finalidades descritas, somado ao prazo legal mínimo, após o qual são anonimizados ou deletados, salvo se houver necessidade de guarda por força de lei ou obrigação contratual.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground">7. Direitos do titular (LGPD)</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">7.1 O usuário, como titular de dados, tem os seguintes direitos, conforme a LGPD:</p>
            <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1 ml-2">
              <li><strong>confirmar</strong> a existência de tratamento de dados;</li>
              <li><strong>acessar</strong> os dados pessoais que possuímos;</li>
              <li><strong>corrigir</strong> dados incompletos, inexatos ou desatualizados;</li>
              <li><strong>solicitar a anonimização, bloqueio ou eliminação</strong> de dados desnecessários ou em desconformidade com a lei;</li>
              <li><strong>solicitar a portabilidade</strong> dos dados a outro fornecedor de serviço;</li>
              <li><strong>solicitar a eliminação</strong> dos dados tratados com base em consentimento, salvo hipóteses legais que permitam sua retenção;</li>
              <li><strong>obter informações</strong> sobre entidades com as quais compartilhamos seus dados;</li>
              <li><strong>revogar o consentimento</strong> a qualquer momento, mediante solicitação aos canais oficiais, o que pode impactar a possibilidade de uso de alguns serviços da PLATAFORMA.</li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              7.2 Para exercer qualquer um desses direitos, o usuário deve entrar em contato pelos canais oficiais indicados no item 10, <strong>identificando-se com nome e CPF</strong>.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground">8. Transmissão internacional de dados</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              8.1 Em função da infraestrutura de nuvem e de parceiros tecnológicos, alguns dados podem ser armazenados em servidores localizados fora do Brasil, observando sempre as exigências da LGPD e garantindo <strong>proteção equivalente à segurança de dados brasileira</strong>.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              8.2 Sempre que houver transferência internacional, isso será feito por meio de contratos com cláusulas de proteção de dados ou mediante autorização legal expressa.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground">9. Publicidade e uso de dados de marketing</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              9.1 Podemos usar dados para <strong>comunicações de marketing e anúncios digitais</strong>, incluindo <strong>campanhas no Google Ads e em demais plataformas</strong>, sempre com base legal adequada e respeito à LGPD.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              9.2 O usuário pode <strong>se recusar</strong> a receber comunicações promocionais a qualquer momento, utilizando o link de descadastro disponível nos e‑mails ou indo nas configurações da PLATAFORMA.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              9.3 Mesmo em campanhas de anúncio de crédito, obedecemos às políticas de <strong>Google Ads e Apple App Store</strong>, não coletando dados de forma oculta nem fazendo uso indevido de segmentação.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground">10. Canais de atendimento e alterações da Política</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">10.1 Em caso de dúvidas, solicitações ou exercícios de direitos de titular, o usuário pode entrar em contato com a Empresa por meio de:</p>
            <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1 ml-2">
              <li><strong>e‑mail</strong>: privacidade@upclt.com.br</li>
              <li>ou mediante <strong>formulário de contato</strong> dentro da própria PLATAFORMA Up CLT.</li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              10.2 A Empresa se reserva o direito de <strong>atualizar ou alterar</strong> esta Política de Privacidade sempre que necessário, em função de mudanças na legislação, na forma de uso da PLATAFORMA ou em políticas internas.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              10.3 As alterações entrarão em vigor após publicação na PLATAFORMA e, quando significativas, serão comunicadas por e‑mail ou mensagem dentro do app. O usuário deve verificar periodicamente a versão vigente.
            </p>
          </section>

          {/* Section 11 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-foreground">11. Play Store e Apple App Store</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              11.1 A coleta, uso e compartilhamento de dados nesta Política de Privacidade seguem as diretrizes da <strong>Google Play Store</strong> e da <strong>Apple App Store</strong>, incluindo as regras relativas à privacidade de dados em aplicativos de crédito e serviços financeiros.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              11.2 O usuário reconhece que a instalação e a atualização da PLATAFORMA Up CLT também estão sujeitas às políticas de privacidade e dados dessas plataformas.
            </p>
          </section>
        </div>
      </main>

      <BottomNav />
    </PageTransition>
  );
}

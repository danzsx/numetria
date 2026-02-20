import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { MobileNav } from '../components/MobileNav';
import { BlueprintCard } from '../components/BlueprintCard';
import { ActionButton } from '../components/ActionButton';
import { CheckCircle2 } from 'lucide-react';

export default function Pro() {
  const features = [
    'Acesso completo aos módulos Automação, Ritmo e Precisão',
    'Métricas avançadas de variação cognitiva',
    'Análise de padrão e distribuição de erro',
    'Histórico ilimitado com visualização comparativa',
    'Exportação de dados para análise externa',
    'Personalização de intervalos e ritmo de treino',
    'Suporte técnico prioritário'
  ];

  return (
    <div className="min-h-screen">
      <Header isLoggedIn={true} />
      
      <main className="pt-24 pb-16 px-6 mb-16 md:mb-0">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 text-center">
            <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-4">
              PROTOCOL_PRO
            </div>
            <h1 className="text-4xl font-semibold text-[var(--nm-text-high)] mb-4">
              Protocolo completo de treino cognitivo
            </h1>
            <p className="text-lg text-[var(--nm-text-dimmed)] max-w-2xl mx-auto">
              Acesso irrestrito ao sistema proprietário de progressão técnica. 
              Mensuração avançada, análise de padrão cognitivo e histórico completo.
            </p>
          </div>

          {/* Features */}
          <section className="mb-12">
            <BlueprintCard label="FEATURES">
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="text-[var(--nm-accent-primary)] flex-shrink-0 mt-0.5" />
                    <span className="text-[var(--nm-text-high)]">{feature}</span>
                  </div>
                ))}
              </div>
            </BlueprintCard>
          </section>

          {/* Pricing */}
          <section className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BlueprintCard label="MONTHLY">
                <div className="text-center py-6">
                  <div className="text-4xl font-[family-name:var(--font-data)] font-semibold text-[var(--nm-text-high)] tabular-nums mb-2">
                    R$ 49
                  </div>
                  <div className="text-sm text-[var(--nm-text-dimmed)] mb-6">
                    por mês
                  </div>
                  <ActionButton variant="ghost" className="w-full">
                    Selecionar mensal
                  </ActionButton>
                </div>
              </BlueprintCard>

              <BlueprintCard label="ANNUAL">
                <div className="text-center py-6">
                  <div className="text-4xl font-[family-name:var(--font-data)] font-semibold text-[var(--nm-text-high)] tabular-nums mb-2">
                    R$ 490
                  </div>
                  <div className="text-sm text-[var(--nm-text-dimmed)] mb-2">
                    por ano
                  </div>
                  <div className="text-xs text-[var(--nm-accent-stability)] font-[family-name:var(--font-data)] mb-6">
                    2 MESES_GRATIS
                  </div>
                  <ActionButton variant="primary" className="w-full">
                    Selecionar anual
                  </ActionButton>
                </div>
              </BlueprintCard>
            </div>
          </section>

          {/* Technical Details */}
          <section>
            <BlueprintCard label="TECHNICAL_INFO">
              <h3 className="text-lg font-semibold text-[var(--nm-text-high)] mb-4">
                Detalhes técnicos
              </h3>
              
              <div className="space-y-4 text-sm text-[var(--nm-text-dimmed)]">
                <p>
                  O Protocolo Pro desbloqueia módulos avançados de treino estruturado: 
                  Automação (compressão de processos), Ritmo (incremento de velocidade) 
                  e Precisão (redução de variação).
                </p>
                
                <p>
                  Métricas avançadas incluem análise de distribuição de erro, 
                  índice de estabilidade neural e variação temporal. 
                  Histórico completo permite visualização longitudinal da progressão.
                </p>
                
                <p>
                  Pagamento seguro processado via Stripe. 
                  Cancelamento a qualquer momento sem complicação. 
                  Dados permanecem privados e não são compartilhados.
                </p>
              </div>
            </BlueprintCard>
          </section>

          {/* CTA */}
          <div className="text-center mt-12 pt-12 border-t border-[var(--nm-grid-line)]">
            <p className="text-[var(--nm-text-dimmed)] mb-6">
              Comece a construir confiança cognitiva mensurável hoje.
            </p>
            <ActionButton variant="primary">
              Acesse o protocolo completo
            </ActionButton>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
import { Link } from 'react-router';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { BlueprintCard } from '../components/BlueprintCard';
import { ActionButton } from '../components/ActionButton';
import { Target, Zap, TrendingUp, Lock } from 'lucide-react';

export default function Landing() {
  const pillars = [
    {
      icon: Lock,
      title: 'Estabilidade',
      description: 'Construção de base sólida através de repetição controlada e consolidação neural.'
    },
    {
      icon: Zap,
      title: 'Automação',
      description: 'Redução do custo cognitivo por meio de compressão de processos mentais.'
    },
    {
      icon: TrendingUp,
      title: 'Velocidade',
      description: 'Incremento progressivo de ritmo sem comprometer precisão estrutural.'
    },
    {
      icon: Target,
      title: 'Precisão',
      description: 'Mensuração técnica de cada execução para controle de variação.'
    }
  ];

  return (
    <div className="min-h-screen">
      <Header isLoggedIn={false} />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(var(--nm-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--nm-grid-line) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Background number */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none">
          <div className="text-[24rem] font-[family-name:var(--font-data)] font-semibold tabular-nums">
            847
          </div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-semibold text-[var(--nm-text-high)] mb-6 leading-tight">
            Confiança cognitiva mensurável construída por método.
          </h1>
          
          <p className="text-xl text-[var(--nm-text-dimmed)] mb-12 max-w-2xl mx-auto leading-relaxed">
            Numetria é uma plataforma de treino mental estruturado focada em cálculo. 
            Progressão técnica baseada em estabilidade, automação e mensuração contínua.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/dashboard">
              <ActionButton variant="primary" className="w-full sm:w-auto">
                Iniciar treino
              </ActionButton>
            </Link>
            <ActionButton variant="ghost" className="w-full sm:w-auto">
              Conhecer o protocolo
            </ActionButton>
          </div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-4">
              QUATRO PILARES
            </div>
            <h2 className="text-3xl font-semibold text-[var(--nm-text-high)]">
              Sistema proprietário de progressão
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pillars.map((pillar, index) => (
              <BlueprintCard 
                key={index}
                label={`PILLAR_0${index + 1}`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-[var(--radius-technical)] bg-[var(--nm-bg-main)] flex items-center justify-center flex-shrink-0">
                    <pillar.icon size={20} className="text-[var(--nm-accent-primary)]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--nm-text-high)] mb-2">
                      {pillar.title}
                    </h3>
                    <p className="text-sm text-[var(--nm-text-dimmed)] leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              </BlueprintCard>
            ))}
          </div>
        </div>
      </section>

      {/* Method Section */}
      <section className="py-24 px-6 bg-[var(--nm-bg-surface)]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-4">
            MÉTODO
          </div>
          <h2 className="text-3xl font-semibold text-[var(--nm-text-high)] mb-6">
            Treino estruturado, não prática aleatória
          </h2>
          <p className="text-[var(--nm-text-dimmed)] leading-relaxed mb-8">
            Cada sessão é construída sobre princípios de consolidação neural. 
            Progressão controlada através de módulos técnicos que isolam conceitos específicos, 
            comprimem processos e mensuram variação. Sem gamificação emocional. 
            Apenas método, repetição e dados.
          </p>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-4">
              PLANOS
            </div>
            <h2 className="text-3xl font-semibold text-[var(--nm-text-high)]">
              Núcleo gratuito vs Protocolo completo
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BlueprintCard label="CORE_FREE">
              <h3 className="text-xl font-semibold text-[var(--nm-text-high)] mb-4">
                Núcleo
              </h3>
              <ul className="space-y-3">
                <li className="text-sm text-[var(--nm-text-dimmed)] flex items-start gap-2">
                  <span className="text-[var(--nm-accent-stability)] mt-1">•</span>
                  <span>Módulos Fundacional e Consolidação</span>
                </li>
                <li className="text-sm text-[var(--nm-text-dimmed)] flex items-start gap-2">
                  <span className="text-[var(--nm-accent-stability)] mt-1">•</span>
                  <span>Métricas básicas (precisão, tempo médio)</span>
                </li>
                <li className="text-sm text-[var(--nm-text-dimmed)] flex items-start gap-2">
                  <span className="text-[var(--nm-accent-stability)] mt-1">•</span>
                  <span>Histórico de 30 dias</span>
                </li>
              </ul>
            </BlueprintCard>

            <BlueprintCard label="PROTOCOL_PRO">
              <h3 className="text-xl font-semibold text-[var(--nm-text-high)] mb-4">
                Protocolo Pro
              </h3>
              <ul className="space-y-3">
                <li className="text-sm text-[var(--nm-text-dimmed)] flex items-start gap-2">
                  <span className="text-[var(--nm-accent-primary)] mt-1">•</span>
                  <span>Todos os módulos (Automação, Ritmo, Precisão)</span>
                </li>
                <li className="text-sm text-[var(--nm-text-dimmed)] flex items-start gap-2">
                  <span className="text-[var(--nm-accent-primary)] mt-1">•</span>
                  <span>Métricas avançadas e análise de padrão cognitivo</span>
                </li>
                <li className="text-sm text-[var(--nm-text-dimmed)] flex items-start gap-2">
                  <span className="text-[var(--nm-accent-primary)] mt-1">•</span>
                  <span>Histórico ilimitado e exportação de dados</span>
                </li>
              </ul>
              <Link to="/pro">
                <ActionButton variant="primary" className="w-full mt-6">
                  Acessar protocolo completo
                </ActionButton>
              </Link>
            </BlueprintCard>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

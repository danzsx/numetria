import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { BlueprintCard } from '../components/BlueprintCard'
import { useAuth } from '../../contexts/AuthContext'

export default function Manifesto() {
    const { user } = useAuth()

    return (
        <div className="min-h-screen bg-[var(--nm-bg-main)]">
            <Header />

            <main className="pt-32 pb-24 px-6 md:px-12 relative overflow-hidden">
                {/* Background grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage: `linear-gradient(var(--nm-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--nm-grid-line) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}
                />

                {/* Background number backdrop */}
                <div className="absolute right-0 top-64 opacity-[0.02] pointer-events-none select-none">
                    <div className="text-[20rem] font-[family-name:var(--font-data)] font-semibold tabular-nums leading-none">
                        01
                    </div>
                </div>

                <div className="max-w-3xl mx-auto relative z-10">

                    {/* Hero Section */}
                    <section className="mb-24">
                        <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.2em] mb-4">
                            MANIFESTO_V1.0
                        </div>
                        <h1 className="text-4xl md:text-5xl font-semibold text-[var(--nm-text-high)] leading-[1.1] mb-8">
                            A performance não é barulho.<br />
                            <span className="text-[var(--nm-accent-primary)]">É controle.</span>
                        </h1>
                        <p className="text-xl text-[var(--nm-text-dimmed)] leading-relaxed mb-8">
                            Numetria é um ambiente privado de treino mental voltado para o desenvolvimento de velocidade, precisão e estabilidade cognitiva. Não somos um jogo. Somos um método.
                        </p>
                    </section>

                    {/* Pillars Section */}
                    <section className="mb-24 space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <BlueprintCard label="01_ESTABILIDADE">
                                <p className="text-sm text-[var(--nm-text-dimmed)] leading-relaxed">
                                    A velocidade é consequência da estabilidade. Primeiro consolidamos a precisão e a baixa variabilidade. Reduzimos a carga cognitiva para que o cérebro possa processar com clareza.
                                </p>
                            </BlueprintCard>
                            <BlueprintCard label="02_AUTOMAÇÃO">
                                <p className="text-sm text-[var(--nm-text-dimmed)] leading-relaxed">
                                    Padrões reconhecidos tornam-se automáticos. Através da repetição técnica estruturada, transformamos o esforço consciente em fluxo intuitivo.
                                </p>
                            </BlueprintCard>
                            <BlueprintCard label="03_VELOCIDADE">
                                <p className="text-sm text-[var(--nm-text-dimmed)] leading-relaxed">
                                    O ritmo surge naturalmente quando a estrutura está sólida. O treinamento de velocidade na Numetria é metódico e progressivo, nunca artificial.
                                </p>
                            </BlueprintCard>
                            <BlueprintCard label="04_PRECISÃO">
                                <p className="text-sm text-[var(--nm-text-dimmed)] leading-relaxed">
                                    Erros são dados técnicos. Cada desvio é uma oportunidade de recalibrar a estrutura, identificando falhas na decomposição, transporte ou compensação mental.
                                </p>
                            </BlueprintCard>
                        </div>
                    </section>

                    {/* Pedagogy Section */}
                    <section className="mb-24">
                        <h2 className="text-2xl font-semibold text-[var(--nm-text-high)] mb-8 flex items-center gap-3">
                            <span className="text-[var(--nm-accent-primary)] font-[family-name:var(--font-data)] text-sm font-normal">//</span>
                            Motor Pedagógico
                        </h2>
                        <div className="space-y-8 border-l border-[var(--nm-grid-line)] pl-8 ml-2">
                            <div>
                                <h3 className="text-lg font-medium text-[var(--nm-text-high)] mb-3 text-mono">Estrutura antes de compressão</h3>
                                <p className="text-[var(--nm-text-dimmed)] leading-relaxed text-sm">
                                    Respeitamos o princípio do concreto para o abstrato. Cada conceito segue três camadas: explícito estruturado, guiado e, finalmente, executado mentalmente de forma comprimida.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-[var(--nm-text-high)] mb-3">Erro como dado técnico</h3>
                                <p className="text-[var(--nm-text-dimmed)] leading-relaxed text-sm">
                                    Não tratamos falhas como defeitos emocionais. Analisamos desvios de ritmo e precisão para entender onde a estrutura cognitiva precisa de reforço.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-[var(--nm-text-high)] mb-3">Consistência traz clareza</h3>
                                <p className="text-[var(--nm-text-dimmed)] leading-relaxed text-sm">
                                    A clareza mental é o resultado da integração entre precisão e ritmo. O progresso é mensurado internamente, sem recompensas superficiais ou gamificação barulhenta.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Brand Philosophy */}
                    <section className="mb-24">
                        <BlueprintCard label="FILOSOFIA_BRAND" annotation="SILENT_LUXURY">
                            <div className="py-8 text-center">
                                <p className="text-2xl font-light text-[var(--nm-text-high)] italic leading-relaxed">
                                    "Numetria é treino. E treino constrói confiança cognitiva mensurável construída por método."
                                </p>
                            </div>
                        </BlueprintCard>
                    </section>

                    {/* Final Statement */}
                    <section className="text-center pt-12 border-t border-[var(--nm-grid-line)]">
                        <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.2em] mb-6">
                            NUMETRIA_SYSTEM
                        </div>
                        <p className="text-[var(--nm-text-dimmed)] max-w-xl mx-auto">
                            Abordagem racional. Estética minimalista. Evolução estrutural avançada. Desenvolvemos o processamento mental que o mundo moderno exige.
                        </p>
                    </section>

                </div>
            </main>

            <Footer />
        </div>
    )
}

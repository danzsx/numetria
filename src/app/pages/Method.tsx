import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { BlueprintCard } from '../components/BlueprintCard'
import { useAuth } from '../../contexts/AuthContext'
import { CheckCircle2, Zap, Target, BarChart3, Clock } from 'lucide-react'

export default function Method() {
    const { user } = useAuth()

    return (
        <div className="min-h-screen bg-[var(--nm-bg-main)]">
            <Header />

            <main className="pt-32 pb-24 px-6 md:px-12 relative overflow-hidden">
                {/* Background decorative elements */}
                <div
                    className="absolute inset-0 opacity-[0.02] pointer-events-none"
                    style={{
                        backgroundImage: `radial-gradient(var(--nm-accent-primary) 1px, transparent 1px)`,
                        backgroundSize: '32px 32px'
                    }}
                />
                <div className="absolute left-[-10%] top-[20%] opacity-[0.01] pointer-events-none select-none">
                    <div className="text-[25rem] font-[family-name:var(--font-data)] font-bold leading-none">
                        METHOD
                    </div>
                </div>

                <div className="max-w-4xl mx-auto relative z-10">

                    {/* Hero Section */}
                    <section className="mb-32">
                        <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.2em] mb-4">
                            SYSTEM_CORE_V1.1
                        </div>
                        <h1 className="text-4xl md:text-6xl font-semibold text-[var(--nm-text-high)] leading-[1.05] mb-8">
                            O Sistema Numetria de <br />
                            <span className="text-[var(--nm-accent-primary)]">Performance Cognitiva.</span>
                        </h1>
                        <p className="text-xl text-[var(--nm-text-dimmed)] leading-relaxed max-w-2xl">
                            Não ensinamos matemática. Desenvolvemos processamento mental. Nosso motor pedagógico é desenhado para transformar a carga cognitiva em fluidez intuitiva através de quatro pilares integrados.
                        </p>
                    </section>

                    {/* Logic Grid */}
                    <section className="mb-32">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'ESTABILIDADE', val: '98%', desc: 'Base sólida precede o ritmo.' },
                                { label: 'AUTOMAÇÃO', val: '0.4s', desc: 'Compressão de processos.' },
                                { label: 'VELOCIDADE', val: '12x', desc: 'Incremento progressivo.' },
                                { label: 'PRECISÃO', val: '100%', desc: 'Dados sobre emoção.' }
                            ].map((item, i) => (
                                <div key={i} className="border border-[var(--nm-grid-line)] p-6 rounded-[var(--radius-technical)] bg-[var(--nm-bg-surface)]/30">
                                    <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[9px] uppercase tracking-widest mb-4">
                                        {item.label}
                                    </div>
                                    <div className="text-3xl font-[family-name:var(--font-data)] text-[var(--nm-text-high)] mb-2">
                                        {item.val}
                                    </div>
                                    <div className="text-xs text-[var(--nm-text-dimmed)]">
                                        {item.desc}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Core Principles */}
                    <section className="mb-32">
                        <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.2em] mb-12 text-center">
                            PRINCÍPIOS_NORTEADORES
                        </div>

                        <div className="space-y-6">
                            <BlueprintCard label="P_01" annotation="STABILITY_FIRST">
                                <div className="flex flex-col md:flex-row gap-8 items-center p-4">
                                    <div className="w-16 h-16 rounded-full border-2 border-[var(--nm-accent-primary)]/20 flex items-center justify-center flex-shrink-0">
                                        <BarChart3 className="text-[var(--nm-accent-primary)]" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-[var(--nm-text-high)] mb-2">Estabilidade precede velocidade</h3>
                                        <p className="text-sm text-[var(--nm-text-dimmed)] leading-relaxed">
                                            A velocidade não é treinada diretamente no início. Primeiro consolidamos a precisão e a baixa variabilidade. Isso reduz a carga cognitiva e fortalece os circuitos neurais por repetição técnica estruturada.
                                        </p>
                                    </div>
                                </div>
                            </BlueprintCard>

                            <BlueprintCard label="P_02" annotation="LAYERED_LEARNING">
                                <div className="flex flex-col md:flex-row gap-8 items-center p-4">
                                    <div className="w-16 h-16 rounded-full border-2 border-[var(--nm-accent-primary)]/20 flex items-center justify-center flex-shrink-0">
                                        <Zap className="text-[var(--nm-accent-primary)]" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-[var(--nm-text-high)] mb-2">Estrutura antes de compressão</h3>
                                        <p className="text-sm text-[var(--nm-text-dimmed)] leading-relaxed">
                                            Respeitamos o desenvolvimento cognitivo em três níveis: Explícito Estruturado (entendimento), Guiado (prática assistida) e Comprimido (automação mental absoluta).
                                        </p>
                                    </div>
                                </div>
                            </BlueprintCard>

                            <BlueprintCard label="P_03" annotation="ERROR_AS_DATA">
                                <div className="flex flex-col md:flex-row gap-8 items-center p-4">
                                    <div className="w-16 h-16 rounded-full border-2 border-[var(--nm-accent-primary)]/20 flex items-center justify-center flex-shrink-0">
                                        <Target className="text-[var(--nm-accent-primary)]" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-[var(--nm-text-high)] mb-2">Erro como dado técnico</h3>
                                        <p className="text-sm text-[var(--nm-text-dimmed)] leading-relaxed">
                                            Não tratamos erros como falhas emocionais. São desvios estruturais analisados por algoritmo para identificar se a falha ocorreu na decomposição, transporte ou ritmo execution.
                                        </p>
                                    </div>
                                </div>
                            </BlueprintCard>
                        </div>
                    </section>

                    {/* The 5 Phases */}
                    <section className="mb-32">
                        <h2 className="text-2xl font-semibold text-[var(--nm-text-high)] mb-12 flex items-center gap-4">
                            <span className="text-[var(--nm-accent-primary)] font-[family-name:var(--font-data)] text-sm">//</span>
                            Arquitetura de Progressão
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {[
                                { name: 'Fundacional', icon: CheckCircle2, desc: 'Padrões Básicos' },
                                { name: 'Consolidação', icon: BarChart3, desc: 'Variações Técnicas' },
                                { name: 'Automação', icon: Zap, desc: 'Repetição Deliberada' },
                                { name: 'Ritmo', icon: Clock, desc: 'Estabilidade Sob Tempo' },
                                { name: 'Precisão', icon: Target, desc: 'Transferência Complexa' },
                            ].map((phase, i) => (
                                <div key={i} className="group relative pt-8 pb-6 px-4 border border-[var(--nm-grid-line)] rounded-[var(--radius-technical)] hover:border-[var(--nm-accent-primary)]/30 transition-all duration-300">
                                    <div className="absolute -top-3 left-4 px-2 bg-[var(--nm-bg-main)] text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[9px]">
                                        PHASE_0{i + 1}
                                    </div>
                                    <phase.icon className="text-[var(--nm-accent-primary)]/40 mb-4 group-hover:text-[var(--nm-accent-primary)] transition-colors" size={20} />
                                    <div className="text-sm font-medium text-[var(--nm-text-high)] mb-1">{phase.name}</div>
                                    <div className="text-[10px] text-[var(--nm-text-dimmed)] uppercase tracking-tight">{phase.desc}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Lesson DNA */}
                    <section className="mb-32">
                        <BlueprintCard label="DNA_DA_AULA" annotation="PROTOCOLO_ESTRUTURADO">
                            <div className="p-8">
                                <p className="text-[var(--nm-text-dimmed)] mb-12 leading-relaxed">
                                    Cada aula na Numetria é um simulador cognitivo. Não entregamos apenas exercícios; entregamos uma sequência deliberada de estímulos desenhados para a neuroplasticidade.
                                </p>
                                <div className="space-y-4">
                                    {[
                                        'Aquecimento Neural: Ativação de conhecimento prévio.',
                                        'Estrutura Técnica: Demonstração explícita da técnica.',
                                        'Execução Guiada: Validação de etapas intermediárias.',
                                        'Consolidação: Formação de rastro de memória.',
                                        'Compressão/Ritmo: Automação sob interferência.',
                                        'Síntese: Resumo técnico e recalibração.'
                                    ].map((step, i) => (
                                        <div key={i} className="flex items-center gap-4 text-sm text-[var(--nm-text-high)]">
                                            <span className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px]">[{i + 1}]</span>
                                            {step}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </BlueprintCard>
                    </section>

                    {/* Final Vision */}
                    <section className="text-center pt-16 border-t border-[var(--nm-grid-line)]">
                        <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.2em] mb-6">
                            MÉTODO_NUMETRIA
                        </div>
                        <p className="text-3xl font-light text-[var(--nm-text-high)] max-w-2xl mx-auto leading-tight italic">
                            "Clareza é o resultado da integração entre precisão, ritmo e consistência ao longo do tempo."
                        </p>
                    </section>

                </div>
            </main>

            <Footer />
        </div>
    )
}

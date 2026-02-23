import { Link } from 'react-router';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { BlueprintCard } from '../components/BlueprintCard';
import { ActionButton } from '../components/ActionButton';
import { Target, Zap, TrendingUp, Lock, Clock, AlertCircle, Brain, Calculator, ShieldCheck, CheckCircle2, BarChart2 } from 'lucide-react';

export default function LandingPage() {
    const pains = [
        {
            icon: Clock,
            title: 'Lento sob pressão'
        },
        {
            icon: AlertCircle,
            title: 'Erros por instabilidade'
        },
        {
            icon: Brain,
            title: 'Insegurança silenciosa'
        },
        {
            icon: Calculator,
            title: 'Dependência de ferramentas'
        }
    ];

    const pillars = [
        {
            icon: Lock,
            title: 'Estabilidade',
            description: 'Enxergue a consolidação da sua evolução de forma objetiva, com indicadores técnicos precisos.',
            color: 'text-[var(--nm-accent-stability)]'
        },
        {
            icon: Zap,
            title: 'Automação',
            description: 'O sistema ajusta a carga e elimina padrões nocivos automaticamente enquanto sua memória muscular atua.',
            color: 'text-[var(--nm-accent-primary)]'
        },
        {
            icon: TrendingUp,
            title: 'Velocidade',
            description: 'O ritmo evolui com você. O tempo é introduzido silenciosamente apenas quando a confiança estiver madura.',
            color: 'text-[var(--nm-text-high)]'
        },
        {
            icon: Target,
            title: 'Precisão',
            description: 'Corrija a rota analiticamente, descobrindo se você errou na decomposição, transporte ou ritmo.',
            color: 'text-[var(--nm-text-high)]'
        }
    ];

    return (
        <div className="min-h-screen bg-[var(--nm-bg-main)]">
            <Header />

            {/* 1. Hero Section */}
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
                <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
                    <div className="text-[24rem] font-[family-name:var(--font-data)] font-semibold tabular-nums text-[var(--nm-text-high)]">
                        100%
                    </div>
                </div>

                <div className="max-w-4xl mx-auto text-center relative z-10 lg:w-[720px]">
                    <h1 className="text-5xl md:text-6xl font-semibold text-[var(--nm-text-high)] mb-6 leading-tight">
                        Performance não é barulho. É controle.
                    </h1>

                    <p className="text-lg text-[var(--nm-text-dimmed)] mb-10 mx-auto leading-relaxed">
                        Desenvolva precisão, velocidade e estabilidade cognitiva através de um treinamento metódico focado em estruturação mental. Para quem quer parar de contar nos dedos e começar a pensar com clareza.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left w-full mx-auto justify-center max-w-2xl">
                        <div className="flex items-start gap-2 text-[var(--nm-text-high)] text-sm">
                            <CheckCircle2 size={16} className="text-[var(--nm-text-annotation)] mt-0.5 flex-shrink-0" />
                            <span>Redução da carga cognitiva diária</span>
                        </div>
                        <div className="flex items-start gap-2 text-[var(--nm-text-high)] text-sm">
                            <CheckCircle2 size={16} className="text-[var(--nm-text-annotation)] mt-0.5 flex-shrink-0" />
                            <span>Baixa variabilidade de tempo de resposta</span>
                        </div>
                        <div className="flex items-start gap-2 text-[var(--nm-text-high)] text-sm">
                            <CheckCircle2 size={16} className="text-[var(--nm-text-annotation)] mt-0.5 flex-shrink-0" />
                            <span>Precisão consistente sob pressão</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-2">
                        <Link to="/signup" className="w-full sm:w-auto">
                            <ActionButton variant="primary" className="w-full sm:w-auto bg-[#3A72F8]">
                                Iniciar Protocolo Fundacional
                            </ActionButton>
                        </Link>
                        <span className="text-[var(--nm-text-annotation)] text-xs">100% focado no desenvolvimento do seu raciocínio.</span>
                    </div>
                </div>
            </section>

            {/* 2. Seção de Dor */}
            <section className="py-24 px-6 border-t border-[var(--nm-grid-line)] bg-[var(--nm-bg-surface)]">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-semibold text-[var(--nm-text-high)] mb-6">
                        O problema não está na sua inteligência.
                    </h2>
                    <p className="text-[var(--nm-text-dimmed)] leading-relaxed mb-16 max-w-2xl mx-auto">
                        A maioria das pessoas experimenta insegurança silenciosa diante de cálculos básicos do dia a dia. A lentidão sob pressão, a dependência constante de uma calculadora e os erros provocados por instabilidade não são defeitos inatos. São sintomas de uma base não estruturada.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {pains.map((pain, index) => (
                            <div key={index} className="flex flex-col items-center p-6 border border-[var(--nm-grid-line)] rounded-[var(--radius-technical)]">
                                <pain.icon size={24} className="text-[var(--nm-text-annotation)] mb-4" />
                                <span className="text-sm font-semibold text-[var(--nm-text-high)]">{pain.title}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. Quebra de Paradigma */}
            <section className="py-24 px-6 border-t border-[var(--nm-grid-line)]">
                <div className="max-w-4xl mx-auto text-center lg:w-[720px]">
                    <h2 className="text-3xl font-semibold text-[var(--nm-text-high)] mb-6">
                        A matemática ensinada foca na resposta. O treino estruturado foca no processo.
                    </h2>
                    <p className="text-[var(--nm-text-dimmed)] leading-relaxed text-lg">
                        Quando a base neural não está habituada a agrupar números logicamente, seu cérebro consome energia excessiva, gerando cansaço e erro. <span className="text-[var(--nm-text-high)]">"Velocidade é consequência de estabilidade"</span>. Construir uma arquitetura mental eficiente exige praticar a decomposição e a compensação de maneira isolada antes de tentar acelerar o ritmo.
                    </p>
                </div>
            </section>

            {/* 4. O Mecanismo Único */}
            <section className="py-24 px-6 bg-[var(--nm-bg-surface)] border-t border-[var(--nm-grid-line)]">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-4">
                            O MECANISMO ÚNICO
                        </div>
                        <h2 className="text-3xl font-semibold text-[var(--nm-text-high)] mb-6">
                            O Sistema Proprietário de Quatro Pilares
                        </h2>
                        <p className="text-[var(--nm-text-dimmed)] leading-relaxed max-w-2xl mx-auto">
                            A arquitetura Numetria é orientada à diminuição de carga cognitiva em três etapas de aprendizado: Estrutura → Compressão → Ritmo. Os erros alimentam diretamente seu indicador de estabilidade, permitindo ajustar a calibragem da dificuldade sem interrupções artificiais.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {pillars.map((pillar, index) => (
                            <BlueprintCard
                                key={index}
                                label={`PILAR_0${index + 1}`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-[var(--radius-technical)] bg-[var(--nm-bg-main)] flex items-center justify-center flex-shrink-0 border border-[var(--nm-grid-line)]">
                                        <pillar.icon size={20} className={pillar.color} />
                                    </div>
                                    <div>
                                        <h3 className={`text-lg font-semibold text-[var(--nm-text-high)] mb-2`}>
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

            {/* 5. Como Funciona (Arquitetura do Produto) */}
            <section className="py-24 px-6 border-t border-[var(--nm-grid-line)]">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-semibold text-[var(--nm-text-high)] mb-4">
                            Treino desenhado para evolução contínua e silenciosa
                        </h2>
                        <p className="text-[var(--nm-text-dimmed)]">
                            Numetria não possui ranking ou aspecto social. A evolução é estritamente privada.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-8 rounded-[var(--radius-technical)] border border-[var(--nm-grid-line)] bg-[var(--nm-bg-surface)]">
                            <h3 className="text-xl font-semibold text-[var(--nm-text-high)] mb-6 flex items-center gap-2">
                                Núcleo Fundacional <span className="text-[10px] bg-[var(--nm-bg-main)] px-2 py-1 rounded text-[var(--nm-text-dimmed)]">GRATUITO</span>
                            </h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 size={18} className="text-[var(--nm-text-dimmed)] mt-0.5" />
                                    <span className="text-[var(--nm-text-dimmed)] text-sm">Acesso aos ciclos iniciais de treino</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 size={18} className="text-[var(--nm-text-dimmed)] mt-0.5" />
                                    <span className="text-[var(--nm-text-dimmed)] text-sm">Métricas de estabilidade essenciais</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 size={18} className="text-[var(--nm-text-dimmed)] mt-0.5" />
                                    <span className="text-[var(--nm-text-dimmed)] text-sm">Aulas estruturais focadas no processo base</span>
                                </li>
                            </ul>
                        </div>

                        <div className="p-8 rounded-[var(--radius-technical)] border border-[var(--nm-accent-primary)] bg-[var(--nm-bg-main)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--nm-accent-primary)] opacity-5 rounded-bl-full" />
                            <h3 className="text-xl font-semibold text-[var(--nm-accent-primary)] mb-6 flex items-center gap-2">
                                Protocolo Numetria Pro
                            </h3>
                            <ul className="space-y-4 relative z-10">
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 size={18} className="text-[var(--nm-accent-primary)] mt-0.5" />
                                    <span className="text-[var(--nm-text-high)] text-sm">Dashboard analítico avançado de performance</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 size={18} className="text-[var(--nm-accent-primary)] mt-0.5" />
                                    <span className="text-[var(--nm-text-high)] text-sm">Desbloqueio dos Módulos de Compressão e Ritmo</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 size={18} className="text-[var(--nm-accent-primary)] mt-0.5" />
                                    <span className="text-[var(--nm-text-high)] text-sm">Relatórios cognitivos de oscilação e retenção</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Prova Lógica */}
            <section className="py-24 px-6 bg-[var(--nm-bg-surface)] border-t border-[var(--nm-grid-line)]">
                <div className="max-w-4xl mx-auto text-center lg:w-[720px]">
                    <BarChart2 size={32} className="text-[var(--nm-text-dimmed)] mx-auto mb-6" />
                    <h2 className="text-3xl font-semibold text-[var(--nm-text-high)] mb-6">
                        Validação baseada em dados, não em promessas vazias.
                    </h2>
                    <p className="text-[var(--nm-text-dimmed)] leading-relaxed text-lg">
                        Um sistema só funciona se for mensurável. Seu Dashboard pessoal traduz a redução linear de oscilações (tempo e erro) nas equações mentais ao longo das semanas de uso.
                    </p>
                </div>
            </section>

            {/* 7. Oferta e 8. Garantia Técnica */}
            <section className="py-24 px-6 border-t border-[var(--nm-grid-line)]">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl font-semibold text-[var(--nm-text-high)] mb-6">
                                Consolide seu processamento.
                            </h2>
                            <p className="text-[var(--nm-text-dimmed)] leading-relaxed mb-8">
                                O acesso ao Protocolo Pro entrega os módulos avançados focados em compressão rítmica. Você terá histórico ilimitado, leitura de padrão cognitivo adaptativo e relatórios de progresso analíticos permanentes.
                            </p>
                            <Link to="/pro">
                                <ActionButton variant="primary" className="bg-[#3A72F8]">
                                    Acesse o protocolo completo
                                </ActionButton>
                            </Link>
                        </div>

                        <div className="p-8 rounded-[var(--radius-technical)] border border-[var(--nm-grid-line)] bg-[var(--nm-bg-surface)]">
                            <ShieldCheck size={32} className="text-[var(--nm-accent-stability)] mb-6" />
                            <h3 className="text-xl font-semibold text-[var(--nm-text-high)] mb-4">
                                Calibração Técnica Garantida
                            </h3>
                            <p className="text-[var(--nm-text-dimmed)] text-sm leading-relaxed">
                                O método funciona através da constância. Se durante os primeiros 7 dias a estrutura adaptativa não corresponder ao seu mapeamento cognitivo esperado, cancele com um único clique no seu painel. Sem fricção.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 9. Encerramento */}
            <section className="py-32 px-6 bg-[var(--nm-bg-main)] border-t border-[var(--nm-grid-line)] text-center">
                <h2 className="text-4xl font-semibold text-[var(--nm-text-high)] mb-10">
                    Inicie sua evolução estrutural.
                </h2>
                <Link to="/signup">
                    <ActionButton variant="primary" className="bg-[#3A72F8]">
                        Inicie sua evolução estrutural
                    </ActionButton>
                </Link>
            </section>

            <Footer />
        </div>
    );
}

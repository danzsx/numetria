import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { MobileNav } from '../components/MobileNav';
import { BlueprintCard } from '../components/BlueprintCard';
import { ActionButton } from '../components/ActionButton';
import { PaywallModal } from '../components/PaywallModal';
import { CheckCircle2, Play, Loader2, Star, Lock } from 'lucide-react';
import { useConceptProgress } from '../../hooks/useConceptProgress';
import { ConceptProgress } from '../../types/database';

// ─── Skeleton ─────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-[var(--nm-bg-surface)] rounded-[var(--radius-technical)] ${className ?? ''}`}
    />
  )
}

function LessonSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  )
}

// ─── Mapeamento de conceitos ──────────────────────────────────
// concept_id 1-8   → Fundacional
// concept_id 9-15  → Consolidação
// concept_id 16-18 → Automação (PRO)
// concept_id 19-21 → Ritmo (PRO)
// concept_id 22-24 → Precisão (PRO)

const FOUNDATIONAL_CONCEPTS = [
  { id: 1,  name: 'Multiplicação por 5' },
  { id: 2,  name: 'Soma até 100 com transporte' },
  { id: 3,  name: 'Multiplicação por 9' },
  { id: 4,  name: 'Divisão exata por 2' },
  { id: 5,  name: 'Multiplicação por 2 e 4' },
  { id: 6,  name: 'Adição de três parcelas' },
  { id: 7,  name: 'Subtração com resultado positivo' },
  { id: 8,  name: 'Multiplicação por 10 e 100' },
];

const CONSOLIDATION_CONCEPTS = [
  { id: 9,  name: 'Subtração com empréstimo' },
  { id: 10, name: 'Multiplicação por 3 e 6' },
  { id: 11, name: 'Divisão por 3 e 6' },
  { id: 12, name: 'Multiplicação por 7 e 8' },
  { id: 13, name: 'Divisão por 4 e 5' },
  { id: 14, name: 'Multiplicação por 11' },
  { id: 15, name: 'Divisão por 7 e 8' },
];

const AUTOMACAO_CONCEPTS = [
  { id: 16, name: 'Reconhecimento de Padrões' },
  { id: 17, name: 'Complementos Decimais I' },
  { id: 18, name: 'Complementos Decimais II' },
];

const RITMO_CONCEPTS = [
  { id: 19, name: 'Ritmo Base' },
  { id: 20, name: 'Pressão Temporal' },
  { id: 21, name: 'Fluxo Adaptativo' },
];

const PRECISAO_CONCEPTS = [
  { id: 22, name: 'Alternância ×÷ I' },
  { id: 23, name: 'Interferência Estrutural' },
  { id: 24, name: 'Precisão Integrada' },
];

// ─── Helpers ─────────────────────────────────────────────────

function conceptProgressToLessons(cp: ConceptProgress | null) {
  const toStatus = (s: string | null | undefined): 'locked' | 'available' | 'completed' => {
    if (s === 'completed') return 'completed';
    if (s === 'available') return 'available';
    return 'locked';
  };

  if (!cp) {
    return [
      { id: 1, name: 'Estrutura',  status: 'locked' as const },
      { id: 2, name: 'Compressão', status: 'locked' as const },
      { id: 3, name: 'Ritmo',      status: 'locked' as const },
    ];
  }

  const l1 = toStatus(cp.lesson_1_status);
  const l2 = toStatus(cp.lesson_2_status);
  const l3 = toStatus(cp.lesson_3_status);

  const effectiveL1 =
    (cp.status === 'available' || cp.status === 'in_progress') && l1 === 'locked'
      ? 'available'
      : l1;

  return [
    { id: 1, name: 'Estrutura',  status: effectiveL1 },
    { id: 2, name: 'Compressão', status: l2 },
    { id: 3, name: 'Ritmo',      status: l3 },
  ];
}

function conceptProgressPercent(cp: ConceptProgress | null): number {
  if (!cp) return 0;
  if (cp.status === 'mastered') return 100;
  const lessons = [cp.lesson_1_status, cp.lesson_2_status, cp.lesson_3_status];
  const done = lessons.filter((s) => s === 'completed').length;
  return Math.round((done / 3) * 100);
}

// ─── Componente raiz ─────────────────────────────────────────

export default function Modules() {
  const { moduleId } = useParams();

  if (!moduleId) {
    return <ModuleList />;
  }

  return <ModuleDetail moduleId={moduleId} />;
}

// ─── Lista de módulos ─────────────────────────────────────────

function ModuleList() {
  const { getModuleProgress, loading, isPro } = useConceptProgress();

  const foundationalProgress  = getModuleProgress(1, 8);
  const consolidationProgress = getModuleProgress(9, 15);
  const automacaoProgress     = getModuleProgress(16, 18);
  const ritmoProgress         = getModuleProgress(19, 21);
  const precisaoProgress      = getModuleProgress(22, 24);

  const freeModules = [
    {
      id: 'tabuada',
      name: 'Tabuada Estruturada',
      description: 'Automação e estabilidade básica das 4 operações fundamentais.',
      concepts: 40,
      progress: null,
      isNew: true,
      isPro: false,
    },
    {
      id: 'foundational',
      name: 'Fundacional',
      description: 'Construção de base sólida em operações fundamentais.',
      concepts: 8,
      progress: foundationalProgress,
      isPro: false,
    },
    {
      id: 'consolidation',
      name: 'Consolidação',
      description: 'Compressão neural através de repetição estruturada.',
      concepts: 7,
      progress: consolidationProgress,
      isPro: false,
    },
  ];

  const proModules = [
    {
      id: 'automacao',
      name: 'Automação',
      description: 'Reconhecimento de padrões e compressão neural avançada.',
      concepts: 3,
      progress: automacaoProgress,
      isPro: true,
    },
    {
      id: 'ritmo',
      name: 'Ritmo',
      description: 'Calibração de velocidade com cronômetro adaptativo.',
      concepts: 3,
      progress: ritmoProgress,
      isPro: true,
    },
    {
      id: 'precisao',
      name: 'Precisão',
      description: 'Interferência controlada e alternância de operações.',
      concepts: 3,
      progress: precisaoProgress,
      isPro: true,
    },
  ];

  const allModules = [...freeModules, ...proModules];

  return (
    <div className="min-h-screen">
      <Header isLoggedIn={true} />

      <main className="pt-24 pb-16 px-6 mb-16 md:mb-0">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <h1 className="text-3xl font-semibold text-[var(--nm-text-high)] mb-2">Módulos</h1>
            <p className="text-[var(--nm-text-dimmed)]">Progressão estruturada por conceitos isolados</p>
          </div>

          <div className="space-y-6">
            {allModules.map((module) => {
              const isProModule = module.isPro;
              const card = (
                <div
                  key={module.id}
                  className={isProModule ? 'rounded-[var(--radius-technical)] ring-1 ring-[#3A72F8]/40' : ''}
                >
                  <Link
                    to={module.id === 'tabuada' ? '/tabuada/setup' : `/modules/${module.id}`}
                  >
                    <BlueprintCard
                      label={module.id.toUpperCase()}
                      annotation={isProModule ? 'PRO' : (module.isNew ? 'NOVO' : `${module.concepts}_CONCEPTS`)}
                      onClick={() => {}}
                    >
                      <h3 className="text-xl font-semibold text-[var(--nm-text-high)] mb-2">
                        {module.name}
                      </h3>
                      <p className="text-sm text-[var(--nm-text-dimmed)] mb-4">
                        {module.description}
                      </p>

                      {!module.isNew && (
                        <div className="flex items-center gap-4">
                          {loading ? (
                            <Loader2 size={14} className="text-[var(--nm-text-annotation)] animate-spin" />
                          ) : (
                            <>
                              {isProModule && !isPro ? (
                                <div className="flex items-center gap-2">
                                  <Lock size={12} style={{ color: '#3A72F8' }} />
                                  <span
                                    className="text-xs font-[family-name:var(--font-data)] uppercase tracking-[0.1em]"
                                    style={{ color: '#3A72F8' }}
                                  >
                                    Requer Pro
                                  </span>
                                </div>
                              ) : (
                                <>
                                  <div className="flex-1 h-1 bg-[var(--nm-bg-main)] rounded-full overflow-hidden">
                                    <div
                                      className="h-full transition-all duration-500"
                                      style={{
                                        width: `${module.progress}%`,
                                        background: isProModule ? '#3A72F8' : 'var(--nm-accent-primary)',
                                      }}
                                    />
                                  </div>
                                  <div className="text-xs font-[family-name:var(--font-data)] text-[var(--nm-text-dimmed)] tabular-nums">
                                    {module.progress}%
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </BlueprintCard>
                  </Link>
                </div>
              );

              return card;
            })}
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}

// ─── Detalhe do módulo ────────────────────────────────────────

type ModuleData = {
  name: string
  description: string
  concepts: Array<{ id: number; name: string }>
  isPro?: boolean
}

function ModuleDetail({ moduleId }: { moduleId: string }) {
  const { getConceptById, loading, isPro } = useConceptProgress();
  const navigate = useNavigate();
  const [paywallModule, setPaywallModule] = useState<string | null>(null);

  const moduleData: Record<string, ModuleData> = {
    foundational: {
      name: 'Fundacional',
      description: 'Construção de base sólida em operações fundamentais.',
      concepts: FOUNDATIONAL_CONCEPTS,
    },
    consolidation: {
      name: 'Consolidação',
      description: 'Compressão neural através de repetição estruturada.',
      concepts: CONSOLIDATION_CONCEPTS,
    },
    automacao: {
      name: 'Automação',
      description: 'Reconhecimento de padrões e compressão neural avançada.',
      concepts: AUTOMACAO_CONCEPTS,
      isPro: true,
    },
    ritmo: {
      name: 'Ritmo',
      description: 'Calibração de velocidade com cronômetro adaptativo.',
      concepts: RITMO_CONCEPTS,
      isPro: true,
    },
    precisao: {
      name: 'Precisão',
      description: 'Interferência controlada e alternância de operações.',
      concepts: PRECISAO_CONCEPTS,
      isPro: true,
    },
  };

  const module = moduleData[moduleId];

  if (!module) {
    return <div>Módulo não encontrado</div>;
  }

  const handleStartLesson = (conceptId: number, lessonNumber: 1 | 2 | 3) => {
    if (conceptId >= 16 && !isPro) {
      console.log('[analytics] pro_paywall_view', { conceptId, moduleName: module.name });
      setPaywallModule(module.name);
      return;
    }
    navigate(`/tabuada/training?conceptId=${conceptId}&lessonNumber=${lessonNumber}`);
  };

  // Ícone por status de lição
  const getLessonIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle2 size={16} className="text-[var(--nm-accent-stability)]" />;
    if (status === 'available') return <Play         size={16} className="text-[var(--nm-accent-primary)]" />;
    return <Lock size={16} className="text-[var(--nm-text-annotation)] opacity-40" />;
  };

  // Ícone + estilo por status de conceito
  const getConceptStatusBadge = (status: string) => {
    switch (status) {
      case 'mastered':
        return (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-sm"
               style={{ background: 'rgba(255,193,7,0.12)', border: '1px solid rgba(255,193,7,0.4)' }}>
            <Star size={10} style={{ color: '#FFC107' }} />
            <span className="text-[10px] font-[family-name:var(--font-data)] uppercase tracking-[0.1em]"
                  style={{ color: '#FFC107' }}>
              Masterizado
            </span>
          </div>
        );
      case 'completed':
        return (
          <span className="text-[10px] font-[family-name:var(--font-data)] uppercase tracking-[0.1em] text-[var(--nm-accent-stability)]">
            Concluído
          </span>
        );
      case 'in_progress':
        return (
          <span className="text-[10px] font-[family-name:var(--font-data)] uppercase tracking-[0.1em] text-[var(--nm-accent-primary)]">
            Em progresso
          </span>
        );
      case 'available':
        return (
          <span className="text-[10px] font-[family-name:var(--font-data)] uppercase tracking-[0.1em] text-[var(--nm-text-annotation)]">
            Disponível
          </span>
        );
      case 'locked':
      default:
        return (
          <span className="text-[10px] font-[family-name:var(--font-data)] uppercase tracking-[0.1em] text-[var(--nm-text-annotation)] opacity-50">
            Bloqueado
          </span>
        );
    }
  };

  // Cor da barra de progresso por status
  const getProgressColor = (status: string, isProConcept: boolean): string => {
    if (isProConcept) return '#3A72F8';
    if (status === 'mastered')  return '#FFC107';
    if (status === 'completed') return 'var(--nm-accent-stability)';
    return 'var(--nm-accent-primary)';
  };

  const isProModule = module.isPro === true;

  return (
    <div className="min-h-screen">
      <Header isLoggedIn={true} />

      <main className="pt-24 pb-16 px-6 mb-16 md:mb-0">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <Link to="/modules" className="text-sm text-[var(--nm-text-dimmed)] hover:text-[var(--nm-text-high)] transition-colors">
              ← Voltar aos módulos
            </Link>
          </div>

          <div className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em]">
                {moduleId.toUpperCase()}
              </div>
              {isProModule && (
                <div
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.12em]"
                  style={{ background: 'rgba(58,114,248,0.12)', border: '1px solid rgba(58,114,248,0.4)', color: '#3A72F8' }}
                >
                  <Lock size={9} />
                  PRO
                </div>
              )}
            </div>
            <h1 className="text-3xl font-semibold text-[var(--nm-text-high)] mb-2">
              {module.name}
            </h1>
            <p className="text-[var(--nm-text-dimmed)]">{module.description}</p>
          </div>

          {loading ? (
            <div className="space-y-6">
              {module.concepts.map((c) => (
                <div key={c.id} className="space-y-3 p-5 border border-[var(--nm-grid-line)] rounded-[var(--radius-technical)]">
                  <Skeleton className="h-6 w-2/5" />
                  <LessonSkeleton />
                  <Skeleton className="h-1 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {module.concepts.map((concept, idx) => {
                const cp       = getConceptById(concept.id);
                const lessons  = conceptProgressToLessons(cp);
                const progress = conceptProgressPercent(cp);
                const status   = cp?.status ?? 'locked';
                const isMastered  = status === 'mastered';
                const isCompleted = status === 'completed' || isMastered;
                const isLocked    = status === 'locked';
                const isProConcept = concept.id >= 16;
                const isLockedPro  = isProConcept && !isPro;

                return (
                  <div
                    key={concept.id}
                    className={isProConcept ? 'rounded-[var(--radius-technical)] ring-1 ring-[#3A72F8]/40' : ''}
                  >
                    <BlueprintCard
                      label={`CONCEPT_${String(idx + 1).padStart(2, '0')}`}
                      annotation={isProConcept ? 'PRO' : undefined}
                    >
                      {/* Cabeçalho do conceito */}
                      <div className="flex items-start justify-between mb-4">
                        <h3
                          className="text-lg font-semibold"
                          style={{
                            color: isMastered
                              ? '#FFC107'
                              : isProConcept
                              ? '#3A72F8'
                              : isLocked
                              ? 'var(--nm-text-annotation)'
                              : 'var(--nm-text-high)',
                            opacity: isLocked && !isProConcept ? 0.5 : 1,
                          }}
                        >
                          {concept.name}
                        </h3>
                        {cp && !isProConcept && getConceptStatusBadge(status)}
                      </div>

                      {/* Lições */}
                      {isLockedPro ? (
                        /* Usuário free vendo conceito PRO: mostrar lições bloqueadas + CTA */
                        <div className="space-y-2 mb-4">
                          {['Estrutura', 'Compressão', 'Ritmo'].map((lessonName, i) => (
                            <div
                              key={i}
                              className="flex items-center p-3 rounded-[var(--radius-technical)] bg-[var(--nm-bg-main)]"
                              style={{ opacity: 0.45 }}
                            >
                              <Lock size={16} className="text-[var(--nm-text-annotation)] mr-3 flex-shrink-0" />
                              <span className="text-sm text-[var(--nm-text-annotation)]">{lessonName}</span>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              console.log('[analytics] pro_paywall_view', { conceptId: concept.id, moduleName: module.name });
                              setPaywallModule(module.name);
                            }}
                            className="w-full mt-1 py-2.5 px-4 text-sm rounded-[var(--radius-technical)] transition-colors border"
                            style={{
                              borderColor: 'rgba(58,114,248,0.6)',
                              color: '#3A72F8',
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(58,114,248,0.08)';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                            }}
                          >
                            Desbloquear com Protocolo Pro
                          </button>
                        </div>
                      ) : (
                        /* Lições normais (free concept ou Pro user) */
                        <div className="space-y-2 mb-4">
                          {lessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className={`flex items-center justify-between p-3 rounded-[var(--radius-technical)] transition-colors ${
                                lesson.status === 'available'
                                  ? 'bg-[var(--nm-bg-main)] border border-[var(--nm-accent-primary)]'
                                  : 'bg-[var(--nm-bg-main)]'
                              }`}
                              style={{
                                opacity: lesson.status === 'locked' ? 0.45 : 1,
                              }}
                            >
                              <div className="flex items-center gap-3">
                                {getLessonIcon(lesson.status)}
                                <span
                                  className="text-sm"
                                  style={{
                                    color:
                                      lesson.status === 'completed'
                                        ? 'var(--nm-text-high)'
                                        : lesson.status === 'available'
                                        ? 'var(--nm-text-high)'
                                        : 'var(--nm-text-annotation)',
                                  }}
                                >
                                  {lesson.name}
                                </span>
                              </div>

                              {lesson.status === 'available' && (
                                <ActionButton
                                  variant="primary"
                                  className="!py-1 !px-4 !text-sm"
                                  onClick={() => handleStartLesson(concept.id, lesson.id as 1 | 2 | 3)}
                                >
                                  Iniciar
                                </ActionButton>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Barra de progresso */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-1 bg-[var(--nm-bg-main)] rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all duration-500"
                            style={{
                              width: `${progress}%`,
                              background: getProgressColor(status, isProConcept),
                            }}
                          />
                        </div>
                        <div
                          className="text-xs font-[family-name:var(--font-data)] tabular-nums"
                          style={{ color: getProgressColor(status, isProConcept) }}
                        >
                          {progress}%
                        </div>
                      </div>

                      {/* Métricas do conceito */}
                      {cp?.last_precision != null && !isLockedPro && (
                        <div className="mt-3 pt-3 border-t border-[var(--nm-grid-line)]">
                          <div className="flex items-center gap-4 text-xs text-[var(--nm-text-annotation)]">
                            <span>
                              Última precisão:{' '}
                              <span className="text-[var(--nm-text-dimmed)]">
                                {cp.last_precision.toFixed(1)}%
                              </span>
                            </span>
                            {cp.total_sessions != null && cp.total_sessions > 0 && (
                              <span>
                                {cp.total_sessions}{' '}
                                {cp.total_sessions === 1 ? 'sessão' : 'sessões'}
                              </span>
                            )}
                            {isCompleted && concept.id < 15 && (
                              <span
                                className="ml-auto text-[10px] uppercase tracking-[0.08em]"
                                style={{ color: 'var(--nm-accent-stability)' }}
                              >
                                → próximo desbloqueado
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </BlueprintCard>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <MobileNav />

      <PaywallModal
        open={!!paywallModule}
        moduleName={paywallModule ?? ''}
        onClose={() => setPaywallModule(null)}
      />
    </div>
  );
}

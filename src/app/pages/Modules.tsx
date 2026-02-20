import { Link, useParams } from 'react-router';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { MobileNav } from '../components/MobileNav';
import { BlueprintCard } from '../components/BlueprintCard';
import { ActionButton } from '../components/ActionButton';
import { CheckCircle2, Circle, Play, Loader2, Star, Lock } from 'lucide-react';
import { useConceptProgress } from '../../hooks/useConceptProgress';
import { ConceptProgress } from '../../types/database';

// Mapeamento estático de conceitos pedagógicos
// concept_id 1-8  → módulo Foundational
// concept_id 9-15 → módulo Consolidation

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

// ─── Helpers ─────────────────────────────────────────────────

function conceptProgressToLessons(cp: ConceptProgress | null) {
  const toStatus = (s: string | null | undefined): 'locked' | 'available' | 'completed' => {
    if (s === 'completed') return 'completed';
    if (s === 'available') return 'available';
    return 'locked';
  };

  if (!cp) {
    return [
      { id: 1, name: 'Estrutura', status: 'locked' as const },
      { id: 2, name: 'Compressão', status: 'locked' as const },
      { id: 3, name: 'Ritmo', status: 'locked' as const },
    ];
  }

  const l1 = toStatus(cp.lesson_1_status);
  const l2 = toStatus(cp.lesson_2_status);
  const l3 = toStatus(cp.lesson_3_status);

  // Conceito available ou in_progress sem lição 1 iniciada → disponibilizar lição 1
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
  const { getModuleProgress, loading } = useConceptProgress();

  const foundationalProgress  = getModuleProgress(1, 8);
  const consolidationProgress = getModuleProgress(9, 15);

  const modules = [
    {
      id: 'tabuada',
      name: 'Tabuada Estruturada',
      description: 'Automação e estabilidade básica das 4 operações fundamentais.',
      concepts: 40,
      progress: null,
      isNew: true,
    },
    {
      id: 'foundational',
      name: 'Fundacional',
      description: 'Construção de base sólida em operações fundamentais.',
      concepts: 8,
      progress: foundationalProgress,
    },
    {
      id: 'consolidation',
      name: 'Consolidação',
      description: 'Compressão neural através de repetição estruturada.',
      concepts: 7,
      progress: consolidationProgress,
    },
  ];

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
            {modules.map((module) => (
              <Link
                key={module.id}
                to={module.id === 'tabuada' ? '/tabuada/setup' : `/modules/${module.id}`}
              >
                <BlueprintCard
                  label={module.id.toUpperCase()}
                  annotation={module.isNew ? 'NOVO' : `${module.concepts}_CONCEPTS`}
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
                          <div className="flex-1 h-1 bg-[var(--nm-bg-main)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--nm-accent-primary)] transition-all duration-500"
                              style={{ width: `${module.progress}%` }}
                            />
                          </div>
                          <div className="text-xs font-[family-name:var(--font-data)] text-[var(--nm-text-dimmed)] tabular-nums">
                            {module.progress}%
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </BlueprintCard>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}

// ─── Detalhe do módulo ────────────────────────────────────────

function ModuleDetail({ moduleId }: { moduleId: string }) {
  const { getConceptById, loading } = useConceptProgress();

  const moduleData: Record<string, { name: string; description: string; concepts: Array<{ id: number; name: string }> }> = {
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
  };

  const module = moduleData[moduleId];

  if (!module) {
    return <div>Módulo não encontrado</div>;
  }

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
  const getProgressColor = (status: string): string => {
    if (status === 'mastered')  return '#FFC107';
    if (status === 'completed') return 'var(--nm-accent-stability)';
    return 'var(--nm-accent-primary)';
  };

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
            <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-2">
              {moduleId.toUpperCase()}
            </div>
            <h1 className="text-3xl font-semibold text-[var(--nm-text-high)] mb-2">
              {module.name}
            </h1>
            <p className="text-[var(--nm-text-dimmed)]">{module.description}</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="text-[var(--nm-text-annotation)] animate-spin" />
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

                return (
                  <BlueprintCard
                    key={concept.id}
                    label={`CONCEPT_${String(idx + 1).padStart(2, '0')}`}
                  >
                    {/* Cabeçalho do conceito */}
                    <div className="flex items-start justify-between mb-4">
                      <h3
                        className="text-lg font-semibold"
                        style={{
                          color: isMastered
                            ? '#FFC107'
                            : isLocked
                            ? 'var(--nm-text-annotation)'
                            : 'var(--nm-text-high)',
                          opacity: isLocked ? 0.5 : 1,
                        }}
                      >
                        {concept.name}
                      </h3>
                      {cp && getConceptStatusBadge(status)}
                    </div>

                    {/* Lições */}
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
                            <Link to={`/lesson/${concept.id}/${lesson.id}`}>
                              <ActionButton variant="primary" className="!py-1 !px-4 !text-sm">
                                Iniciar
                              </ActionButton>
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Barra de progresso */}
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-1 bg-[var(--nm-bg-main)] rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${progress}%`,
                            background: getProgressColor(status),
                          }}
                        />
                      </div>
                      <div
                        className="text-xs font-[family-name:var(--font-data)] tabular-nums"
                        style={{ color: getProgressColor(status) }}
                      >
                        {progress}%
                      </div>
                    </div>

                    {/* Métricas do conceito */}
                    {cp?.last_precision != null && (
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
                          {/* Indicador de próximo conceito desbloqueado */}
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
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}

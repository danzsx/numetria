import { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { BlueprintCard } from '../components/BlueprintCard';
import { ActionButton } from '../components/ActionButton';
import { SessionMetrics } from '../utils/tabuadaEngine';
import { SessionResult } from '../../services/session.service';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface LessonResultState {
  metrics: SessionMetrics;
  analysis: {
    status: 'stable' | 'consolidating' | 'unstable';
    message: string;
    recommendation?: string;
  };
  conceptId: number;
  lessonNumber: number;
  result?: SessionResult | null;
}

const LESSON_NAMES: Record<number, string> = {
  1: 'Estrutura',
  2: 'Compressão',
  3: 'Ritmo',
};

export default function LessonResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const data = location.state as LessonResultState | null;

  useEffect(() => {
    if (!data) {
      navigate('/modules');
    }
  }, [data, navigate]);

  if (!data) return null;

  const { metrics, analysis, conceptId, lessonNumber, result } = data;
  const lessonName = LESSON_NAMES[lessonNumber] ?? `Aula ${lessonNumber}`;

  const getStatusColor = (status: string) => {
    if (status === 'stable')   return 'var(--nm-accent-stability)';
    if (status === 'unstable') return 'var(--nm-accent-error)';
    return 'var(--nm-accent-primary)';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'stable')   return <TrendingUp  size={20} />;
    if (status === 'unstable') return <TrendingDown size={20} />;
    return <Minus size={20} />;
  };

  const nextLessonNumber = lessonNumber + 1;
  const hasNextLesson = nextLessonNumber <= 3;
  // SQL unlocks next lesson for both stable and consolidating (anything except unstable)
  const canAdvance = analysis.status !== 'unstable';

  return (
    <div className="min-h-screen bg-[var(--nm-bg-main)]">
      <div className="pt-12 pb-16 px-6">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="mb-12 text-center">
            <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-4">
              AULA_CONCLUÍDA // CONCEPT_{String(conceptId).padStart(2, '0')}
            </div>
            <h1 className="text-3xl font-semibold text-[var(--nm-text-high)] mb-2">
              Análise — {lessonName}
            </h1>
            <p className="text-[var(--nm-text-dimmed)] text-sm">
              Aula {lessonNumber} de 3
            </p>
          </div>

          <div className="space-y-6">
            {/* Status */}
            <BlueprintCard label="STATUS">
              <div
                className="flex items-center gap-3 mb-3"
                style={{ color: getStatusColor(analysis.status) }}
              >
                {getStatusIcon(analysis.status)}
                <h3 className="text-xl font-semibold">{analysis.message}</h3>
              </div>
              {analysis.recommendation && (
                <p className="text-sm text-[var(--nm-text-dimmed)]">{analysis.recommendation}</p>
              )}
            </BlueprintCard>

            {/* Métricas */}
            <div className="grid grid-cols-2 gap-4">
              <BlueprintCard>
                <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-2">
                  PRECISÃO
                </div>
                <div className="text-4xl font-[family-name:var(--font-data)] font-semibold text-[var(--nm-text-high)] tabular-nums">
                  {metrics.precision.toFixed(1)}%
                </div>
                <div className="text-xs text-[var(--nm-text-dimmed)] mt-1">
                  {metrics.correctAnswers}/{metrics.totalProblems} corretas
                </div>
              </BlueprintCard>

              <BlueprintCard>
                <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-2">
                  TEMPO MÉDIO
                </div>
                <div className="text-4xl font-[family-name:var(--font-data)] font-semibold text-[var(--nm-text-high)] tabular-nums">
                  {(metrics.avgTime / 1000).toFixed(1)}s
                </div>
                <div className="text-xs text-[var(--nm-text-dimmed)] mt-1">
                  por evocação
                </div>
              </BlueprintCard>
            </div>

            {/* Streak */}
            {result && (
              <BlueprintCard label="SEQUÊNCIA">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-3xl font-[family-name:var(--font-data)] font-semibold text-[var(--nm-text-high)] tabular-nums">
                      {result.streak}
                    </div>
                    <div className="text-xs text-[var(--nm-text-dimmed)] mt-1">
                      {result.streak === 1 ? 'dia consecutivo' : 'dias consecutivos'}
                    </div>
                  </div>
                  <div className="flex-1 text-xs text-[var(--nm-text-annotation)] text-right">
                    Sessão registrada
                  </div>
                </div>
              </BlueprintCard>
            )}

            {/* Próximo passo */}
            <BlueprintCard label="PRÓXIMO_PASSO">
              {analysis.status === 'unstable' && (
                <div className="mb-4 p-3 rounded-[var(--radius-technical)] border border-[var(--nm-accent-error)] bg-[var(--nm-bg-main)]">
                  <div className="text-[10px] font-[family-name:var(--font-data)] uppercase tracking-[0.1em] text-[var(--nm-accent-error)] mb-1">
                    REFORÇO_RECOMENDADO
                  </div>
                  <p className="text-xs text-[var(--nm-text-dimmed)] leading-relaxed">
                    Repita esta aula antes de avançar para consolidar o padrão de evocação.
                  </p>
                </div>
              )}

              {canAdvance && hasNextLesson ? (
                <div>
                  <div className="text-sm text-[var(--nm-text-dimmed)] mb-4">
                    Aula {nextLessonNumber} — {LESSON_NAMES[nextLessonNumber]} desbloqueada.
                  </div>
                  <Link to={`/lesson/${conceptId}/${nextLessonNumber}`}>
                    <button className="w-full py-2 px-4 rounded-[var(--radius-technical)] border border-[var(--nm-accent-primary)] text-[var(--nm-accent-primary)] text-sm hover:bg-[var(--nm-accent-primary)] hover:text-[var(--nm-bg-main)] transition-colors">
                      Iniciar Aula {nextLessonNumber}
                    </button>
                  </Link>
                </div>
              ) : canAdvance && !hasNextLesson ? (
                <p className="text-sm text-[var(--nm-accent-stability)]">
                  Conceito concluído. Verifique os módulos para o próximo.
                </p>
              ) : (
                <p className="text-sm text-[var(--nm-text-dimmed)]">
                  Reforço recomendado antes de avançar. Repita esta aula para estabilizar o padrão.
                </p>
              )}
            </BlueprintCard>

            {/* Ação principal */}
            <Link to="/modules">
              <ActionButton variant="primary" className="w-full">
                Voltar aos módulos
              </ActionButton>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

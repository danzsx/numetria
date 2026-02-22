import { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { BlueprintCard } from '../components/BlueprintCard';
import { ActionButton } from '../components/ActionButton';
import {
  SessionMetrics,
  TabuadaConfig,
  getOperationName,
  getLevel,
  getLevelDescription,
  Mode,
  TimerMode,
  Operation,
  ProMode,
} from '../utils/tabuadaEngine';
import { SessionResult } from '../../services/session.service';
import { TrendingUp, TrendingDown, Minus, ChevronUp, RotateCcw, Equal } from 'lucide-react';

interface ResultState {
  metrics: SessionMetrics;
  analysis: {
    status: 'stable' | 'consolidating' | 'unstable';
    message: string;
    recommendation?: string;
  };
  config: TabuadaConfig;
  result?: SessionResult | null;
  conceptId?: number | null;
  lessonNumber?: number | null;
  proMode?: ProMode | null;
}

// ─── Utilitários adaptativos ─────────────────────────────────

function levelToConfig(
  level: number,
  base: number,
  operation: Operation
): TabuadaConfig {
  const map: Record<number, { mode: Mode; timerMode: TimerMode }> = {
    1: { mode: 'sequential', timerMode: 'untimed' },
    2: { mode: 'random',     timerMode: 'untimed' },
    3: { mode: 'sequential', timerMode: 'timed'   },
    4: { mode: 'random',     timerMode: 'timed'   },
  };
  const safeLevel = Math.min(4, Math.max(1, level));
  const { mode, timerMode } = map[safeLevel];
  return { operation, base, mode, timerMode };
}

interface NextStep {
  config: TabuadaConfig;
  label: string;
  reason: string;
  direction: 'advance' | 'maintain' | 'reinforce';
}

function getNextStep(
  config: TabuadaConfig,
  status: 'stable' | 'consolidating' | 'unstable',
  result: SessionResult | null
): NextStep {
  const currentLevel = getLevel(config);

  if (status === 'stable') {
    // Servidor já atualizou o adaptive_level: usar esse valor
    const nextLevel = result ? result.adaptive_level : Math.min(4, currentLevel + 1);
    return {
      config:    levelToConfig(nextLevel, config.base, config.operation),
      label:     `Avançar para Nível ${nextLevel}`,
      reason:    'Estabilização confirmada. Sistema preparado para o próximo nível de automação.',
      direction: 'advance',
    };
  }

  if (status === 'unstable') {
    const regressLevel = result ? result.adaptive_level : Math.max(1, currentLevel - 1);
    return {
      config:    levelToConfig(regressLevel, config.base, config.operation),
      label:     'Reforço estrutural',
      reason:    'Interferência detectada. Consolidando padrão no nível base antes de avançar.',
      direction: 'reinforce',
    };
  }

  // consolidating: manter nível atual
  return {
    config:    levelToConfig(currentLevel, config.base, config.operation),
    label:     'Repetir configuração',
    reason:    'Continue consolidando. Mais repetições estabilizarão o padrão de evocação.',
    direction: 'maintain',
  };
}

// ─── Componente ──────────────────────────────────────────────

export default function TabuadaResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const data = location.state as ResultState | null;

  useEffect(() => {
    if (!data) {
      navigate('/tabuada/setup');
    }
  }, [data, navigate]);

  useEffect(() => {
    if (data?.result?.new_status === 'mastered' && data?.conceptId) {
      console.log('[analytics] concept_mastered', { conceptId: data.conceptId, lessonNumber: data.lessonNumber });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!data) return null;

  const { metrics, analysis, config, result, conceptId } = data;

  const isPro = conceptId != null && conceptId >= 16;

  // Índice de Estabilidade PRO
  const stabilityScore = isPro && metrics.avgTime > 0
    ? Math.max(0, (metrics.correctAnswers / metrics.totalProblems) * (1 - metrics.timeVariability / metrics.avgTime) * 100)
    : 0;

  const isCompressionMode = isPro && analysis.status === 'stable' && metrics.precision >= 95 && stabilityScore > 85;

  const level    = getLevel(config);
  const levelDesc = getLevelDescription(level);
  const nextStep  = getNextStep(config, analysis.status, result ?? null);

  const getStatusColor = (status: string) => {
    if (status === 'stable')   return 'var(--nm-accent-stability)';
    if (status === 'unstable') return 'var(--nm-accent-error)';
    return 'var(--nm-accent-primary)';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'stable')   return <TrendingUp   size={20} />;
    if (status === 'unstable') return <TrendingDown  size={20} />;
    return <Minus size={20} />;
  };

  const getDirectionIcon = (direction: NextStep['direction']) => {
    if (direction === 'advance')  return <ChevronUp  size={16} />;
    if (direction === 'reinforce') return <RotateCcw size={16} />;
    return <Equal size={16} />;
  };

  const getDirectionColor = (direction: NextStep['direction']): string => {
    if (direction === 'advance')  return 'var(--nm-accent-stability)';
    if (direction === 'reinforce') return 'var(--nm-accent-error)';
    return 'var(--nm-accent-primary)';
  };

  const handleRetry = () => {
    navigate('/tabuada/training', { state: { config } });
  };

  const handleNewConfig = () => {
    navigate('/tabuada/setup');
  };

  const handleNextStep = () => {
    navigate('/tabuada/training', { state: { config: nextStep.config } });
  };

  return (
    <div className="min-h-screen bg-[var(--nm-bg-main)]">
      <div className="pt-12 pb-16 px-6">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="mb-12 text-center">
            <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-4">
              SESSÃO_CONCLUÍDA
            </div>
            <h1 className="text-3xl font-semibold text-[var(--nm-text-high)] mb-2">
              Análise de Performance
            </h1>
            <p className="text-[var(--nm-text-dimmed)] text-sm">
              {getOperationName(config.operation)} por {config.base} — Nível {level}
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
                <h3 className="text-xl font-semibold">
                  {analysis.message}
                </h3>
              </div>
              {analysis.recommendation && (
                <p className="text-sm text-[var(--nm-text-dimmed)]">
                  {analysis.recommendation}
                </p>
              )}
            </BlueprintCard>

            {/* Métricas principais */}
            <div className="grid grid-cols-2 gap-4">
              <BlueprintCard>
                <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-2">
                  {isPro ? 'ÍNDICE_DE_ESTABILIDADE' : 'PRECISÃO'}
                </div>
                <div className="text-4xl font-[family-name:var(--font-data)] font-semibold text-[var(--nm-text-high)] tabular-nums">
                  {isPro ? `${stabilityScore.toFixed(1)}%` : `${metrics.precision.toFixed(1)}%`}
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

            {/* MODO_COMPRESSÃO badge — sessões PRO com alta estabilidade e precisão */}
            {isCompressionMode && (
              <BlueprintCard>
                <div className="text-[var(--nm-accent-primary)] font-[family-name:var(--font-data)] text-xs tracking-widest uppercase">
                  MODO_COMPRESSÃO · Etapas visuais reduzidas na próxima sessão
                </div>
              </BlueprintCard>
            )}

            {/* Métricas secundárias */}
            <BlueprintCard label="ANÁLISE_TÉCNICA">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-[var(--nm-grid-line)]">
                  <span className="text-sm text-[var(--nm-text-dimmed)]">Variabilidade temporal</span>
                  <span className="text-sm font-[family-name:var(--font-data)] text-[var(--nm-text-high)] tabular-nums">
                    {(metrics.timeVariability / 1000).toFixed(2)}s
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[var(--nm-grid-line)]">
                  <span className="text-sm text-[var(--nm-text-dimmed)]">Tempo total</span>
                  <span className="text-sm font-[family-name:var(--font-data)] text-[var(--nm-text-high)] tabular-nums">
                    {(metrics.totalTime / 1000).toFixed(1)}s
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-[var(--nm-text-dimmed)]">Configuração</span>
                  <span className="text-xs text-[var(--nm-text-annotation)]">
                    {levelDesc.split('—')[0].trim()}
                  </span>
                </div>
              </div>
            </BlueprintCard>

            {/* Streak (se sessão salva) */}
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

            {/* ─── Próximo Passo Adaptativo ─── */}
            <BlueprintCard label="PRÓXIMO_PASSO">
              {/* Direção */}
              <div
                className="flex items-center gap-2 mb-3"
                style={{ color: getDirectionColor(nextStep.direction) }}
              >
                {getDirectionIcon(nextStep.direction)}
                <span className="text-sm font-semibold">
                  {nextStep.label}
                </span>
                {result && (
                  <span className="ml-auto text-[10px] font-[family-name:var(--font-data)] uppercase tracking-[0.08em] text-[var(--nm-text-annotation)]">
                    Nível {result.adaptive_level}
                  </span>
                )}
              </div>

              {/* Config do próximo passo */}
              <div className="flex gap-2 mb-3">
                <span className="px-2 py-0.5 rounded-sm bg-[var(--nm-bg-main)] border border-[var(--nm-grid-line)] text-[10px] font-[family-name:var(--font-data)] text-[var(--nm-text-annotation)] uppercase tracking-[0.08em]">
                  {nextStep.config.mode === 'sequential' ? 'Sequencial' : 'Aleatório'}
                </span>
                <span className="px-2 py-0.5 rounded-sm bg-[var(--nm-bg-main)] border border-[var(--nm-grid-line)] text-[10px] font-[family-name:var(--font-data)] text-[var(--nm-text-annotation)] uppercase tracking-[0.08em]">
                  {nextStep.config.timerMode === 'timed' ? 'Com cronômetro' : 'Sem cronômetro'}
                </span>
              </div>

              {/* Razão */}
              <p className="text-xs text-[var(--nm-text-dimmed)] mb-4 leading-relaxed">
                {nextStep.reason}
              </p>

              {/* Reforço estrutural: alerta adicional se unstable */}
              {analysis.status === 'unstable' && (
                <div className="mb-4 p-3 rounded-[var(--radius-technical)] border border-[var(--nm-accent-error)] bg-[var(--nm-bg-main)]">
                  <div className="text-[10px] font-[family-name:var(--font-data)] uppercase tracking-[0.1em] text-[var(--nm-accent-error)] mb-1">
                    REFORÇO_ESTRUTURAL
                  </div>
                  <p className="text-xs text-[var(--nm-text-dimmed)] leading-relaxed">
                    Retorne ao modo sequencial sem cronômetro para reconstruir o padrão de evocação antes de avançar.
                  </p>
                </div>
              )}

              <button
                onClick={handleNextStep}
                className="w-full py-2 px-4 rounded-[var(--radius-technical)] border border-[var(--nm-accent-primary)] text-[var(--nm-accent-primary)] text-sm hover:bg-[var(--nm-accent-primary)] hover:text-[var(--nm-bg-main)] transition-colors"
              >
                Treinar agora
              </button>
            </BlueprintCard>

            {/* Ações */}
            <div className="flex gap-3">
              <ActionButton
                variant="secondary"
                onClick={handleRetry}
                className="flex-1"
              >
                Repetir treino
              </ActionButton>
              <ActionButton
                variant="primary"
                onClick={handleNewConfig}
                className="flex-1"
              >
                Nova configuração
              </ActionButton>
            </div>

            {/* Voltar ao dashboard */}
            <div className="text-center">
              <Link
                to="/dashboard"
                className="text-sm text-[var(--nm-text-dimmed)] hover:text-[var(--nm-text-high)] transition-colors"
              >
                Voltar ao dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

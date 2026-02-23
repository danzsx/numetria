import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { MobileNav } from '../components/MobileNav'
import { BlueprintCard } from '../components/BlueprintCard'
import { ActionButton } from '../components/ActionButton'
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts'
import { Lock } from 'lucide-react'
import { useMetrics } from '../../hooks/useMetrics'
import { useAuth } from '../../contexts/AuthContext'
import { userService } from '../../services/user.service'
import type { ConceptProgress, DailyMetric } from '../../types/database'
import { findNextTrailAction } from '../utils/moduleContext'
import type { ModuleId } from '../utils/moduleContext'
import { trackFlowEvent } from '../utils/flowTelemetry'
import { isModuleEnabled } from '../utils/moduleFlags'

// ── Helpers ────────────────────────────────────────────────────────────────

function avg(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null && !isNaN(v))
  if (valid.length === 0) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

function calcModuleProgressWeighted(
  summary: ConceptProgress[],
  fromId: number,
  toId: number
): number {
  const inRange = summary.filter(c => c.concept_id >= fromId && c.concept_id <= toId)
  if (inRange.length === 0) return 0
  const totalWeight = inRange.reduce((acc, c) => {
    if (c.status === 'mastered') return acc + 100
    if (c.status === 'completed') return acc + 75
    if (c.status === 'in_progress') return acc + 30
    return acc
  }, 0)
  return Math.round(totalWeight / inRange.length)
}

function formatToday(): string {
  return new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).toUpperCase()
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-[var(--nm-bg-surface)] rounded-[var(--radius-technical)] ${className ?? ''}`}
    />
  )
}

// ── Component ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { dashboardData, loading, error } = useMetrics()
  const [isPro, setIsPro] = useState(false)

  useEffect(() => {
    userService.getPlanStatus().then(s => setIsPro(s.is_active)).catch(() => { })
  }, [])

  // Derived data
  const last30: DailyMetric[] = dashboardData?.last_30_days ?? []
  const last7 = last30.slice(-7)
  const prev7 = last30.slice(-14, -7)
  const conceptSummary = dashboardData?.concept_summary ?? []
  const streak = dashboardData?.streak?.current_streak_days ?? 0
  const nextTrailAction = findNextTrailAction(conceptSummary, isPro)

  const handleContinueTrail = () => {
    if (!nextTrailAction) return

    trackFlowEvent('dashboard_continue_trail_click', {
      moduleId: nextTrailAction.moduleId,
      moduleName: nextTrailAction.moduleName,
      conceptId: nextTrailAction.conceptId,
      conceptName: nextTrailAction.conceptName,
      lessonNumber: nextTrailAction.lessonNumber,
    })

    navigate(
      `/tabuada/training?conceptId=${nextTrailAction.conceptId}&lessonNumber=${nextTrailAction.lessonNumber}`,
      {
        state: {
          moduleJourney: {
            moduleId: nextTrailAction.moduleId,
            moduleName: nextTrailAction.moduleName,
            conceptId: nextTrailAction.conceptId,
            conceptName: nextTrailAction.conceptName,
            lessonNumber: nextTrailAction.lessonNumber,
          },
        },
      }
    )
  }

  const avgPrecision = avg(last7.map((d) => d.precision_pct))
  const avgTime = avg(last7.map((d) => d.avg_time_ms))
  const avgStability = avg(last7.map((d) => d.stability_score))
  const prevPrecision = avg(prev7.map((d) => d.precision_pct))

  const weeklyChange =
    avgPrecision !== null && prevPrecision !== null
      ? avgPrecision - prevPrecision
      : null

  // Chart data (last 7 days of precision)
  const chartData = last7.map((d, i) => ({
    day: i + 1,
    value: d.precision_pct ?? 0,
  }))

  // Modules
  const modules = [
    {
      id: 'foundational',
      name: 'Fundacional',
      progress: calcModuleProgressWeighted(conceptSummary, 1, 8),
      concepts: 8,
      locked: false,
      isPro: false,
    },
    {
      id: 'consolidation',
      name: 'Consolidação',
      progress: calcModuleProgressWeighted(conceptSummary, 9, 15),
      concepts: 7,
      locked: false,
      isPro: false,
    },
    {
      id: 'automacao',
      name: 'Automação',
      progress: calcModuleProgressWeighted(conceptSummary, 16, 18),
      concepts: 3,
      locked: !isPro,
      isPro: true,
    },
    {
      id: 'ritmo',
      name: 'Ritmo',
      progress: calcModuleProgressWeighted(conceptSummary, 19, 21),
      concepts: 3,
      locked: !isPro,
      isPro: true,
    },
    {
      id: 'precisao',
      name: 'Precisão',
      progress: calcModuleProgressWeighted(conceptSummary, 22, 24),
      concepts: 3,
      locked: !isPro,
      isPro: true,
    },
  ].filter((module) => isModuleEnabled(module.id as ModuleId))

  // Display name
  const displayName =
    dashboardData?.profile?.display_name ??
    user?.email?.split('@')[0] ??
    null

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen">
      <Header isLoggedIn={!!user} />

      <main className="pt-24 pb-16 px-6 mb-16 md:mb-0">
        <div className="max-w-3xl mx-auto">

          {/* Welcome */}
          <div className="mb-12">
            <h1 className="text-3xl font-semibold text-[var(--nm-text-high)] mb-2">
              {displayName ? `Olá, ${displayName}` : 'Dashboard'}
            </h1>
            <p className="text-[var(--nm-text-dimmed)]">
              {streak > 0
                ? `Sequência ativa: ${streak} dia${streak !== 1 ? 's' : ''} // ${formatToday()}`
                : `Sessão ativa // ${formatToday()}`}
            </p>
          </div>

          {/* Error state */}
          {error && (
            <div className="mb-8 p-4 border border-[var(--nm-accent-error,#ef4444)] rounded-[var(--radius-technical)] text-sm text-[var(--nm-text-dimmed)]">
              <span className="font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] text-[var(--nm-text-annotation)] block mb-1">
                ERRO_CONEXAO
              </span>
              {error}
            </div>
          )}

          {/* Continue Trail */}
          <section className="mb-12">
            <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-4">
              CONTINUAR_TRILHA
            </div>
            <BlueprintCard label="PROXIMA_ACAO">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-5 w-1/3" />
                </div>
              ) : !nextTrailAction ? (
                <p className="text-sm text-[var(--nm-text-dimmed)]">
                  Nenhum modulo esta ativo nesta onda de rollout.
                </p>
              ) : (
                <>
                  <div className="text-sm text-[var(--nm-text-dimmed)] mb-2">
                    Modulo atual
                  </div>
                  <div className="text-lg font-semibold text-[var(--nm-text-high)] mb-3">
                    {nextTrailAction.moduleName}
                  </div>
                  <div className="text-sm text-[var(--nm-text-dimmed)] mb-1">
                    Conceito atual
                  </div>
                  <div className="text-[var(--nm-text-high)] mb-3">
                    {nextTrailAction.conceptName}
                  </div>
                  <div className="text-sm text-[var(--nm-text-dimmed)] mb-1">
                    Proxima aula recomendada
                  </div>
                  <div className="text-[var(--nm-text-high)] mb-4">
                    Aula {nextTrailAction.lessonNumber} - {nextTrailAction.lessonLabel}
                  </div>
                  <ActionButton
                    variant="primary"
                    className="w-full"
                    onClick={handleContinueTrail}
                  >
                    Continuar de onde parei
                  </ActionButton>
                </>
              )}
            </BlueprintCard>
          </section>

          {/* Classifier quick-access */}
          <section className="mb-12">
            <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-4">
              CLASSIFICADOR_OPERAÇÕES
            </div>
            <Link to="/classify">
              <BlueprintCard label="ANALYZE" annotation="NOVO" onClick={() => { }}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-[var(--radius-technical)] bg-[var(--nm-accent-primary)]/10 flex items-center justify-center flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--nm-accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[var(--nm-text-high)] mb-1">
                      Classificador Estrutural
                    </h3>
                    <p className="text-sm text-[var(--nm-text-dimmed)]">
                      Digite uma operação e descubra qual conceito e aula são mais relevantes.
                    </p>
                  </div>
                </div>
              </BlueprintCard>
            </Link>
          </section>

          {/* Metrics Block */}
          <section className="mb-12">
            <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-4">
              RESUMO_ATUAL
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <BlueprintCard label="ACCURACY">
                  <div className="text-3xl font-[family-name:var(--font-data)] font-semibold text-[var(--nm-text-high)] tabular-nums">
                    {avgPrecision !== null ? `${avgPrecision.toFixed(1)}%` : '--'}
                  </div>
                  <div className="text-xs text-[var(--nm-text-dimmed)] mt-1">
                    Precisão média 7d
                  </div>
                </BlueprintCard>

                <BlueprintCard label="TIME">
                  <div className="text-3xl font-[family-name:var(--font-data)] font-semibold text-[var(--nm-text-high)] tabular-nums">
                    {avgTime !== null ? `${(avgTime / 1000).toFixed(1)}s` : '--'}
                  </div>
                  <div className="text-xs text-[var(--nm-text-dimmed)] mt-1">
                    Tempo médio 7d
                  </div>
                </BlueprintCard>

                <BlueprintCard label="STABILITY">
                  <div className="text-3xl font-[family-name:var(--font-data)] font-semibold text-[var(--nm-accent-stability)] tabular-nums">
                    {avgStability !== null ? avgStability.toFixed(1) : '--'}
                  </div>
                  <div className="text-xs text-[var(--nm-text-dimmed)] mt-1">
                    Índice estável 7d
                  </div>
                </BlueprintCard>

                <BlueprintCard label="DELTA_7D">
                  <div className="text-3xl font-[family-name:var(--font-data)] font-semibold text-[var(--nm-text-high)] tabular-nums">
                    {weeklyChange !== null
                      ? `${weeklyChange >= 0 ? '+' : ''}${weeklyChange.toFixed(1)}%`
                      : '--'}
                  </div>
                  <div className="text-xs text-[var(--nm-text-dimmed)] mt-1">
                    Variação semanal
                  </div>
                </BlueprintCard>
              </div>
            )}
          </section>

          {/* Modules Block */}
          <section className="mb-12">
            <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-4">
              MAPA_MODULOS
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {modules.map((module) => (
                  <div
                    key={module.id}
                    className={module.isPro ? 'rounded-[var(--radius-technical)] ring-1 ring-[#3A72F8]/40' : ''}
                  >
                    <Link to={`/modules/${module.id}`}>
                      <BlueprintCard
                        label={module.id.toUpperCase()}
                        annotation={module.isPro ? 'PRO' : `${module.concepts}_CONCEPTS`}
                        onClick={() => { }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-[var(--nm-text-high)]">
                                {module.name}
                              </h3>
                              {module.locked && (
                                <Lock
                                  size={16}
                                  style={module.isPro
                                    ? { color: '#3A72F8' }
                                    : { color: 'var(--nm-text-annotation)' }}
                                />
                              )}
                            </div>

                            {module.locked ? (
                              <div
                                className="text-xs"
                                style={module.isPro
                                  ? { color: '#3A72F8', opacity: 0.7 }
                                  : { color: 'var(--nm-text-annotation)' }}
                              >
                                Requer Protocolo Pro
                              </div>
                            ) : (
                              <div className="flex items-center gap-4">
                                <div className="flex-1 h-1 bg-[var(--nm-bg-main)] rounded-full overflow-hidden">
                                  <div
                                    className="h-full transition-all duration-500"
                                    style={{
                                      width: `${module.progress}%`,
                                      background: module.isPro
                                        ? '#3A72F8'
                                        : 'var(--nm-accent-primary)',
                                    }}
                                  />
                                </div>
                                <div className="text-xs font-[family-name:var(--font-data)] text-[var(--nm-text-dimmed)] tabular-nums">
                                  {module.progress}%
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </BlueprintCard>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* History Block */}
          <section>
            <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-4">
              HISTORICO_7D
            </div>

            {loading ? (
              <Skeleton className="h-48" />
            ) : chartData.length === 0 ? (
              <BlueprintCard label="ACCURACY_TREND">
                <div className="h-32 flex items-center justify-center">
                  <p className="text-sm text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)]">
                    SEM_DADOS // Complete uma sessão para ver o gráfico
                  </p>
                </div>
              </BlueprintCard>
            ) : (
              <BlueprintCard label="ACCURACY_TREND">
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <YAxis domain={[0, 100]} hide />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="var(--nm-accent-primary)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-sm text-[var(--nm-text-dimmed)]">
                  Precisão dos últimos {chartData.length} dia{chartData.length !== 1 ? 's' : ''}.
                  {avgPrecision !== null && avgPrecision >= 85
                    ? ' Tendência crescente estável.'
                    : ''}
                </div>
              </BlueprintCard>
            )}
          </section>

        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  )
}

import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { MobileNav } from '../components/MobileNav'
import { BlueprintCard } from '../components/BlueprintCard'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { useMetrics } from '../../hooks/useMetrics'
import { useAuth } from '../../contexts/AuthContext'
import type { DailyMetric, TrainingSession } from '../../types/database'

// ── Helpers ────────────────────────────────────────────────────────────────

const OPERATION_LABEL: Record<string, string> = {
  multiplication: 'Multiplicação',
  division:       'Divisão',
  addition:       'Adição',
  subtraction:    'Subtração',
}

function formatDateLong(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).toUpperCase()
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getModuleLabel(conceptId: number | null): string {
  if (conceptId === null) return 'Tabuada Livre'
  if (conceptId <= 8) return 'Fundacional'
  if (conceptId <= 15) return 'Consolidação'
  return 'Pro'
}

function getStatusColor(status: TrainingSession['session_status']): string {
  if (status === 'stable')       return 'text-[var(--nm-accent-stability)]'
  if (status === 'consolidating') return 'text-[var(--nm-accent-primary)]'
  return 'text-[var(--nm-text-annotation)]'
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-[var(--nm-bg-surface)] rounded-[var(--radius-technical)] ${className ?? ''}`}
    />
  )
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean
  payload?: Array<{ value: number; payload: { dateLabel: string } }>
  unit: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--nm-bg-surface)] border border-[var(--nm-grid-line)] rounded-[var(--radius-technical)] p-3">
      <p className="text-xs font-[family-name:var(--font-data)] text-[var(--nm-text-annotation)] mb-1">
        {payload[0].payload.dateLabel}
      </p>
      <p className="text-xs font-[family-name:var(--font-data)] text-[var(--nm-text-high)] tabular-nums">
        {payload[0].value.toFixed(1)}{unit}
      </p>
    </div>
  )
}

// ── Component ──────────────────────────────────────────────────────────────

export default function History() {
  const { user } = useAuth()
  const { dashboardData, loading, error } = useMetrics()

  const last30: DailyMetric[] = dashboardData?.last_30_days ?? []
  const recentSessions: TrainingSession[] = dashboardData?.recent_sessions ?? []

  // Chart data: precision (%) and avg_time (seconds)
  const chartData = last30.map((d) => ({
    dateLabel: formatDateShort(d.date),
    precision: d.precision_pct != null ? Math.round(d.precision_pct * 10) / 10 : null,
    avgTime:   d.avg_time_ms != null   ? Math.round((d.avg_time_ms / 1000) * 10) / 10 : null,
  }))

  return (
    <div className="min-h-screen">
      <Header isLoggedIn={!!user} />

      <main className="pt-24 pb-16 px-6 mb-16 md:mb-0">
        <div className="max-w-4xl mx-auto">

          <div className="mb-12">
            <h1 className="text-3xl font-semibold text-[var(--nm-text-high)] mb-2">
              Histórico
            </h1>
            <p className="text-[var(--nm-text-dimmed)]">
              Análise de progressão e mensuração contínua
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

          {/* Charts Section */}
          <section className="mb-12">
            <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-4">
              METRICAS_30D
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-6">
                <Skeleton className="h-72" />
                <Skeleton className="h-72" />
              </div>
            ) : chartData.length === 0 ? (
              <BlueprintCard label="METRICAS_30D">
                <div className="h-48 flex items-center justify-center">
                  <p className="text-sm text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)]">
                    SEM_DADOS // Complete sessões para ver o gráfico de evolução
                  </p>
                </div>
              </BlueprintCard>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {/* Precision Chart */}
                <BlueprintCard label="ACCURACY_TREND">
                  <h3 className="text-lg font-semibold text-[var(--nm-text-high)] mb-4">
                    Precisão
                  </h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <XAxis
                          dataKey="dateLabel"
                          stroke="var(--nm-text-annotation)"
                          style={{ fontSize: '10px', fontFamily: 'var(--font-data)' }}
                          interval={Math.floor(chartData.length / 6)}
                        />
                        <YAxis
                          domain={[0, 100]}
                          stroke="var(--nm-text-annotation)"
                          style={{ fontSize: '10px', fontFamily: 'var(--font-data)' }}
                        />
                        <Tooltip
                          content={(props) => (
                            <ChartTooltip
                              active={props.active}
                              payload={props.payload as Array<{ value: number; payload: { dateLabel: string } }>}
                              unit="%"
                            />
                          )}
                        />
                        <Line
                          type="monotone"
                          dataKey="precision"
                          stroke="var(--nm-accent-primary)"
                          strokeWidth={2}
                          dot={false}
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </BlueprintCard>

                {/* Time Chart */}
                <BlueprintCard label="TIME_TREND">
                  <h3 className="text-lg font-semibold text-[var(--nm-text-high)] mb-4">
                    Tempo médio
                  </h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <XAxis
                          dataKey="dateLabel"
                          stroke="var(--nm-text-annotation)"
                          style={{ fontSize: '10px', fontFamily: 'var(--font-data)' }}
                          interval={Math.floor(chartData.length / 6)}
                        />
                        <YAxis
                          domain={[0, 10]}
                          stroke="var(--nm-text-annotation)"
                          style={{ fontSize: '10px', fontFamily: 'var(--font-data)' }}
                        />
                        <Tooltip
                          content={(props) => (
                            <ChartTooltip
                              active={props.active}
                              payload={props.payload as Array<{ value: number; payload: { dateLabel: string } }>}
                              unit="s"
                            />
                          )}
                        />
                        <Line
                          type="monotone"
                          dataKey="avgTime"
                          stroke="var(--nm-accent-stability)"
                          strokeWidth={2}
                          dot={false}
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </BlueprintCard>
              </div>
            )}
          </section>

          {/* Sessions List */}
          <section>
            <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-4">
              SESSOES_RECENTES
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : recentSessions.length === 0 ? (
              <BlueprintCard label="SESSOES_RECENTES">
                <p className="text-sm text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)]">
                  SEM_SESSOES // Nenhuma sessão registrada ainda
                </p>
              </BlueprintCard>
            ) : (
              <div className="space-y-4">
                {recentSessions.map((session) => (
                  <BlueprintCard
                    key={session.id}
                    label={formatDateLong(session.completed_at)}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-[var(--nm-text-dimmed)] mb-1">
                          {getModuleLabel(session.concept_id)} //{' '}
                          {OPERATION_LABEL[session.operation] ?? session.operation} ×{' '}
                          {session.base_number}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)]">
                            {session.total_problems} questões
                          </div>
                          <div
                            className={`text-xs font-[family-name:var(--font-data)] uppercase tracking-wider ${getStatusColor(session.session_status)}`}
                          >
                            {session.session_status}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] uppercase tracking-wider mb-1">
                            Precisão
                          </div>
                          <div className="text-lg font-[family-name:var(--font-data)] font-semibold text-[var(--nm-text-high)] tabular-nums">
                            {session.precision_pct.toFixed(1)}%
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] uppercase tracking-wider mb-1">
                            Tempo
                          </div>
                          <div className="text-lg font-[family-name:var(--font-data)] font-semibold text-[var(--nm-text-high)] tabular-nums">
                            {(session.avg_time_ms / 1000).toFixed(1)}s
                          </div>
                        </div>
                      </div>
                    </div>
                  </BlueprintCard>
                ))}
              </div>
            )}
          </section>

        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  )
}

import { motion } from 'motion/react'

interface StabilityIndicatorProps {
  precision: number    // 0-100
  variability: number  // ms (desvio padrão)
  avgTime: number      // ms
  status: 'stable' | 'consolidating' | 'unstable'
}

export function StabilityIndicator({ precision, variability, avgTime, status }: StabilityIndicatorProps) {
  // Pilar de estabilidade: (1 - variabilidade/média) * 100, limitado a 0-100
  const stability = avgTime > 0
    ? Math.max(0, Math.min(100, (1 - variability / avgTime) * 100))
    : 0

  // Pilar de velocidade: (10000ms - avgTime) / 90, limitado a 0-100
  const velocity = Math.max(0, Math.min(100, (10000 - avgTime) / 90))

  const statusColor =
    status === 'stable'       ? 'var(--nm-accent-stability)' :
    status === 'unstable'     ? 'var(--nm-accent-error)'     :
    /* consolidating */         'var(--nm-accent-primary)'

  const statusLabel =
    status === 'stable'   ? 'ESTÁVEL'      :
    status === 'unstable' ? 'INSTÁVEL'     :
    /* consolidating */     'CONSOLIDANDO'

  const bars = [
    { label: 'PRECISÃO',     value: precision, unit: '%' },
    { label: 'ESTABILIDADE', value: stability,  unit: '%' },
    { label: 'VELOCIDADE',   value: velocity,   unit: ''  },
  ]

  return (
    <div className="space-y-4">
      {/* Status header */}
      <div className="flex items-center justify-between">
        <div
          className="text-[10px] font-[family-name:var(--font-data)] uppercase tracking-[0.15em]"
          style={{ color: statusColor }}
        >
          STATUS_{statusLabel}
        </div>
        <div className="text-[10px] font-[family-name:var(--font-data)] text-[var(--nm-text-annotation)]">
          3 pilares
        </div>
      </div>

      {/* Bars */}
      {bars.map((bar, i) => (
        <div key={bar.label}>
          <div className="flex justify-between mb-1.5">
            <span className="text-[10px] font-[family-name:var(--font-data)] uppercase tracking-[0.1em] text-[var(--nm-text-annotation)]">
              {bar.label}
            </span>
            <span className="text-[11px] font-[family-name:var(--font-data)] tabular-nums text-[var(--nm-text-high)]">
              {bar.value.toFixed(1)}{bar.unit}
            </span>
          </div>
          <div className="h-[2px] bg-[var(--nm-bg-main)] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: statusColor }}
              initial={{ width: '0%' }}
              animate={{ width: `${Math.max(0, Math.min(100, bar.value))}%` }}
              transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1], delay: i * 0.12 }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

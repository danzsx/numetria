import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { TechniqueStep } from '../../../types/lesson'
import { ActionButton } from '../ActionButton'
import { BlueprintCard } from '../BlueprintCard'

interface StepBlockProps {
  techniqueName: string
  techniqueRule: string
  example: { operand1: number; operand2: number; operand3?: number }
  steps: TechniqueStep[]
  conclusion: string
  onComplete: () => void
}

export function StepBlock({
  techniqueName,
  techniqueRule,
  example,
  steps,
  conclusion,
  onComplete,
}: StepBlockProps) {
  const [revealedSteps, setRevealedSteps] = useState(0)

  const allRevealed = revealedSteps >= steps.length

  const handleNext = () => {
    if (!allRevealed) {
      setRevealedSteps(r => r + 1)
    }
  }

  const exampleStr =
    example.operand3 !== undefined
      ? `${example.operand1} × ${example.operand2} × ${example.operand3}`
      : `${example.operand1} × ${example.operand2}`

  return (
    <div className="px-6 py-8 pb-16">
      <div className="max-w-md mx-auto space-y-5">

        {/* Header */}
        <div className="text-center">
          <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-1">
            TÉCNICA_ESTRUTURAL
          </div>
          <div className="text-[var(--nm-text-dimmed)] text-xs">
            {techniqueName}
          </div>
        </div>

        {/* Regra mental */}
        <BlueprintCard label="REGRA_MENTAL">
          <p className="text-sm text-[var(--nm-text-high)] leading-relaxed">
            {techniqueRule}
          </p>
        </BlueprintCard>

        {/* Problema exemplo */}
        <div className="text-center py-4">
          <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.12em] mb-3">
            EXEMPLO_DEMONSTRATIVO
          </div>
          <div className="text-4xl font-[family-name:var(--font-data)] font-semibold text-[var(--nm-text-high)] tabular-nums">
            {exampleStr} = ?
          </div>
        </div>

        {/* Etapas reveladas progressivamente */}
        <div className="space-y-3">
          <AnimatePresence>
            {steps.slice(0, revealedSteps).map((step) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <BlueprintCard label={step.label.toUpperCase()}>
                  <div className="space-y-2">
                    <div className="text-xl font-[family-name:var(--font-data)] font-semibold text-[var(--nm-text-high)] tabular-nums">
                      {step.expression}
                    </div>
                    <div className="text-xs text-[var(--nm-text-dimmed)] leading-relaxed">
                      {step.explanation}
                    </div>
                    <div
                      className="text-base font-[family-name:var(--font-data)] font-semibold tabular-nums"
                      style={{ color: 'var(--nm-accent-primary)' }}
                    >
                      = {step.answer}
                    </div>
                  </div>
                </BlueprintCard>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Conclusão — aparece após todas as etapas */}
          <AnimatePresence>
            {allRevealed && (
              <motion.div
                key="conclusion"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <div
                  className="p-4 rounded-[var(--radius-technical)] border bg-[var(--nm-bg-main)] text-center"
                  style={{ borderColor: 'var(--nm-accent-stability)' }}
                >
                  <div
                    className="text-[10px] font-[family-name:var(--font-data)] uppercase tracking-[0.12em] mb-2"
                    style={{ color: 'var(--nm-accent-stability)' }}
                  >
                    RESULTADO
                  </div>
                  <div className="text-2xl font-[family-name:var(--font-data)] font-semibold text-[var(--nm-text-high)] tabular-nums">
                    {conclusion}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Botão de ação */}
        {!allRevealed ? (
          <ActionButton variant="primary" className="w-full" onClick={handleNext}>
            {revealedSteps === 0
              ? `Ver ${steps[0]?.label ?? 'primeira etapa'} →`
              : `Ver ${steps[revealedSteps]?.label ?? 'próxima etapa'} →`}
          </ActionButton>
        ) : (
          <ActionButton variant="primary" className="w-full" onClick={onComplete}>
            Entendi, vou praticar →
          </ActionButton>
        )}

        <div className="text-center text-xs text-[var(--nm-text-annotation)]">
          {allRevealed
            ? 'Técnica assimilada.'
            : `${revealedSteps} / ${steps.length} etapas reveladas`}
        </div>
      </div>
    </div>
  )
}

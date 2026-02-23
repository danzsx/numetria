import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { TheoryContent } from '../../../types/lesson'
import { InputField } from '../InputField'
import { ActionButton } from '../ActionButton'

const OP_SYM: Record<string, string> = {
  multiplication: '×',
  division: '÷',
  addition: '+',
  subtraction: '−',
}

interface Props {
  simulatedPractice: TheoryContent['simulatedPractice']
  operation: string
  onComplete: () => void
}

export function TheorySimulated({ simulatedPractice, operation, onComplete }: Props) {
  const sym = OP_SYM[operation] ?? '×'
  const [activeStepIdx, setActiveStepIdx] = useState(0)
  const [filledValues, setFilledValues] = useState<string[]>([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [isError, setIsError] = useState(false)
  const [allDone, setAllDone] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const steps = simulatedPractice.steps

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [activeStepIdx])

  const handleSubmit = () => {
    if (allDone) return
    const num = parseInt(currentAnswer)
    if (isNaN(num)) return

    const expected = steps[activeStepIdx].answer
    if (num === expected) {
      setIsError(false)
      setFilledValues(prev => {
        const next = [...prev]
        next[activeStepIdx] = currentAnswer
        return next
      })
      setCurrentAnswer('')

      const isLast = activeStepIdx === steps.length - 1
      if (isLast) {
        setTimeout(() => setAllDone(true), 500)
      } else {
        setTimeout(() => setActiveStepIdx(i => i + 1), 400)
      }
    } else {
      setIsError(true)
      setTimeout(() => {
        setIsError(false)
        setCurrentAnswer('')
      }, 700)
    }
  }

  // Compute the final answer from the last filled step
  const finalAnswer = steps.length > 0 ? steps[steps.length - 1].answer : 0

  return (
    <div className="flex flex-col items-start min-h-[70vh] px-6 pt-8 pb-16">
      <div className="max-w-sm w-full mx-auto space-y-6">
        <div className="text-center">
          <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em]">
            INTERAÇÃO_SIMULADA
          </div>
        </div>

        {/* Problem */}
        <div className="text-center py-4">
          <div className="text-4xl font-[family-name:var(--font-data)] font-semibold text-[var(--nm-text-high)] tabular-nums mb-1">
            {simulatedPractice.operand1} {sym} {simulatedPractice.operand2}
          </div>
          <div className="text-[var(--nm-text-annotation)] text-sm">= ?</div>
        </div>

        {/* All steps visible from start (dimmed as reminder), active one gets input */}
        <div className="space-y-4">
          {steps.map((step, i) => {
            const isDone = filledValues[i] !== undefined
            const isActive = i === activeStepIdx && !allDone
            const isPending = i > activeStepIdx && !allDone

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
              >
                <div className="text-[10px] font-[family-name:var(--font-data)] uppercase tracking-[0.12em] text-[var(--nm-text-annotation)] mb-2">
                  Passo {i + 1}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm flex-1 transition-colors duration-300 ${
                      isActive ? 'text-[var(--nm-text-high)]' : 'text-[var(--nm-text-dimmed)]'
                    }`}
                  >
                    {step.prompt}
                  </span>
                  {isDone ? (
                    <span className="font-[family-name:var(--font-data)] font-semibold text-[var(--nm-accent-stability)] tabular-nums text-lg">
                      {filledValues[i]}
                    </span>
                  ) : isActive ? (
                    <div className="w-28">
                      <InputField
                        ref={inputRef}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={currentAnswer}
                        onChange={(e) => setCurrentAnswer(e.target.value.replace(/\D/g, ''))}
                        onEnter={handleSubmit}
                        error={isError}
                        placeholder="?"
                        className="text-lg"
                      />
                    </div>
                  ) : (
                    <span className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-sm">
                      ___
                    </span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {!allDone && (
          <div className="text-xs text-[var(--nm-text-annotation)] text-center">
            Pressione Enter para confirmar
          </div>
        )}

        {/* Completion */}
        <AnimatePresence>
          {allDone && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              {/* Final answer reveal */}
              <div className="text-center py-2">
                <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.12em] mb-2">
                  RESULTADO
                </div>
                <div className="text-3xl font-[family-name:var(--font-data)] font-semibold text-[var(--nm-accent-stability)] tabular-nums">
                  {simulatedPractice.operand1} {sym} {simulatedPractice.operand2} = {finalAnswer} ✓
                </div>
              </div>

              <div className="text-sm text-[var(--nm-text-dimmed)] leading-relaxed text-center">
                {simulatedPractice.successMessage}
              </div>

              <ActionButton variant="primary" className="w-full" onClick={onComplete}>
                Ver o que evitar →
              </ActionButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

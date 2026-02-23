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
  guidedExample: TheoryContent['guidedExample']
  operation: string
  onComplete: () => void
}

export function TheoryGuidedExample({ guidedExample, operation, onComplete }: Props) {
  const sym = OP_SYM[operation] ?? '×'
  const [stepIndex, setStepIndex] = useState(-1) // -1 = no steps revealed
  const [answers, setAnswers] = useState<string[]>([])
  const [errorCounts, setErrorCounts] = useState<number[]>([])
  const [stepDone, setStepDone] = useState<boolean[]>([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [isError, setIsError] = useState(false)
  const [showCompactThought, setShowCompactThought] = useState(false)
  const [allDone, setAllDone] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const steps = guidedExample.steps

  useEffect(() => {
    if (stepIndex >= 0) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [stepIndex])

  const handleReveal = () => {
    setStepIndex(0)
    setCurrentAnswer('')
  }

  const handleSubmit = () => {
    if (stepIndex < 0 || stepDone[stepIndex]) return
    const num = parseInt(currentAnswer)
    if (isNaN(num)) return

    const expected = steps[stepIndex].answer
    if (num === expected) {
      // Correct — freeze step, advance
      setIsError(false)
      setAnswers(prev => {
        const next = [...prev]
        next[stepIndex] = currentAnswer
        return next
      })
      setStepDone(prev => {
        const next = [...prev]
        next[stepIndex] = true
        return next
      })
      setErrorCounts(prev => {
        const next = [...prev]
        next[stepIndex] = 0
        return next
      })
      setCurrentAnswer('')

      const isLast = stepIndex === steps.length - 1
      if (isLast) {
        setTimeout(() => {
          setShowCompactThought(true)
          setAllDone(true)
        }, 700)
      } else {
        // Reveal next step on tap
        setTimeout(() => {
          setStepIndex(i => i + 1)
          setCurrentAnswer('')
        }, 600)
      }
    } else {
      // Error — soft, show correct after 1.5s and advance
      setIsError(true)
      const newErrors = (errorCounts[stepIndex] ?? 0) + 1
      setErrorCounts(prev => {
        const next = [...prev]
        next[stepIndex] = newErrors
        return next
      })

      setTimeout(() => {
        setIsError(false)
        setAnswers(prev => {
          const next = [...prev]
          next[stepIndex] = String(expected)
          return next
        })
        setStepDone(prev => {
          const next = [...prev]
          next[stepIndex] = true
          return next
        })
        setCurrentAnswer('')

        const isLast = stepIndex === steps.length - 1
        if (isLast) {
          setTimeout(() => {
            setShowCompactThought(true)
            setAllDone(true)
          }, 500)
        } else {
          setTimeout(() => {
            setStepIndex(i => i + 1)
            setCurrentAnswer('')
          }, 400)
        }
      }, 1500)
    }
  }

  return (
    <div className="flex flex-col items-start min-h-[70vh] px-6 pt-8 pb-16">
      <div className="max-w-sm w-full mx-auto space-y-6">
        <div className="text-center">
          <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em]">
            EXEMPLO_GUIADO
          </div>
        </div>

        {/* Problem statement */}
        <div className="text-center py-4">
          <div className="text-4xl font-[family-name:var(--font-data)] font-semibold text-[var(--nm-text-high)] tabular-nums mb-1">
            {guidedExample.operand1} {sym} {guidedExample.operand2}
          </div>
          <div className="text-[var(--nm-text-annotation)] text-sm">= ?</div>
        </div>

        {/* Start button */}
        {stepIndex === -1 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <ActionButton variant="ghost" className="w-full" onClick={handleReveal}>
              Revelar Etapa 1 →
            </ActionButton>
          </motion.div>
        )}

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, i) => {
            if (i > stepIndex) return null
            const isDone = stepDone[i]
            const isActive = i === stepIndex && !isDone

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-[10px] font-[family-name:var(--font-data)] uppercase tracking-[0.12em] text-[var(--nm-text-annotation)] mb-2">
                  Etapa {i + 1}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[var(--nm-text-dimmed)] flex-1">
                    {step.prompt}
                  </span>
                  {isDone ? (
                    <span className="font-[family-name:var(--font-data)] font-semibold text-[var(--nm-accent-stability)] tabular-nums text-lg">
                      {answers[i]}
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
                  ) : null}
                </div>
              </motion.div>
            )
          })}
        </div>

        {stepIndex >= 0 && !allDone && !stepDone[stepIndex] && (
          <div className="text-xs text-[var(--nm-text-annotation)] text-center">
            Pressione Enter para confirmar
          </div>
        )}

        {/* Compact thought */}
        <AnimatePresence>
          {showCompactThought && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <div className="text-center">
                <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.12em] mb-2">
                  PENSAMENTO_COMPACTO
                </div>
                <div className="text-sm text-[var(--nm-text-dimmed)] italic leading-relaxed">
                  {guidedExample.compactThought}
                </div>
              </div>
              <ActionButton variant="primary" className="w-full" onClick={onComplete}>
                Agora você tenta →
              </ActionButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

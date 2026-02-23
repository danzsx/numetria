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
  calibration: TheoryContent['calibration']
  operation: string
  onComplete: (status: 'ok' | 'assisted') => void
}

type CalibrationPhase = 'single_input' | 'guided_fallback' | 'done'

export function TheoryCalibration({ calibration, operation, onComplete }: Props) {
  const sym = OP_SYM[operation] ?? '×'
  const [phase, setPhase] = useState<CalibrationPhase>('single_input')
  const [answer, setAnswer] = useState('')
  const [isError, setIsError] = useState(false)
  const [stepAnswers, setStepAnswers] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [currentStepAnswer, setCurrentStepAnswer] = useState('')
  const [isStepError, setIsStepError] = useState(false)
  const [stepDone, setStepDone] = useState<boolean[]>([])
  const [singleFeedback, setSingleFeedback] = useState<'correct' | 'wrong' | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const stepInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  useEffect(() => {
    if (phase === 'guided_fallback') {
      setTimeout(() => stepInputRef.current?.focus(), 100)
    }
  }, [phase, currentStep])

  const handleSingleSubmit = () => {
    const num = parseInt(answer)
    if (isNaN(num) || singleFeedback) return

    if (num === calibration.answer) {
      setSingleFeedback('correct')
      setTimeout(() => onComplete('ok'), 1200)
    } else {
      setIsError(true)
      setSingleFeedback('wrong')
      setTimeout(() => {
        setIsError(false)
        setPhase('guided_fallback')
      }, 1000)
    }
  }

  const handleStepSubmit = () => {
    if (currentStep >= calibration.steps.length) return
    const num = parseInt(currentStepAnswer)
    if (isNaN(num) || stepDone[currentStep]) return

    const expected = calibration.steps[currentStep].answer
    if (num === expected) {
      setIsStepError(false)
      setStepAnswers(prev => {
        const next = [...prev]
        next[currentStep] = currentStepAnswer
        return next
      })
      setStepDone(prev => {
        const next = [...prev]
        next[currentStep] = true
        return next
      })
      setCurrentStepAnswer('')

      const isLast = currentStep === calibration.steps.length - 1
      if (isLast) {
        setTimeout(() => {
          setPhase('done')
          onComplete('assisted')
        }, 800)
      } else {
        setTimeout(() => {
          setCurrentStep(i => i + 1)
          setCurrentStepAnswer('')
        }, 500)
      }
    } else {
      setIsStepError(true)
      setTimeout(() => {
        setIsStepError(false)
        // Auto-fill and advance
        setStepAnswers(prev => {
          const next = [...prev]
          next[currentStep] = String(expected)
          return next
        })
        setStepDone(prev => {
          const next = [...prev]
          next[currentStep] = true
          return next
        })
        setCurrentStepAnswer('')

        const isLast = currentStep === calibration.steps.length - 1
        if (isLast) {
          setTimeout(() => {
            setPhase('done')
            onComplete('assisted')
          }, 600)
        } else {
          setTimeout(() => {
            setCurrentStep(i => i + 1)
            setCurrentStepAnswer('')
          }, 400)
        }
      }, 1200)
    }
  }

  return (
    <div className="flex flex-col items-start min-h-[70vh] px-6 pt-8 pb-16">
      <div className="max-w-sm w-full mx-auto space-y-6">
        <div className="text-center">
          <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em]">
            DESAFIO_DE_CALIBRAÇÃO
          </div>
        </div>

        {/* Problem */}
        <div className="text-center py-4">
          <div className="text-4xl font-[family-name:var(--font-data)] font-semibold text-[var(--nm-text-high)] tabular-nums mb-1">
            {calibration.operand1} {sym} {calibration.operand2}
          </div>
          <div className="text-[var(--nm-text-annotation)] text-sm">= ?</div>
        </div>

        {/* Phase: single input */}
        <AnimatePresence mode="wait">
          {phase === 'single_input' && (
            <motion.div
              key="single"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="text-xs text-[var(--nm-text-dimmed)] text-center">
                Resolva sem scaffolding — use a técnica que aprendeu.
              </div>
              <InputField
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={answer}
                onChange={(e) => setAnswer(e.target.value.replace(/\D/g, ''))}
                onEnter={handleSingleSubmit}
                error={isError}
                placeholder="?"
                className="text-2xl"
                disabled={!!singleFeedback}
              />

              <AnimatePresence>
                {singleFeedback === 'correct' && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-sm font-[family-name:var(--font-data)] text-[var(--nm-accent-stability)]"
                  >
                    Calibração confirmada. Técnica estável.
                  </motion.div>
                )}
                {singleFeedback === 'wrong' && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-sm font-[family-name:var(--font-data)] text-[var(--nm-text-dimmed)]"
                  >
                    Vamos reconstruir passo a passo…
                  </motion.div>
                )}
              </AnimatePresence>

              {!singleFeedback && (
                <div className="text-xs text-[var(--nm-text-annotation)] text-center">
                  Pressione Enter para confirmar
                </div>
              )}
            </motion.div>
          )}

          {/* Phase: guided fallback */}
          {phase === 'guided_fallback' && (
            <motion.div
              key="guided"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <div className="text-xs text-[var(--nm-text-dimmed)] leading-relaxed text-center">
                Sem problema — vamos reconstruir a estrutura.
              </div>

              <div className="space-y-4">
                {calibration.steps.map((step, i) => {
                  if (i > currentStep) return null
                  const isDone = stepDone[i]
                  const isActive = i === currentStep && !isDone

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
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
                            {stepAnswers[i]}
                          </span>
                        ) : isActive ? (
                          <div className="w-28">
                            <InputField
                              ref={stepInputRef}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={currentStepAnswer}
                              onChange={(e) => setCurrentStepAnswer(e.target.value.replace(/\D/g, ''))}
                              onEnter={handleStepSubmit}
                              error={isStepError}
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

              {phase === 'guided_fallback' && !stepDone.every(Boolean) && (
                <div className="text-xs text-[var(--nm-text-annotation)] text-center">
                  Pressione Enter para confirmar
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

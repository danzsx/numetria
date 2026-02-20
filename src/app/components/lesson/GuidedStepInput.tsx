import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { GuidedProblem, ErrorType } from '../../../types/lesson'
import { InputField } from '../InputField'
import { StructuralFeedbackCard } from './StructuralFeedbackCard'

interface GuidedStepInputProps {
  problem: GuidedProblem
  problemIndex: number
  totalProblems: number
  onComplete: (correct: boolean, timeMs: number) => void
}

const OP_SYMBOLS: Record<string, string> = {
  multiplication: '×',
  division:       '÷',
  addition:       '+',
  subtraction:    '−',
}

export function GuidedStepInput({
  problem,
  problemIndex,
  totalProblems,
  onComplete,
}: GuidedStepInputProps) {
  const startRef = useRef(Date.now())
  const intermediateRef = useRef<HTMLInputElement>(null)
  const finalRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<'intermediate' | 'final'>('intermediate')
  const [intermediateValue, setIntermediateValue] = useState('')
  const [finalValue, setFinalValue] = useState('')
  const [intermediateFeedback, setIntermediateFeedback] = useState<{
    correct: boolean
    errorType?: ErrorType
    userAnswer: number
  } | null>(null)
  const [finalFeedback, setFinalFeedback] = useState<{ correct: boolean } | null>(null)
  const [isErrorIntermediate, setIsErrorIntermediate] = useState(false)
  const [isErrorFinal, setIsErrorFinal] = useState(false)

  const sym = OP_SYMBOLS[problem.operation] ?? problem.operation
  const problemStr =
    problem.operand3 !== undefined
      ? `${problem.operand1} ${sym} ${problem.operand2} ${sym} ${problem.operand3}`
      : `${problem.operand1} ${sym} ${problem.operand2}`

  useEffect(() => {
    startRef.current = Date.now()
    intermediateRef.current?.focus()
  }, [])

  useEffect(() => {
    if (step === 'final') {
      finalRef.current?.focus()
    }
  }, [step])

  const handleIntermediateSubmit = () => {
    const num = parseInt(intermediateValue)
    if (isNaN(num) || intermediateFeedback) return

    const isCorrect = num === problem.intermediate.answer
    setIntermediateFeedback({
      correct: isCorrect,
      errorType: isCorrect ? undefined : problem.intermediate.errorType,
      userAnswer: num,
    })
    setIsErrorIntermediate(!isCorrect)

    // Avança para o passo final em todo caso — bloco 3 é guiado, não bloqueante
    setTimeout(() => {
      setStep('final')
    }, isCorrect ? 700 : 1800)
  }

  const handleFinalSubmit = () => {
    const num = parseInt(finalValue)
    if (isNaN(num) || finalFeedback) return

    const isCorrect = num === problem.final
    const elapsed = Date.now() - startRef.current
    setFinalFeedback({ correct: isCorrect })
    setIsErrorFinal(!isCorrect)

    const intermediateCorrect = intermediateFeedback?.correct ?? false
    const overallCorrect = intermediateCorrect && isCorrect

    setTimeout(() => {
      onComplete(overallCorrect, elapsed)
    }, 1000)
  }

  return (
    <div className="max-w-sm w-full mx-auto">
      {/* Cabeçalho */}
      <div className="text-center mb-8">
        <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-1">
          PRÁTICA_GUIADA
        </div>
        <div className="text-[var(--nm-text-dimmed)] text-xs">
          {problemIndex + 1} / {totalProblems}
        </div>
      </div>

      {/* Expressão do problema */}
      <div className="text-center mb-8">
        <div className="text-4xl font-[family-name:var(--font-data)] font-semibold text-[var(--nm-text-high)] tabular-nums mb-2">
          {problemStr}
        </div>
        <div className="text-[var(--nm-text-annotation)] text-sm">= ?</div>
      </div>

      {/* Etapa intermediária */}
      <div className="mb-6">
        <div className="text-[10px] font-[family-name:var(--font-data)] uppercase tracking-[0.12em] text-[var(--nm-text-annotation)] mb-3">
          {problem.intermediate.label}
        </div>
        <InputField
          ref={intermediateRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={intermediateValue}
          onChange={(e) => setIntermediateValue(e.target.value.replace(/\D/g, ''))}
          onEnter={handleIntermediateSubmit}
          error={isErrorIntermediate}
          placeholder="?"
          className="text-2xl"
          disabled={!!intermediateFeedback}
        />
        <AnimatePresence>
          {intermediateFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3"
            >
              {intermediateFeedback.correct ? (
                <div className="text-center text-sm font-[family-name:var(--font-data)] text-[var(--nm-accent-stability)]">
                  Correto. → {problem.intermediate.answer}
                </div>
              ) : (
                <StructuralFeedbackCard
                  errorType={intermediateFeedback.errorType!}
                  correctAnswer={problem.intermediate.answer}
                  userAnswer={intermediateFeedback.userAnswer}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Etapa final — aparece após a intermediária */}
      <AnimatePresence>
        {step === 'final' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            className="mb-6"
          >
            <div className="text-[10px] font-[family-name:var(--font-data)] uppercase tracking-[0.12em] text-[var(--nm-text-annotation)] mb-3">
              RESULTADO_FINAL =
            </div>
            <InputField
              ref={finalRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={finalValue}
              onChange={(e) => setFinalValue(e.target.value.replace(/\D/g, ''))}
              onEnter={handleFinalSubmit}
              error={isErrorFinal}
              placeholder="?"
              className="text-2xl"
              disabled={!!finalFeedback}
            />
            <AnimatePresence>
              {finalFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`mt-2 text-center text-sm font-[family-name:var(--font-data)] ${
                    finalFeedback.correct
                      ? 'text-[var(--nm-accent-stability)]'
                      : 'text-[var(--nm-accent-error)]'
                  }`}
                >
                  {finalFeedback.correct ? 'Correto.' : `Resposta: ${problem.final}`}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center text-xs text-[var(--nm-text-annotation)]">
        Pressione Enter para confirmar
      </div>
    </div>
  )
}

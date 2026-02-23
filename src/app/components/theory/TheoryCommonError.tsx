import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { TheoryContent } from '../../../types/lesson'
import { BlueprintCard } from '../BlueprintCard'
import { ActionButton } from '../ActionButton'

const OP_SYM: Record<string, string> = {
  multiplication: '×',
  division: '÷',
  addition: '+',
  subtraction: '−',
}

interface Props {
  commonError: TheoryContent['commonError']
  operation: string
  onComplete: () => void
}

export function TheoryCommonError({ commonError, operation, onComplete }: Props) {
  const [answered, setAnswered] = useState<'correct' | 'wrong' | null>(null)

  const { wrongProblem } = commonError
  const sym = OP_SYM[operation] ?? '×'

  const handleAnswer = (answer: 'sim' | 'nao') => {
    // "Sim" = user thinks it's correct (WRONG answer — it's a common error)
    // "Não" = user recognizes it's wrong (CORRECT answer)
    if (answer === 'nao') {
      setAnswered('correct') // user correctly identified the error
    } else {
      setAnswered('wrong') // user was tricked
    }
  }

  return (
    <div className="flex flex-col items-start min-h-[70vh] px-6 pt-8 pb-16">
      <div className="max-w-sm w-full mx-auto space-y-6">
        <div className="text-center">
          <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em]">
            ERROS_COMUNS
          </div>
        </div>

        {/* Wrong problem display */}
        <div className="text-center py-4">
          <div className="text-[var(--nm-text-dimmed)] text-xs font-[family-name:var(--font-data)] uppercase tracking-[0.1em] mb-3">
            Alguém resolveu assim:
          </div>
          <div className="text-4xl font-[family-name:var(--font-data)] font-semibold text-[var(--nm-text-high)] tabular-nums mb-2">
            {wrongProblem.operand1} {sym} {wrongProblem.operand2} = {wrongProblem.wrongAnswer}
          </div>
        </div>

        {/* Question */}
        <div className="text-sm text-[var(--nm-text-high)] font-medium text-center">
          Esse resultado está correto?
        </div>

        {/* Buttons */}
        <AnimatePresence mode="wait">
          {!answered && (
            <motion.div
              key="buttons"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="grid grid-cols-2 gap-3"
            >
              <ActionButton variant="ghost" className="w-full" onClick={() => handleAnswer('sim')}>
                Sim
              </ActionButton>
              <ActionButton variant="primary" className="w-full" onClick={() => handleAnswer('nao')}>
                Não
              </ActionButton>
            </motion.div>
          )}

          {answered && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              {/* Status */}
              <div
                className={`text-sm font-[family-name:var(--font-data)] ${
                  answered === 'correct'
                    ? 'text-[var(--nm-accent-stability)]'
                    : 'text-[var(--nm-accent-error)]'
                }`}
              >
                {answered === 'correct'
                  ? 'Correto — você identificou o erro.'
                  : 'Esse é o erro mais comum nessa técnica.'}
              </div>

              {/* Error explanation */}
              <div className="space-y-2">
                <div className="text-[10px] font-[family-name:var(--font-data)] uppercase tracking-[0.12em] text-[var(--nm-accent-error)]">
                  {commonError.errorStep}
                </div>
                <div className="text-xs text-[var(--nm-text-dimmed)] leading-relaxed">
                  {commonError.errorExplanation}
                </div>
              </div>

              {/* Cognitive anchor */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <BlueprintCard className="border-[var(--nm-accent-primary)]">
                  <div className="text-center">
                    <div className="text-[10px] font-[family-name:var(--font-data)] uppercase tracking-[0.12em] text-[var(--nm-text-annotation)] mb-3">
                      ÂNCORA_COGNITIVA
                    </div>
                    <div className="font-[family-name:var(--font-data)] uppercase tracking-[0.12em] text-[var(--nm-accent-primary)] text-sm font-semibold">
                      {commonError.cognitiveAnchor}
                    </div>
                  </div>
                </BlueprintCard>
              </motion.div>

              <ActionButton variant="primary" className="w-full" onClick={onComplete}>
                Pronto para o desafio →
              </ActionButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

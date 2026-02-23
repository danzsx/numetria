import { useRef, useState } from 'react'
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

type Phase = 'initial' | 'input' | 'answered' | 'skipped'

interface Props {
  hook: TheoryContent['hook']
  onComplete: () => void
}

export function TheoryHook({ hook, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('initial')
  const [userAnswer, setUserAnswer] = useState('')
  const [isCorrect, setIsCorrect] = useState(false)
  const [isError, setIsError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const sym = OP_SYM[hook.problem.operation] ?? hook.problem.operation

  const handleKnow = () => {
    setPhase('input')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleSkip = () => setPhase('skipped')

  const handleSubmit = () => {
    const num = parseInt(userAnswer)
    if (isNaN(num) || phase === 'answered') return
    const correct = num === hook.answer
    setIsCorrect(correct)
    setIsError(!correct)
    setPhase('answered')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
      <div className="max-w-sm w-full text-center">
        <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em] mb-10">
          GANCHO_COGNITIVO
        </div>

        {/* Problem */}
        <div className="mb-10">
          <div className="text-5xl font-[family-name:var(--font-data)] font-semibold text-[var(--nm-text-high)] tabular-nums mb-2">
            {hook.problem.operand1} {sym} {hook.problem.operand2}
          </div>
          <div className="text-[var(--nm-text-annotation)] text-sm">= ?</div>
        </div>

        <AnimatePresence mode="wait">
          {phase === 'initial' && (
            <motion.div
              key="initial"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              <ActionButton variant="primary" className="w-full" onClick={handleKnow}>
                Eu sei calcular
              </ActionButton>
              <ActionButton variant="ghost" className="w-full" onClick={handleSkip}>
                Não sei ao certo
              </ActionButton>
            </motion.div>
          )}

          {phase === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <InputField
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value.replace(/\D/g, ''))}
                onEnter={handleSubmit}
                error={isError}
                placeholder="?"
                className="text-2xl"
              />
              <ActionButton variant="primary" className="w-full" onClick={handleSubmit}>
                Confirmar
              </ActionButton>
              <div className="text-xs text-[var(--nm-text-annotation)]">
                Pressione Enter para confirmar
              </div>
            </motion.div>
          )}

          {(phase === 'answered' || phase === 'skipped') && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {phase === 'answered' && (
                <div
                  className={`text-sm font-[family-name:var(--font-data)] ${
                    isCorrect ? 'text-[var(--nm-accent-stability)]' : 'text-[var(--nm-accent-error)]'
                  }`}
                >
                  {isCorrect ? `Correto — ${hook.answer}` : `Resposta: ${hook.answer}`}
                </div>
              )}
              {phase === 'skipped' && (
                <div className="text-sm text-[var(--nm-text-dimmed)]">
                  Sem problema — vamos aprender a técnica.
                </div>
              )}

              {/* Visual hint */}
              <div className="text-xs text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] uppercase tracking-[0.12em] border border-[var(--nm-grid-line)] rounded-[var(--radius-technical)] px-3 py-2">
                {hook.visualHint}
              </div>

              <ActionButton variant="primary" className="w-full" onClick={onComplete}>
                Ver como funciona →
              </ActionButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

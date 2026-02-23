import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { TheoryContent } from '../../../types/lesson'
import { BlueprintCard } from '../BlueprintCard'
import { ActionButton } from '../ActionButton'

interface Props {
  intuition: TheoryContent['intuition']
  onComplete: () => void
}

export function TheoryIntuition({ intuition, onComplete }: Props) {
  const [visibleLines, setVisibleLines] = useState(0)
  const [showEquation, setShowEquation] = useState(false)
  const [questionAnswered, setQuestionAnswered] = useState(false)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [showExplanation, setShowExplanation] = useState(false)

  const totalLines = intuition.lines.length

  // Reveal lines auto (900ms) or on tap
  useEffect(() => {
    if (visibleLines >= totalLines) {
      const t = setTimeout(() => setShowEquation(true), 500)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setVisibleLines(v => v + 1), 900)
    return () => clearTimeout(t)
  }, [visibleLines, totalLines])

  const handleRevealTap = () => {
    if (visibleLines < totalLines) setVisibleLines(v => v + 1)
  }

  const handleOptionSelect = (index: number) => {
    if (questionAnswered) return
    setSelectedOption(index)
    const correct = index === intuition.comprehensionQuestion.correctIndex

    if (correct) {
      setShowExplanation(true)
      setTimeout(() => setQuestionAnswered(true), 600)
    } else {
      setShowExplanation(true)
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      if (newAttempts >= 2) {
        // Second wrong attempt — auto-advance after showing explanation
        setTimeout(() => setQuestionAnswered(true), 2000)
      } else {
        // First wrong — show explanation briefly, then let retry
        setTimeout(() => {
          setShowExplanation(false)
          setSelectedOption(null)
        }, 1800)
      }
    }
  }

  return (
    <div className="flex flex-col items-start min-h-[70vh] px-6 pt-8 pb-16">
      <div className="max-w-sm w-full mx-auto space-y-6">
        <div className="text-center">
          <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em]">
            POR_QUE_FUNCIONA
          </div>
        </div>

        {/* Lines — tap to reveal next */}
        <div className="space-y-4 cursor-pointer" onClick={handleRevealTap}>
          {intuition.lines.slice(0, visibleLines).map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className={`text-base leading-relaxed transition-colors duration-300 ${
                i === visibleLines - 1
                  ? 'text-[var(--nm-text-high)]'
                  : 'text-[var(--nm-text-dimmed)]'
              }`}
            >
              {line}
            </motion.div>
          ))}
          {visibleLines < totalLines && (
            <div className="text-[var(--nm-text-annotation)] text-xs">
              Toque para continuar…
            </div>
          )}
        </div>

        {/* Key equation */}
        <AnimatePresence>
          {showEquation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <BlueprintCard label="EQUAÇÃO_CHAVE">
                <div className="text-center font-[family-name:var(--font-data)] text-lg font-semibold text-[var(--nm-accent-primary)] mt-2 tracking-wide">
                  {intuition.keyEquation}
                </div>
              </BlueprintCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comprehension question */}
        <AnimatePresence>
          {showEquation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="space-y-4"
            >
              <div className="text-sm text-[var(--nm-text-high)] font-medium leading-relaxed">
                {intuition.comprehensionQuestion.question}
              </div>

              <div className="space-y-2">
                {intuition.comprehensionQuestion.options.map((option, i) => {
                  const isSelected = selectedOption === i
                  const isCorrectOption = i === intuition.comprehensionQuestion.correctIndex
                  const showResult = (questionAnswered && isCorrectOption) || (isSelected && !questionAnswered)

                  return (
                    <button
                      key={i}
                      onClick={() => handleOptionSelect(i)}
                      disabled={questionAnswered}
                      className={`
                        w-full text-left px-4 py-3 rounded-[var(--radius-technical)] border text-sm
                        transition-all duration-250
                        ${questionAnswered && isCorrectOption
                          ? 'border-[var(--nm-accent-stability)] text-[var(--nm-accent-stability)] bg-[var(--nm-bg-surface)]'
                          : isSelected && !isCorrectOption && !questionAnswered
                          ? 'border-[var(--nm-accent-error)] text-[var(--nm-accent-error)] bg-[var(--nm-bg-surface)]'
                          : 'border-[var(--nm-grid-line)] text-[var(--nm-text-dimmed)] hover:border-[var(--nm-text-annotation)] hover:text-[var(--nm-text-high)]'
                        }
                        ${questionAnswered ? 'cursor-default' : 'cursor-pointer'}
                      `}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>

              {/* Explanation */}
              <AnimatePresence>
                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="text-xs text-[var(--nm-text-dimmed)] leading-relaxed border-l-2 border-[var(--nm-accent-primary)] pl-3 py-1">
                      {intuition.comprehensionQuestion.explanation}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Continue button */}
              <AnimatePresence>
                {questionAnswered && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ActionButton variant="primary" className="w-full" onClick={onComplete}>
                      Entendido →
                    </ActionButton>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

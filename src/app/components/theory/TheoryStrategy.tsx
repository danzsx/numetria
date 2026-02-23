import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { TheoryContent } from '../../../types/lesson'
import { InputField } from '../InputField'
import { BlueprintCard } from '../BlueprintCard'
import { ActionButton } from '../ActionButton'

interface Props {
  strategy: TheoryContent['strategy']
  onComplete: () => void
}

function getPhraseSegments(phrase: string): string[] {
  return phrase.split('___')
}

export function TheoryStrategy({ strategy, onComplete }: Props) {
  // Typewriter: revealed words per phrase
  const [phraseWordCounts, setPhraseWordCounts] = useState<number[]>(
    strategy.innerVoice.map(() => 0)
  )
  const [activePhraseIdx, setActivePhraseIdx] = useState(0)
  const wordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Inputs
  const [activeInputIdx, setActiveInputIdx] = useState(-1) // -1 = not started
  const [filledValues, setFilledValues] = useState<number[]>([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [errorCount, setErrorCount] = useState(0)
  const [isError, setIsError] = useState(false)
  const [showSynthesis, setShowSynthesis] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const phrases = strategy.innerVoice
  const gapInputs = strategy.gapInputs

  // Map: for each phrase, how many blanks it has, and which gapInput indices they correspond to
  // Strategy: last blank in each phrase with blanks = new gapInput; earlier blanks = prev filled values
  const phraseMeta = phrases.map((phrase) => {
    const blankCount = (phrase.match(/___/g) || []).length
    return blankCount
  })

  // Determine which gapInput corresponds to each phrase (the one that needs user input)
  // Phrases with 0 blanks: no gap input
  // Phrases with ≥1 blank: last blank is the next gapInput; earlier blanks show prev answers
  const phraseGapMap: number[] = [] // phraseGapMap[i] = index of gapInput for phrase i, or -1
  let gapCounter = 0
  for (let i = 0; i < phrases.length; i++) {
    if (phraseMeta[i] > 0) {
      phraseGapMap[i] = gapCounter++
    } else {
      phraseGapMap[i] = -1
    }
  }

  // Typewriter for current phrase
  useEffect(() => {
    if (activePhraseIdx >= phrases.length) return

    const phrase = phrases[activePhraseIdx]
    const words = phrase.split(' ')
    const currentCount = phraseWordCounts[activePhraseIdx]

    if (currentCount >= words.length) {
      // Phrase fully typed — start its input or advance
      const gapIdx = phraseGapMap[activePhraseIdx]
      if (gapIdx >= 0 && gapIdx < gapInputs.length) {
        // This phrase needs input — activate it
        if (activeInputIdx !== gapIdx) {
          wordTimerRef.current = setTimeout(() => {
            setActiveInputIdx(gapIdx)
            setTimeout(() => inputRef.current?.focus(), 100)
          }, 200)
        }
      } else if (activePhraseIdx < phrases.length - 1) {
        // No input needed — advance to next phrase
        wordTimerRef.current = setTimeout(() => {
          setActivePhraseIdx(i => i + 1)
        }, 400)
      }
      return
    }

    // Type next word
    wordTimerRef.current = setTimeout(() => {
      setPhraseWordCounts(prev => {
        const next = [...prev]
        next[activePhraseIdx] = currentCount + 1
        return next
      })
    }, 80)

    return () => {
      if (wordTimerRef.current) clearTimeout(wordTimerRef.current)
    }
  }, [activePhraseIdx, phraseWordCounts, activeInputIdx])

  const handleSubmit = () => {
    if (activeInputIdx < 0 || activeInputIdx >= gapInputs.length) return
    const num = parseInt(currentAnswer)
    if (isNaN(num)) return

    const expected = gapInputs[activeInputIdx].answer
    if (num === expected) {
      // Correct
      setIsError(false)
      setFilledValues(prev => {
        const next = [...prev]
        next[activeInputIdx] = num
        return next
      })
      setCurrentAnswer('')
      setErrorCount(0)
      setActiveInputIdx(-1)

      // Advance to next phrase
      const nextPhraseIdx = activePhraseIdx + 1
      if (nextPhraseIdx < phrases.length) {
        setTimeout(() => setActivePhraseIdx(nextPhraseIdx), 300)
      } else {
        setTimeout(() => setShowSynthesis(true), 500)
      }
    } else {
      // Error
      setIsError(true)
      const newErrors = errorCount + 1
      setErrorCount(newErrors)
      if (newErrors >= 2) {
        // Auto-fill after 2 errors
        setTimeout(() => {
          setIsError(false)
          setFilledValues(prev => {
            const next = [...prev]
            next[activeInputIdx] = expected
            return next
          })
          setCurrentAnswer('')
          setErrorCount(0)
          setActiveInputIdx(-1)
          const nextPhraseIdx = activePhraseIdx + 1
          if (nextPhraseIdx < phrases.length) {
            setTimeout(() => setActivePhraseIdx(nextPhraseIdx), 300)
          } else {
            setTimeout(() => setShowSynthesis(true), 500)
          }
        }, 1200)
      } else {
        setTimeout(() => setIsError(false), 500)
      }
    }
  }

  // Render a phrase with blanks filled or as input
  const renderPhrase = (phrase: string, phraseIdx: number) => {
    const gapIdx = phraseGapMap[phraseIdx]
    const segments = getPhraseSegments(phrase)

    return (
      <span>
        {segments.map((seg, si) => {
          const parts: React.ReactNode[] = []
          if (seg) parts.push(<span key={`t${si}`}>{seg}</span>)
          if (si < segments.length - 1) {
            // This is a blank
            const isLastBlank = si === segments.length - 2
            const isInputBlank = isLastBlank && gapIdx >= 0

            if (isInputBlank && activeInputIdx === gapIdx) {
              // Show inline placeholder while user types
              parts.push(
                <span key={`b${si}`} className="inline-block border-b border-[var(--nm-accent-primary)] min-w-[2rem] text-center text-[var(--nm-accent-primary)]">
                  {currentAnswer || '___'}
                </span>
              )
            } else if (isInputBlank && filledValues[gapIdx] !== undefined) {
              // Show filled value for this blank
              parts.push(
                <span key={`b${si}`} className="font-semibold text-[var(--nm-accent-stability)]">
                  {filledValues[gapIdx]}
                </span>
              )
            } else if (!isInputBlank && gapIdx > 0 && filledValues[gapIdx - 1] !== undefined) {
              // Earlier blank shows previous answer
              parts.push(
                <span key={`b${si}`} className="font-semibold text-[var(--nm-accent-stability)]">
                  {filledValues[gapIdx - 1]}
                </span>
              )
            } else {
              parts.push(
                <span key={`b${si}`} className="text-[var(--nm-text-dimmed)]">___</span>
              )
            }
          }
          return parts
        })}
      </span>
    )
  }

  // Determine visible words for a phrase
  const getVisibleText = (phrase: string, phraseIdx: number): string => {
    const words = phrase.split(' ')
    const count = phraseWordCounts[phraseIdx]
    return words.slice(0, count).join(' ')
  }

  return (
    <div className="flex flex-col items-start min-h-[70vh] px-6 pt-8 pb-16">
      <div className="max-w-sm w-full mx-auto space-y-6">
        <div className="text-center">
          <div className="text-[var(--nm-text-annotation)] font-[family-name:var(--font-data)] text-[10px] uppercase tracking-[0.15em]">
            ESTRATÉGIA_MENTAL
          </div>
        </div>

        {/* Inner voice monologue */}
        <div className="space-y-3">
          {phrases.map((phrase, i) => {
            if (phraseWordCounts[i] === 0) return null
            const words = phrase.split(' ')
            const revealedWords = words.slice(0, phraseWordCounts[i])
            const isActive = i === activePhraseIdx
            const isComplete = phraseWordCounts[i] >= words.length

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`text-base leading-relaxed transition-colors duration-300 ${
                  isActive ? 'text-[var(--nm-text-high)]' : 'text-[var(--nm-text-dimmed)]'
                }`}
              >
                {/* Render the phrase with filled blanks */}
                {isComplete ? renderPhrase(phrase, i) : revealedWords.join(' ')}
              </motion.div>
            )
          })}
        </div>

        {/* Active gap input */}
        <AnimatePresence>
          {activeInputIdx >= 0 && activeInputIdx < gapInputs.length && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              <div className="text-[10px] font-[family-name:var(--font-data)] uppercase tracking-[0.12em] text-[var(--nm-text-annotation)]">
                {gapInputs[activeInputIdx].prompt}
              </div>
              <motion.div
                animate={isError ? { x: [-4, 4, -4, 0] } : { x: 0 }}
                transition={{ duration: 0.3 }}
              >
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
                  className="text-2xl"
                />
              </motion.div>
              <div className="text-xs text-[var(--nm-text-annotation)] text-center">
                Pressione Enter para confirmar
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Synthesis */}
        <AnimatePresence>
          {showSynthesis && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <BlueprintCard label="SÍNTESE">
                <div className="space-y-2 mt-2">
                  {gapInputs.map((gap, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-[var(--nm-text-dimmed)]">{gap.prompt}</span>
                      <span className="font-[family-name:var(--font-data)] font-semibold text-[var(--nm-accent-stability)] tabular-nums">
                        {filledValues[i] ?? gap.answer}
                      </span>
                    </div>
                  ))}
                </div>
              </BlueprintCard>
              <ActionButton variant="primary" className="w-full" onClick={onComplete}>
                Ver exemplo completo →
              </ActionButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

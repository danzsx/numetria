import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { TheoryContent } from '../../../types/lesson'
import { TheoryHook } from './TheoryHook'
import { TheoryIntuition } from './TheoryIntuition'
import { TheoryStrategy } from './TheoryStrategy'
import { TheoryGuidedExample } from './TheoryGuidedExample'
import { TheorySimulated } from './TheorySimulated'
import { TheoryCommonError } from './TheoryCommonError'
import { TheoryCalibration } from './TheoryCalibration'

type TheorySubStep =
  | 'T1_hook'
  | 'T2_intuition'
  | 'T3_strategy'
  | 'T4_guided'
  | 'T5_simulated'
  | 'T6_errors'
  | 'T7_calibration'

const STEP_ORDER: TheorySubStep[] = [
  'T1_hook',
  'T2_intuition',
  'T3_strategy',
  'T4_guided',
  'T5_simulated',
  'T6_errors',
  'T7_calibration',
]

const STEP_PROGRESS: Record<TheorySubStep, number> = {
  T1_hook: 0,
  T2_intuition: 17,
  T3_strategy: 33,
  T4_guided: 50,
  T5_simulated: 67,
  T6_errors: 83,
  T7_calibration: 100,
}

interface TheoryPhaseProps {
  content: TheoryContent
  onComplete: (calibrationStatus: 'ok' | 'assisted') => void
  onProgressChange?: (pct: number) => void
  onStepChange?: (step: number) => void
}

const TRANSITION = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.3, ease: [0.2, 0.8, 0.2, 1] as const },
}

export function TheoryPhase({
  content,
  onComplete,
  onProgressChange,
  onStepChange,
}: TheoryPhaseProps) {
  const [currentStep, setCurrentStep] = useState<TheorySubStep>('T1_hook')

  const advanceTo = (step: TheorySubStep) => {
    setCurrentStep(step)
    onProgressChange?.(STEP_PROGRESS[step])
    onStepChange?.(STEP_ORDER.indexOf(step) + 1)
  }

  return (
    <AnimatePresence mode="wait">
      {currentStep === 'T1_hook' && (
        <motion.div key="T1" {...TRANSITION}>
          <TheoryHook
            hook={content.hook}
            onComplete={() => advanceTo('T2_intuition')}
          />
        </motion.div>
      )}
      {currentStep === 'T2_intuition' && (
        <motion.div key="T2" {...TRANSITION}>
          <TheoryIntuition
            intuition={content.intuition}
            onComplete={() => advanceTo('T3_strategy')}
          />
        </motion.div>
      )}
      {currentStep === 'T3_strategy' && (
        <motion.div key="T3" {...TRANSITION}>
          <TheoryStrategy
            strategy={content.strategy}
            onComplete={() => advanceTo('T4_guided')}
          />
        </motion.div>
      )}
      {currentStep === 'T4_guided' && (
        <motion.div key="T4" {...TRANSITION}>
          <TheoryGuidedExample
            guidedExample={content.guidedExample}
            operation={content.hook.problem.operation}
            onComplete={() => advanceTo('T5_simulated')}
          />
        </motion.div>
      )}
      {currentStep === 'T5_simulated' && (
        <motion.div key="T5" {...TRANSITION}>
          <TheorySimulated
            simulatedPractice={content.simulatedPractice}
            operation={content.hook.problem.operation}
            onComplete={() => advanceTo('T6_errors')}
          />
        </motion.div>
      )}
      {currentStep === 'T6_errors' && (
        <motion.div key="T6" {...TRANSITION}>
          <TheoryCommonError
            commonError={content.commonError}
            operation={content.hook.problem.operation}
            onComplete={() => advanceTo('T7_calibration')}
          />
        </motion.div>
      )}
      {currentStep === 'T7_calibration' && (
        <motion.div key="T7" {...TRANSITION}>
          <TheoryCalibration
            calibration={content.calibration}
            operation={content.hook.problem.operation}
            onComplete={onComplete}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

import { describe, expect, it } from 'vitest'
import {
  createConceptLessonEngine,
  lessonNumberToConceptMode,
  type ConceptLessonMode,
} from './conceptLessonEngine'

function buildInput(
  conceptId: number,
  mode: ConceptLessonMode,
  difficultyTier: 1 | 2 | 3 | 4 = 3
) {
  return {
    moduleId: conceptId <= 8 ? 'foundational' : conceptId <= 15 ? 'consolidation' : 'automacao',
    conceptId,
    lessonNumber: mode === 'structure' ? 1 : mode === 'comprehension' ? 2 : 3,
    mode,
    difficultyTier,
    adaptiveProfile: {
      mode: 'random' as const,
      timerMode: 'untimed' as const,
      proMode: conceptId >= 22 ? ('precision' as const) : null,
    },
  }
}

function isAppliedQuestion(problem: { operation: string; operand1: number; operand2: number }) {
  if (problem.operation === 'multiplication') {
    return problem.operand1 > 10
  }
  if (problem.operation === 'division') {
    return problem.operand1 > 40
  }
  return problem.operand1 > 20 || problem.operand2 > 20
}

describe('lessonNumberToConceptMode', () => {
  it('mapeia aulas para modos corretos', () => {
    expect(lessonNumberToConceptMode(1)).toBe('structure')
    expect(lessonNumberToConceptMode(2)).toBe('comprehension')
    expect(lessonNumberToConceptMode(3)).toBe('rhythm')
    expect(lessonNumberToConceptMode(99)).toBe('rhythm')
  })
})

describe('createConceptLessonEngine - Fase 3 content migration', () => {
  it('gera 10 questoes por aula com diferenca clara de timer por modo', () => {
    const structure = createConceptLessonEngine(buildInput(1, 'structure'))
    const comprehension = createConceptLessonEngine(buildInput(1, 'comprehension'))
    const rhythm = createConceptLessonEngine(buildInput(1, 'rhythm'))

    expect(structure.questionSet).toHaveLength(10)
    expect(comprehension.questionSet).toHaveLength(10)
    expect(rhythm.questionSet).toHaveLength(10)

    expect(structure.timerPolicy.timerMode).toBe('untimed')
    expect(comprehension.timerPolicy.timerMode).toBe('untimed')
    expect(rhythm.timerPolicy.timerMode).toBe('timed')
  })

  it('inclui o exemplo obrigatorio de multiplicacao por 5 na aula de estrutura', () => {
    const output = createConceptLessonEngine(buildInput(1, 'structure', 4))

    const has2478x5 = output.questionSet.some(
      (q) => q.operation === 'multiplication' && q.operand1 === 2478 && q.operand2 === 5
    )

    expect(has2478x5).toBe(true)
  })

  it('inclui os casos obrigatorios de compreensao para multiplicacao por 5', () => {
    const output = createConceptLessonEngine(buildInput(1, 'comprehension', 4))
    const required = [478, 1450, 903, 12006]

    const found = required.filter((n) =>
      output.questionSet.some(
        (q) => q.operation === 'multiplication' && q.operand1 === n && q.operand2 === 5
      )
    )

    expect(found).toHaveLength(required.length)
  })

  it('evita nucleo de tabuada simples em todos os conceitos e modos (>=80% aplicado)', () => {
    const concepts = Array.from({ length: 24 }, (_, i) => i + 1)
    const modes: ConceptLessonMode[] = ['structure', 'comprehension', 'rhythm']

    for (const conceptId of concepts) {
      for (const mode of modes) {
        const output = createConceptLessonEngine(buildInput(conceptId, mode, 3))
        const appliedCount = output.questionSet.filter(isAppliedQuestion).length
        const appliedRatio = appliedCount / output.questionSet.length
        expect(appliedRatio).toBeGreaterThanOrEqual(0.8)
      }
    }
  })

  it('mantem precisao (conceitos 22-24) com alternancia de operacoes', () => {
    for (const conceptId of [22, 23, 24]) {
      const output = createConceptLessonEngine(buildInput(conceptId, 'rhythm', 3))
      const operations = new Set(output.questionSet.map((q) => q.operation))
      expect(operations.has('multiplication')).toBe(true)
      expect(operations.has('division')).toBe(true)
    }
  })

  it('preserva diferenca pedagogica de modos em amostra representativa de modulos', () => {
    const sampleConcepts = [1, 10, 17, 20, 23]

    for (const conceptId of sampleConcepts) {
      const structure = createConceptLessonEngine(buildInput(conceptId, 'structure', 3))
      const comprehension = createConceptLessonEngine(buildInput(conceptId, 'comprehension', 3))
      const rhythm = createConceptLessonEngine(buildInput(conceptId, 'rhythm', 3))

      expect(structure.lessonPlan.lessonMode).toBe('structure')
      expect(comprehension.lessonPlan.lessonMode).toBe('comprehension')
      expect(rhythm.lessonPlan.lessonMode).toBe('rhythm')
      expect(structure.timerPolicy.timerMode).toBe('untimed')
      expect(rhythm.timerPolicy.timerMode).toBe('timed')
    }
  })
})

import { describe, expect, it } from 'vitest'
import { buildJourneyContext, findNextTrailAction } from './moduleContext'
import type { ConceptProgress } from '../../types/database'

function conceptProgress(
  conceptId: number,
  lesson1: ConceptProgress['lesson_1_status'],
  lesson2: ConceptProgress['lesson_2_status'],
  lesson3: ConceptProgress['lesson_3_status']
): ConceptProgress {
  return {
    id: `cp-${conceptId}`,
    user_id: 'user-1',
    concept_id: conceptId,
    status: 'in_progress',
    lesson_1_status: lesson1,
    lesson_2_status: lesson2,
    lesson_3_status: lesson3,
    total_sessions: 1,
    best_precision: null,
    avg_precision: null,
    last_precision: null,
    first_attempted_at: null,
    last_attempted_at: null,
    completed_at: null,
  }
}

describe('findNextTrailAction', () => {
  it('escolhe a proxima aula disponivel respeitando ordem de conceito', () => {
    const summary: ConceptProgress[] = [
      conceptProgress(1, 'completed', 'completed', 'completed'),
      conceptProgress(2, 'completed', 'available', 'locked'),
      conceptProgress(3, 'available', 'locked', 'locked'),
    ]

    const next = findNextTrailAction(summary, false)
    expect(next?.conceptId).toBe(2)
    expect(next?.lessonNumber).toBe(2)
  })

  it('ignora conceitos pro para usuarios free', () => {
    const summary: ConceptProgress[] = [
      conceptProgress(16, 'available', 'locked', 'locked'),
    ]

    const next = findNextTrailAction(summary, false)
    expect(next?.conceptId).toBe(1)
    expect(next?.lessonNumber).toBe(1)
  })
})

describe('buildJourneyContext', () => {
  it('normaliza lessonNumber invalido para aula 1', () => {
    const journey = buildJourneyContext(10, 99)
    expect(journey?.moduleId).toBe('consolidation')
    expect(journey?.lessonNumber).toBe(1)
  })
})

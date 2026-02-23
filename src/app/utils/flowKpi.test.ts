import { describe, expect, it } from 'vitest'
import { calculateDropOffReductionPct, calculateFlowKpis, validateEndToEndModuleFlow } from './flowKpi'
import type { FlowEventDetail } from './flowTelemetry'

function event(
  eventName: FlowEventDetail['event'],
  minute: string,
  sessionId: string
): FlowEventDetail {
  return {
    event: eventName,
    sessionId,
    moduleId: 'foundational',
    conceptId: 1,
    lessonNumber: 1,
    timestamp: `2026-02-22T10:${minute}:00.000Z`,
  }
}

describe('calculateFlowKpis', () => {
  it('calcula retorno ao modulo e drop-off por sessao de resultado', () => {
    const events: FlowEventDetail[] = [
      event('module_result_viewed', '00', 'session-a'),
      event('module_result_back_to_module_click', '01', 'session-a'),
      event('module_result_viewed', '02', 'session-b'),
      event('module_result_next_lesson_click', '03', 'session-b'),
      event('module_result_viewed', '04', 'session-c'),
    ]

    const kpis = calculateFlowKpis(events)
    expect(kpis.sessionsViewed).toBe(3)
    expect(kpis.sessionsReturnedToModule).toBe(1)
    expect(kpis.sessionsWithAction).toBe(2)
    expect(kpis.sessionsWithoutAction).toBe(1)
    expect(kpis.returnToModuleRatePct).toBe(33.33)
    expect(kpis.resultDropOffRatePct).toBe(33.33)
  })
})

describe('calculateDropOffReductionPct', () => {
  it('calcula reducao percentual de drop-off vs baseline', () => {
    expect(calculateDropOffReductionPct(40, 25)).toBe(37.5)
  })
})

describe('validateEndToEndModuleFlow', () => {
  it('valida cadeia dashboard/modulo/treino/resultado/proxima acao por sessao', () => {
    const events: FlowEventDetail[] = [
      event('module_lesson_completed', '00', 'session-a'),
      event('module_result_viewed', '01', 'session-a'),
      event('module_result_next_lesson_click', '02', 'session-a'),
      event('module_lesson_completed', '03', 'session-b'),
      event('module_result_viewed', '04', 'session-b'),
    ]

    const check = validateEndToEndModuleFlow(events)
    expect(check.validSessions).toBe(1)
    expect(check.brokenSessions).toBe(1)
  })
})

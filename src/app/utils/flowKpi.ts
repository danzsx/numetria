import type { FlowEventDetail } from './flowTelemetry'

const RESULT_ACTION_EVENTS = [
  'module_result_next_lesson_click',
  'module_result_repeat_lesson_click',
  'module_result_back_to_module_click',
] as const

export interface FlowKpis {
  sessionsViewed: number
  sessionsReturnedToModule: number
  sessionsWithAction: number
  sessionsWithoutAction: number
  returnToModuleRatePct: number
  resultDropOffRatePct: number
}

export interface FlowSequenceValidation {
  validSessions: number
  brokenSessions: number
}

type SessionKeyedEvent = FlowEventDetail & { _sessionKey: string }

function normalizeSessionKey(event: FlowEventDetail, index: number): string {
  if (typeof event.sessionId === 'string' && event.sessionId.length > 0) {
    return `sid:${event.sessionId}`
  }

  const moduleId = typeof event.moduleId === 'string' ? event.moduleId : 'unknown-module'
  const conceptId =
    typeof event.conceptId === 'number' && Number.isFinite(event.conceptId) ? event.conceptId : -1
  const lessonNumber =
    typeof event.lessonNumber === 'number' && Number.isFinite(event.lessonNumber) ? event.lessonNumber : -1
  const minuteBucket = event.timestamp.slice(0, 16)
  return `fallback:${moduleId}:${conceptId}:${lessonNumber}:${minuteBucket}:${index}`
}

function toSessionKeyed(events: FlowEventDetail[]): SessionKeyedEvent[] {
  return events
    .slice()
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map((event, index) => ({
      ...event,
      _sessionKey: normalizeSessionKey(event, index),
    }))
}

function toPct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0
  return Math.round((numerator / denominator) * 10000) / 100
}

export function calculateFlowKpis(events: FlowEventDetail[]): FlowKpis {
  const keyed = toSessionKeyed(events)

  const viewed = new Set<string>()
  const returned = new Set<string>()
  const actions = new Set<string>()

  for (const event of keyed) {
    if (event.event === 'module_result_viewed') {
      viewed.add(event._sessionKey)
      continue
    }

    if (event.event === 'module_result_back_to_module_click') {
      returned.add(event._sessionKey)
      actions.add(event._sessionKey)
      continue
    }

    if (RESULT_ACTION_EVENTS.includes(event.event as (typeof RESULT_ACTION_EVENTS)[number])) {
      actions.add(event._sessionKey)
    }
  }

  const viewedSessions = Array.from(viewed)
  const sessionsReturnedToModule = viewedSessions.filter((key) => returned.has(key)).length
  const sessionsWithAction = viewedSessions.filter((key) => actions.has(key)).length
  const sessionsWithoutAction = viewedSessions.length - sessionsWithAction

  return {
    sessionsViewed: viewedSessions.length,
    sessionsReturnedToModule,
    sessionsWithAction,
    sessionsWithoutAction,
    returnToModuleRatePct: toPct(sessionsReturnedToModule, viewedSessions.length),
    resultDropOffRatePct: toPct(sessionsWithoutAction, viewedSessions.length),
  }
}

export function calculateDropOffReductionPct(
  baselineDropOffRatePct: number,
  currentDropOffRatePct: number
): number {
  if (baselineDropOffRatePct <= 0) return 0
  const reduction = ((baselineDropOffRatePct - currentDropOffRatePct) / baselineDropOffRatePct) * 100
  return Math.round(reduction * 100) / 100
}

export function validateEndToEndModuleFlow(events: FlowEventDetail[]): FlowSequenceValidation {
  const keyed = toSessionKeyed(events)
  const viewedSessions = new Set<string>()
  const completedSessions = new Set<string>()
  const actionSessions = new Set<string>()

  for (const event of keyed) {
    if (event.event === 'module_lesson_completed') {
      completedSessions.add(event._sessionKey)
    } else if (event.event === 'module_result_viewed') {
      viewedSessions.add(event._sessionKey)
    } else if (RESULT_ACTION_EVENTS.includes(event.event as (typeof RESULT_ACTION_EVENTS)[number])) {
      actionSessions.add(event._sessionKey)
    }
  }

  let validSessions = 0
  for (const sessionKey of viewedSessions) {
    if (completedSessions.has(sessionKey) && actionSessions.has(sessionKey)) {
      validSessions += 1
    }
  }

  return {
    validSessions,
    brokenSessions: viewedSessions.size - validSessions,
  }
}

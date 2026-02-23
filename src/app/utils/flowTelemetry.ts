import { calculateFlowKpis, validateEndToEndModuleFlow } from './flowKpi'

export type FlowEventName =
  | 'dashboard_continue_trail_click'
  | 'module_lesson_start'
  | 'module_lesson_ready'
  | 'module_training_opened'
  | 'module_training_exit_to_module'
  | 'module_lesson_completed'
  | 'module_result_viewed'
  | 'module_result_next_lesson_click'
  | 'module_result_repeat_lesson_click'
  | 'module_result_back_to_module_click'
  | 'module_result_no_action_exit'

type FlowEventPayload = Record<string, unknown>
export interface FlowEventDetail extends FlowEventPayload {
  event: FlowEventName
  timestamp: string
}

const FLOW_EVENTS_STORAGE_KEY = 'numetria:flow-events:v1'
const FLOW_EVENTS_LIMIT = 500

function getStoredEvents(): FlowEventDetail[] {
  if (typeof window === 'undefined' || !window.localStorage) return []
  try {
    const raw = window.localStorage.getItem(FLOW_EVENTS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as FlowEventDetail[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function setStoredEvents(events: FlowEventDetail[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(FLOW_EVENTS_STORAGE_KEY, JSON.stringify(events.slice(-FLOW_EVENTS_LIMIT)))
  } catch {
    // best effort telemetry persistence
  }
}

function registerTelemetryApi(): void {
  if (typeof window === 'undefined') return
  const api = {
    getEvents: () => getStoredEvents(),
    getKpis: () => calculateFlowKpis(getStoredEvents()),
    validateFlow: () => validateEndToEndModuleFlow(getStoredEvents()),
    clearEvents: () => setStoredEvents([]),
  }
  ;(window as Window & { numetriaFlowTelemetry?: typeof api }).numetriaFlowTelemetry = api
}

export function trackFlowEvent(event: FlowEventName, payload: FlowEventPayload = {}): void {
  const detail: FlowEventDetail = {
    event,
    ...payload,
    timestamp: new Date().toISOString(),
  }

  console.log('[analytics][flow]', detail)

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    const stored = getStoredEvents()
    stored.push(detail)
    setStoredEvents(stored)
    registerTelemetryApi()
    window.dispatchEvent(new CustomEvent('numetria:flow_event', { detail }))
  }
}

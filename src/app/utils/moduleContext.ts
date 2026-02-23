import type { ConceptProgress } from '../../types/database'
import { isModuleEnabled } from './moduleFlags'

export type ModuleId =
  | 'foundational'
  | 'consolidation'
  | 'automacao'
  | 'ritmo'
  | 'precisao'

export interface ModuleInfo {
  id: ModuleId
  name: string
  fromConceptId: number
  toConceptId: number
}

export interface ModuleJourneyContext {
  moduleId: ModuleId
  moduleName: string
  conceptId: number
  conceptName: string
  lessonNumber: 1 | 2 | 3
}

export interface NextTrailAction extends ModuleJourneyContext {
  lessonLabel: string
}

const MODULES: ModuleInfo[] = [
  { id: 'foundational', name: 'Fundacional', fromConceptId: 1, toConceptId: 8 },
  { id: 'consolidation', name: 'Consolidacao', fromConceptId: 9, toConceptId: 15 },
  { id: 'automacao', name: 'Automacao', fromConceptId: 16, toConceptId: 18 },
  { id: 'ritmo', name: 'Ritmo', fromConceptId: 19, toConceptId: 21 },
  { id: 'precisao', name: 'Precisao', fromConceptId: 22, toConceptId: 24 },
]

const CONCEPT_NAMES: Record<number, string> = {
  1: 'Multiplicacao por 5',
  2: 'Soma ate 100 com transporte',
  3: 'Multiplicacao por 9',
  4: 'Divisao exata por 2',
  5: 'Multiplicacao por 2 e 4',
  6: 'Adicao de tres parcelas',
  7: 'Subtracao com resultado positivo',
  8: 'Multiplicacao por 10 e 100',
  9: 'Subtracao com emprestimo',
  10: 'Multiplicacao por 3 e 6',
  11: 'Divisao por 3 e 6',
  12: 'Multiplicacao por 7 e 8',
  13: 'Divisao por 4 e 5',
  14: 'Multiplicacao por 11',
  15: 'Divisao por 7 e 8',
  16: 'Reconhecimento de Padroes',
  17: 'Complementos Decimais I',
  18: 'Complementos Decimais II',
  19: 'Ritmo Base',
  20: 'Pressao Temporal',
  21: 'Fluxo Adaptativo',
  22: 'Alternancia x div I',
  23: 'Interferencia Estrutural',
  24: 'Precisao Integrada',
}

export function getLessonLabel(lessonNumber: number): string {
  if (lessonNumber === 1) return 'Estrutura'
  if (lessonNumber === 2) return 'Compreensao'
  return 'Ritmo'
}

export function getConceptNameById(conceptId: number): string {
  return CONCEPT_NAMES[conceptId] ?? `Conceito ${conceptId}`
}

export function getModuleById(moduleId: string): ModuleInfo | null {
  return MODULES.find((module) => module.id === moduleId) ?? null
}

export function getModuleFromConceptId(conceptId: number): ModuleInfo | null {
  return (
    MODULES.find(
      (module) => conceptId >= module.fromConceptId && conceptId <= module.toConceptId
    ) ?? null
  )
}

function getNextLessonFromProgress(concept: ConceptProgress): 1 | 2 | 3 | null {
  if (concept.lesson_1_status === 'available') return 1
  if (concept.lesson_2_status === 'available') return 2
  if (concept.lesson_3_status === 'available') return 3
  return null
}

export function findNextTrailAction(
  conceptSummary: ConceptProgress[],
  isPro: boolean
): NextTrailAction | null {
  const allowedMaxConceptId = isPro ? 24 : 15
  const sorted = [...conceptSummary]
    .filter((concept) => concept.concept_id >= 1 && concept.concept_id <= allowedMaxConceptId)
    .sort((a, b) => a.concept_id - b.concept_id)

  for (const concept of sorted) {
    const lessonNumber = getNextLessonFromProgress(concept)
    if (!lessonNumber) continue

    const module = getModuleFromConceptId(concept.concept_id)
    if (!module) continue
    if (!isModuleEnabled(module.id)) continue

    return {
      moduleId: module.id,
      moduleName: module.name,
      conceptId: concept.concept_id,
      conceptName: getConceptNameById(concept.concept_id),
      lessonNumber,
      lessonLabel: getLessonLabel(lessonNumber),
    }
  }

  const fallbackModule = MODULES.find((module) => isModuleEnabled(module.id))
  if (!fallbackModule) return null

  return {
    moduleId: fallbackModule.id,
    moduleName: fallbackModule.name,
    conceptId: fallbackModule.fromConceptId,
    conceptName: getConceptNameById(fallbackModule.fromConceptId),
    lessonNumber: 1,
    lessonLabel: getLessonLabel(1),
  }
}

export function buildJourneyContext(
  conceptId: number,
  lessonNumber: number
): ModuleJourneyContext | null {
  const module = getModuleFromConceptId(conceptId)
  if (!module) return null

  const safeLessonNumber: 1 | 2 | 3 =
    lessonNumber === 1 || lessonNumber === 2 || lessonNumber === 3 ? lessonNumber : 1

  return {
    moduleId: module.id,
    moduleName: module.name,
    conceptId,
    conceptName: getConceptNameById(conceptId),
    lessonNumber: safeLessonNumber,
  }
}

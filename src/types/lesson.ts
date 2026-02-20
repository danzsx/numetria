// ─── Tipos para o sistema de aulas interativas ───────────────────────────────
// Fase 2 — Motor de Conteúdo das Aulas (Dados Estáticos)

export type ErrorType = 'decomposition' | 'transport' | 'compensation' | 'rhythm'

export interface WarmupQuestion {
  operand1: number
  operand2: number
  operation: 'multiplication' | 'addition' | 'subtraction' | 'division'
  answer: number
}

export interface TechniqueStep {
  label: string        // ex: "Etapa 1"
  expression: string   // ex: "14 × 10"
  explanation: string  // ex: "Multiplique por 10 primeiro"
  answer: number
}

export interface GuidedProblem {
  operand1: number
  operand2: number
  operand3?: number    // para problemas de três parcelas (conceito 6)
  operation: string
  intermediate: {
    label: string
    answer: number
    errorType: ErrorType
  }
  final: number
}

export interface ConsolidationQuestion {
  operand1: number
  operand2: number
  operand3?: number    // para problemas de três parcelas (conceito 6)
  operation: string
  answer: number
}

export interface LessonContent {
  conceptId: number
  lessonNumber: 1 | 2 | 3
  title: string
  techniqueName: string
  techniqueRule: string
  warmup: WarmupQuestion[]
  technique: {
    example: { operand1: number; operand2: number; operand3?: number }
    steps: TechniqueStep[]
    conclusion: string
  }
  guided: GuidedProblem[]
  consolidation: ConsolidationQuestion[]
  compression: ConsolidationQuestion[]
}

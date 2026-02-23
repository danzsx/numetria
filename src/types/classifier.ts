/** ─────────────────────────────────────────────────────────────
 *  Classificador Estrutural de Operações — Tipos e Contratos
 *  Spec: docs/spec-classificador-operacoes.md · Fase 0
 *  ───────────────────────────────────────────────────────────── */

/** Operadores suportados pelo parser */
export type ClassifierOperator = 'addition' | 'subtraction' | 'multiplication' | 'division'

/** Expressão parseada */
export interface ParsedExpression {
    /** 2 ou 3 operandos numéricos extraídos da string */
    operands: number[]
    /** Operação identificada */
    operator: ClassifierOperator
    /** String original fornecida pelo usuário */
    raw: string
}

/** Erro de parsing */
export interface ParseError {
    type: 'invalid_format' | 'unsupported_operation' | 'empty_input' | 'out_of_range'
    message: string
}

/** Resultado do parse — discriminated union ok/error */
export type ParseResult =
    | { ok: true; expression: ParsedExpression }
    | { ok: false; error: ParseError }

/** Match de um conceito pedagógico */
export interface ConceptMatch {
    /** ID do conceito (1–24) */
    conceptId: number
    /** Nome legível do conceito */
    conceptName: string
    /** Nome do módulo */
    moduleName: string
    /** Identificador do módulo */
    moduleId: 'foundational' | 'consolidation' | 'automacao' | 'ritmo' | 'precisao'
    /** Score de confiança entre 0.0 e 1.0 */
    confidence: number
    /** Explicação legível do motivo do match */
    reason: string
    /** Camada que originou este match */
    matchLayer: 'direct' | 'decomposition' | 'heuristic'
    /** Se o conceito requer plano Pro */
    isPro: boolean
    /** Se existe conteúdo de aula implementado para este conceito */
    hasLesson: boolean
}

/** Recomendação de aula específica */
export interface LessonRecommendation {
    /** ID do conceito associado */
    conceptId: number
    /** Número da aula (1, 2 ou 3) */
    lessonNumber: 1 | 2 | 3
    /** Nome pedagógico da aula */
    lessonName: 'Estrutura' | 'Compressão' | 'Ritmo e Transferência'
    /** Justificativa da recomendação */
    rationale: string
}

/** Resultado final da classificação */
export interface ClassificationResult {
    /** Expressão parseada */
    expression: ParsedExpression
    /** Conceitos correspondentes, ordenados por confidence desc */
    matches: ConceptMatch[]
    /** Aula recomendada para o match principal (null se nenhum match) */
    recommendedLesson: LessonRecommendation | null
    /** Mensagem de fallback quando nenhum conceito casa (null se há matches) */
    fallbackMessage: string | null
}

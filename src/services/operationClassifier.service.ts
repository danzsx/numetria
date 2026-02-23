/** ─────────────────────────────────────────────────────────────
 *  Classificador Estrutural de Operações — Serviço Completo
 *  Spec: docs/spec-classificador-operacoes.md · Fases 1–2
 *  ───────────────────────────────────────────────────────────── */

import type {
    ClassifierOperator,
    ClassificationResult,
    ConceptMatch,
    LessonRecommendation,
    ParsedExpression,
    ParseError,
    ParseResult,
} from '../types/classifier'

// ═══════════════════════════════════════════════════════════════════════════════
//  FASE 1 — PARSER
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Constantes ────────────────────────────────────────────────────────────────

/** Limite superior para operandos (spec §1.3) */
const MAX_OPERAND = 99_999

/** Mapa de caracteres Unicode → ASCII */
const UNICODE_MAP: Record<string, string> = {
    '×': '*',
    '÷': '/',
    '−': '-',
    '✕': '*',
    '➗': '/',
}

/**
 * Caracteres que indicam operações não-suportadas.
 * Se a entrada normalizada contiver algum deles → `unsupported_operation`
 */
const UNSUPPORTED_CHARS = /[a-zA-Z√^()]/

/**
 * Regex de captura — 3 operandos (somente adição: a + b + c)
 * Testada ANTES da regex de 2 operandos (spec §1.2)
 */
const PATTERN_3OP = /^(\d+)\s*\+\s*(\d+)\s*\+\s*(\d+)$/

/**
 * Regex de captura — 2 operandos genéricos
 * Captura: número   operador   número
 */
const PATTERN_2OP = /^(\d+)\s*([+\-*/x×÷−])\s*(\d+)$/i

// ─── Helpers (Parser) ──────────────────────────────────────────────────────────

/**
 * Normaliza a entrada do usuário (spec §1.1):
 *   Etapa 1: trim + lowercase
 *   Etapa 2: Unicode → ASCII
 *   Etapa 3: remover espaços múltiplos
 */
function normalizeInput(raw: string): string {
    // Etapa 1: trim + lowercase
    let result = raw.trim().toLowerCase()

    // Etapa 2: Unicode → ASCII
    for (const [unicode, ascii] of Object.entries(UNICODE_MAP)) {
        result = result.replaceAll(unicode, ascii)
    }

    // Etapa 2b: 'x' entre dígitos é operador de multiplicação → '*'
    result = result.replace(/(\d)\s*x\s*(\d)/g, '$1*$2')

    // Etapa 3: remover espaços múltiplos
    result = result.replace(/\s+/g, ' ')

    return result
}

/**
 * Detecta o operador classificado a partir de um símbolo capturado (spec §1.4).
 */
function detectOperator(symbol: string): ClassifierOperator {
    switch (symbol) {
        case '+':
            return 'addition'
        case '-':
        case '−':
            return 'subtraction'
        case '*':
        case 'x':
        case '×':
            return 'multiplication'
        case '/':
        case '÷':
            return 'division'
        default:
            return 'addition' // fallback seguro; nunca deve ser alcançado após regex
    }
}

/**
 * Cria um `ParseError` tipado.
 */
function makeError(
    type: ParseError['type'],
    message: string,
): ParseResult {
    return { ok: false, error: { type, message } }
}

// ─── API Pública — Parser ──────────────────────────────────────────────────────

/**
 * Parseia uma string livre fornecida pelo usuário e extrai a operação, os
 * operandos e metadados estruturais.
 *
 * **Formatos aceitos:**
 * - `5 × 14`, `5x14`, `5*14`
 * - `48+37`, `48 + 37`
 * - `7 + 8 + 3` (adição de 3 parcelas)
 * - `84/2`, `84 ÷ 2`
 * - `92 − 47`, `92 - 47`
 *
 * **Rejeições:**
 * - String vazia → `empty_input`
 * - Letras, parênteses, `√`, `^` → `unsupported_operation`
 * - Operandos > 99 999 → `out_of_range`
 * - Formato não reconhecido → `invalid_format`
 */
export function parseExpression(raw: string): ParseResult {
    // ─── Validação: entrada vazia ─────────────────────────────────────────
    if (!raw || raw.trim().length === 0) {
        return makeError('empty_input', 'Entrada vazia. Digite uma operação. Ex: 5 × 14')
    }

    // ─── Normalização ─────────────────────────────────────────────────────
    const normalized = normalizeInput(raw)

    // ─── Validação: caracteres não-suportados ─────────────────────────────
    if (UNSUPPORTED_CHARS.test(normalized)) {
        return makeError(
            'unsupported_operation',
            'Operação não suportada. Use +, −, × ou ÷.',
        )
    }

    // ─── Tentativa 1: 3 operandos (adição) ────────────────────────────────
    const match3 = PATTERN_3OP.exec(normalized)
    if (match3) {
        const operands = [
            Number(match3[1]),
            Number(match3[2]),
            Number(match3[3]),
        ]

        // Validação: out_of_range
        if (operands.some(n => n > MAX_OPERAND)) {
            return makeError('out_of_range', 'Operandos devem ser ≤ 99.999.')
        }

        const expression: ParsedExpression = {
            operands,
            operator: 'addition',
            raw,
        }
        return { ok: true, expression }
    }

    // ─── Tentativa 2: 2 operandos ─────────────────────────────────────────
    const match2 = PATTERN_2OP.exec(normalized)
    if (match2) {
        const operands = [Number(match2[1]), Number(match2[3])]
        const operatorSymbol = match2[2]

        // Validação: out_of_range
        if (operands.some(n => n > MAX_OPERAND)) {
            return makeError('out_of_range', 'Operandos devem ser ≤ 99.999.')
        }

        const expression: ParsedExpression = {
            operands,
            operator: detectOperator(operatorSymbol),
            raw,
        }
        return { ok: true, expression }
    }

    // ─── Nenhum padrão casou → formato inválido ──────────────────────────
    return makeError(
        'invalid_format',
        'Formato inválido. Ex: 2405 x 13',
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  FASE 2 — MOTOR DE CLASSIFICAÇÃO INTELIGENTE
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Mapeamento de módulos e conceitos ─────────────────────────────────────────

/** Nomes dos conceitos pedagógicos */
const CONCEPT_NAMES: Record<number, string> = {
    1: 'Multiplicação por 5',
    2: 'Soma até 100 com transporte',
    3: 'Multiplicação por 9',
    4: 'Divisão exata por 2',
    5: 'Multiplicação por 2 e 4',
    6: 'Adição de três parcelas',
    7: 'Subtração com resultado positivo',
    8: 'Multiplicação por 10 e 100',
    9: 'Subtração com empréstimo',
    10: 'Multiplicação por 3 e 6',
    11: 'Divisão por 3 e 6',
    12: 'Multiplicação por 7 e 8',
    13: 'Divisão por 4 e 5',
    14: 'Multiplicação por 11',
    15: 'Divisão por 7 e 8',
    16: 'Reconhecimento de Padrões',
    17: 'Complementos Decimais I',
    18: 'Complementos e Composições',
    19: 'Ritmo Base',
    20: 'Pressão Temporal',
    21: 'Fluxo Adaptativo',
    22: 'Alternância × ÷ I',
    23: 'Interferência Estrutural',
    24: 'Precisão Integrada',
}

/** Mapeamento conceito → módulo */
const CONCEPT_MODULE: Record<number, { moduleId: ConceptMatch['moduleId']; moduleName: string }> = {
    1: { moduleId: 'foundational', moduleName: 'Fundacional' },
    2: { moduleId: 'foundational', moduleName: 'Fundacional' },
    3: { moduleId: 'foundational', moduleName: 'Fundacional' },
    4: { moduleId: 'foundational', moduleName: 'Fundacional' },
    5: { moduleId: 'foundational', moduleName: 'Fundacional' },
    6: { moduleId: 'foundational', moduleName: 'Fundacional' },
    7: { moduleId: 'foundational', moduleName: 'Fundacional' },
    8: { moduleId: 'foundational', moduleName: 'Fundacional' },
    9: { moduleId: 'consolidation', moduleName: 'Consolidação' },
    10: { moduleId: 'consolidation', moduleName: 'Consolidação' },
    11: { moduleId: 'consolidation', moduleName: 'Consolidação' },
    12: { moduleId: 'consolidation', moduleName: 'Consolidação' },
    13: { moduleId: 'consolidation', moduleName: 'Consolidação' },
    14: { moduleId: 'consolidation', moduleName: 'Consolidação' },
    15: { moduleId: 'consolidation', moduleName: 'Consolidação' },
    16: { moduleId: 'automacao', moduleName: 'Automação' },
    17: { moduleId: 'automacao', moduleName: 'Automação' },
    18: { moduleId: 'automacao', moduleName: 'Automação' },
    19: { moduleId: 'ritmo', moduleName: 'Ritmo' },
    20: { moduleId: 'ritmo', moduleName: 'Ritmo' },
    21: { moduleId: 'ritmo', moduleName: 'Ritmo' },
    22: { moduleId: 'precisao', moduleName: 'Precisão' },
    23: { moduleId: 'precisao', moduleName: 'Precisão' },
    24: { moduleId: 'precisao', moduleName: 'Precisão' },
}

/** Operação primária associada a cada conceito */
const CONCEPT_OPERATION: Record<number, ClassifierOperator> = {
    1: 'multiplication', 2: 'addition', 3: 'multiplication', 4: 'division',
    5: 'multiplication', 6: 'addition', 7: 'subtraction', 8: 'multiplication',
    9: 'subtraction', 10: 'multiplication', 11: 'division', 12: 'multiplication',
    13: 'division', 14: 'multiplication', 15: 'division',
    16: 'multiplication', 17: 'multiplication', 18: 'multiplication',
    19: 'multiplication', 20: 'multiplication', 21: 'division',
    22: 'multiplication', 23: 'division', 24: 'multiplication',
}

/** Conceitos que possuem aula implementada (atualmente: conceitos 1–8, lessonNumber 1) */
const CONCEPTS_WITH_LESSONS = new Set([1, 2, 3, 4, 5, 6, 7, 8])

/** Nomes das aulas por número */
const LESSON_NAMES: Record<1 | 2 | 3, LessonRecommendation['lessonName']> = {
    1: 'Estrutura',
    2: 'Compressão',
    3: 'Ritmo e Transferência',
}

// ─── 2.5 Função auxiliar: Detecção de Empréstimo (borrow) ──────────────────────

/**
 * Detecta se uma subtração requer "empréstimo" (borrow) em algum dígito.
 * Usada na distinção entre conceito 7 (subtração simples) e conceito 9 (com empréstimo).
 */
export function hasDigitBorrow(minuend: number, subtrahend: number): boolean {
    const mStr = String(minuend)
    const sStr = String(subtrahend).padStart(mStr.length, '0')

    for (let i = mStr.length - 1; i >= 0; i--) {
        if (parseInt(sStr[i]) > parseInt(mStr[i])) return true
    }
    return false
}

// ─── 2.2 Camada 1 — Match Direto ──────────────────────────────────────────────

interface DirectRule {
    conceptId: number
    op: ClassifierOperator
    test: (ops: number[], expr: ParsedExpression) => boolean
    name: string
    module: ConceptMatch['moduleId']
}

const DIRECT_RULES: DirectRule[] = [
    // ─── Módulo Fundacional (1–8) ───
    {
        conceptId: 1, op: 'multiplication', test: (ops) => ops.includes(5),
        name: 'Multiplicação por 5', module: 'foundational'
    },

    {
        conceptId: 2, op: 'addition', test: (ops) => ops.length === 2 &&
            ops.every(n => n <= 100) && ((ops[0] % 10) + (ops[1] % 10)) > 9,
        name: 'Soma até 100 com transporte', module: 'foundational'
    },

    {
        conceptId: 3, op: 'multiplication', test: (ops) => ops.includes(9),
        name: 'Multiplicação por 9', module: 'foundational'
    },

    {
        conceptId: 4, op: 'division', test: (_ops, expr) =>
            expr.operands[1] === 2 && expr.operands[0] % 2 === 0,
        name: 'Divisão exata por 2', module: 'foundational'
    },

    {
        conceptId: 5, op: 'multiplication', test: (ops) =>
            ops.includes(2) || ops.includes(4),
        name: 'Multiplicação por 2 e 4', module: 'foundational'
    },

    {
        conceptId: 6, op: 'addition', test: (ops) => ops.length === 3,
        name: 'Adição de três parcelas', module: 'foundational'
    },

    {
        conceptId: 7, op: 'subtraction', test: (_ops, expr) =>
            expr.operands[0] > expr.operands[1] &&
            expr.operands.every(n => n <= 200) &&
            !hasDigitBorrow(expr.operands[0], expr.operands[1]),
        name: 'Subtração com resultado positivo', module: 'foundational'
    },

    {
        conceptId: 8, op: 'multiplication', test: (ops) =>
            ops.includes(10) || ops.includes(100),
        name: 'Multiplicação por 10 e 100', module: 'foundational'
    },

    // ─── Módulo Consolidação (9–15) ───
    {
        conceptId: 9, op: 'subtraction', test: (_ops, expr) =>
            hasDigitBorrow(expr.operands[0], expr.operands[1]),
        name: 'Subtração com empréstimo', module: 'consolidation'
    },

    {
        conceptId: 10, op: 'multiplication', test: (ops) =>
            ops.includes(3) || ops.includes(6),
        name: 'Multiplicação por 3 e 6', module: 'consolidation'
    },

    {
        conceptId: 11, op: 'division', test: (_ops, expr) =>
            [3, 6].includes(expr.operands[1]),
        name: 'Divisão por 3 e 6', module: 'consolidation'
    },

    {
        conceptId: 12, op: 'multiplication', test: (ops) =>
            ops.includes(7) || ops.includes(8),
        name: 'Multiplicação por 7 e 8', module: 'consolidation'
    },

    {
        conceptId: 13, op: 'division', test: (_ops, expr) =>
            [4, 5].includes(expr.operands[1]),
        name: 'Divisão por 4 e 5', module: 'consolidation'
    },

    {
        conceptId: 14, op: 'multiplication', test: (ops) => ops.includes(11),
        name: 'Multiplicação por 11', module: 'consolidation'
    },

    {
        conceptId: 15, op: 'division', test: (_ops, expr) =>
            [7, 8].includes(expr.operands[1]),
        name: 'Divisão por 7 e 8', module: 'consolidation'
    },
]

// ─── Cálculo de confidence (Camada 1) ──────────────────────────────────────────

/** Operandos-chave exatos para cada conceito (quando o operando é especificamente esse valor) */
const EXACT_KEY_OPERANDS: Record<number, number[]> = {
    1: [5],
    3: [9],
    4: [2],       // divisor
    5: [2, 4],
    8: [10, 100],
    10: [3, 6],
    11: [3, 6],   // divisor
    12: [7, 8],
    13: [4, 5],   // divisor
    14: [11],
    15: [7, 8],   // divisor
}

function isExactKeyOperand(conceptId: number, operands: number[]): boolean {
    const keys = EXACT_KEY_OPERANDS[conceptId]
    if (!keys) return false
    return operands.some(n => keys.includes(n))
}

function getOtherOperandValue(conceptId: number, operands: number[]): number {
    const keys = EXACT_KEY_OPERANDS[conceptId]
    if (!keys) return Math.max(...operands)
    const other = operands.filter(n => !keys.includes(n))
    return other.length > 0 ? Math.max(...other) : Math.max(...operands)
}

function calculateDirectConfidence(conceptId: number, operands: number[]): number {
    let base = 0.90

    // Boost: operando-chave é exato e único
    if (isExactKeyOperand(conceptId, operands)) base = 1.0

    // Ajuste por magnitude — operandos muito grandes reduzem confiança marginalmente
    const otherOperand = getOtherOperandValue(conceptId, operands)
    if (otherOperand > 1000) base -= 0.05
    if (otherOperand > 10000) base -= 0.05

    return Math.max(0.70, base)
}

// ─── runDirectRules ────────────────────────────────────────────────────────────

function runDirectRules(expr: ParsedExpression): ConceptMatch[] {
    const matches: ConceptMatch[] = []

    for (const rule of DIRECT_RULES) {
        if (rule.op !== expr.operator) continue
        if (!rule.test(expr.operands, expr)) continue

        const moduleInfo = CONCEPT_MODULE[rule.conceptId]
        matches.push({
            conceptId: rule.conceptId,
            conceptName: rule.name,
            moduleName: moduleInfo?.moduleName ?? 'Desconhecido',
            moduleId: rule.module,
            confidence: calculateDirectConfidence(rule.conceptId, expr.operands),
            reason: buildDirectReason(rule.conceptId, expr),
            matchLayer: 'direct',
            isPro: rule.conceptId > 15,
            hasLesson: CONCEPTS_WITH_LESSONS.has(rule.conceptId),
        })
    }

    return matches
}

function buildDirectReason(conceptId: number, expr: ParsedExpression): string {
    const keys = EXACT_KEY_OPERANDS[conceptId]
    if (keys) {
        const found = expr.operands.find(n => keys.includes(n))
        if (found !== undefined) {
            return `Um dos operandos é ${found}`
        }
    }

    // Razões específicas para conceitos sem operando-chave simples
    switch (conceptId) {
        case 2:
            return `Soma com transporte: unidades (${expr.operands[0] % 10} + ${expr.operands[1] % 10}) > 9`
        case 6:
            return 'Adição de três parcelas'
        case 7:
            return 'Subtração simples sem empréstimo'
        case 9:
            return 'Subtração com empréstimo detectado'
        default:
            return `Match direto para conceito ${conceptId}`
    }
}

// ─── 2.3 Camada 2 — Decomposição Estrutural ───────────────────────────────────

interface DecompositionRule {
    test: (expr: ParsedExpression) => boolean
    resolve: (expr: ParsedExpression) => { conceptId: number; name: string }
    confidence: number
    reason: (expr: ParsedExpression) => string
}

/** Encontra o conceito correspondente ao multiplicador base */
function findConceptByMultiplier(baseDigit: number): { conceptId: number; name: string } {
    const multiplierMap: Record<number, { conceptId: number; name: string }> = {
        5: { conceptId: 1, name: 'Multiplicação por 5' },
        9: { conceptId: 3, name: 'Multiplicação por 9' },
        2: { conceptId: 5, name: 'Multiplicação por 2 e 4' },
        4: { conceptId: 5, name: 'Multiplicação por 2 e 4' },
        3: { conceptId: 10, name: 'Multiplicação por 3 e 6' },
        6: { conceptId: 10, name: 'Multiplicação por 3 e 6' },
        7: { conceptId: 12, name: 'Multiplicação por 7 e 8' },
        8: { conceptId: 12, name: 'Multiplicação por 7 e 8' },
    }
    return multiplierMap[baseDigit] ?? { conceptId: 16, name: 'Reconhecimento de Padrões' }
}

/** Verifica se um número é "proche" de um valor redondo (ex: 99, 101, 199) */
function isCloseToRound(n: number): boolean {
    const magnitude = Math.pow(10, Math.floor(Math.log10(n)))
    const rounded = Math.round(n / magnitude) * magnitude
    return Math.abs(n - rounded) <= 2
}

function roundUp(n: number): number {
    const magnitude = Math.pow(10, Math.floor(Math.log10(n)))
    return Math.ceil(n / magnitude) * magnitude
}

const DECOMPOSITION_PATTERNS: DecompositionRule[] = [
    // ×50 pode ser visto como ×5 transferido (×100 ÷ 2)
    {
        test: (expr) => expr.operator === 'multiplication' &&
            expr.operands.some(n => n % 10 === 0 && n / 10 >= 2 && n / 10 <= 9),
        resolve: (expr) => {
            const factor = expr.operands.find(n => n % 10 === 0 && n / 10 >= 2 && n / 10 <= 9)!
            const baseDigit = factor / 10
            return findConceptByMultiplier(baseDigit)
        },
        confidence: 0.80,
        reason: (expr) => {
            const factor = expr.operands.find(n => n % 10 === 0 && n / 10 >= 2 && n / 10 <= 9)!
            const baseDigit = factor / 10
            return `${factor} = ${baseDigit} × 10 → padrão de transferência`
        },
    },

    // ×25 pode ser visto como ×100 ÷ 4
    {
        test: (expr) => expr.operator === 'multiplication' && expr.operands.includes(25),
        resolve: () => ({ conceptId: 16, name: 'Reconhecimento de Padrões' }),
        confidence: 0.82,
        reason: () => '25 = 100 ÷ 4 → padrão de reconhecimento',
    },

    // ×15 = ×10 + ×5
    {
        test: (expr) => expr.operator === 'multiplication' && expr.operands.includes(15),
        resolve: () => ({ conceptId: 18, name: 'Complementos e Composições' }),
        confidence: 0.78,
        reason: () => '15 = 10 + 5 → decomposição aditiva',
    },

    // Complementos decimais: unidades somam 10
    {
        test: (expr) => expr.operator === 'addition' && expr.operands.length === 2 &&
            (expr.operands[0] % 10) + (expr.operands[1] % 10) === 10,
        resolve: () => ({ conceptId: 17, name: 'Complementos Decimais' }),
        confidence: 0.75,
        reason: () => 'Unidades dos operandos somam 10 → complemento decimal',
    },

    // Subtração onde operando pode ser arredondado (ex: -99 ≈ -100+1)
    {
        test: (expr) => expr.operator === 'subtraction' &&
            isCloseToRound(expr.operands[1]),
        resolve: () => ({ conceptId: 9, name: 'Subtração com compensação' }),
        confidence: 0.72,
        reason: (expr) => `${expr.operands[1]} ≈ ${roundUp(expr.operands[1])} → compensação`,
    },

    // Multiplicação 2 dígitos × 2 dígitos (propriedade distributiva)
    {
        test: (expr) => expr.operator === 'multiplication' &&
            expr.operands.every(n => n >= 10 && n <= 99) &&
            !DIRECT_RULES.some(r => r.op === 'multiplication' && r.test(expr.operands, expr)),
        resolve: () => ({ conceptId: 16, name: 'Propriedade distributiva mental' }),
        confidence: 0.65,
        reason: () => 'Dois operandos de 2 dígitos → requer decomposição distributiva',
    },

    // Multiplicação grande (3+ dígitos × 1 dígito não-chave)
    {
        test: (expr) => expr.operator === 'multiplication' &&
            expr.operands.some(n => n >= 100) &&
            !DIRECT_RULES.some(r => r.op === 'multiplication' && r.test(expr.operands, expr)),
        resolve: () => ({ conceptId: 16, name: 'Propriedade distributiva mental' }),
        confidence: 0.60,
        reason: () => 'Operando de 3+ dígitos sem fator especial → decomposição posicional',
    },
]

function runDecompositionRules(expr: ParsedExpression): ConceptMatch[] {
    const matches: ConceptMatch[] = []

    for (const pattern of DECOMPOSITION_PATTERNS) {
        if (!pattern.test(expr)) continue

        const resolved = pattern.resolve(expr)
        const moduleInfo = CONCEPT_MODULE[resolved.conceptId]

        matches.push({
            conceptId: resolved.conceptId,
            conceptName: resolved.name,
            moduleName: moduleInfo?.moduleName ?? 'Desconhecido',
            moduleId: moduleInfo?.moduleId ?? 'automacao',
            confidence: pattern.confidence,
            reason: pattern.reason(expr),
            matchLayer: 'decomposition',
            isPro: resolved.conceptId > 15,
            hasLesson: CONCEPTS_WITH_LESSONS.has(resolved.conceptId),
        })
    }

    return matches
}

// ─── 2.4 Camada 3 — Heurística de Proximidade ─────────────────────────────────

/** Multiplicadores-chave e seus conceitos correspondentes */
const KEY_MULTIPLIERS: Array<{ value: number; conceptId: number }> = [
    { value: 2, conceptId: 5 },
    { value: 3, conceptId: 10 },
    { value: 4, conceptId: 5 },
    { value: 5, conceptId: 1 },
    { value: 6, conceptId: 10 },
    { value: 7, conceptId: 12 },
    { value: 8, conceptId: 12 },
    { value: 9, conceptId: 3 },
    { value: 10, conceptId: 8 },
    { value: 11, conceptId: 14 },
    { value: 100, conceptId: 8 },
]

function findNearestKeyMultiplier(n: number): { value: number; conceptId: number } | null {
    let best: { value: number; conceptId: number } | null = null
    let bestDist = Infinity

    for (const km of KEY_MULTIPLIERS) {
        const dist = Math.abs(n - km.value)
        if (dist < bestDist) {
            bestDist = dist
            best = km
        }
    }

    return best
}

function buildMatch(conceptId: number): Partial<ConceptMatch> {
    const moduleInfo = CONCEPT_MODULE[conceptId]
    return {
        conceptId,
        conceptName: CONCEPT_NAMES[conceptId] ?? `Conceito ${conceptId}`,
        moduleName: moduleInfo?.moduleName ?? 'Desconhecido',
        moduleId: moduleInfo?.moduleId ?? 'automacao',
        isPro: conceptId > 15,
        hasLesson: CONCEPTS_WITH_LESSONS.has(conceptId),
    }
}

function heuristicAnalysis(expr: ParsedExpression): ConceptMatch[] {
    const matches: ConceptMatch[] = []

    if (expr.operator === 'multiplication') {
        // Encontra o menor operando e verifica proximidade a fator-chave
        const smallOp = Math.min(...expr.operands)
        const nearestKey = findNearestKeyMultiplier(smallOp)
        if (nearestKey && Math.abs(smallOp - nearestKey.value) <= 1) {
            matches.push({
                ...buildMatch(nearestKey.conceptId),
                confidence: 0.45,
                reason: `${smallOp} ≈ ${nearestKey.value} → conceito próximo`,
                matchLayer: 'heuristic',
            } as ConceptMatch)
        }
    }

    if (expr.operator === 'addition' && expr.operands.length === 2) {
        // Verifica se a soma provavelmente terá transporte
        const unitSum = (expr.operands[0] % 10) + (expr.operands[1] % 10)
        if (unitSum >= 10) {
            matches.push({
                ...buildMatch(2),
                confidence: 0.40,
                reason: 'Soma com transporte detectado (unidades ≥ 10)',
                matchLayer: 'heuristic',
            } as ConceptMatch)
        }
    }

    if (expr.operator === 'division') {
        // Verifica divisibilidade por fatores-chave comuns
        const dividend = expr.operands[0]
        const divisor = expr.operands[1]
        if (dividend % divisor !== 0) {
            // Divisão não exata — fora do escopo pedagógico
            return []
        }
    }

    return matches
}

// ─── 2.6 Resolução de Conflitos e Ranqueamento ────────────────────────────────

/** Tabela de especificidade por conceito (spec §2.6) */
const CONCEPT_SPECIFICITY: Record<number, number> = {
    8: 1.05, // ×10, ×100 — muito específico
    14: 1.04, // ×11
    1: 1.02, // ×5
    3: 1.02, // ×9
    4: 1.01, // ÷2
    12: 1.00, // ×7, ×8
    10: 0.99, // ×3, ×6
    5: 0.98, // ×2, ×4
}

function getConceptSpecificity(conceptId: number): number {
    return CONCEPT_SPECIFICITY[conceptId] ?? 1.0
}

function deduplicateByConceptId(matches: ConceptMatch[]): ConceptMatch[] {
    const map = new Map<number, ConceptMatch>()

    for (const match of matches) {
        const existing = map.get(match.conceptId)
        if (!existing || match.confidence > existing.confidence) {
            map.set(match.conceptId, match)
        }
    }

    return Array.from(map.values())
}

function resolveConflicts(matches: ConceptMatch[]): ConceptMatch[] {
    // 1. Ordenar por confidence desc
    matches.sort((a, b) => b.confidence - a.confidence)

    // 2. Penalizar conceitos com operando menos "restrito"
    for (const match of matches) {
        const specificity = getConceptSpecificity(match.conceptId)
        match.confidence = Math.min(1.0, match.confidence * specificity)
    }

    // 3. Re-ordenar
    matches.sort((a, b) => b.confidence - a.confidence)

    // 4. Cap de confidence em caso de ambiguidade
    if (matches.length >= 2 &&
        matches[0].confidence - matches[1].confidence < 0.1) {
        // Ambos candidatos são igualmente válidos
        const cap = Math.min(matches[0].confidence, 0.85)
        matches[0].confidence = cap
        matches[1].confidence = cap
    }

    // Arredondar para 2 casas decimais
    for (const match of matches) {
        match.confidence = Math.round(match.confidence * 100) / 100
    }

    return matches
}

// ─── 2.7 Determinação Inteligente da Aula ──────────────────────────────────────

function getOperationForConcept(conceptId: number): ClassifierOperator {
    return CONCEPT_OPERATION[conceptId] ?? 'multiplication'
}

function isKeyOperand(conceptId: number, n: number): boolean {
    const keys = EXACT_KEY_OPERANDS[conceptId]
    if (!keys) return false
    return keys.includes(n)
}

export function determineLessonNumber(
    conceptId: number,
    operands: number[],
): { lessonNumber: 1 | 2 | 3; rationale: string } {
    const maxOperand = Math.max(...operands.filter(n => !isKeyOperand(conceptId, n)))
    const allSmall = operands.every(n => n <= 12)

    // Se todos os operandos são de tabuada simples → Aula 1
    if (allSmall) {
        return { lessonNumber: 1, rationale: 'Operandos pequenos (≤ 12) → Aula Estrutura' }
    }

    // Faixas dinâmicas baseadas no tipo de operação
    const operation = getOperationForConcept(conceptId)

    if (operation === 'multiplication' || operation === 'division') {
        if (maxOperand <= 30) return { lessonNumber: 1, rationale: `Magnitude baixa (${maxOperand} ≤ 30) → Aula Estrutura` }
        if (maxOperand <= 200) return { lessonNumber: 2, rationale: `Magnitude moderada (${maxOperand} ≤ 200) → Aula Compressão` }
        return { lessonNumber: 3, rationale: `Magnitude alta (${maxOperand} > 200) → Aula Ritmo e Transferência` }
    }

    if (operation === 'addition' || operation === 'subtraction') {
        if (maxOperand <= 100) return { lessonNumber: 1, rationale: `Soma/subtração simples (${maxOperand} ≤ 100) → Aula Estrutura` }
        if (maxOperand <= 500) return { lessonNumber: 2, rationale: `Soma/subtração moderada (${maxOperand} ≤ 500) → Aula Compressão` }
        return { lessonNumber: 3, rationale: `Soma/subtração complexa (${maxOperand} > 500) → Aula Ritmo e Transferência` }
    }

    return { lessonNumber: 1, rationale: 'Padrão: Aula Estrutura' }
}

// ─── 2.8 Fallback Inteligente ──────────────────────────────────────────────────

const BASE_FALLBACK: Record<ClassifierOperator, { conceptId: number; name: string }> = {
    multiplication: { conceptId: 16, name: 'Reconhecimento de Padrões / Propriedade Distributiva' },
    addition: { conceptId: 2, name: 'Soma até 100 com transporte' },
    subtraction: { conceptId: 9, name: 'Subtração com empréstimo' },
    division: { conceptId: 13, name: 'Divisão por 4 e 5' },
}

function buildFallback(expr: ParsedExpression): string {
    const fb = BASE_FALLBACK[expr.operator]
    return `Aula não encontrada. Recomendação estrutural: ${fb.name} (Conceito ${fb.conceptId}).`
}

// ─── 2.9 API Pública — Classificação ──────────────────────────────────────────

/**
 * Erro de classificação — lançado quando o input não pode ser parseado.
 */
export class ClassificationError extends Error {
    constructor(public readonly parseError: ParseError) {
        super(parseError.message)
        this.name = 'ClassificationError'
    }
}

/**
 * Classifica uma expressão matemática livre, retornando conceitos pedagógicos
 * correspondentes com score de confiança, recomendação de aula e fallback.
 *
 * Motor de 3 camadas:
 *  1. Match Direto (confidence 0.85–1.0)
 *  2. Decomposição Estrutural (confidence 0.60–0.85)
 *  3. Heurística de Proximidade (confidence 0.30–0.60)
 */
export function classifyOperation(input: string): ClassificationResult {
    const parsed = parseExpression(input)
    if (!parsed.ok) throw new ClassificationError(parsed.error)

    const expr = parsed.expression
    const allMatches: ConceptMatch[] = []

    // Camada 1 — Match Direto
    allMatches.push(...runDirectRules(expr))

    // Camada 2 — Decomposição
    allMatches.push(...runDecompositionRules(expr))

    // Camada 3 — Heurística (só se poucas matches nas camadas anteriores)
    if (allMatches.length < 2) {
        allMatches.push(...heuristicAnalysis(expr))
    }

    // Deduplica por conceptId (mantém maior confidence)
    const deduped = deduplicateByConceptId(allMatches)

    // Resolução de conflitos
    const ranked = resolveConflicts(deduped)

    // Determinação de aula (para o match principal)
    const topMatch = ranked[0] ?? null
    const lesson = topMatch
        ? determineLessonNumber(topMatch.conceptId, expr.operands)
        : null

    return {
        expression: expr,
        matches: ranked,
        recommendedLesson: lesson ? {
            conceptId: topMatch!.conceptId,
            lessonNumber: lesson.lessonNumber,
            lessonName: LESSON_NAMES[lesson.lessonNumber],
            rationale: lesson.rationale,
        } : null,
        fallbackMessage: ranked.length === 0 ? buildFallback(expr) : null,
    }
}

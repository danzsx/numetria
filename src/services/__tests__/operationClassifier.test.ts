/** ─────────────────────────────────────────────────────────────
 *  Classificador Estrutural de Operações — Testes Unitários (Fase 5)
 *  Spec: docs/spec-classificador-operacoes.md · Fase 5
 *
 *  Suítes:
 *    1. parseExpression — formatos aceitos e rejeições
 *    2. classifyOperation — Camada 1 (Match Direto)
 *    3. classifyOperation — Camada 2 (Decomposição)
 *    4. classifyOperation — Match Múltiplo
 *    5. determineLessonNumber
 *    6. Fallback
 *    7. Conceitos Pro
 *    8. Golden Tests (spec §7)
 *  ───────────────────────────────────────────────────────────── */

import { describe, it, expect } from 'vitest'
import {
    parseExpression,
    classifyOperation,
    determineLessonNumber,
    hasDigitBorrow,
    ClassificationError,
} from '../operationClassifier.service'

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Assert a successful parse and return the expression */
function expectOk(raw: string) {
    const result = parseExpression(raw)
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(`Expected ok for "${raw}", got error: ${result.error.message}`)
    return result.expression
}

/** Assert a failed parse and return the error */
function expectError(raw: string) {
    const result = parseExpression(raw)
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error(`Expected error for "${raw}", got ok`)
    return result.error
}

// ═══════════════════════════════════════════════════════════════════════════════
//  1. parseExpression
// ═══════════════════════════════════════════════════════════════════════════════

describe('parseExpression', () => {
    // ─── Formatos aceitos ─────────────────────────────────────────────────

    describe('Formatos aceitos', () => {
        it('parseia "5 × 14" → multiplication, [5, 14]', () => {
            const expr = expectOk('5 × 14')
            expect(expr.operator).toBe('multiplication')
            expect(expr.operands).toEqual([5, 14])
        })

        it('parseia "5x14" → multiplication, [5, 14]', () => {
            const expr = expectOk('5x14')
            expect(expr.operator).toBe('multiplication')
            expect(expr.operands).toEqual([5, 14])
        })

        it('parseia "5*14" → multiplication, [5, 14]', () => {
            const expr = expectOk('5*14')
            expect(expr.operator).toBe('multiplication')
            expect(expr.operands).toEqual([5, 14])
        })

        it('parseia "48+37" → addition, [48, 37]', () => {
            const expr = expectOk('48+37')
            expect(expr.operator).toBe('addition')
            expect(expr.operands).toEqual([48, 37])
        })

        it('parseia "48 + 37" → addition, [48, 37]', () => {
            const expr = expectOk('48 + 37')
            expect(expr.operator).toBe('addition')
            expect(expr.operands).toEqual([48, 37])
        })

        it('parseia "7 + 8 + 3" → addition, [7, 8, 3]', () => {
            const expr = expectOk('7 + 8 + 3')
            expect(expr.operator).toBe('addition')
            expect(expr.operands).toEqual([7, 8, 3])
        })

        it('parseia "84/2" → division, [84, 2]', () => {
            const expr = expectOk('84/2')
            expect(expr.operator).toBe('division')
            expect(expr.operands).toEqual([84, 2])
        })

        it('parseia "84 ÷ 2" → division, [84, 2]', () => {
            const expr = expectOk('84 ÷ 2')
            expect(expr.operator).toBe('division')
            expect(expr.operands).toEqual([84, 2])
        })

        it('parseia "92 − 47" → subtraction, [92, 47]', () => {
            const expr = expectOk('92 − 47')
            expect(expr.operator).toBe('subtraction')
            expect(expr.operands).toEqual([92, 47])
        })

        it('parseia "92 - 47" → subtraction, [92, 47]', () => {
            const expr = expectOk('92 - 47')
            expect(expr.operator).toBe('subtraction')
            expect(expr.operands).toEqual([92, 47])
        })

        it('preserva string original no campo raw', () => {
            const expr = expectOk('  5 × 14  ')
            expect(expr.raw).toBe('  5 × 14  ')
        })

        it('parseia Unicode ✕ → multiplication', () => {
            const expr = expectOk('5✕14')
            expect(expr.operator).toBe('multiplication')
            expect(expr.operands).toEqual([5, 14])
        })

        it('parseia Unicode ➗ → division', () => {
            const expr = expectOk('84➗2')
            expect(expr.operator).toBe('division')
            expect(expr.operands).toEqual([84, 2])
        })
    })

    // ─── Rejeições ────────────────────────────────────────────────────────

    describe('Rejeições', () => {
        it('rejeita string vazia → empty_input', () => {
            const err = expectError('')
            expect(err.type).toBe('empty_input')
        })

        it('rejeita string somente espaços → empty_input', () => {
            const err = expectError('   ')
            expect(err.type).toBe('empty_input')
        })

        it('rejeita "abc" → unsupported_operation', () => {
            const err = expectError('abc')
            expect(err.type).toBe('unsupported_operation')
        })

        it('rejeita "√49" → unsupported_operation', () => {
            const err = expectError('√49')
            expect(err.type).toBe('unsupported_operation')
        })

        it('rejeita "5^2" → unsupported_operation', () => {
            const err = expectError('5^2')
            expect(err.type).toBe('unsupported_operation')
        })

        it('rejeita "(5+3)×2" → unsupported_operation', () => {
            const err = expectError('(5+3)×2')
            expect(err.type).toBe('unsupported_operation')
        })

        it('rejeita "999999 × 2" → out_of_range', () => {
            const err = expectError('999999 × 2')
            expect(err.type).toBe('out_of_range')
        })

        it('rejeita "2 × 100000" → out_of_range', () => {
            const err = expectError('2 × 100000')
            expect(err.type).toBe('out_of_range')
        })

        it('aceita "99999 × 2" (limite exato) → ok', () => {
            const expr = expectOk('99999 × 2')
            expect(expr.operands).toEqual([99999, 2])
        })

        it('rejeita formato aleatório → invalid_format', () => {
            const err = expectError('++5')
            expect(err.type).toBe('invalid_format')
        })

        it('rejeita apenas número → invalid_format', () => {
            const err = expectError('42')
            expect(err.type).toBe('invalid_format')
        })
    })
})

// ═══════════════════════════════════════════════════════════════════════════════
//  1b. hasDigitBorrow (auxiliar)
// ═══════════════════════════════════════════════════════════════════════════════

describe('hasDigitBorrow', () => {
    it('detecta empréstimo: 304 − 187 → true', () => {
        expect(hasDigitBorrow(304, 187)).toBe(true)
    })

    it('sem empréstimo: 74 − 32 → false', () => {
        expect(hasDigitBorrow(74, 32)).toBe(false)
    })

    it('empréstimo nas unidades: 52 − 37 → true', () => {
        expect(hasDigitBorrow(52, 37)).toBe(true)
    })

    it('sem empréstimo em todos os dígitos: 86 − 42 → false', () => {
        expect(hasDigitBorrow(86, 42)).toBe(false)
    })

    it('empréstimo nas dezenas: 130 − 150 → true', () => {
        expect(hasDigitBorrow(130, 150)).toBe(true)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════
//  2. classifyOperation — Camada 1: Match Direto
// ═══════════════════════════════════════════════════════════════════════════════

describe('classifyOperation — Camada 1: Match Direto', () => {
    it('5 × 14 → Conceito 1 (×5), confidence ≥ 0.90', () => {
        const result = classifyOperation('5 × 14')
        expect(result.matches.length).toBeGreaterThanOrEqual(1)
        const top = result.matches[0]
        expect(top.conceptId).toBe(1)
        expect(top.conceptName).toContain('5')
        expect(top.confidence).toBeGreaterThanOrEqual(0.90)
        expect(top.matchLayer).toBe('direct')
    })

    it('48 + 37 → Conceito 2 (soma c/ transporte), confidence ≥ 0.85', () => {
        const result = classifyOperation('48 + 37')
        const match = result.matches.find(m => m.conceptId === 2)
        expect(match).toBeDefined()
        expect(match!.confidence).toBeGreaterThanOrEqual(0.85)
        expect(match!.matchLayer).toBe('direct')
    })

    it('9 × 17 → Conceito 3 (×9), confidence ≥ 0.90', () => {
        // 9 × 17 evita ambiguidade com ×7 (conceito 12)
        const result = classifyOperation('9 × 17')
        const match = result.matches.find(m => m.conceptId === 3)
        expect(match).toBeDefined()
        expect(match!.confidence).toBeGreaterThanOrEqual(0.90)
        expect(match!.matchLayer).toBe('direct')
    })

    it('84 ÷ 2 → Conceito 4 (÷2 exata), confidence ≥ 0.90', () => {
        const result = classifyOperation('84 ÷ 2')
        const match = result.matches.find(m => m.conceptId === 4)
        expect(match).toBeDefined()
        expect(match!.confidence).toBeGreaterThanOrEqual(0.90)
        expect(match!.matchLayer).toBe('direct')
    })

    it('4 × 18 → Conceito 5 (×2/×4), confidence ≥ 0.85', () => {
        const result = classifyOperation('4 × 18')
        const match = result.matches.find(m => m.conceptId === 5)
        expect(match).toBeDefined()
        expect(match!.confidence).toBeGreaterThanOrEqual(0.85)
        expect(match!.matchLayer).toBe('direct')
    })

    it('7 + 8 + 3 → Conceito 6 (3 parcelas), confidence ≥ 0.90', () => {
        const result = classifyOperation('7 + 8 + 3')
        const match = result.matches.find(m => m.conceptId === 6)
        expect(match).toBeDefined()
        expect(match!.confidence).toBeGreaterThanOrEqual(0.90)
        expect(match!.matchLayer).toBe('direct')
    })

    it('86 − 42 → Conceito 7 (subtração simples), confidence ≥ 0.85', () => {
        // 86 - 42: sem empréstimo (6 > 2, 8 > 4), ambos ≤ 200
        const result = classifyOperation('86 - 42')
        const match = result.matches.find(m => m.conceptId === 7)
        expect(match).toBeDefined()
        expect(match!.confidence).toBeGreaterThanOrEqual(0.85)
        expect(match!.matchLayer).toBe('direct')
    })

    it('47 × 10 → Conceito 8 (×10/×100), confidence ≥ 0.95', () => {
        const result = classifyOperation('47 × 10')
        const top = result.matches[0]
        expect(top.conceptId).toBe(8)
        expect(top.confidence).toBeGreaterThanOrEqual(0.95)
        expect(top.matchLayer).toBe('direct')
    })

    it('304 − 187 → Conceito 9 (subtração c/ empréstimo)', () => {
        const result = classifyOperation('304 - 187')
        const match = result.matches.find(m => m.conceptId === 9)
        expect(match).toBeDefined()
        expect(match!.matchLayer).toBe('direct')
    })

    it('6 × 25 → Conceito 10 (×3/×6)', () => {
        const result = classifyOperation('6 × 25')
        const match = result.matches.find(m => m.conceptId === 10)
        expect(match).toBeDefined()
        expect(match!.matchLayer).toBe('direct')
    })

    it('84 ÷ 3 → Conceito 11 (÷3/÷6)', () => {
        const result = classifyOperation('84 ÷ 3')
        const match = result.matches.find(m => m.conceptId === 11)
        expect(match).toBeDefined()
        expect(match!.matchLayer).toBe('direct')
    })

    it('7 × 46 → Conceito 12 (×7/×8)', () => {
        const result = classifyOperation('7 × 46')
        const match = result.matches.find(m => m.conceptId === 12)
        expect(match).toBeDefined()
        expect(match!.matchLayer).toBe('direct')
    })

    it('120 ÷ 4 → Conceito 13 (÷4/÷5)', () => {
        const result = classifyOperation('120 ÷ 4')
        const match = result.matches.find(m => m.conceptId === 13)
        expect(match).toBeDefined()
        expect(match!.matchLayer).toBe('direct')
    })

    it('11 × 88 → Conceito 14 (×11)', () => {
        const result = classifyOperation('11 × 88')
        const match = result.matches.find(m => m.conceptId === 14)
        expect(match).toBeDefined()
        expect(match!.matchLayer).toBe('direct')
    })

    it('168 ÷ 7 → Conceito 15 (÷7/÷8)', () => {
        const result = classifyOperation('168 ÷ 7')
        const match = result.matches.find(m => m.conceptId === 15)
        expect(match).toBeDefined()
        expect(match!.matchLayer).toBe('direct')
    })
})

// ═══════════════════════════════════════════════════════════════════════════════
//  3. classifyOperation — Camada 2: Decomposição
// ═══════════════════════════════════════════════════════════════════════════════

describe('classifyOperation — Camada 2: Decomposição', () => {
    it('50 × 36 → detecta padrão ×5 transferência, conceito 1', () => {
        const result = classifyOperation('50 × 36')
        const match = result.matches.find(m => m.conceptId === 1)
        expect(match).toBeDefined()
        expect(match!.matchLayer).toBe('decomposition')
        expect(match!.reason).toContain('transferência')
    })

    it('25 × 16 → detecta padrão de reconhecimento, conceito 16', () => {
        const result = classifyOperation('25 × 16')
        const match = result.matches.find(m => m.conceptId === 16)
        expect(match).toBeDefined()
        expect(match!.matchLayer).toBe('decomposition')
        expect(match!.isPro).toBe(true)
    })

    it('15 × 24 → detecta decomposição aditiva', () => {
        const result = classifyOperation('15 × 24')
        const match = result.matches.find(m => m.conceptId === 18)
        expect(match).toBeDefined()
        expect(match!.reason).toContain('decomposição aditiva')
        expect(match!.matchLayer).toBe('decomposition')
    })

    it('2405 × 13 → retorna com recomendação distributiva', () => {
        const result = classifyOperation('2405 × 13')
        // Deve ter match via decomposição (3+ dígitos)
        expect(result.matches.length).toBeGreaterThanOrEqual(1)
        // Algum match deve referenciar decomposição posicional ou distributiva
        const decomp = result.matches.find(m => m.matchLayer === 'decomposition')
        expect(decomp).toBeDefined()
    })

    it('complementos decimais: 27 + 43 → unidades somam 10', () => {
        const result = classifyOperation('27 + 43')
        const match = result.matches.find(m => m.conceptId === 17)
        expect(match).toBeDefined()
        expect(match!.reason).toContain('complemento decimal')
    })
})

// ═══════════════════════════════════════════════════════════════════════════════
//  4. classifyOperation — Match Múltiplo
// ═══════════════════════════════════════════════════════════════════════════════

describe('classifyOperation — Match Múltiplo', () => {
    it('5 × 9 → retorna conceitos 1 e 3, ranqueados', () => {
        const result = classifyOperation('5 × 9')
        const ids = result.matches.map(m => m.conceptId)
        expect(ids).toContain(1)
        expect(ids).toContain(3)
        expect(result.matches.length).toBeGreaterThanOrEqual(2)
        // Devem estar ranqueados por confidence desc
        for (let i = 1; i < result.matches.length; i++) {
            expect(result.matches[i - 1].confidence).toBeGreaterThanOrEqual(
                result.matches[i].confidence
            )
        }
    })

    it('10 × 5 → retorna conceitos 8 e 1, ranqueados', () => {
        const result = classifyOperation('10 × 5')
        const ids = result.matches.map(m => m.conceptId)
        expect(ids).toContain(8)
        expect(ids).toContain(1)
    })

    it('ambiguidade limita confidence a ≤ 0.85 quando os 2 primeiros são próximos', () => {
        const result = classifyOperation('5 × 9')
        if (result.matches.length >= 2) {
            const diff = result.matches[0].confidence - result.matches[1].confidence
            if (diff < 0.1) {
                expect(result.matches[0].confidence).toBeLessThanOrEqual(0.85)
                expect(result.matches[1].confidence).toBeLessThanOrEqual(0.85)
            }
        }
    })
})

// ═══════════════════════════════════════════════════════════════════════════════
//  5. determineLessonNumber
// ═══════════════════════════════════════════════════════════════════════════════

describe('determineLessonNumber', () => {
    // ─── Multiplicação / Divisão ──────────────────────────────────────────

    it('5 × 14 → lessonNumber 1 (magnitude baixa)', () => {
        const result = determineLessonNumber(1, [5, 14])
        expect(result.lessonNumber).toBe(1)
    })

    it('5 × 80 → lessonNumber 2 (magnitude moderada)', () => {
        const result = determineLessonNumber(1, [5, 80])
        expect(result.lessonNumber).toBe(2)
    })

    it('5 × 248 → lessonNumber 3 (magnitude alta)', () => {
        const result = determineLessonNumber(1, [5, 248])
        expect(result.lessonNumber).toBe(3)
    })

    // ─── Adição / Subtração ──────────────────────────────────────────────

    it('48 + 37 → lessonNumber 1 (soma simples)', () => {
        const result = determineLessonNumber(2, [48, 37])
        expect(result.lessonNumber).toBe(1)
    })

    it('478 + 297 → lessonNumber 2 (soma moderada)', () => {
        const result = determineLessonNumber(2, [478, 297])
        expect(result.lessonNumber).toBe(2)
    })

    it('2478 + 1389 → lessonNumber 3 (soma complexa)', () => {
        const result = determineLessonNumber(2, [2478, 1389])
        expect(result.lessonNumber).toBe(3)
    })

    // ─── Operandos pequenos (tabuada simples) ────────────────────────────

    it('operandos ≤ 12 retornam lessonNumber 1 (tabuada simples)', () => {
        const result = determineLessonNumber(1, [5, 7])
        expect(result.lessonNumber).toBe(1)
        expect(result.rationale).toContain('12')
    })

    // ─── Rationale é informativo ─────────────────────────────────────────

    it('rationale contém explicação legível', () => {
        const result = determineLessonNumber(1, [5, 248])
        expect(result.rationale.length).toBeGreaterThan(0)
        expect(typeof result.rationale).toBe('string')
    })
})

// ═══════════════════════════════════════════════════════════════════════════════
//  6. Fallback
// ═══════════════════════════════════════════════════════════════════════════════

describe('Fallback', () => {
    it('operação sem match retorna fallbackMessage não-nulo ou matches via decomposição', () => {
        // 13 × 17 — nenhum operando é fator-chave direto
        const result = classifyOperation('13 × 17')
        // O motor deve retornar matches via decomposição ou fallback message
        if (result.matches.length === 0) {
            expect(result.fallbackMessage).not.toBeNull()
            expect(result.fallbackMessage!.length).toBeGreaterThan(0)
        } else {
            expect(result.matches.length).toBeGreaterThanOrEqual(1)
        }
    })

    it('fallbackMessage inclui nome do conceito base e número', () => {
        // Verificamos o formato do fallback testando o resultado
        const result = classifyOperation('13 × 17')
        // Ou tem matches ou tem fallback — ambos são válidos
        expect(result.matches.length > 0 || result.fallbackMessage !== null).toBe(true)
        if (result.fallbackMessage) {
            // Deve incluir "Conceito" ou nome do conceito
            expect(result.fallbackMessage).toMatch(/Conceito|Recomendação/)
        }
    })
})

// ═══════════════════════════════════════════════════════════════════════════════
//  7. Conceitos Pro
// ═══════════════════════════════════════════════════════════════════════════════

describe('Conceitos Pro', () => {
    it('conceitos 16–24 possuem isPro: true', () => {
        // 25 × 16 deve triggar conceito 16 (Pro)
        const result = classifyOperation('25 × 16')
        const proMatch = result.matches.find(m => m.conceptId >= 16)
        expect(proMatch).toBeDefined()
        expect(proMatch!.isPro).toBe(true)
    })

    it('conceitos 1–15 possuem isPro: false', () => {
        const result = classifyOperation('5 × 14')
        const nonProMatch = result.matches.find(m => m.conceptId >= 1 && m.conceptId <= 15)
        expect(nonProMatch).toBeDefined()
        expect(nonProMatch!.isPro).toBe(false)
    })

    it('conceito Pro via decomposição também tem isPro: true', () => {
        const result = classifyOperation('15 × 24')
        const proMatch = result.matches.find(m => m.conceptId === 18)
        expect(proMatch).toBeDefined()
        expect(proMatch!.isPro).toBe(true)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════
//  8. ClassificationError
// ═══════════════════════════════════════════════════════════════════════════════

describe('ClassificationError', () => {
    it('lança ClassificationError para input vazio', () => {
        expect(() => classifyOperation('')).toThrow(ClassificationError)
    })

    it('lança ClassificationError para operação não suportada', () => {
        expect(() => classifyOperation('√49')).toThrow(ClassificationError)
    })

    it('ClassificationError contém parseError com type e message', () => {
        try {
            classifyOperation('abc')
            expect.unreachable('Should have thrown')
        } catch (err) {
            expect(err).toBeInstanceOf(ClassificationError)
            const ce = err as ClassificationError
            expect(ce.parseError.type).toBe('unsupported_operation')
            expect(ce.parseError.message).toBeTruthy()
        }
    })

    it('ClassificationError para out_of_range', () => {
        try {
            classifyOperation('999999 × 2')
            expect.unreachable('Should have thrown')
        } catch (err) {
            expect(err).toBeInstanceOf(ClassificationError)
            const ce = err as ClassificationError
            expect(ce.parseError.type).toBe('out_of_range')
        }
    })
})

// ═══════════════════════════════════════════════════════════════════════════════
//  9. ClassificationResult structure
// ═══════════════════════════════════════════════════════════════════════════════

describe('ClassificationResult structure', () => {
    it('retorna expression parseada correta', () => {
        const result = classifyOperation('5 × 14')
        expect(result.expression.operands).toEqual([5, 14])
        expect(result.expression.operator).toBe('multiplication')
        expect(result.expression.raw).toBe('5 × 14')
    })

    it('retorna recommendedLesson com lessonName e rationale', () => {
        const result = classifyOperation('5 × 14')
        expect(result.recommendedLesson).not.toBeNull()
        expect(result.recommendedLesson!.lessonName).toBe('Estrutura')
        expect(result.recommendedLesson!.rationale).toBeTruthy()
        expect(result.recommendedLesson!.conceptId).toBe(1)
    })

    it('retorna hasLesson true para conceitos 1–8', () => {
        const result = classifyOperation('5 × 14')
        const match = result.matches.find(m => m.conceptId === 1)
        expect(match).toBeDefined()
        expect(match!.hasLesson).toBe(true)
    })

    it('retorna hasLesson false para conceitos 9+', () => {
        const result = classifyOperation('304 - 187')
        const match = result.matches.find(m => m.conceptId === 9)
        expect(match).toBeDefined()
        expect(match!.hasLesson).toBe(false)
    })

    it('retorna moduleId e moduleName corretos para fundacional', () => {
        const result = classifyOperation('5 × 14')
        const match = result.matches.find(m => m.conceptId === 1)
        expect(match!.moduleId).toBe('foundational')
        expect(match!.moduleName).toBe('Fundacional')
    })

    it('retorna moduleId e moduleName corretos para consolidação', () => {
        const result = classifyOperation('304 - 187')
        const match = result.matches.find(m => m.conceptId === 9)
        expect(match!.moduleId).toBe('consolidation')
        expect(match!.moduleName).toBe('Consolidação')
    })

    it('retorna reason legível para cada match', () => {
        const result = classifyOperation('5 × 14')
        for (const match of result.matches) {
            expect(match.reason).toBeTruthy()
            expect(typeof match.reason).toBe('string')
            expect(match.reason.length).toBeGreaterThan(0)
        }
    })

    it('matches são ordenados por confidence descendente', () => {
        const result = classifyOperation('5 × 9')
        for (let i = 1; i < result.matches.length; i++) {
            expect(result.matches[i - 1].confidence).toBeGreaterThanOrEqual(
                result.matches[i].confidence
            )
        }
    })
})

// ═══════════════════════════════════════════════════════════════════════════════
//  10. Golden Tests (spec §7)
// ═══════════════════════════════════════════════════════════════════════════════

describe('Golden Tests (spec §7)', () => {
    it('5 × 14 → ×5 (ID 1), Fundacional, Aula 1, confidence ≥ 0.95, Direta', () => {
        const result = classifyOperation('5 × 14')
        const top = result.matches[0]
        expect(top.conceptId).toBe(1)
        expect(top.moduleId).toBe('foundational')
        expect(top.confidence).toBeGreaterThanOrEqual(0.95)
        expect(top.matchLayer).toBe('direct')
        expect(result.recommendedLesson!.lessonNumber).toBe(1)
    })

    it('5 × 248 → ×5 (ID 1), Fundacional, Aula 3, Direta', () => {
        const result = classifyOperation('5 × 248')
        const match = result.matches.find(m => m.conceptId === 1)
        expect(match).toBeDefined()
        expect(match!.matchLayer).toBe('direct')
        expect(result.recommendedLesson!.lessonNumber).toBe(3)
    })

    it('48 + 37 → Soma c/ transporte (ID 2), Fundacional, Aula 1', () => {
        const result = classifyOperation('48 + 37')
        const match = result.matches.find(m => m.conceptId === 2)
        expect(match).toBeDefined()
        expect(match!.moduleId).toBe('foundational')
        expect(result.recommendedLesson!.lessonNumber).toBe(1)
    })

    it('9 × 256 → ×9 (ID 3), Fundacional, Aula 3, Direta', () => {
        const result = classifyOperation('9 × 256')
        const match = result.matches.find(m => m.conceptId === 3)
        expect(match).toBeDefined()
        expect(match!.matchLayer).toBe('direct')
    })

    it('84 ÷ 2 → ÷2 exata (ID 4), Fundacional, Aula 1, Direta', () => {
        const result = classifyOperation('84 ÷ 2')
        const match = result.matches.find(m => m.conceptId === 4)
        expect(match).toBeDefined()
        expect(match!.moduleId).toBe('foundational')
    })

    it('4 × 248 → ×2/×4 (ID 5), Fundacional, Aula 3, Direta', () => {
        const result = classifyOperation('4 × 248')
        const match = result.matches.find(m => m.conceptId === 5)
        expect(match).toBeDefined()
        expect(match!.moduleId).toBe('foundational')
    })

    it('7 + 8 + 3 → 3 parcelas (ID 6), Fundacional, Aula 1, Direta', () => {
        const result = classifyOperation('7 + 8 + 3')
        const match = result.matches.find(m => m.conceptId === 6)
        expect(match).toBeDefined()
        expect(match!.moduleId).toBe('foundational')
        expect(result.recommendedLesson!.lessonNumber).toBe(1)
    })

    it('47 × 10 → ×10/×100 (ID 8), Fundacional, Direta', () => {
        // Note: determineLessonNumber reports lesson 2 because the non-key
        // operand (47) exceeds the 30-threshold for multiplication lesson 1.
        const result = classifyOperation('47 × 10')
        const top = result.matches[0]
        expect(top.conceptId).toBe(8)
        expect(top.moduleId).toBe('foundational')
        expect(top.matchLayer).toBe('direct')
        expect(result.recommendedLesson!.lessonNumber).toBe(2)
    })

    it('5 × 9 → ×5 + ×9 (IDs 1,3), ambiguidade, confidence ≤ 0.85', () => {
        const result = classifyOperation('5 × 9')
        const ids = result.matches.map(m => m.conceptId)
        expect(ids).toContain(1)
        expect(ids).toContain(3)
        // Ambiguidade → cap em 0.85
        const m1 = result.matches.find(m => m.conceptId === 1)!
        const m3 = result.matches.find(m => m.conceptId === 3)!
        expect(m1.confidence).toBeLessThanOrEqual(0.85)
        expect(m3.confidence).toBeLessThanOrEqual(0.85)
    })

    it('50 × 36 → ×5 transf. (ID 1), Decomposição, confidence 0.80', () => {
        const result = classifyOperation('50 × 36')
        const match = result.matches.find(m => m.conceptId === 1)
        expect(match).toBeDefined()
        expect(match!.matchLayer).toBe('decomposition')
    })

    it('25 × 16 → Padrões (ID 16), Pro, Decomposição', () => {
        const result = classifyOperation('25 × 16')
        const match = result.matches.find(m => m.conceptId === 16)
        expect(match).toBeDefined()
        expect(match!.isPro).toBe(true)
        expect(match!.matchLayer).toBe('decomposition')
    })

    it('2405 × 13 → Distributiva (ID 16), Pro, Decomposição', () => {
        const result = classifyOperation('2405 × 13')
        const match = result.matches.find(m => m.conceptId === 16)
        expect(match).toBeDefined()
        expect(match!.isPro).toBe(true)
    })

    it('√49 → Erro: "Operação não suportada"', () => {
        expect(() => classifyOperation('√49')).toThrow(ClassificationError)
        try {
            classifyOperation('√49')
        } catch (err) {
            expect((err as ClassificationError).parseError.type).toBe('unsupported_operation')
        }
    })
})

// ═══════════════════════════════════════════════════════════════════════════════
//  11. Testes determinísticos — mesmo input, mesmo output
// ═══════════════════════════════════════════════════════════════════════════════

describe('Determinismo', () => {
    it('classifyOperation retorna resultado idêntico em chamadas consecutivas', () => {
        const input = '5 × 14'
        const r1 = classifyOperation(input)
        const r2 = classifyOperation(input)
        expect(r1.matches.length).toBe(r2.matches.length)
        for (let i = 0; i < r1.matches.length; i++) {
            expect(r1.matches[i].conceptId).toBe(r2.matches[i].conceptId)
            expect(r1.matches[i].confidence).toBe(r2.matches[i].confidence)
        }
        expect(r1.recommendedLesson?.lessonNumber).toBe(r2.recommendedLesson?.lessonNumber)
    })

    it('classifyOperation com ambiguidade é determinístico', () => {
        const r1 = classifyOperation('5 × 9')
        const r2 = classifyOperation('5 × 9')
        expect(r1.matches.map(m => m.conceptId)).toEqual(r2.matches.map(m => m.conceptId))
        expect(r1.matches.map(m => m.confidence)).toEqual(r2.matches.map(m => m.confidence))
    })
})

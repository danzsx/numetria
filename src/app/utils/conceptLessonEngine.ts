import type { Mode, Operation, Problem, ProMode, TimerMode } from './tabuadaEngine'

export type ConceptLessonMode = 'structure' | 'comprehension' | 'rhythm'
export type DifficultyTier = 1 | 2 | 3 | 4

export interface AdaptiveProfile {
  mode: Mode
  timerMode: TimerMode
  proMode?: ProMode | null
}

export interface ConceptLessonEngineInput {
  moduleId: string
  conceptId: number
  lessonNumber: 1 | 2 | 3
  mode: ConceptLessonMode
  difficultyTier: DifficultyTier
  adaptiveProfile: AdaptiveProfile
}

export interface ConceptLessonPlan {
  lessonMode: ConceptLessonMode
  operation: Operation
  base: number
}

export interface FeedbackRules {
  showPerQuestionFeedback: boolean
  retryOnError: boolean
}

export interface TimerPolicy {
  timerMode: TimerMode
  baseTimeLimitMs: number | null
}

export interface ConceptLessonEngineOutput {
  lessonPlan: ConceptLessonPlan
  questionSet: Problem[]
  feedbackRules: FeedbackRules
  timerPolicy: TimerPolicy
}

type ConceptDefinition = {
  operation: Operation
  base: number
}

const CONCEPTS: Record<number, ConceptDefinition> = {
  1: { operation: 'multiplication', base: 5 },
  2: { operation: 'addition', base: 10 },
  3: { operation: 'multiplication', base: 9 },
  4: { operation: 'division', base: 2 },
  5: { operation: 'multiplication', base: 2 },
  6: { operation: 'addition', base: 3 },
  7: { operation: 'subtraction', base: 10 },
  8: { operation: 'multiplication', base: 10 },
  9: { operation: 'subtraction', base: 10 },
  10: { operation: 'multiplication', base: 3 },
  11: { operation: 'division', base: 3 },
  12: { operation: 'multiplication', base: 7 },
  13: { operation: 'division', base: 4 },
  14: { operation: 'multiplication', base: 11 },
  15: { operation: 'division', base: 7 },
  16: { operation: 'multiplication', base: 5 },
  17: { operation: 'multiplication', base: 7 },
  18: { operation: 'multiplication', base: 9 },
  19: { operation: 'multiplication', base: 6 },
  20: { operation: 'multiplication', base: 8 },
  21: { operation: 'division', base: 6 },
  22: { operation: 'multiplication', base: 7 },
  23: { operation: 'division', base: 7 },
  24: { operation: 'multiplication', base: 9 },
}

type ModeFactory = (input: ConceptLessonEngineInput, def: ConceptDefinition) => ConceptLessonEngineOutput

type Range = {
  min: number
  max: number
}

type ModeRangeMap = Record<ConceptLessonMode, Record<DifficultyTier, Range>>

type Pair = {
  a: number
  b: number
}

const modeFactories: Record<ConceptLessonMode, ModeFactory> = {
  structure: createStructureLesson,
  comprehension: createComprehensionLesson,
  rhythm: createRhythmLesson,
}

const QUESTION_COUNT = 10

const MULTIPLICATION_RANGES: ModeRangeMap = {
  structure: {
    1: { min: 14, max: 80 },
    2: { min: 30, max: 220 },
    3: { min: 80, max: 800 },
    4: { min: 200, max: 2400 },
  },
  comprehension: {
    1: { min: 60, max: 480 },
    2: { min: 120, max: 1200 },
    3: { min: 300, max: 4800 },
    4: { min: 700, max: 18000 },
  },
  rhythm: {
    1: { min: 40, max: 260 },
    2: { min: 90, max: 760 },
    3: { min: 180, max: 2400 },
    4: { min: 350, max: 6400 },
  },
}

const DIVISION_QUOTIENT_RANGES: ModeRangeMap = {
  structure: {
    1: { min: 14, max: 75 },
    2: { min: 35, max: 220 },
    3: { min: 80, max: 700 },
    4: { min: 200, max: 2200 },
  },
  comprehension: {
    1: { min: 60, max: 420 },
    2: { min: 120, max: 900 },
    3: { min: 280, max: 3200 },
    4: { min: 700, max: 11000 },
  },
  rhythm: {
    1: { min: 40, max: 260 },
    2: { min: 100, max: 700 },
    3: { min: 200, max: 1800 },
    4: { min: 320, max: 5200 },
  },
}

const ADDITION_RANGES: ModeRangeMap = {
  structure: {
    1: { min: 18, max: 95 },
    2: { min: 40, max: 260 },
    3: { min: 80, max: 750 },
    4: { min: 180, max: 1800 },
  },
  comprehension: {
    1: { min: 80, max: 380 },
    2: { min: 150, max: 900 },
    3: { min: 300, max: 3000 },
    4: { min: 600, max: 11000 },
  },
  rhythm: {
    1: { min: 45, max: 260 },
    2: { min: 110, max: 700 },
    3: { min: 220, max: 1800 },
    4: { min: 400, max: 5200 },
  },
}

const SUBTRACTION_RANGES: ModeRangeMap = {
  structure: {
    1: { min: 35, max: 120 },
    2: { min: 80, max: 280 },
    3: { min: 150, max: 820 },
    4: { min: 300, max: 2200 },
  },
  comprehension: {
    1: { min: 90, max: 420 },
    2: { min: 180, max: 950 },
    3: { min: 300, max: 3200 },
    4: { min: 700, max: 12000 },
  },
  rhythm: {
    1: { min: 60, max: 260 },
    2: { min: 130, max: 700 },
    3: { min: 240, max: 1900 },
    4: { min: 420, max: 5600 },
  },
}

const MULTIPLIER_FAMILIES: Record<number, number[]> = {
  1: [5],
  3: [9],
  5: [2, 4],
  8: [10, 100],
  10: [3, 6],
  12: [7, 8],
  14: [11],
  16: [5, 25],
  17: [9, 11],
  18: [15, 25],
  19: [6],
  20: [8],
}

const DIVISOR_FAMILIES: Record<number, number[]> = {
  4: [2],
  11: [3, 6],
  13: [4, 5],
  15: [7, 8],
  21: [6],
}

const MULTIPLICATION_ANCHORS: Record<number, Partial<Record<ConceptLessonMode, number[]>>> = {
  1: {
    structure: [2478, 1605, 830],
    comprehension: [478, 1450, 903, 12006, 3875],
    rhythm: [760, 1285, 2490, 5015],
  },
  3: {
    structure: [128, 247],
    comprehension: [365, 742, 1305],
    rhythm: [288, 459, 999],
  },
  5: {
    structure: [84, 126],
    comprehension: [305, 742, 1508],
    rhythm: [244, 528, 980],
  },
  8: {
    structure: [47, 63, 82],
    comprehension: [145, 908, 1206],
    rhythm: [240, 575, 990],
  },
  10: {
    structure: [74, 116],
    comprehension: [245, 608, 1407],
    rhythm: [198, 432, 975],
  },
  12: {
    structure: [46, 82],
    comprehension: [187, 520, 1304],
    rhythm: [161, 344, 902],
  },
  14: {
    structure: [54, 88],
    comprehension: [145, 707, 1308],
    rhythm: [121, 266, 594],
  },
  16: {
    structure: [125, 240],
    comprehension: [375, 1240, 2508],
    rhythm: [225, 640, 1215],
  },
  17: {
    structure: [75, 128],
    comprehension: [450, 907, 1405],
    rhythm: [198, 532, 1001],
  },
  18: {
    structure: [48, 125],
    comprehension: [315, 990, 1824],
    rhythm: [225, 608, 1280],
  },
  19: {
    structure: [168, 245],
    comprehension: [430, 908, 1776],
    rhythm: [240, 516, 999],
  },
  20: {
    structure: [124, 205],
    comprehension: [365, 742, 1508],
    rhythm: [248, 504, 1192],
  },
}

const DIVISION_ANCHOR_QUOTIENTS: Record<number, Partial<Record<ConceptLessonMode, number[]>>> = {
  4: {
    structure: [42, 58],
    comprehension: [125, 478, 903],
    rhythm: [84, 166, 317],
  },
  11: {
    structure: [24, 36],
    comprehension: [145, 378, 902],
    rhythm: [72, 165, 294],
  },
  13: {
    structure: [28, 45],
    comprehension: [125, 364, 905],
    rhythm: [96, 188, 272],
  },
  15: {
    structure: [21, 34],
    comprehension: [145, 288, 903],
    rhythm: [84, 152, 264],
  },
  21: {
    structure: [32, 45],
    comprehension: [165, 430, 908],
    rhythm: [96, 188, 302],
  },
}

const ADDITION_ANCHORS: Record<number, Partial<Record<ConceptLessonMode, Pair[]>>> = {
  2: {
    structure: [
      { a: 47, b: 38 },
      { a: 58, b: 27 },
      { a: 69, b: 24 },
    ],
    comprehension: [
      { a: 478, b: 297 },
      { a: 1450, b: 378 },
      { a: 903, b: 187 },
      { a: 1206, b: 594 },
    ],
    rhythm: [
      { a: 284, b: 167 },
      { a: 520, b: 396 },
      { a: 905, b: 188 },
    ],
  },
  6: {
    structure: [
      { a: 67, b: 43 },
      { a: 85, b: 25 },
      { a: 76, b: 34 },
    ],
    comprehension: [
      { a: 348, b: 452 },
      { a: 1205, b: 795 },
      { a: 734, b: 266 },
      { a: 1890, b: 1110 },
    ],
    rhythm: [
      { a: 240, b: 360 },
      { a: 585, b: 415 },
      { a: 918, b: 282 },
    ],
  },
}

const SUBTRACTION_ANCHORS: Record<number, Partial<Record<ConceptLessonMode, Pair[]>>> = {
  7: {
    structure: [
      { a: 52, b: 37 },
      { a: 64, b: 48 },
      { a: 73, b: 56 },
    ],
    comprehension: [
      { a: 428, b: 279 },
      { a: 905, b: 487 },
      { a: 1420, b: 736 },
    ],
    rhythm: [
      { a: 284, b: 167 },
      { a: 651, b: 492 },
      { a: 980, b: 743 },
    ],
  },
  9: {
    structure: [
      { a: 304, b: 187 },
      { a: 512, b: 298 },
      { a: 740, b: 463 },
    ],
    comprehension: [
      { a: 2478, b: 1389 },
      { a: 3905, b: 1768 },
      { a: 8204, b: 4576 },
    ],
    rhythm: [
      { a: 1380, b: 799 },
      { a: 2564, b: 1487 },
      { a: 4720, b: 2394 },
    ],
  },
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickRange(table: ModeRangeMap, mode: ConceptLessonMode, tier: DifficultyTier): Range {
  return table[mode][tier]
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i)
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function uniqueFromRange(count: number, range: Range, minAllowed = 12): number[] {
  const values = new Set<number>()
  const safeMin = Math.max(minAllowed, range.min)
  while (values.size < count) {
    values.add(randomInt(safeMin, range.max))
  }
  return Array.from(values)
}

function uniquePairsFromRange(
  count: number,
  range: Range,
  validate: (a: number, b: number) => boolean
): Pair[] {
  const pairs: Pair[] = []
  const seen = new Set<string>()

  while (pairs.length < count) {
    const a = randomInt(range.min, range.max)
    const b = randomInt(range.min, range.max)
    if (!validate(a, b)) continue
    const key = `${a}_${b}`
    if (seen.has(key)) continue
    seen.add(key)
    pairs.push({ a, b })
  }

  return pairs
}

function toMultiplicationProblem(id: string, multiplicand: number, multiplier: number): Problem {
  return {
    id,
    operand1: multiplicand,
    operand2: multiplier,
    operation: 'multiplication',
    correctAnswer: multiplicand * multiplier,
    displayString: `${multiplicand} x ${multiplier}`,
  }
}

function toDivisionProblem(id: string, quotient: number, divisor: number): Problem {
  const dividend = quotient * divisor
  return {
    id,
    operand1: dividend,
    operand2: divisor,
    operation: 'division',
    correctAnswer: quotient,
    displayString: `${dividend} / ${divisor}`,
  }
}

function toAdditionProblem(id: string, a: number, b: number): Problem {
  return {
    id,
    operand1: a,
    operand2: b,
    operation: 'addition',
    correctAnswer: a + b,
    displayString: `${a} + ${b}`,
  }
}

function toSubtractionProblem(id: string, a: number, b: number): Problem {
  return {
    id,
    operand1: a,
    operand2: b,
    operation: 'subtraction',
    correctAnswer: a - b,
    displayString: `${a} - ${b}`,
  }
}

function buildMultiplicationQuestions(input: ConceptLessonEngineInput): Problem[] {
  const multipliers = MULTIPLIER_FAMILIES[input.conceptId] ?? [CONCEPTS[input.conceptId]?.base ?? 5]
  const anchors = MULTIPLICATION_ANCHORS[input.conceptId]?.[input.mode] ?? []
  const range = pickRange(MULTIPLICATION_RANGES, input.mode, input.difficultyTier)

  const values = [...anchors]
  const randomValues = uniqueFromRange(QUESTION_COUNT, range)
  for (const value of randomValues) {
    if (values.length >= QUESTION_COUNT) break
    if (value <= 10) continue
    values.push(value)
  }

  const baseSet = values.slice(0, QUESTION_COUNT).map((value, index) => {
    const multiplier = multipliers[index % multipliers.length]
    return toMultiplicationProblem(`c${input.conceptId}_${input.mode}_m_${index}`, value, multiplier)
  })

  return input.mode === 'structure' ? baseSet : shuffle(baseSet)
}

function buildDivisionQuestions(input: ConceptLessonEngineInput): Problem[] {
  const divisors = DIVISOR_FAMILIES[input.conceptId] ?? [CONCEPTS[input.conceptId]?.base ?? 2]
  const anchorQuotients = DIVISION_ANCHOR_QUOTIENTS[input.conceptId]?.[input.mode] ?? []
  const range = pickRange(DIVISION_QUOTIENT_RANGES, input.mode, input.difficultyTier)

  const quotients = [...anchorQuotients]
  const randomQuotients = uniqueFromRange(QUESTION_COUNT, range)
  for (const value of randomQuotients) {
    if (quotients.length >= QUESTION_COUNT) break
    if (value <= 10) continue
    quotients.push(value)
  }

  const baseSet = quotients.slice(0, QUESTION_COUNT).map((quotient, index) => {
    const divisor = divisors[index % divisors.length]
    return toDivisionProblem(`c${input.conceptId}_${input.mode}_d_${index}`, quotient, divisor)
  })

  return input.mode === 'structure' ? baseSet : shuffle(baseSet)
}

function buildAdditionQuestions(input: ConceptLessonEngineInput, forceComplementUnits = false): Problem[] {
  const anchors = ADDITION_ANCHORS[input.conceptId]?.[input.mode] ?? []
  const range = pickRange(ADDITION_RANGES, input.mode, input.difficultyTier)

  const pairs = [...anchors]
  const generatedPairs = uniquePairsFromRange(QUESTION_COUNT, range, (a, b) => {
    const units = (a % 10) + (b % 10)
    const hasCarry = units >= 10
    if (!hasCarry) return false
    if (forceComplementUnits) return units === 10
    return true
  })

  for (const pair of generatedPairs) {
    if (pairs.length >= QUESTION_COUNT) break
    pairs.push(pair)
  }

  const baseSet = pairs.slice(0, QUESTION_COUNT).map((pair, index) =>
    toAdditionProblem(`c${input.conceptId}_${input.mode}_a_${index}`, pair.a, pair.b)
  )

  return input.mode === 'structure' ? baseSet : shuffle(baseSet)
}

function buildSubtractionQuestions(input: ConceptLessonEngineInput, hardBorrow: boolean): Problem[] {
  const anchors = SUBTRACTION_ANCHORS[input.conceptId]?.[input.mode] ?? []
  const range = pickRange(SUBTRACTION_RANGES, input.mode, input.difficultyTier)

  const pairs = [...anchors]
  const generatedPairs = uniquePairsFromRange(QUESTION_COUNT, range, (a, b) => {
    if (a <= b) return false
    if (a - b < 8) return false

    const requiresBorrow = (a % 10) < (b % 10)
    if (hardBorrow) {
      return requiresBorrow
    }

    const nearDistance = a - b <= Math.max(45, Math.round((range.max - range.min) * 0.25))
    return requiresBorrow || nearDistance
  })

  for (const pair of generatedPairs) {
    if (pairs.length >= QUESTION_COUNT) break
    pairs.push(pair)
  }

  const baseSet = pairs.slice(0, QUESTION_COUNT).map((pair, index) =>
    toSubtractionProblem(`c${input.conceptId}_${input.mode}_s_${index}`, pair.a, pair.b)
  )

  return input.mode === 'structure' ? baseSet : shuffle(baseSet)
}

function buildPrecisionMixedQuestions(input: ConceptLessonEngineInput): Problem[] {
  const base = CONCEPTS[input.conceptId]?.base ?? 7
  const range = pickRange(MULTIPLICATION_RANGES, input.mode, input.difficultyTier)
  const divisors = input.conceptId === 24 ? [9, 11] : [base, base + 1]
  const multipliers = input.conceptId === 24 ? [9, 11] : [base, base + 2]

  const values = uniqueFromRange(QUESTION_COUNT, range, 20)
  const items: Problem[] = []

  for (let i = 0; i < QUESTION_COUNT; i += 1) {
    const n = values[i]
    if (i % 2 === 0) {
      const multiplier = multipliers[i % multipliers.length]
      items.push(toMultiplicationProblem(`c${input.conceptId}_${input.mode}_pm_${i}`, n, multiplier))
    } else {
      const divisor = divisors[i % divisors.length]
      const quotient = Math.max(12, Math.round(n / 2))
      items.push(toDivisionProblem(`c${input.conceptId}_${input.mode}_pd_${i}`, quotient, divisor))
    }
  }

  return input.mode === 'structure' ? items : shuffle(items)
}

function resolveQuestionSet(input: ConceptLessonEngineInput): Problem[] {
  if ([22, 23, 24].includes(input.conceptId)) {
    return buildPrecisionMixedQuestions(input)
  }

  if (MULTIPLIER_FAMILIES[input.conceptId]) {
    return buildMultiplicationQuestions(input)
  }

  if (DIVISOR_FAMILIES[input.conceptId]) {
    return buildDivisionQuestions(input)
  }

  if (input.conceptId === 2) {
    return buildAdditionQuestions(input)
  }

  if (input.conceptId === 6) {
    return buildAdditionQuestions(input, true)
  }

  if (input.conceptId === 7) {
    return buildSubtractionQuestions(input, false)
  }

  if (input.conceptId === 9) {
    return buildSubtractionQuestions(input, true)
  }

  if (CONCEPTS[input.conceptId]?.operation === 'addition') {
    return buildAdditionQuestions(input)
  }

  if (CONCEPTS[input.conceptId]?.operation === 'subtraction') {
    return buildSubtractionQuestions(input, true)
  }

  if (CONCEPTS[input.conceptId]?.operation === 'division') {
    return buildDivisionQuestions(input)
  }

  return buildMultiplicationQuestions(input)
}

function createStructureLesson(
  input: ConceptLessonEngineInput,
  def: ConceptDefinition
): ConceptLessonEngineOutput {
  return {
    lessonPlan: {
      lessonMode: 'structure',
      operation: def.operation,
      base: def.base,
    },
    questionSet: resolveQuestionSet(input),
    feedbackRules: {
      showPerQuestionFeedback: true,
      retryOnError: true,
    },
    timerPolicy: {
      timerMode: 'untimed',
      baseTimeLimitMs: null,
    },
  }
}

function createComprehensionLesson(
  input: ConceptLessonEngineInput,
  def: ConceptDefinition
): ConceptLessonEngineOutput {
  return {
    lessonPlan: {
      lessonMode: 'comprehension',
      operation: def.operation,
      base: def.base,
    },
    questionSet: resolveQuestionSet(input),
    feedbackRules: {
      showPerQuestionFeedback: true,
      retryOnError: true,
    },
    timerPolicy: {
      timerMode: input.adaptiveProfile.timerMode,
      baseTimeLimitMs: null,
    },
  }
}

function createRhythmLesson(
  input: ConceptLessonEngineInput,
  def: ConceptDefinition
): ConceptLessonEngineOutput {
  return {
    lessonPlan: {
      lessonMode: 'rhythm',
      operation: def.operation,
      base: def.base,
    },
    questionSet: resolveQuestionSet(input),
    feedbackRules: {
      showPerQuestionFeedback: input.adaptiveProfile.proMode !== 'flow',
      retryOnError: input.adaptiveProfile.proMode !== 'flow',
    },
    timerPolicy: {
      timerMode: 'timed',
      baseTimeLimitMs: input.adaptiveProfile.proMode === 'rhythm' ? 5000 : null,
    },
  }
}

export function lessonNumberToConceptMode(lessonNumber: number): ConceptLessonMode {
  if (lessonNumber <= 1) return 'structure'
  if (lessonNumber === 2) return 'comprehension'
  return 'rhythm'
}

export function createConceptLessonEngine(
  input: ConceptLessonEngineInput
): ConceptLessonEngineOutput {
  const def = CONCEPTS[input.conceptId]
  if (!def) {
    throw new Error(`ConceptLessonEngine: conceito ${input.conceptId} nao mapeado`)
  }

  const factory = modeFactories[input.mode]
  return factory(input, def)
}

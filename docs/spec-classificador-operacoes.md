# SPEC: Classificador Estrutural de Operações (Faseado)
**Versão**: 1.0 | **Data**: 2026-02-22 | **Status**: Pronto para execução
**PRD de referência**: `docs/PRD-classificador-operacoes.md`

---

## 1. Objetivo

Implementar um classificador que recebe uma expressão matemática livre, analisa sua estrutura cognitiva e mapeia aos 24 conceitos pedagógicos da Numetria, retornando conceito, módulo, aula e confiança.

> [!IMPORTANT]
> O sistema **não resolve** a operação. Ele **classifica** a estrutura cognitiva necessária para resolvê-la mentalmente.

---

## 2. Escopo Técnico

### Incluído
1. Parser robusto de expressões (`+`, `−/−`, `×/x/*`, `÷//`) com normalização Unicode.
2. Motor de classificação determinístico com 3 camadas de inteligência (match direto, decomposição, heurística).
3. Ranqueamento multi-conceito com score de confiança.
4. Determinação de aula por análise de magnitude calibrada ao `conceptLessonEngine`.
5. Fallback estrutural com recomendação pedagógica.
6. Página `/classify` seguindo design system Numetria.

### Fora de Escopo
1. Resolução da operação.
2. Parênteses, potências, raízes, expressões encadeadas.
3. Integração com progresso do usuário (adaptação personalizada).
4. Geração de exercícios a partir da operação.

---

## 3. Premissas e Dependências

1. Taxonomia de conceitos consolidada em `conceptLessonEngine.ts` (conceitos 1–24).
2. Conteúdo de aulas disponível em `lessonContent.ts` (conceitos 1–8 com `lessonNumber: 1`).
3. Componentes `BlueprintCard`, `ActionButton`, `InputField`, `PaywallModal` disponíveis.
4. Roteamento via `react-router` em `routes.tsx`.
5. Conceitos 9–24 podem não ter aula implementada — botão "Ir para aula" segue regra de disponibilidade.

---

## 4. Estratégia de Implementação por Fases

## Fase 0 — Tipos e Contratos (30 min)
**Objetivo:** definir tipos e interfaces do classificador.

### Entregas

#### [NEW] `src/types/classifier.ts`

```typescript
/** Operadores suportados pelo parser */
export type ClassifierOperator = 'addition' | 'subtraction' | 'multiplication' | 'division'

/** Expressão parseada */
export interface ParsedExpression {
  operands: number[]                // 2 ou 3 operandos
  operator: ClassifierOperator
  raw: string                       // string original
}

/** Erro de parsing */
export interface ParseError {
  type: 'invalid_format' | 'unsupported_operation' | 'empty_input' | 'out_of_range'
  message: string
}

/** Resultado do parse */
export type ParseResult =
  | { ok: true; expression: ParsedExpression }
  | { ok: false; error: ParseError }

/** Match de um conceito */
export interface ConceptMatch {
  conceptId: number
  conceptName: string
  moduleName: string
  moduleId: 'foundational' | 'consolidation' | 'automacao' | 'ritmo' | 'precisao'
  confidence: number                // 0.0 – 1.0
  reason: string                    // explicação legível
  matchLayer: 'direct' | 'decomposition' | 'heuristic'
  isPro: boolean
  hasLesson: boolean                // se existe conteúdo implementado
}

/** Recomendação de aula */
export interface LessonRecommendation {
  conceptId: number
  lessonNumber: 1 | 2 | 3
  lessonName: 'Estrutura' | 'Compressão' | 'Ritmo e Transferência'
  rationale: string
}

/** Resultado final da classificação */
export interface ClassificationResult {
  expression: ParsedExpression
  matches: ConceptMatch[]           // ordenados por confidence desc
  recommendedLesson: LessonRecommendation | null
  fallbackMessage: string | null
}
```

### Critérios de aceite
1. Tipos compilam sem erro.
2. Todos os campos documentados refletem o contrato do PRD.

---

## Fase 1 — Parser Inteligente (1–2h)
**Objetivo:** extrair operação, operandos e metadados de uma string livre.

### Entregas

#### [NEW] `src/services/operationClassifier.service.ts` — seção de parsing

### 1.1 Normalização de entrada

```
Etapa 1: trim + lowercase
Etapa 2: Unicode → ASCII
  - '×' → '*'     '÷' → '/'     '−' → '-'
  - '✕' → '*'     '➗' → '/'
Etapa 3: remover espaços múltiplos
Etapa 4: extrair tokens via regex
```

### 1.2 Regex de captura

```
PATTERN_2OP: /^(\d+)\s*([+\-*\/x×÷−])\s*(\d+)$/i
PATTERN_3OP: /^(\d+)\s*\+\s*(\d+)\s*\+\s*(\d+)$/
```

Após normalização, o parser tenta `PATTERN_3OP` primeiro (adição de 3 parcelas), depois `PATTERN_2OP`.

### 1.3 Validações

| Validação | Ação |
|-----------|------|
| String vazia | `ParseError: empty_input` |
| Contém letras, parênteses, `√`, `^` | `ParseError: unsupported_operation` ("Operação não suportada. Use +, −, × ou ÷.") |
| Operandos > 99999 | `ParseError: out_of_range` ("Operandos devem ser ≤ 99.999.") |
| Formato inválido | `ParseError: invalid_format` ("Formato inválido. Ex: 2405 x 13") |

### 1.4 Detecção de operador

```typescript
function detectOperator(symbol: string): ClassifierOperator {
  // '+' → addition
  // '-', '−' → subtraction
  // '*', 'x', '×' → multiplication
  // '/', '÷' → division
}
```

### Critérios de aceite
1. Parser aceita formatos: `5 × 14`, `5x14`, `5*14`, `48+37`, `7 + 8 + 3`, `84/2`, `84 ÷ 2`.
2. Parser rejeita: `abc`, `√49`, `(5+3)×2`, `5^2`, strings vazias.
3. Parser retorna operandos numéricos corretos e operação identificada.

---

## Fase 2 — Motor de Classificação Inteligente (2–3h)
**Objetivo:** implementar algoritmo de 3 camadas que identifica conceitos com score de confiança.

### 2.1 Arquitetura do Motor — 3 Camadas de Inteligência

O classificador executa **sequencialmente** 3 camadas, acumulando matches. Cada camada adiciona matches com `confidence` decrescente.

```
┌─────────────────────────────────────────────────┐
│  Camada 1: MATCH DIRETO (confidence 0.85–1.0)   │
│  Operando é exatamente o fator-chave do conceito │
├─────────────────────────────────────────────────┤
│  Camada 2: DECOMPOSIÇÃO (confidence 0.60–0.85)  │
│  Operação decomposta revela padrão conhecido      │
├─────────────────────────────────────────────────┤
│  Camada 3: HEURÍSTICA (confidence 0.30–0.60)     │
│  Análise de magnitude e propriedades numéricas    │
└─────────────────────────────────────────────────┘
```

### 2.2 Camada 1 — Match Direto

Regras determinísticas por conceito. Cada regra produz um `ConceptMatch`.

```typescript
const DIRECT_RULES: DirectRule[] = [
  // ─── Módulo Fundacional (1–8) ───
  { conceptId: 1,  op: 'multiplication', test: (ops) => ops.includes(5),
    name: 'Multiplicação por 5', module: 'foundational' },

  { conceptId: 2,  op: 'addition', test: (ops) => ops.length === 2 &&
    ops.every(n => n <= 100) && ((ops[0] % 10) + (ops[1] % 10)) > 9,
    name: 'Soma até 100 com transporte', module: 'foundational' },

  { conceptId: 3,  op: 'multiplication', test: (ops) => ops.includes(9),
    name: 'Multiplicação por 9', module: 'foundational' },

  { conceptId: 4,  op: 'division', test: (ops, expr) =>
    expr.operands[1] === 2 && expr.operands[0] % 2 === 0,
    name: 'Divisão exata por 2', module: 'foundational' },

  { conceptId: 5,  op: 'multiplication', test: (ops) =>
    ops.includes(2) || ops.includes(4),
    name: 'Multiplicação por 2 e 4', module: 'foundational' },

  { conceptId: 6,  op: 'addition', test: (ops) => ops.length === 3,
    name: 'Adição de três parcelas', module: 'foundational' },

  { conceptId: 7,  op: 'subtraction', test: (ops, expr) =>
    expr.operands[0] > expr.operands[1] &&
    expr.operands.every(n => n <= 200) &&
    !hasDigitBorrow(expr.operands[0], expr.operands[1]),
    name: 'Subtração com resultado positivo', module: 'foundational' },

  { conceptId: 8,  op: 'multiplication', test: (ops) =>
    ops.includes(10) || ops.includes(100),
    name: 'Multiplicação por 10 e 100', module: 'foundational' },

  // ─── Módulo Consolidação (9–15) ───
  { conceptId: 9,  op: 'subtraction', test: (ops, expr) =>
    hasDigitBorrow(expr.operands[0], expr.operands[1]),
    name: 'Subtração com empréstimo', module: 'consolidation' },

  { conceptId: 10, op: 'multiplication', test: (ops) =>
    ops.includes(3) || ops.includes(6),
    name: 'Multiplicação por 3 e 6', module: 'consolidation' },

  { conceptId: 11, op: 'division', test: (ops, expr) =>
    [3, 6].includes(expr.operands[1]),
    name: 'Divisão por 3 e 6', module: 'consolidation' },

  { conceptId: 12, op: 'multiplication', test: (ops) =>
    ops.includes(7) || ops.includes(8),
    name: 'Multiplicação por 7 e 8', module: 'consolidation' },

  { conceptId: 13, op: 'division', test: (ops, expr) =>
    [4, 5].includes(expr.operands[1]),
    name: 'Divisão por 4 e 5', module: 'consolidation' },

  { conceptId: 14, op: 'multiplication', test: (ops) => ops.includes(11),
    name: 'Multiplicação por 11', module: 'consolidation' },

  { conceptId: 15, op: 'division', test: (ops, expr) =>
    [7, 8].includes(expr.operands[1]),
    name: 'Divisão por 7 e 8', module: 'consolidation' },
]
```

**Cálculo de confidence (Camada 1):**

```typescript
function calculateDirectConfidence(conceptId: number, operands: number[]): number {
  const keyOperand = getKeyOperand(conceptId, operands)
  const otherOperand = getOtherOperand(conceptId, operands)

  let base = 0.90

  // Boost: operando-chave é exato e único
  if (isExactKeyOperand(conceptId, keyOperand)) base = 1.0

  // Penalty: ambiguidade — operação casa com múltiplos conceitos
  // (tratado no ranqueamento final)

  // Ajuste por magnitude — operandos muito grandes reduzem confiança marginalmente
  if (otherOperand > 1000) base -= 0.05
  if (otherOperand > 10000) base -= 0.05

  return Math.max(0.70, base)
}
```

### 2.3 Camada 2 — Decomposição Estrutural

Analisa se a operação pode ser **decomposta** em um padrão conhecido, mesmo sem operando-chave direto.

```typescript
const DECOMPOSITION_PATTERNS: DecompositionRule[] = [
  // ×50 pode ser visto como ×5 transferido (×100 ÷ 2)
  {
    test: (expr) => expr.operator === 'multiplication' &&
      expr.operands.some(n => n % 10 === 0 && n / 10 >= 2 && n / 10 <= 9),
    resolve: (expr) => {
      const factor = expr.operands.find(n => n % 10 === 0)!
      const baseDigit = factor / 10
      return findConceptByMultiplier(baseDigit)
    },
    confidence: 0.80,
    reason: (expr) => `${factor} = ${baseDigit} × 10 → padrão de transferência`
  },

  // ×25 pode ser visto como ×100 ÷ 4
  {
    test: (expr) => expr.operator === 'multiplication' && expr.operands.includes(25),
    resolve: () => ({ conceptId: 16, name: 'Reconhecimento de Padrões' }),
    confidence: 0.82,
    reason: () => '25 = 100 ÷ 4 → padrão de reconhecimento'
  },

  // ×15 = ×10 + ×5
  {
    test: (expr) => expr.operator === 'multiplication' && expr.operands.includes(15),
    resolve: () => ({ conceptId: 18, name: 'Complementos e Composições' }),
    confidence: 0.78,
    reason: () => '15 = 10 + 5 → decomposição aditiva'
  },

  // Complementos decimais: unidades somam 10
  {
    test: (expr) => expr.operator === 'addition' && expr.operands.length === 2 &&
      (expr.operands[0] % 10) + (expr.operands[1] % 10) === 10,
    resolve: () => ({ conceptId: 17, name: 'Complementos Decimais' }),
    confidence: 0.75,
    reason: () => 'Unidades dos operandos somam 10 → complemento decimal'
  },

  // Subtração onde operando pode ser arredondado (ex: -99 ≈ -100+1)
  {
    test: (expr) => expr.operator === 'subtraction' &&
      isCloseToRound(expr.operands[1]),
    resolve: () => ({ conceptId: 9, name: 'Subtração com compensação' }),
    confidence: 0.72,
    reason: (expr) => `${expr.operands[1]} ≈ ${roundUp(expr.operands[1])} → compensação`
  },

  // Multiplicação 2 dígitos × 2 dígitos (propriedade distributiva)
  {
    test: (expr) => expr.operator === 'multiplication' &&
      expr.operands.every(n => n >= 10 && n <= 99) &&
      !DIRECT_RULES.some(r => r.op === 'multiplication' && r.test(expr.operands, expr)),
    resolve: () => ({ conceptId: 16, name: 'Propriedade distributiva mental' }),
    confidence: 0.65,
    reason: () => 'Dois operandos de 2 dígitos → requer decomposição distributiva'
  },

  // Multiplicação grande (3+ dígitos × 1 dígito não-chave)
  {
    test: (expr) => expr.operator === 'multiplication' &&
      expr.operands.some(n => n >= 100) &&
      !DIRECT_RULES.some(r => r.op === 'multiplication' && r.test(expr.operands, expr)),
    resolve: () => ({ conceptId: 16, name: 'Propriedade distributiva mental' }),
    confidence: 0.60,
    reason: () => 'Operando de 3+ dígitos sem fator especial → decomposição posicional'
  },
]
```

### 2.4 Camada 3 — Heurística de Proximidade

Quando nenhuma das camadas anteriores encontrou match forte, a heurística analisa propriedades numéricas genéricas.

```typescript
function heuristicAnalysis(expr: ParsedExpression): ConceptMatch[] {
  const matches: ConceptMatch[] = []
  const maxOp = Math.max(...expr.operands)

  if (expr.operator === 'multiplication') {
    // Encontra o menor operando e verifica proximidade a fator-chave
    const smallOp = Math.min(...expr.operands)
    const nearestKey = findNearestKeyMultiplier(smallOp)
    if (nearestKey && Math.abs(smallOp - nearestKey.value) <= 1) {
      matches.push({
        ...buildMatch(nearestKey.conceptId),
        confidence: 0.45,
        reason: `${smallOp} ≈ ${nearestKey.value} → conceito próximo`,
        matchLayer: 'heuristic'
      })
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
        matchLayer: 'heuristic'
      })
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
```

### 2.5 Função auxiliar: Detecção de Empréstimo (borrow)

Usada na distinção entre conceito 7 (subtração simples) e conceito 9 (com empréstimo):

```typescript
function hasDigitBorrow(minuend: number, subtrahend: number): boolean {
  const mStr = String(minuend)
  const sStr = String(subtrahend).padStart(mStr.length, '0')

  for (let i = mStr.length - 1; i >= 0; i--) {
    if (parseInt(sStr[i]) > parseInt(mStr[i])) return true
  }
  return false
}
```

### 2.6 Resolução de Conflitos e Ranqueamento

Quando múltiplos conceitos casam (ex: `5 × 9` → conceito 1 e conceito 3):

```typescript
function resolveConflicts(matches: ConceptMatch[]): ConceptMatch[] {
  // 1. Ordenar por confidence desc
  matches.sort((a, b) => b.confidence - a.confidence)

  // 2. Penalizar conceitos com operando menos "restrito"
  //    Ex: ×5 é mais restrito que ×3 → ×5 tende a ter confidence maior
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

  return matches
}
```

**Tabela de especificidade por conceito:**

| Conceito | Operando-chave | Especificidade |
|----------|---------------|----------------|
| ×10, ×100 | 10, 100 | 1.05 (muito específico) |
| ×11 | 11 | 1.04 |
| ×5 | 5 | 1.02 |
| ×9 | 9 | 1.02 |
| ÷2 (par) | 2 | 1.01 |
| ×7, ×8 | 7, 8 | 1.00 |
| ×3, ×6 | 3, 6 | 0.99 |
| ×2, ×4 | 2, 4 | 0.98 (menos restrito) |

### 2.7 Determinação Inteligente da Aula

A seleção de aula usa faixas de magnitude **calibradas** com os ranges de `conceptLessonEngine.ts`:

```typescript
function determineLessonNumber(
  conceptId: number,
  operands: number[]
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
    if (maxOperand <= 30)  return { lessonNumber: 1, rationale: `Magnitude baixa (${maxOperand} ≤ 30) → Aula Estrutura` }
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
```

### 2.8 Fallback Inteligente

```typescript
const BASE_FALLBACK: Record<ClassifierOperator, { conceptId: number; name: string }> = {
  multiplication: { conceptId: 16, name: 'Reconhecimento de Padrões / Propriedade Distributiva' },
  addition:       { conceptId: 2,  name: 'Soma até 100 com transporte' },
  subtraction:    { conceptId: 9,  name: 'Subtração com empréstimo' },
  division:       { conceptId: 13, name: 'Divisão por 4 e 5' },
}

function buildFallback(expr: ParsedExpression): string {
  const fb = BASE_FALLBACK[expr.operator]
  return `Aula não encontrada. Recomendação estrutural: ${fb.name} (Conceito ${fb.conceptId}).`
}
```

### 2.9 API pública do serviço

```typescript
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
```

### Critérios de aceite
1. Match exato para cada conceito 1–15 com confidence ≥ 0.85.
2. `5 × 9` retorna conceitos 1 e 3, ambos ranqueados.
3. `2405 × 13` retorna fallback/decomposição com recomendação estrutural.
4. `50 × 36` detecta padrão de transferência do ×5 (conceito 1, aula 3).
5. Determinação de aula varia corretamente: `5 × 14` → aula 1, `5 × 248` → aula 3.
6. Conceitos 16–24 retornam `isPro: true`.

---

## Fase 3 — Página de Classificação (2–3h)
**Objetivo:** criar a interface visual do classificador.

### Entregas

#### [NEW] `src/app/pages/OperationClassifier.tsx`

### 3.1 Estados da Página

```
┌────────────────────────────────────┐
│  EMPTY   → instrução visual        │
│  INPUT   → digitando               │
│  LOADING → calculando (250ms cap)  │
│  RESULT  → card de resultado       │
│  ERROR   → mensagem de erro        │
└────────────────────────────────────┘
```

### 3.2 Layout

```
┌─────────────────────────────────────────────────┐
│  CLASSIFIER // ANÁLISE_ESTRUTURAL               │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  Ex: 2405 x 13                    🔍     │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌─────────────────────────────────────────────┐│
│  │ BlueprintCard                               ││
│  │ CONCEITO_MATCH // CONFIDENCE: 0.95          ││
│  │                                             ││
│  │  Multiplicação por 5                        ││
│  │  Módulo Fundacional · Aula 1 — Estrutura    ││
│  │                                             ││
│  │  "Um dos operandos é 5"                     ││
│  │                                             ││
│  │  [Ir para aula →]                           ││
│  └─────────────────────────────────────────────┘│
│                                                  │
│  ┌────── Outros conceitos relacionados ────────┐│
│  │ Multiplicação por 9 · conf: 0.80 · PRO      ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### 3.3 Componentes usados

| Componente | Uso |
|------------|-----|
| `BlueprintCard` | Card principal de resultado + cards secundários |
| `InputField` (estilo ghost-technical) | Campo de entrada da operação |
| `ActionButton` | Botão "Classificar" + "Ir para aula" |
| `PaywallModal` | Modal ao clicar "Ir para aula" em conceito Pro para user free |

### 3.4 Comportamento

| Ação | Resposta |
|------|----------|
| Digitar operação + Enter | Aciona classificação |
| Clicar botão "Classificar" | Aciona classificação |
| Resultado com aula existente | Botão "Ir para aula" → navega para `/lesson/{conceptId}/{lessonNumber}` |
| Resultado com conceito Pro (user free) | Botão "Ir para aula" → abre `PaywallModal` |
| Conceito sem aula implementada | Badge "Em breve" no botão (desabilitado) |
| Operação inválida | Card de erro com mensagem do parser |
| Input vazio | Estado vazio com instrução: "Digite uma operação. Ex: 5 × 14, 48 + 37, 84 ÷ 2" |

### 3.5 Responsividade

- Desktop: campo centralizado (max-width `var(--container-max-width)`: 720px)
- Mobile: full-width com padding lateral de 16px
- Cards empilhados em coluna única

### Critérios de aceite
1. Tela renderiza corretamente em `/classify`.
2. Enter e botão ambos acionam classificação.
3. Card de resultado exibe conceito, módulo, aula, confidence, reason.
4. Badge "PRO" visível para conceitos 16+.
5. `PaywallModal` abre ao clicar "Ir para aula" em conceito Pro com user free.
6. Estado vazio com instrução clara.
7. Responsivo mobile/desktop.
8. Segue design system Numetria.

---

## Fase 4 — Integração de Rota (15 min)
**Objetivo:** registrar a rota `/classify` no router.

### Entregas

#### [MODIFY] `src/app/routes.tsx`

```diff
+import OperationClassifier from './pages/OperationClassifier'

 export const router = createBrowserRouter([
   // ─── Rotas protegidas ───
   {
     path: '/',
     Component: ProtectedLayout,
     children: [
       { path: 'dashboard', Component: Dashboard },
+      { path: 'classify', Component: OperationClassifier },
       { path: 'modules', Component: Modules },
```

### Critérios de aceite
1. Navegação para `/classify` renderiza `OperationClassifier.tsx`.
2. Rota requer autenticação (dentro de `ProtectedLayout`).

---

## Fase 5 — Testes Unitários (1–2h)
**Objetivo:** validar parser, classificação, e determinação de aula.

### Entregas

#### [NEW] `src/services/__tests__/operationClassifier.test.ts`

### 5.1 Suíte de Testes

```typescript
describe('parseExpression', () => {
  // Formatos aceitos
  it('parseia "5 × 14" → multiplication, [5, 14]')
  it('parseia "5x14" → multiplication, [5, 14]')
  it('parseia "5*14" → multiplication, [5, 14]')
  it('parseia "48+37" → addition, [48, 37]')
  it('parseia "48 + 37" → addition, [48, 37]')
  it('parseia "7 + 8 + 3" → addition, [7, 8, 3]')
  it('parseia "84/2" → division, [84, 2]')
  it('parseia "84 ÷ 2" → division, [84, 2]')
  it('parseia "92 − 47" → subtraction, [92, 47]')
  it('parseia "92 - 47" → subtraction, [92, 47]')

  // Rejeições
  it('rejeita string vazia → empty_input')
  it('rejeita "abc" → invalid_format')
  it('rejeita "√49" → unsupported_operation')
  it('rejeita "5^2" → unsupported_operation')
  it('rejeita "(5+3)×2" → unsupported_operation')
  it('rejeita "999999 × 2" → out_of_range')
})

describe('classifyOperation — Camada 1: Match Direto', () => {
  // Cada conceito de 1 a 15
  it('5 × 14 → Conceito 1 (×5), confidence ≥ 0.90')
  it('48 + 37 → Conceito 2 (soma c/ transporte), confidence ≥ 0.85')
  it('9 × 7 → Conceito 3 (×9), confidence ≥ 0.90')
  it('84 ÷ 2 → Conceito 4 (÷2 exata), confidence ≥ 0.90')
  it('4 × 18 → Conceito 5 (×2/×4), confidence ≥ 0.90')
  it('7 + 8 + 3 → Conceito 6 (3 parcelas), confidence ≥ 0.90')
  it('74 − 38 → Conceito 7 (subtração simples), confidence ≥ 0.85')
  it('47 × 10 → Conceito 8 (×10/×100), confidence ≥ 0.95')
  it('304 − 187 → Conceito 9 (subtração c/ empréstimo)')
  it('6 × 25 → Conceito 10 (×3/×6)')
  it('84 ÷ 3 → Conceito 11 (÷3/÷6)')
  it('7 × 46 → Conceito 12 (×7/×8)')
  it('120 ÷ 4 → Conceito 13 (÷4/÷5)')
  it('11 × 88 → Conceito 14 (×11)')
  it('168 ÷ 7 → Conceito 15 (÷7/÷8)')
})

describe('classifyOperation — Camada 2: Decomposição', () => {
  it('50 × 36 → detecta padrão ×5 transferência, conceito 1')
  it('25 × 16 → detecta padrão de reconhecimento, conceito 16')
  it('15 × 24 → detecta decomposição aditiva')
  it('2405 × 13 → fallback com recomendação distributiva')
})

describe('classifyOperation — Match Múltiplo', () => {
  it('5 × 9 → retorna conceitos 1 e 3, ranqueados')
  it('10 × 5 → retorna conceitos 8 e 1, ranqueados')
})

describe('determineLessonNumber', () => {
  it('5 × 14 → lessonNumber 1 (magnitude baixa)')
  it('5 × 80 → lessonNumber 2 (magnitude moderada)')
  it('5 × 248 → lessonNumber 3 (magnitude alta)')
  it('48 + 37 → lessonNumber 1 (soma simples)')
  it('478 + 297 → lessonNumber 2 (soma moderada)')
  it('2478 + 1389 → lessonNumber 3 (soma complexa)')
})

describe('Fallback', () => {
  it('operação sem match retorna fallbackMessage não-nulo')
  it('fallbackMessage inclui nome do conceito base e número')
})

describe('Conceitos Pro', () => {
  it('conceitos 16–24 possuem isPro: true')
  it('conceitos 1–15 possuem isPro: false')
})
```

### Critérios de aceite
1. Todos os testes passam com `npx vitest run src/services/__tests__/operationClassifier.test.ts`.
2. ≥ 90% dos cenários do PRD cobertos.
3. Testes são determinísticos (sem randomness no classificador).

---

## Fase 6 — Validação e QA (1h)
**Objetivo:** validar integração visual e funcional.

### 6.1 Teste Manual (Browser)

| # | Ação | Resultado Esperado |
|---|------|--------------------|
| 1 | Navegar para `/classify` | Página renderiza com input focado |
| 2 | Digitar `5 × 14` + Enter | Card: "Multiplicação por 5", Fundacional, Aula 1, conf ≥ 0.90 |
| 3 | Digitar `5 × 248` | Card: Aula 3 — Ritmo e Transferência |
| 4 | Digitar `9 × 256` | Card: "Multiplicação por 9", Aula 3 |
| 5 | Digitar `7 + 8 + 3` | Card: "Adição de três parcelas", Aula 1 |
| 6 | Digitar `5 × 9` | Dois cards: ×5 e ×9, ranqueados |
| 7 | Digitar `2405 × 13` | Fallback com recomendação estrutural |
| 8 | Digitar `abc` | Card de erro: "Formato inválido" |
| 9 | Digitar `√49` | Card de erro: "Operação não suportada" |
| 10 | Clicar "Ir para aula" (conceito 1, aula 1) | Navega para `/lesson/1/1` |
| 11 | Redimensionar para mobile | Layout responsivo sem quebras |

### 6.2 Checklist de QA

- [ ] Parser aceita todos os 4 operadores em múltiplos formatos
- [ ] Parser aceita 2 e 3 operandos
- [ ] Classificação retorna conceito correto para conceitos 1–15
- [ ] Conceitos Pro com flag `isPro: true`
- [ ] Multi-match ranqueado quando aplicável
- [ ] Aula varia por magnitude (1/2/3)
- [ ] Fallback com recomendação para operações fora do escopo
- [ ] `reason` legível em cada match
- [ ] Botão "Ir para aula" funcional para conceitos com conteúdo
- [ ] Badge "Em breve" para conceitos sem conteúdo implementado
- [ ] `PaywallModal` para conceitos Pro com user free
- [ ] Responsivo mobile + desktop
- [ ] Design system Numetria (cores, tipografia, componentes)

### Critérios de aceite
1. Todos os 11 cenários manuais passam.
2. Checklist de QA 100% marcado.
3. Sem erros no console.

---

## 5. Mapa de Arquivos

| Arquivo | Status | Fase |
|---------|--------|------|
| `src/types/classifier.ts` | [NEW] | Fase 0 |
| `src/services/operationClassifier.service.ts` | [NEW] | Fases 1–2 |
| `src/app/pages/OperationClassifier.tsx` | [NEW] | Fase 3 |
| `src/app/routes.tsx` | [MODIFY] | Fase 4 |
| `src/services/__tests__/operationClassifier.test.ts` | [NEW] | Fase 5 |

---

## 6. Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Ambiguidade em operações multi-conceito (ex: `5 × 9`) | Retorno de lista ranqueada com confidence e razão explícita |
| Conceitos 9–24 sem aulas implementadas | Botão "Ir para aula" condicional + badge "Em breve" |
| Operações multi-etapa ou com parênteses | Parser rejeita com mensagem clara |
| Falso-positivos na Camada 2 (decomposição) | Confidence capped em 0.85 + teste extensivo |
| Gap de magnitude em faixas de aula | Calibração com ranges de `conceptLessonEngine.ts` |

---

## 7. Tabela de Exemplos de Referência (Golden Tests)

| Entrada | Conceito | Módulo | Aula | Confidence | Camada |
|---------|----------|--------|------|------------|--------|
| `5 × 14` | ×5 (ID 1) | Fundacional | 1 — Estrutura | 1.0 | Direta |
| `5 × 248` | ×5 (ID 1) | Fundacional | 3 — Ritmo | 1.0 | Direta |
| `48 + 37` | Soma c/ transporte (ID 2) | Fundacional | 1 — Estrutura | 0.95 | Direta |
| `9 × 256` | ×9 (ID 3) | Fundacional | 3 — Ritmo | 1.0 | Direta |
| `84 ÷ 2` | ÷2 exata (ID 4) | Fundacional | 1 — Estrutura | 1.0 | Direta |
| `4 × 248` | ×2/×4 (ID 5) | Fundacional | 3 — Ritmo | 1.0 | Direta |
| `7 + 8 + 3` | 3 parcelas (ID 6) | Fundacional | 1 — Estrutura | 1.0 | Direta |
| `74 − 38` | Sub. simples (ID 7) | Fundacional | 1 — Estrutura | 0.90 | Direta |
| `47 × 10` | ×10/×100 (ID 8) | Fundacional | 1 — Estrutura | 1.0 | Direta |
| `5 × 9` | ×5 + ×9 (IDs 1,3) | Fundacional | 1 — Estrutura | 0.85/0.85 | Direta |
| `50 × 36` | ×5 transf. (ID 1) | Fundacional | 3 — Ritmo | 0.80 | Decomposição |
| `25 × 16` | Padrões (ID 16) | Pro | 1 — Estrutura | 0.82 | Decomposição |
| `2405 × 13` | Distributiva (ID 16) | Pro | 3 — Ritmo | 0.60 | Decomposição |
| `√49` | — | — | — | — | Erro: "Operação não suportada" |

---

## 8. Definition of Done (Global)

1. Parser reconhece 4 operadores em múltiplos formatos, 2 e 3 operandos.
2. Classificação de 3 camadas retorna conceitos corretos para golden tests.
3. Ranqueamento multi-conceito funcional com resolução de conflitos.
4. Aula recomendada calibrada por magnitude real do conteúdo existente.
5. Fallback estrutural com mensagem pedagógica útil.
6. Página `/classify` funcional, estilizada, responsiva.
7. Testes unitários passando; ≥ 90% de cobertura dos cenários do PRD.
8. Sem regressão em rotas ou componentes existentes.

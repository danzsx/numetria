# SPEC — Aula Interativa de Cálculo Mental
**Versão**: 1.0 | **Data**: 2026-02-20 | **Base**: modulo_aula_implementacao.md

---

## Contexto e Objetivo

Atualmente, o botão "Iniciar" em `Modules.tsx` redireciona para `/training` (treino genérico) sem passar `concept_id` ou `lesson_number`. Isso significa que toda a progressão pedagógica definida no banco (desbloqueio de aulas, conceitos, métricas por conceito) nunca é ativada pelo fluxo de módulos.

Este spec cobre:
1. Corrigir o gap de roteamento entre Modules e o backend pedagógico.
2. Criar o fluxo de execução de aula com rota dedicada (`/lesson/:conceptId/:lessonNumber`).
3. Transformar a Aula 1 (Estrutura) em uma aula expositiva + guiada com 6 blocos.
4. Integrar corretamente com `useSession` e `complete_session`.

---

## Arquitetura da Solução

```
Modules.tsx
  → navega para /lesson/:conceptId/:lessonNumber

LessonExecution.tsx (nova página)
  → lê params
  → decide tipo de aula:
      lesson_number === 1  →  LessonTypeStructure  (6 blocos interativos)
      lesson_number === 2  →  LessonTypeCompression (treino com timer leve)
      lesson_number === 3  →  LessonTypeRhythm      (treino com interferência)
  → ao finalizar: chama useSession.finishSession({ concept_id, lesson_number })
  → navega para /lesson/:conceptId/:lessonNumber/result

LessonResult.tsx (nova página simples)
  → mostra StabilityIndicator + próxima aula desbloqueada + botão voltar
```

### Novos componentes

| Componente | Responsabilidade |
|---|---|
| `StepBlock` | Revela técnica mental passo a passo (clique para avançar) |
| `GuidedStepInput` | Campo para resultado intermediário com validação instantânea |
| `StructuralFeedbackCard` | Classifica erro por tipo (decomposição, transporte, compensação, ritmo) |
| `StabilityIndicator` | Exibe precisão, variabilidade e recomendação técnica ao final |

### Conteúdo das aulas (Fase 2)

Inicialmente hardcoded em `src/data/lessonContent.ts`, estruturado como JSON por `concept_id`. A tabela de banco `lesson_content` fica como proposta futura (Fase 5D).

---

## Fases de Implementação

---

### Fase 1 — Correção do Gap de Roteamento

**Objetivo**: Ligar Modules ao backend. Sem nova UI, apenas a costura mínima necessária.
**Arquivos tocados**: `Modules.tsx`, `routes.tsx`, novo `LessonExecution.tsx` (scaffold).
**Depende de**: nada (fixes ao estado atual).

#### 1.1 — Corrigir navegação em Modules.tsx

No botão "Iniciar" de cada aula dentro de `foundational` e `consolidation`, substituir:
```tsx
// ANTES
navigate('/training')

// DEPOIS
navigate(`/lesson/${concept.concept_id}/${lessonNumber}`)
```

Onde `lessonNumber` é `1`, `2` ou `3` conforme a aula.

#### 1.2 — Adicionar rota em routes.tsx

```tsx
{ path: 'lesson/:conceptId/:lessonNumber', Component: LessonExecution },
{ path: 'lesson/:conceptId/:lessonNumber/result', Component: LessonResult },
```

Ambas dentro do `ProtectedLayout` existente.

#### 1.3 — Scaffold de LessonExecution.tsx

Criar `src/app/pages/LessonExecution.tsx`:
- Lê `conceptId` e `lessonNumber` de `useParams()`.
- Para lesson_number 2 e 3: renderiza o fluxo existente de treino (reutilizar `TabuadaTraining` lógica via `useSession`) passando os identificadores corretos.
- Para lesson_number 1: renderiza placeholder "Em breve — Aula Estruturada" (preenchido na Fase 3).
- Ao finalizar, chama `useSession.finishSession()` com `concept_id` e `lesson_number`, navega para `/lesson/:conceptId/:lessonNumber/result`.

#### 1.4 — Scaffold de LessonResult.tsx

Criar `src/app/pages/LessonResult.tsx`:
- Lê `location.state` para métricas da sessão (padrão já estabelecido no projeto).
- Exibe precisão, status da sessão e botão "Voltar aos módulos".
- Reutiliza estrutura visual de `TabuadaResult.tsx`.

#### Critério de Aceite — Fase 1
- [ ] Clicar em "Iniciar" na Aula 2 de um conceito navega para `/lesson/3/2` (ex: concept 3, lesson 2).
- [ ] A sessão é salva no banco com `concept_id` e `lesson_number` corretos.
- [ ] `complete_session` no Supabase progressi corretamente (lesson_1_status → available → completed).
- [ ] Aula 1 exibe placeholder sem quebrar a navegação.

---

### Fase 2 — Motor de Conteúdo das Aulas (Dados Estáticos)

**Objetivo**: Criar a camada de conteúdo que alimenta a Aula 1 de cada conceito.
**Arquivos tocados**: novo `src/data/lessonContent.ts`, novo `src/types/lesson.ts`.
**Depende de**: Fase 1.

#### 2.1 — Tipos TypeScript para conteúdo de aula

Criar `src/types/lesson.ts`:

```typescript
export type ErrorType = 'decomposition' | 'transport' | 'compensation' | 'rhythm'

export interface WarmupQuestion {
  operand1: number
  operand2: number
  operation: 'multiplication' | 'addition' | 'subtraction' | 'division'
  answer: number
}

export interface TechniqueStep {
  label: string        // ex: "Etapa 1"
  expression: string   // ex: "14 × 10 = ?"
  explanation: string  // ex: "Multiplique por 10 primeiro"
  answer: number
}

export interface GuidedProblem {
  operand1: number
  operand2: number
  operation: string
  intermediate: {
    label: string
    answer: number
    errorType: ErrorType // tipo de erro se o usuário errar aqui
  }
  final: number
}

export interface ConsolidationQuestion {
  operand1: number
  operand2: number
  operation: string
  answer: number
}

export interface LessonContent {
  conceptId: number
  lessonNumber: 1 | 2 | 3
  title: string
  techniqueName: string         // ex: "Multiplicação por 5 via halvening"
  techniqueRule: string         // ex: "Multiplique por 10 e divida por 2"
  warmup: WarmupQuestion[]      // Bloco 1: 2-4 questões
  technique: {                  // Bloco 2: passos
    example: { operand1: number; operand2: number }
    steps: TechniqueStep[]
    conclusion: string
  }
  guided: GuidedProblem[]       // Bloco 3: 3-4 problemas com etapas
  consolidation: ConsolidationQuestion[] // Bloco 4: 5-10 questões
  compression: ConsolidationQuestion[]   // Bloco 5: 5 questões sem etapas
}
```

#### 2.2 — Conteúdo inicial para conceitos 1-8 (foundational)

Criar `src/data/lessonContent.ts` com `LessonContent[]` para `lessonNumber === 1` dos conceitos 1 a 8.

Começar com conceitos 6, 7, 8 (Multiplicação por 2, 5, 10) como validação do modelo, pois têm técnicas mentais mais claras para o template de decomposição.

Exemplo de estrutura (concept 7 — Multiplicação por 5):
```typescript
{
  conceptId: 7,
  lessonNumber: 1,
  title: "Multiplicação por 5",
  techniqueName: "Halvening",
  techniqueRule: "Multiplique por 10, depois divida por 2",
  warmup: [
    { operand1: 5, operand2: 2, operation: 'multiplication', answer: 10 },
    { operand1: 5, operand2: 4, operation: 'multiplication', answer: 20 },
    { operand1: 10, operand2: 3, operation: 'multiplication', answer: 30 },
  ],
  technique: {
    example: { operand1: 5, operand2: 14 },
    steps: [
      { label: "Etapa 1", expression: "14 × 10", explanation: "Multiplique por 10", answer: 140 },
      { label: "Etapa 2", expression: "140 ÷ 2", explanation: "Divida por 2", answer: 70 },
    ],
    conclusion: "5 × 14 = 70"
  },
  guided: [
    {
      operand1: 5, operand2: 16, operation: 'multiplication',
      intermediate: { label: "16 × 10 =", answer: 160, errorType: 'decomposition' },
      final: 80
    },
    // ...
  ],
  consolidation: [...],  // 8 questões de 5×N
  compression: [...]     // 5 questões
}
```

#### Critério de Aceite — Fase 2
- [ ] `getLessonContent(conceptId, lessonNumber)` retorna o conteúdo correto.
- [ ] Todos os 8 conceitos foundational têm conteúdo para lesson 1.
- [ ] TypeScript sem erros de tipo.

---

### Fase 3 — Blocos de Execução da Aula (UI dos Blocos 1, 4, 5, 6)

**Objetivo**: Implementar a estrutura visual dos blocos mais simples da nova aula.
**Arquivos tocados**: `LessonExecution.tsx` (Aula 1), novos componentes.
**Depende de**: Fase 2.

A aula roda em um `currentBlock: 1 | 2 | 3 | 4 | 5 | 6` gerenciado por `useState`. Cada bloco ocupa tela cheia. Navegação é linear (sem voltar).

#### 3.1 — Bloco 1: Aquecimento Neural

Estado local: `warmupIndex`, `answers[]`.

- Exibe uma questão por vez do array `content.warmup`.
- Sem timer.
- Input numérico (reutilizar `InputField` existente).
- Feedback imediato: verde se correto, vermelho com resposta correta se errado.
- Não bloqueia progressão (aquecimento é formativo, não classificatório).
- Ao terminar todas as questões: botão "Continuar para a técnica".

#### 3.2 — Bloco 4: Consolidação Estrutural

Estado local: `consolidationIndex`, `correctCount`, `times[]`.

- Exibe questões de `content.consolidation` uma por vez.
- Sem timer.
- Apenas resposta final (sem etapas intermediárias).
- Coleta `is_correct` e `time_ms` por questão para métricas.
- Ao terminar: calcula `precision_pct` e `time_variability`, exibe mini-badge de estabilidade, botão "Mini Compressão".

#### 3.3 — Bloco 5: Mini Compressão

Igual ao Bloco 4, mas:
- Questões de `content.compression`.
- Exibe contador regressivo leve (não bloqueante — só visual, sem penalidade por tempo).
- Sistema "esconde" a etapa intermediária (usuário sabe a técnica, agora comprime).
- Ao atingir `precision >= 90%`: flag `compressionPassed = true` que será usada para marcar sessão como `stable`.

#### 3.4 — Bloco 6: Síntese

Tela final da aula. Exibe:
- `StabilityIndicator` com: precisão final, variabilidade, status da sessão.
- Resumo técnico: nome da técnica + regra mental em destaque.
- Mensagem técnica neutra (sem "parabéns" — consistente com o branding).
- Botão "Finalizar Aula" → chama `finishSession()` → navega para `LessonResult`.

#### 3.5 — Componente StabilityIndicator

`src/app/components/StabilityIndicator.tsx`:

Props:
```typescript
interface StabilityIndicatorProps {
  precision: number      // 0-100
  variability: number    // ms
  avgTime: number        // ms
  status: 'stable' | 'consolidating' | 'unstable'
}
```

Exibe três barras (Precision, Stability, Velocity) com valores numéricos. Visual consistente com o design system existente (cores de status já definidas no projeto).

#### Critério de Aceite — Fase 3
- [ ] Aula 1 de qualquer conceito foundational executa os 4 blocos (1, 4, 5, 6) end-to-end.
- [ ] Métricas coletadas nos blocos 4 e 5 alimentam o `StabilityIndicator` no bloco 6.
- [ ] `finishSession()` é chamado com dados corretos ao finalizar bloco 6.
- [ ] `LessonResult` exibe o resultado com o status correto.

---

### Fase 4 — Blocos Expositivos Interativos (Blocos 2 e 3)

**Objetivo**: Implementar a parte diferenciadora da Aula 1 — a exposição técnica guiada.
**Arquivos tocados**: `LessonExecution.tsx` (bloco 2 e 3), novos componentes `StepBlock` e `GuidedStepInput`.
**Depende de**: Fase 3.

#### 4.1 — Componente StepBlock (Bloco 2)

`src/app/components/lesson/StepBlock.tsx`:

Props:
```typescript
interface StepBlockProps {
  techniqueName: string
  techniqueRule: string
  example: { operand1: number; operand2: number }
  steps: TechniqueStep[]
  conclusion: string
  onComplete: () => void
}
```

Comportamento:
- Exibe o problema-exemplo no topo: `5 × 14 = ?`
- Estado `revealedSteps: number` (começa em 0).
- Cada clique em "Próximo passo" incrementa `revealedSteps` e anima a entrada do novo passo (Framer Motion `AnimatePresence`).
- Cada passo exibe: `label` + `expression` + `explanation` + resposta revelada com destaque.
- Após último passo: exibe conclusão + botão "Entendi, vou praticar".
- Não há respostas digitadas — é puramente expositivo.

Visual: cards empilhados sequencialmente. Cada novo passo entra com `slide-down` animation. Usar o esquema de cores blueprint do design system.

#### 4.2 — Bloco 2 em LessonExecution.tsx

Renderiza `StepBlock` com dados de `content.technique`. Ao `onComplete`, avança para Bloco 3.

#### 4.3 — Componente GuidedStepInput (Bloco 3)

`src/app/components/lesson/GuidedStepInput.tsx`:

Props:
```typescript
interface GuidedStepInputProps {
  problem: GuidedProblem
  onComplete: (correct: boolean, timeMs: number) => void
}
```

Comportamento:
- Exibe o problema: `5 × 18 = ?`
- Passo 1: campo para resultado intermediário (`intermediate.label`).
  - Se correto: feedback verde, avança para passo 2.
  - Se incorreto: exibe `StructuralFeedbackCard` com `intermediate.errorType`, mostra resposta correta, usuário pode tentar passo 2 mesmo assim.
- Passo 2: campo para resultado final.
  - Feedback imediato.
- Emite `onComplete(isCorrect, elapsedMs)`.

#### 4.4 — Componente StructuralFeedbackCard

`src/app/components/lesson/StructuralFeedbackCard.tsx`:

```typescript
interface StructuralFeedbackCardProps {
  errorType: ErrorType
  correctAnswer: number
  userAnswer: number
}
```

Mapeamento de mensagens técnicas por tipo de erro:
```
decomposition → "Erro na decomposição inicial. A técnica começa por [X]."
transport     → "Erro de transporte. Verifique a casa decimal."
compensation  → "Erro de compensação. O ajuste final estava incorreto."
rhythm        → "Erro de ritmo. A execução foi inconsistente com a técnica."
```

Visual: card com borda colorida (status unstable color do design system), ícone técnico, texto curto.

#### 4.5 — Bloco 3 em LessonExecution.tsx

Estado: `guidedIndex`, `guidedResults[]`.

- Renderiza `GuidedStepInput` para cada problema de `content.guided` em sequência.
- Ao terminar todos: avança para Bloco 4.
- `guidedResults` é armazenado no estado da sessão (não persistido separadamente no banco — fica agregado na sessão final).

#### Critério de Aceite — Fase 4
- [ ] Bloco 2 revela passos progressivamente com animação. Não avança sem clicar.
- [ ] Bloco 3 valida o resultado intermediário antes do final.
- [ ] `StructuralFeedbackCard` exibe mensagem técnica correta para cada `errorType`.
- [ ] O fluxo completo dos 6 blocos executa sem erros: 1 → 2 → 3 → 4 → 5 → 6.
- [ ] Sessão finaliza com métricas agregadas dos blocos 4 e 5 (não do 3, pois é guiado).

---

### Fase 5 — Integração Adaptativa e Persistência Completa

**Objetivo**: Garantir que o resultado da aula impacte corretamente a progressão e o motor adaptativo.
**Arquivos tocados**: `useSession.ts`, `session.service.ts`, `LessonResult.tsx`.
**Depende de**: Fase 4 + backend Fases 2-4 já implementadas.

#### 5.1 — Envio correto de concept_id e lesson_number

Verificar que `useSession.finishSession()` recebe e encaminha:
```typescript
finishSession({
  concept_id: conceptId,
  lesson_number: lessonNumber,
  module_phase: 'synthesis', // bloco final
  // métricas dos blocos 4 e 5
})
```

Confirmar que `complete_session` no Supabase:
- Atualiza `lesson_1_status → completed` quando `lesson_number === 1`.
- Desbloqueia `lesson_2_status → available`.
- Progressi `concept.status → in_progress`.

#### 5.2 — Lógica de precisão para completar aula

No bloco 5 (Mini Compressão), se `precision_pct >= 90`:
- Passar `session_status: 'stable'` para `complete_session`.
- Isso aciona o desbloqueio mais rápido de lesson 2 (conforme regra já no SQL da Fase 4).

Se `precision_pct < 80`:
- `session_status: 'unstable'`.
- Bloco 6 exibe alerta: "Reforço recomendado antes de avançar" (usando padrão visual já existente em `TabuadaResult.tsx`).

#### 5.3 — LessonResult.tsx com próximo passo

Após a aula, `LessonResult.tsx` exibe:
- Status da sessão (stable/consolidating/unstable).
- Se `lesson_number === 1` e `stable`: "Aula 2 — Compressão desbloqueada" com botão "Iniciar".
- Se `unstable`: "Reforço recomendado" sem botão de avanço imediato.
- Sempre: botão "Voltar aos Módulos".

Reutilizar o padrão visual do card `PRÓXIMO_PASSO` já existente em `TabuadaResult.tsx`.

#### 5.4 — Seed inicial de concept_progress

Garantir que novos usuários tenham `concept_id = 1, lesson_1_status = 'available'` ao criar conta. Verificar se o trigger `handle_new_user` cobre isso ou se precisa de ajuste na migration existente.

#### 5.5 — Aulas 2 e 3 via LessonExecution

Para `lesson_number 2` e `3`, `LessonExecution` renderiza um treino padrão (sem os 6 blocos), mas com:
- `concept_id` e `lesson_number` passados para `useSession`.
- Nível e modo configurados com base na recomendação do motor adaptativo (`useAdaptive`).
- Resultado navega para `LessonResult` com o mesmo padrão.

#### Critério de Aceite — Fase 5
- [ ] Completar Aula 1 marca `lesson_1_status = completed` e `lesson_2_status = available` no banco.
- [ ] Completar Aula 3 marca o conceito como `mastered` e desbloqueia o próximo conceito.
- [ ] Novo usuário começa com concept_id 1 disponível.
- [ ] Aulas 2 e 3 passam `concept_id` e `lesson_number` corretamente.
- [ ] `LessonResult` exibe o próximo passo correto baseado no status da sessão.

---

## Decisões de Design Consolidadas

| Decisão | Escolha | Justificativa |
|---|---|---|
| Rota | `/lesson/:conceptId/:lessonNumber` | Não cria módulo paralelo, integra na arquitetura |
| Conteúdo | Hardcoded em `lessonContent.ts` | Evita over-engineering; tabela no banco é Fase futura |
| Blocos de métricas | Apenas blocos 4 e 5 | Bloco 3 é formativo (guiado), não classificatório |
| Progressão de blocos | Linear, sem volta | Reduz complexidade de estado; bloco 1 é formativo |
| Aulas 2 e 3 | Treino padrão com identifiers corretos | Reutiliza fluxo existente, entrega valor imediato |
| Seed de conteúdo | Começar por conceitos 6-8 | Têm técnicas mais claras para validar o template |

---

## Arquivos a Criar

```
src/
├── types/
│   └── lesson.ts                                 # Fase 2
├── data/
│   └── lessonContent.ts                          # Fase 2
├── app/
│   ├── pages/
│   │   ├── LessonExecution.tsx                   # Fase 1 (scaffold), 3 (blocos), 4 (interativos)
│   │   └── LessonResult.tsx                      # Fase 1 (scaffold), 5 (completo)
│   └── components/
│       ├── StabilityIndicator.tsx                # Fase 3
│       └── lesson/
│           ├── StepBlock.tsx                     # Fase 4
│           ├── GuidedStepInput.tsx               # Fase 4
│           └── StructuralFeedbackCard.tsx        # Fase 4
```

## Arquivos a Modificar

```
src/
├── app/
│   ├── routes.tsx          # Fase 1: adicionar rotas lesson e lesson/result
│   └── pages/
│       └── Modules.tsx     # Fase 1: corrigir navigate para /lesson/:conceptId/:lessonNumber
└── hooks/
    └── useSession.ts       # Fase 5: confirmar envio de concept_id + lesson_number
```

---

## Dependências entre Fases

```
Fase 1 (Roteamento)
  → Fase 2 (Conteúdo)
      → Fase 3 (Blocos simples: 1, 4, 5, 6)
          → Fase 4 (Blocos interativos: 2, 3)
              → Fase 5 (Integração adaptativa)
```

Fase 1 pode ser implementada e validada de forma isolada — é o desbloqueador crítico.

---

## O que este spec NÃO cobre (fora do escopo)

- Tabela `lesson_content` no banco (conteúdo dinâmico via DB) — proposta futura.
- Módulo `pro` (conceitos 16-24) — cobre Fase 5 da arquitetura geral.
- Conteúdo para módulo `consolidation` (conceitos 9-15) — estrutura é idêntica, conteúdo pode ser adicionado após validar com foundational.
- Vídeos, PDFs ou formatos não interativos — fora do modelo pedagógico atual.
- Relatórios de erro detalhados por tipo para analytics — logging básico via session_problems já existente.

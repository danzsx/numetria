# SPEC: Sprint — Protocolo de Performance PRO
**Versão**: 1.0 | **Data**: 2026-02-22 | **Status**: Pronto para execução

---

## Contexto e Ponto de Partida

As fases 1-4 da arquitetura técnica estão concluídas. A Fase 5 tem infraestrutura parcialmente implementada:

| Item | Status |
|------|--------|
| `ProLayout.tsx` — guarda de rota Pro | ✅ Feito |
| `Pro.tsx` — página de upgrade (UI) | ✅ Feito |
| `user.service.ts` — getPlanStatus, cancelSubscription | ✅ Feito |
| `migration 007_admin_override.sql` — `is_pro_user()`, `get_plan_access()`, role admin | ✅ Feito |
| RLS em concept_progress para concepts 16-24 | ❌ Pendente |
| Regras de desbloqueio PRO no `complete_session` | ❌ Pendente |
| Rota de treino com params `?conceptId&lessonNumber` | ❌ Pendente |
| Paywall nos módulos (UI) | ❌ Pendente |
| Mecânicas PRO (Flow, Smart Timer, Interferência) | ❌ Pendente |
| Stripe + webhook | ❌ Fora deste sprint |

**Mapeamento de conceitos por módulo:**
- Núcleo Fundacional: concept_id 1-8
- Consolidação: concept_id 9-15
- Automação (PRO): concept_id 16-18
- Ritmo (PRO): concept_id 19-21
- Precisão (PRO): concept_id 22-24

---

## Fase 1 — Fundação de Dados PRO (Backend)

**Objetivo:** Garantir que banco, RLS e RPCs suportem os módulos PRO com regras reais de acesso e desbloqueio.

**Dependências:** migration 007 aplicada no Supabase. Sem dependência de frontend.

### 1.1 Migration 008 — Seed PRO em `handle_new_user`

Atualizar o trigger `handle_new_user` para inserir registros em `concept_progress` para os conceitos 16-24 com `status = 'locked'` no momento do signup.

```sql
-- Adicionar ao corpo do trigger handle_new_user (após inserir conceitos 1-15)
INSERT INTO concept_progress (user_id, concept_id, status, lesson_1_status, lesson_2_status, lesson_3_status)
SELECT NEW.id, s.id, 'locked', 'locked', 'locked', 'locked'
FROM generate_series(16, 24) AS s(id)
ON CONFLICT (user_id, concept_id) DO NOTHING;
```

Também criar script idempotente para usuários existentes sem esses registros:

```sql
-- Backfill para usuários que já existem
INSERT INTO concept_progress (user_id, concept_id, status, lesson_1_status, lesson_2_status, lesson_3_status)
SELECT p.id, s.id, 'locked', 'locked', 'locked', 'locked'
FROM profiles p
CROSS JOIN generate_series(16, 24) AS s(id)
ON CONFLICT (user_id, concept_id) DO NOTHING;
```

### 1.2 Migration 008 — RLS para Conceitos PRO

A policy atual em `concept_progress` permite acesso a todos os conceitos. Substituir por:

```sql
-- Drop policy genérica existente
DROP POLICY IF EXISTS "Users can view own progress" ON concept_progress;

-- Conceitos 1-15: todos os usuários autenticados
CREATE POLICY "Free users can view foundational concepts"
  ON concept_progress FOR SELECT
  USING (auth.uid() = user_id AND concept_id <= 15);

-- Conceitos 16-24: apenas PRO (inclui admin via is_pro_user)
CREATE POLICY "Pro concepts only for pro users"
  ON concept_progress FOR SELECT
  USING (
    auth.uid() = user_id
    AND (concept_id <= 15 OR is_pro_user(auth.uid()))
  );

-- Policy de escrita unificada (SELECT está separado acima)
DROP POLICY IF EXISTS "Users can modify own progress" ON concept_progress;
CREATE POLICY "Users can modify own progress"
  ON concept_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

> **Nota:** A separação entre `SELECT` e a policy de escrita (`ALL`) permite que `complete_session` (SECURITY DEFINER) atualize conceitos PRO mesmo sendo chamado via função.

### 1.3 Migration 008 — Regras de Desbloqueio PRO no `complete_session`

Adicionar bloco ao final da RPC `complete_session` que avalia desbloqueio dos módulos PRO. Executar após a lógica existente de desbloqueio de conceitos 1-15.

**Regra de Automação (concepts 16-18):**
- Desbloqueio de concept 16 (lesson 1): todos os concepts 1-15 devem ter status `completed` ou `mastered`.

```sql
-- No complete_session, após lógica de desbloqueio existente:
IF v_concept_id = 15 AND v_new_lesson_status = 'completed' THEN
  -- Verificar se todos os 1-15 estão concluídos
  IF (
    SELECT COUNT(*) FROM concept_progress
    WHERE user_id = v_user_id
      AND concept_id BETWEEN 1 AND 15
      AND status IN ('completed', 'mastered')
  ) = 15 THEN
    -- Desbloquear Automação
    INSERT INTO concept_progress (user_id, concept_id, status, lesson_1_status)
    VALUES (v_user_id, 16, 'available', 'available')
    ON CONFLICT (user_id, concept_id)
    DO UPDATE SET status = 'available', lesson_1_status = 'available';
  END IF;
END IF;
```

**Regra de Ritmo (concepts 19-21):**
- Desbloqueio de concept 19 quando 80% de concepts 1-18 tiverem status `mastered`.

```sql
DECLARE v_mastered_pct NUMERIC;

SELECT (COUNT(*) FILTER (WHERE status = 'mastered')::NUMERIC / 18.0 * 100)
INTO v_mastered_pct
FROM concept_progress
WHERE user_id = v_user_id AND concept_id BETWEEN 1 AND 18;

IF v_mastered_pct >= 80 THEN
  INSERT INTO concept_progress (user_id, concept_id, status, lesson_1_status)
  VALUES (v_user_id, 19, 'available', 'available')
  ON CONFLICT (user_id, concept_id) DO UPDATE
  SET status = CASE WHEN concept_progress.status = 'locked' THEN 'available' ELSE concept_progress.status END,
      lesson_1_status = CASE WHEN concept_progress.lesson_1_status = 'locked' THEN 'available' ELSE concept_progress.lesson_1_status END;
END IF;
```

**Regra de Precisão (concepts 22-24):**
- Desbloqueio quando variabilidade média das últimas 3 sessões de concepts 19-21 < 200ms.

```sql
DECLARE v_avg_variability NUMERIC;

SELECT AVG(time_variability) INTO v_avg_variability
FROM (
  SELECT time_variability FROM training_sessions
  WHERE user_id = v_user_id AND concept_id BETWEEN 19 AND 21
  ORDER BY completed_at DESC LIMIT 3
) sub;

IF v_avg_variability IS NOT NULL AND v_avg_variability < 200 THEN
  INSERT INTO concept_progress (user_id, concept_id, status, lesson_1_status)
  VALUES (v_user_id, 22, 'available', 'available')
  ON CONFLICT (user_id, concept_id) DO UPDATE
  SET status = CASE WHEN concept_progress.status = 'locked' THEN 'available' ELSE concept_progress.status END,
      lesson_1_status = CASE WHEN concept_progress.lesson_1_status = 'locked' THEN 'available' ELSE concept_progress.lesson_1_status END;
END IF;
```

### 1.4 Migration 008 — Guard PRO em `complete_session`

Impedir que usuários free completem sessões de conceitos PRO via manipulação direta de URL:

```sql
-- No início de complete_session, após extrair v_user_id e v_concept_id:
IF v_concept_id IS NOT NULL AND v_concept_id >= 16 THEN
  IF NOT is_pro_user(v_user_id) THEN
    RAISE EXCEPTION 'Acesso negado: conceito % requer Protocolo Pro', v_concept_id;
  END IF;
END IF;
```

### 1.5 Atualizar `get_adaptive_recommendation` para PRO

A RPC atual lida apenas com concepts 1-15. Expandir para retornar recomendações nos concepts 16-24. Comportamento por faixa:

- concepts 16-18 (Automação): recomendar `level 3`, `mode = random`, `timer_mode = untimed` (Flow Mode não usa timer externo)
- concepts 19-21 (Ritmo): recomendar `level 3`, `timer_mode = timed`, timeLimit inicial de 5000ms
- concepts 22-24 (Precisão): recomendar `level 4`, `mode = random`, `timer_mode = timed`

Adicionar campo `pro_mode` ao retorno: `'flow' | 'rhythm' | 'precision' | null`.

```sql
-- No RETURNS JSON da RPC:
RETURN json_build_object(
  -- campos existentes...
  'pro_mode', CASE
    WHEN p_concept_id BETWEEN 16 AND 18 THEN 'flow'
    WHEN p_concept_id BETWEEN 19 AND 21 THEN 'rhythm'
    WHEN p_concept_id BETWEEN 22 AND 24 THEN 'precision'
    ELSE NULL
  END
);
```

Adicionar `pro_mode: 'flow' | 'rhythm' | 'precision' | null` ao tipo `AdaptiveRecommendation` em `src/types/database.ts`.

### Critérios de Conclusão da Fase 1

- [ ] Migration 008 executada no Supabase sem erros
- [ ] Novos usuários têm 24 registros em `concept_progress` após signup
- [ ] Usuários existentes têm backfill aplicado
- [ ] Usuário free não consegue ler `concept_progress` de concepts 16-24 via SDK direto
- [ ] Usuário admin (role='admin') lê concepts 16-24 normalmente
- [ ] `complete_session` com concept_id=16 de usuário free retorna erro 400+
- [ ] `get_adaptive_recommendation` com concept_id=19 retorna `pro_mode = 'rhythm'`

---

## Fase 2 — Integração Treino–Conceito (Frontend)

**Objetivo:** A rota de treino aceita parâmetros de conceito e aula, e os persiste corretamente no banco via `complete_session`.

**Dependências:** Fase 1 concluída.

### 2.1 Rota de Treino com Parâmetros

`TabuadaTraining.tsx` deve ler `?conceptId=X&lessonNumber=Y` via `useSearchParams`:

```typescript
// src/app/pages/TabuadaTraining.tsx
import { useSearchParams } from 'react-router'

const [searchParams] = useSearchParams()
const conceptId = searchParams.get('conceptId') ? Number(searchParams.get('conceptId')) : null
const lessonNumber = searchParams.get('lessonNumber') ? Number(searchParams.get('lessonNumber')) : null
```

Estes valores devem ser passados ao `useSession` e posteriormente ao `sessionService.completeSession`.

### 2.2 Hook `useSession` — Repasse de Metadados Pedagógicos

Atualizar `useSession` para aceitar `conceptId` e `lessonNumber` e incluí-los no payload de `completeSession`:

```typescript
// src/hooks/useSession.ts
interface SessionConfig {
  conceptId?: number | null
  lessonNumber?: number | null
  // ... config existente
}
```

O `session_data` enviado à RPC deve sempre incluir `concept_id` e `lesson_number` quando fornecidos.

### 2.3 `TabuadaSetup.tsx` — Modo Guiado por Conceito

Quando `?conceptId` estiver presente na URL:
- Buscar `get_adaptive_recommendation(conceptId)` e pré-configurar o formulário
- Ocultar seletores manuais de operação/base/nível (mantidos apenas no modo livre)
- Exibir card `CONCEITO_SELECIONADO` com label do conceito e aula

Se `conceptId >= 16`, verificar `isPro` antes de renderizar qualquer conteúdo — redirecionar para `/pro` se false.

### 2.4 `Modules.tsx` — Botão de Início por Aula

O botão de iniciar treino por aula deve navegar para a rota com params:

```typescript
// Dentro do card de cada lição
const handleStartLesson = (conceptId: number, lessonNumber: 1 | 2 | 3) => {
  navigate(`/tabuada/training?conceptId=${conceptId}&lessonNumber=${lessonNumber}`)
}
```

Para concepts 16-24: antes de navegar, verificar se o usuário é Pro. Se não for, abrir paywall modal (Fase 3).

### Critérios de Conclusão da Fase 2

- [ ] Navegar para `/tabuada/training?conceptId=5&lessonNumber=2` inicia treino e registra `concept_id=5, lesson_number=2` no banco
- [ ] `TabuadaSetup.tsx` com `?conceptId=3` oculta seletores manuais e mostra configuração recomendada
- [ ] `complete_session` no banco mostra `concept_id` e `lesson_number` preenchidos nas sessions iniciadas via Modules
- [ ] Sessões sem params ainda funcionam normalmente (treino livre)

---

## Fase 3 — Paywall PRO nos Módulos

**Objetivo:** Usuários free visualizam módulos PRO mas não conseguem iniciar treinos; são direcionados ao upgrade.

**Dependências:** Fase 2 concluída. `isPro` disponível em `useConceptProgress` ou via `userService.getPlanStatus`.

### 3.1 Exposição de `isPro` no Hook

Adicionar ao `useConceptProgress` (ou criar hook `usePlanStatus`):

```typescript
// src/hooks/useConceptProgress.ts
const [isPro, setIsPro] = useState(false)

useEffect(() => {
  userService.getPlanStatus().then(s => setIsPro(s.is_active))
}, [])

// Função helper exportada
const isProConcept = (conceptId: number) => conceptId >= 16
```

### 3.2 Modal de Paywall

Criar componente `PaywallModal.tsx` em `src/app/components/`:

```typescript
interface PaywallModalProps {
  open: boolean
  onClose: () => void
  moduleName: string  // ex: "Automação"
}
```

Conteúdo do modal:
- Label: `ACESSO_RESTRITO`
- Título: `Requer Protocolo Pro`
- Copy: `O módulo {moduleName} faz parte da Evolução Estrutural Avançada. Desbloqueie análise cognitiva profunda, cronômetro adaptativo e mecânicas de interferência controlada.`
- CTA primário: `Conhecer o Protocolo Pro` → navegar para `/pro`
- CTA secundário: `Fechar`

Usar `Dialog` do Radix UI (já instalado em `src/app/components/ui/`).

### 3.3 Integração do Paywall em `Modules.tsx`

```typescript
const [paywallModule, setPaywallModule] = useState<string | null>(null)

const handleStartLesson = (conceptId: number, lessonNumber: 1 | 2 | 3, moduleName: string) => {
  if (conceptId >= 16 && !isPro) {
    // Registrar evento analytics
    console.log('[analytics] pro_paywall_view', { conceptId, moduleName })
    setPaywallModule(moduleName)
    return
  }
  navigate(`/tabuada/training?conceptId=${conceptId}&lessonNumber=${lessonNumber}`)
}
```

Renderizar `<PaywallModal open={!!paywallModule} moduleName={paywallModule} onClose={() => setPaywallModule(null)} />` no JSX.

### 3.4 Guard na Rota de Treino

Em `TabuadaTraining.tsx`, adicionar `useEffect` de verificação:

```typescript
useEffect(() => {
  if (conceptId === null || conceptId < 16) return

  userService.getPlanStatus().then(status => {
    if (!status.is_active) {
      navigate('/pro', { state: { from: location.pathname + location.search }, replace: true })
    }
  })
}, [conceptId])
```

### 3.5 Identidade Visual PRO nos Módulos

Módulos com `concept_id >= 16` recebem:
- Borda: `border border-[#3A72F8]/40` (Primary Accent com 40% de opacidade)
- Badge: `PRO` no canto superior direito do card, cor `#3A72F8`
- Lock icon sobre a aula quando `status = 'locked'` e usuário é free

### Critérios de Conclusão da Fase 3

- [ ] Usuário free clica em aula de Automação → modal de paywall aparece
- [ ] Modal exibe nome correto do módulo e CTA navega para `/pro`
- [ ] Usuário free tenta acessar `/tabuada/training?conceptId=16` diretamente → redirecionado para `/pro`
- [ ] Usuário Pro acessa aula de conceito 16-24 sem bloqueio
- [ ] Cards de módulos PRO têm borda azul e badge `PRO`
- [ ] `pro_paywall_view` logado no console ao tentar acessar módulo bloqueado

---

## Fase 4 — Mecânicas de Execução PRO

**Objetivo:** Implementar os três modos de treino exclusivos do Protocolo PRO no frontend. Nenhuma mudança de banco é necessária — os dados já existentes suportam o armazenamento dos resultados.

**Dependências:** Fase 2 concluída (conceptId disponível em TabuadaTraining). Fase 3 concluída (acesso garantido).

### 4.1 Motor: `tabuadaEngine.ts` — Tipos e Modos PRO

Adicionar ao arquivo existente:

```typescript
export type ProMode = 'flow' | 'rhythm' | 'precision'

export interface ProSessionConfig {
  conceptId: number
  proMode: ProMode
  baseTimeLimit?: number  // ms, para rhythm mode. Default: 5000
}

export interface RhythmProblem extends Problem {
  timeLimit: number  // ms, ajustável dinamicamente
}
```

**Flow Mode (concepts 16-18):**
- Gera 10 questões de reconhecimento de padrões: triplos pitagóricos (3-4-5, 5-12-13, 8-15-17) e complementos decimais (ex: `5 × _ = 100`, `25 × _ = 100`)
- Não requer lógica diferente do `generateProblems` existente — diferença está na UI (sem feedback entre questões)

**Rhythm Mode (concepts 19-21):**
- Gera problemas normais com `timeLimit` por problema
- Expõe `adjustTimer(consecutiveCorrect: number, currentLimit: number): number`:

```typescript
export function adjustTimer(consecutiveCorrectSubTime: number, currentLimit: number): number {
  if (consecutiveCorrectSubTime >= 3) {
    return Math.max(1500, currentLimit - 100)  // mínimo de 1500ms
  }
  return currentLimit
}
```

**Precision Mode (concepts 22-24):**
- Alterna operações em pares: multiplicação/divisão ou adição/subtração
- `generatePrecisionProblems(baseNumber: number): Problem[]`:

```typescript
export function generatePrecisionProblems(baseNumber: number): Problem[] {
  // Pares alternados: índice par = multiplicação, índice ímpar = divisão
  return Array.from({ length: 10 }, (_, i) => {
    const isMultiplication = i % 2 === 0
    // gerar problema de multiplicação ou divisão com baseNumber
  })
}
```

### 4.2 UI: Flow Mode em `TabuadaTraining.tsx`

Quando `proMode === 'flow'`:
- Remover o componente de feedback entre questões (`CORRETO` / `ERRADO` após cada resposta)
- Substituir por barra de progresso silenciosa (questão X de 10)
- Ao terminar as 10 questões, navegar para `TabuadaResult` com todos os dados acumulados

```typescript
const isFlowMode = proMode === 'flow'

// No handler de resposta:
if (isFlowMode) {
  // Sem mostrar feedback visual — avançar diretamente
  goToNextQuestion()
} else {
  // Comportamento padrão com feedback
  showFeedback(isCorrect)
}
```

### 4.3 UI: Smart Timer em `TabuadaTraining.tsx`

Quando `proMode === 'rhythm'`:

```typescript
const [timeLimit, setTimeLimit] = useState(initialTimeLimit)
const [consecutiveSubTime, setConsecutiveSubTime] = useState(0)
const questionStartTime = useRef(Date.now())

// No handler de resposta:
const responseTime = Date.now() - questionStartTime.current
const wasSubTime = responseTime < timeLimit

if (isCorrect && wasSubTime) {
  const newConsecutive = consecutiveSubTime + 1
  setConsecutiveSubTime(newConsecutive)
  const newLimit = adjustTimer(newConsecutive, timeLimit)
  if (newLimit !== timeLimit) {
    setTimeLimit(newLimit)
    console.log('[analytics] adaptive_adjustment', { from: timeLimit, to: newLimit })
  }
} else {
  setConsecutiveSubTime(0)
}
```

O timer regressivo: `useEffect` com `setInterval` que decrementa um contador visual. Se expirar, registrar como erro e avançar.

**Importante:** Ao resetar o input do usuário, usar `ref.current.value = ''` (não `setState`) para evitar re-render que limpa o input durante digitação.

### 4.4 UI: Interference Mode em `TabuadaTraining.tsx`

Quando `proMode === 'precision'`:
- Usar `generatePrecisionProblems` do engine
- Exibir o tipo de operação claramente antes de cada questão (`MULTIPLICAÇÃO` / `DIVISÃO`)
- Se precisão cair abaixo de 80% no meio da sessão (após 5 questões), exibir alerta:

```typescript
// Após resposta da questão 5+:
if (answeredCount >= 5) {
  const currentPrecision = (correctCount / answeredCount) * 100
  if (currentPrecision < 80) {
    setShowStructureAlert(true)  // Banner: "Precisão abaixo de 80% — considere revisar a estrutura técnica"
  }
}
```

### 4.5 `TabuadaResult.tsx` — Exibição PRO

Quando a sessão veio de um conceito PRO (`concept_id >= 16`), substituir:
- `"Acertos"` → `"Índice de Estabilidade"`
- Calcular e exibir: `stability = ((correctCount / totalCount) * (1 - variability / avgTime) * 100).toFixed(1)`

Adicionar badge `MODO_COMPRESSÃO` quando:
- `stability_score > 85` E `precision_pct >= 95`

```typescript
const isCompressionMode = sessionStatus === 'stable' && precisionPct >= 95 && stabilityScore > 85

{isCompressionMode && (
  <div className="text-[var(--nm-accent-primary)] font-[family-name:var(--font-data)] text-xs tracking-widest uppercase">
    MODO_COMPRESSÃO · Etapas visuais reduzidas na próxima sessão
  </div>
)}
```

Evento `concept_mastered` — logar quando o retorno da RPC indicar transição para `mastered`:

```typescript
if (completeResult?.new_status === 'mastered') {
  console.log('[analytics] concept_mastered', { conceptId, lessonNumber })
}
```

Para isso, `complete_session` deve retornar `new_status` no JSON de resposta (verificar se já faz isso; se não, adicionar à RPC).

### Critérios de Conclusão da Fase 4

- [ ] Flow Mode: sessão de concept 16 não mostra feedback entre questões; exibe resumo final correto
- [ ] Smart Timer: após 3 acertos consecutivos abaixo do tempo, `timeLimit` reduz 100ms no próximo problema
- [ ] Smart Timer: input do usuário não é limpo quando o timer ajusta
- [ ] Precision Mode: questões alternam multiplicação/divisão; alerta aparece se precisão < 80% após 5 questões
- [ ] TabuadaResult: sessão PRO mostra "Índice de Estabilidade" no lugar de "Acertos"
- [ ] Badge `MODO_COMPRESSÃO` aparece quando stability > 85 e precision >= 95
- [ ] `adaptive_adjustment` logado no console ao ajustar timer
- [ ] `concept_mastered` logado quando RPC confirma transição

---

## Fase 5 — UX e Refinamentos

**Objetivo:** Polimento visual e de navegação para a experiência PRO.

**Dependências:** Fases 2-4 concluídas.

### 5.1 Breadcrumb de Navegação

Criar componente `Breadcrumb.tsx` em `src/app/components/`:

```typescript
interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}
```

Uso em `TabuadaTraining.tsx` quando `conceptId` está presente:
```
Módulos > Automação — Aula 1 > Treino
```

Implementado como links de texto separados por `›`, sem bibliotecas adicionais.

### 5.2 Skeleton Screens para Lista de Aulas

Em `Modules.tsx`, durante o loading de `concept_progress`:

```typescript
// Reutilizar o padrão Skeleton já existente em Dashboard.tsx
function LessonSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  )
}
```

Renderizar durante `loading === true` em vez do conteúdo vazio atual.

### 5.3 Barra de Progresso Ponderada no Dashboard

Atualizar `calcModuleProgress` em `Dashboard.tsx` para usar pesos por status:

```typescript
function calcModuleProgressWeighted(summary: ConceptProgress[], fromId: number, toId: number): number {
  const inRange = summary.filter(c => c.concept_id >= fromId && c.concept_id <= toId)
  if (inRange.length === 0) return 0

  const totalWeight = inRange.reduce((acc, c) => {
    if (c.status === 'mastered') return acc + 100
    if (c.status === 'completed') return acc + 75
    if (c.status === 'in_progress') return acc + 30
    return acc  // locked/available = 0
  }, 0)

  return Math.round(totalWeight / inRange.length)
}
```

### 5.4 Módulos PRO no Dashboard

No Dashboard, a seção de módulos deve exibir Automação, Ritmo e Precisão como cards com:
- Lock icon quando usuário é free
- Barra de progresso (usando fórmula ponderada)
- Link para `/modules` com âncora no módulo PRO

### Critérios de Conclusão da Fase 5

- [ ] Breadcrumb visível em TabuadaTraining quando `conceptId` está presente
- [ ] Skeleton aparece durante loading da lista de aulas em Modules
- [ ] Barra de progresso do módulo reflete pesos (mastered=100%, completed=75%, in_progress=30%)
- [ ] Dashboard mostra cards PRO com lock para usuários free
- [ ] Nenhuma quebra de layout em mobile com as adições de UI

---

## Fase 6 — Stripe Integration [Fora deste sprint]

Esta fase cobre a integração real de pagamentos e é tratada separadamente por ser uma dependência externa de maior risco. Escopo documentado em `ARQUITETURA-TECNICA.md` Fase 5, itens 5.5-5.11.

**Pré-condição:** Conta Stripe configurada com produtos (mensalR$49, anualR$490) e webhook secret.

**Entregáveis:**
- Edge Function `check-plan-access`: cria Stripe Checkout Session e retorna URL
- Edge Function `stripe-webhook`: valida assinatura e atualiza `plan_subscriptions` + `profiles.plan_type`
- RPC `cancel_my_pro_subscription`: já existe, integrar com Stripe Cancel API

---

## Dependências Entre Fases

```
Fase 1 (Backend)
    └── Fase 2 (Rota/Params)
            └── Fase 3 (Paywall)
            │       └── Fase 5 (UX)
            └── Fase 4 (Mecânicas PRO)
                    └── Fase 5 (UX)
```

Fase 6 (Stripe) é independente — pode ser desenvolvida em paralelo após Fase 1.

---

## Arquivos a Criar / Modificar

| Arquivo | Tipo | Fase |
|---------|------|------|
| `supabase/migrations/008_pro_protocol.sql` | Novo | 1 |
| `src/types/database.ts` | Modificar — adicionar `pro_mode` em `AdaptiveRecommendation` | 1 |
| `src/app/pages/TabuadaTraining.tsx` | Modificar | 2, 4 |
| `src/app/pages/TabuadaSetup.tsx` | Modificar | 2 |
| `src/hooks/useSession.ts` | Modificar | 2 |
| `src/app/pages/Modules.tsx` | Modificar | 2, 3, 5 |
| `src/app/components/PaywallModal.tsx` | Novo | 3 |
| `src/app/utils/tabuadaEngine.ts` | Modificar | 4 |
| `src/app/pages/TabuadaResult.tsx` | Modificar | 4 |
| `src/app/components/Breadcrumb.tsx` | Novo | 5 |
| `src/app/pages/Dashboard.tsx` | Modificar | 5 |

---

## Eventos de Analytics (Logging)

Por ora implementar como `console.log` com prefixo `[analytics]`. Estrutura pronta para futura integração com Posthog/Amplitude.

| Evento | Onde disparar | Payload |
|--------|--------------|---------|
| `session_start` | `useSession.startSession` | `{ conceptId, lessonNumber, isPro }` |
| `pro_paywall_view` | `Modules.tsx handleStartLesson` | `{ conceptId, moduleName }` |
| `adaptive_adjustment` | `TabuadaTraining.tsx` handler | `{ from, to, consecutiveCount }` |
| `concept_mastered` | `TabuadaResult.tsx` | `{ conceptId, lessonNumber }` |

---

## Definition of Done — Sprint Completo

1. Fluxo completo aula 1-24 persiste `concept_id` e `lesson_number` no banco via `complete_session`
2. Usuário free não inicia treino de concepts 16-24 via URL direta (guard no frontend + validação no banco)
3. Smart Timer ajusta tempo em real-time sem causar re-render que limpa o input do usuário
4. Barra de progresso do módulo reflete fórmula ponderada (mastered=100%, completed=75%, in_progress=30%)
5. Regras de desbloqueio PRO executam corretamente no banco ao finalizar sessões nos conceitos-gatilho
6. Modal de paywall aparece para usuários free ao clicar em qualquer aula PRO

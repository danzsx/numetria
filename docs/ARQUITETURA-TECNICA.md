# NUMETRIA — ARQUITETURA TÉCNICA COMPLETA
### Análise Frontend + Proposta Backend + Plano de Implementação
**Versão**: 1.0.0 | **Data**: 2026-02-19 | **Autor**: Engenharia Sênior

---

## ÍNDICE

1. [Análise Estrutural do Frontend](#1-análise-estrutural-do-frontend)
2. [Avaliação Arquitetural](#2-avaliação-arquitetural)
3. [Proposta de Arquitetura Backend (Supabase)](#3-proposta-de-arquitetura-backend-supabase)
4. [Modelagem de Banco de Dados](#4-modelagem-de-banco-de-dados)
5. [Estrutura de API e RPC](#5-estrutura-de-api-e-rpc)
6. [Estratégia de Segurança (RLS)](#6-estratégia-de-segurança-rls)
7. [Integração Frontend ↔ Supabase](#7-integração-frontend--supabase)
8. [Ajustes Necessários no Frontend](#8-ajustes-necessários-no-frontend)
9. [Plano de Implementação por Fases](#9-plano-de-implementação-por-fases)

---

## 1. ANÁLISE ESTRUTURAL DO FRONTEND

### 1.1 Stack Identificada

| Camada | Tecnologia | Versão | Observação |
|--------|-----------|--------|------------|
| Framework UI | React | 18.3.1 | Hooks, FC pattern |
| Build Tool | Vite | 6.3.5 | ES modules, HMR |
| Roteamento | React Router | 7.13.0 | Browser Router, sem lazy loading |
| Estilização | Tailwind CSS | 4.1.12 | v4, config via CSS |
| Design System | CSS Custom Properties | — | Tokens em `theme.css` |
| Animações | Framer Motion | 12.23.24 | AnimatePresence, motion.div |
| Gráficos | Recharts | 2.15.2 | LineChart |
| Componentes base | Radix UI | 60+ | Accessibilidade nativa |
| Ícones | Lucide React | 0.487.0 | Consistentes |
| Formulários | React Hook Form | 7.55.0 | Instalado, **não utilizado** |
| State Management | **Nenhum** | — | Apenas useState local |
| Tipagem | TypeScript | — | Cobertura completa |
| Notificações | Sonner | 2.0.3 | Instalado, não utilizado |

### 1.2 Estrutura de Pastas

```
src/
├── main.tsx                  # Entry point React DOM
├── styles/
│   ├── index.css             # Import master
│   ├── fonts.css             # Google Fonts (Inter + JetBrains Mono)
│   ├── tailwind.css          # Tailwind v4 config
│   └── theme.css             # Design tokens como CSS variables
└── app/
    ├── App.tsx               # RouterProvider wrapper (sem providers)
    ├── routes.tsx            # 11 rotas declaradas
    ├── pages/                # 9 páginas (sem lazy loading)
    │   ├── Landing.tsx
    │   ├── Dashboard.tsx
    │   ├── Modules.tsx
    │   ├── Training.tsx
    │   ├── TabuadaSetup.tsx
    │   ├── TabuadaTraining.tsx
    │   ├── TabuadaResult.tsx
    │   ├── History.tsx
    │   └── Pro.tsx
    ├── components/
    │   ├── ActionButton.tsx
    │   ├── BlueprintCard.tsx
    │   ├── InputField.tsx
    │   ├── Header.tsx
    │   ├── Footer.tsx
    │   ├── MobileNav.tsx
    │   ├── figma/ImageWithFallback.tsx
    │   └── ui/               # 60+ componentes Radix UI
    └── utils/
        └── tabuadaEngine.ts  # Motor de treino (258 linhas)
```

### 1.3 Componentização

**Componentes de Design System Próprios:**
- `ActionButton` — variantes `primary` | `ghost`, tipado, easing padronizado
- `BlueprintCard` — card com label e annotation, clicável
- `InputField` — input numérico com shake animation, forwardRef

**Padrões identificados:**
- Composição sobre herança
- Props tipadas via interface
- Refs encaminhadas para controle de foco
- Easing e durações padronizados via design system

**Não identificados:**
- HOCs
- Compound components
- Context consumers
- Custom hooks além de `use-mobile.ts`

### 1.4 Motor de Treino (`tabuadaEngine.ts`)

Módulo puro com as seguintes responsabilidades:

| Função | Entrada | Saída |
|--------|---------|-------|
| `generateProblems` | `TabuadaConfig` | `Problem[]` (10 questões) |
| `calculateMetrics` | acertos, total, tempos | `SessionMetrics` |
| `analyzeFeedback` | `SessionMetrics`, config | `{ status, message, recommendation }` |
| `getLevel` | `TabuadaConfig` | `1 \| 2 \| 3 \| 4` |

**Lógica adaptativa implementada:**
- Precisão ≥ 90% + variabilidade baixa → `stable`
- Precisão ≥ 90% + variabilidade alta → `consolidating`
- Precisão 70-89% → `consolidating`
- Precisão < 70% → `unstable`

Esta lógica é o núcleo do sistema adaptativo e deve ser espelhada no backend para persistência.

### 1.5 Fluxo de Dados Atual

```
TabuadaSetup → [location.state] → TabuadaTraining → [sessionStorage] → TabuadaResult
```

Todo o fluxo é efêmero. Dados desaparecem no refresh. Sem backend, sem persistência real.

---

## 2. AVALIAÇÃO ARQUITETURAL

### 2.1 Pontos Fortes

| Área | Avaliação | Justificativa |
|------|-----------|---------------|
| Design System | ★★★★★ | CSS tokens consistentes, easing padronizado, hierarquia tipográfica clara |
| Estética | ★★★★★ | Blueprint aesthetic totalmente fiel ao brand |
| TypeScript | ★★★★☆ | Cobertura quase total, tipos bem definidos no engine |
| Componentização | ★★★★☆ | Componentes base sólidos, reutilizáveis |
| Motor pedagógico | ★★★★☆ | Lógica adaptativa correta no cliente |
| Acessibilidade | ★★★☆☆ | Radix UI dá base, mas faltam aria-labels em pontos críticos |

### 2.2 Problemas Arquiteturais Identificados

#### CRÍTICO — Sem camada de estado global

```
App.tsx → RouterProvider (sem Context, sem Store, sem Provider de auth)
```

- `isLoggedIn` é um prop manual em `Header.tsx`, não um estado real
- Dados de dashboard são arrays hardcoded dentro do componente
- Sem distinção entre usuário autenticado e anônimo nas rotas

#### CRÍTICO — Sem rota protegida

```typescript
// routes.tsx atual
{ path: "/dashboard", Component: Dashboard }  // Público de fato
{ path: "/modules", Component: Modules }      // Público de fato
```

Qualquer usuário acessa qualquer rota. Controle Pro é apenas visual.

#### ALTO — Persistência via sessionStorage

```typescript
// TabuadaTraining.tsx
sessionStorage.setItem('tabuadaMetrics', JSON.stringify(metrics))
```

- Dados perdidos no refresh
- Sem histórico acumulado
- Sem base para sistema adaptativo real

#### ALTO — React Hook Form instalado mas não utilizado

```json
"react-hook-form": "7.55.0"
```

TabuadaSetup usa `useState` manual para gerenciar formulário de configuração. Inconsistência que sugere refatoração incompleta.

#### MÉDIO — Sem lazy loading de rotas

```typescript
// routes.tsx
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
// ... 9 imports síncronos
```

Todas as 9 páginas são carregadas no bundle inicial. Com crescimento de conteúdo (45+ aulas), isso escala mal.

#### MÉDIO — Lógica de negócio misturada em componentes de página

`TabuadaTraining.tsx` gerencia: geração de problemas, estado de sessão, timer, coleta de métricas, feedback, navegação. Um único componente com responsabilidades demais.

#### BAIXO — Dependências não utilizadas

MUI, react-dnd, react-responsive-masonry, react-slick, react-day-picker — instalados, não utilizados em nenhum componente ativo. Aumentam bundle size desnecessariamente.

### 2.3 Score de Prontidão para Produção

| Dimensão | Score | Detalhe |
|----------|-------|---------|
| UI/UX Design | 9/10 | Pronto para produção |
| Componentização | 7/10 | Bases sólidas, falta padronização |
| Tipagem | 7/10 | Bom, falta em mock data |
| Roteamento | 4/10 | Sem proteção, sem lazy |
| Estado | 2/10 | Apenas local, hardcoded |
| Persistência | 1/10 | sessionStorage temporário |
| Autenticação | 0/10 | Inexistente |
| Testes | 0/10 | Zero cobertura |
| **Total** | **3.8/10** | **Prototype-ready, não production-ready** |

---

## 3. PROPOSTA DE ARQUITETURA BACKEND (SUPABASE)

### 3.1 Justificativa da Escolha

Supabase foi escolhido como backend por:

- **PostgreSQL nativo**: permite queries analíticas complexas para métricas de performance
- **RLS (Row Level Security)**: segurança declarativa no banco, não no servidor
- **Auth integrado**: email/password, OAuth futuro, JWT automático
- **Realtime** (futuro): para dashboards ao vivo sem polling
- **Edge Functions**: lógica servidor-side sem infraestrutura adicional
- **SDK TypeScript**: integração limpa com a stack atual

### 3.2 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENTE (React)                       │
│                                                          │
│  ┌──────────┐  ┌───────────┐  ┌─────────────────────┐  │
│  │  Pages   │  │  Hooks    │  │     Services         │  │
│  │          │◄─│  useAuth  │◄─│  auth.service.ts     │  │
│  │Dashboard │  │  useUser  │  │  session.service.ts  │  │
│  │Training  │  │useSession │  │  metrics.service.ts  │  │
│  │History   │  │useMetrics │  │  user.service.ts     │  │
│  └──────────┘  └───────────┘  └──────────────────────┘  │
│                      │                  │                │
│               ┌──────┴──────────────────┘               │
│               │     Supabase Client                      │
│               │     lib/supabase.ts                      │
└───────────────┼─────────────────────────────────────────┘
                │  HTTPS / WebSocket
┌───────────────┼─────────────────────────────────────────┐
│               │        SUPABASE                          │
│  ┌────────────▼───────────────────────────────────────┐ │
│  │              Auth (JWT)                             │ │
│  │  email/password → JWT → refresh automático         │ │
│  └───────────────────────────┬─────────────────────── ┘ │
│                              │ RLS enforced              │
│  ┌───────────────────────────▼─────────────────────── ┐ │
│  │              PostgreSQL Database                    │ │
│  │                                                    │ │
│  │  profiles   sessions   metrics_daily   concepts    │ │
│  │  plans      problems   streak          unlocks     │ │
│  └───────────────────────────┬─────────────────────── ┘ │
│                              │                           │
│  ┌───────────────────────────▼─────────────────────── ┐ │
│  │              Edge Functions                         │ │
│  │  /aggregate-metrics  /adaptive-engine              │ │
│  │  /check-plan         /generate-report              │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 3.3 Estrutura de Roles

```
Role: anon
  - Acesso: tabela de planos (read-only), landing page
  - JWT: não autenticado

Role: authenticated
  - Acesso: próprios dados via RLS
  - Subtipos por plan_type:
    ├── free: acesso ao núcleo (15 conceitos, 45 aulas)
    └── pro:  acesso completo (24 conceitos, 72 aulas)

Role: service_role (Edge Functions apenas)
  - Bypass de RLS
  - Usado internamente para agregações
```

---

## 4. MODELAGEM DE BANCO DE DADOS

### 4.1 Diagrama de Entidades

```
auth.users (Supabase Auth)
    │
    │ 1:1
    ▼
profiles ──────────────────── plan_subscriptions
    │                                │
    │ 1:N                            │ 1:1
    ▼                                ▼
training_sessions ─────── plans (free | pro)
    │
    │ 1:N
    ├──► session_problems
    │
    │ 1:1 (agregado)
    ▼
daily_metrics
    │
    └── (agrega de training_sessions)

concept_progress ◄─── profiles (1:N)
module_unlocks   ◄─── profiles (1:N)
streaks          ◄─── profiles (1:1)
```

### 4.2 Schemas Completos

#### Tabela: `profiles`
```sql
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  display_name  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Estado do plano
  plan_type     TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'pro')),
  plan_expires_at TIMESTAMPTZ,

  -- Preferências de treino
  preferred_session_length INTEGER DEFAULT 10,  -- número de problemas
  onboarding_completed BOOLEAN DEFAULT FALSE,

  -- Metadados adaptativos agregados
  global_precision      NUMERIC(5,2),  -- média rolling 30d
  global_avg_time       NUMERIC(8,3),  -- segundos
  global_variability    NUMERIC(8,3),  -- desvio padrão rolling
  adaptive_level        INTEGER DEFAULT 1 CHECK (adaptive_level BETWEEN 1 AND 4),

  CONSTRAINT profiles_plan_check CHECK (
    (plan_type = 'pro' AND plan_expires_at IS NOT NULL)
    OR plan_type = 'free'
  )
);

-- Trigger para criar profile automaticamente no signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Índices
CREATE INDEX idx_profiles_plan_type ON profiles(plan_type);
CREATE INDEX idx_profiles_updated_at ON profiles(updated_at);
```

#### Tabela: `training_sessions`
```sql
CREATE TABLE training_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Configuração da sessão
  operation       TEXT NOT NULL CHECK (operation IN ('multiplication', 'division', 'addition', 'subtraction')),
  base_number     INTEGER NOT NULL CHECK (base_number BETWEEN 2 AND 11),
  mode            TEXT NOT NULL CHECK (mode IN ('sequential', 'random')),
  timer_mode      TEXT NOT NULL CHECK (timer_mode IN ('timed', 'untimed')),
  level           INTEGER NOT NULL CHECK (level BETWEEN 1 AND 4),

  -- Identificação pedagógica
  concept_id      INTEGER,  -- 1-15 núcleo, 16-24 Pro
  lesson_number   INTEGER CHECK (lesson_number BETWEEN 1 AND 3),
  module_phase    TEXT CHECK (module_phase IN ('warmup', 'technique', 'guided', 'consolidation', 'compression', 'synthesis')),

  -- Métricas brutas da sessão
  total_problems  INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  total_time_ms   INTEGER NOT NULL,  -- milissegundos totais

  -- Métricas calculadas (armazenadas para evitar recálculo)
  precision_pct   NUMERIC(5,2) NOT NULL,  -- 0.00 a 100.00
  avg_time_ms     NUMERIC(10,3) NOT NULL,
  time_variability NUMERIC(10,3) NOT NULL,  -- desvio padrão em ms

  -- Status adaptativo resultante
  session_status  TEXT NOT NULL CHECK (session_status IN ('stable', 'consolidating', 'unstable')),
  recommendation  TEXT,

  -- Timestamps
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadados
  session_aborted BOOLEAN DEFAULT FALSE,
  device_type     TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop'))
);

-- Índices para queries analíticas
CREATE INDEX idx_sessions_user_id ON training_sessions(user_id);
CREATE INDEX idx_sessions_user_date ON training_sessions(user_id, completed_at DESC);
CREATE INDEX idx_sessions_concept ON training_sessions(user_id, concept_id);
CREATE INDEX idx_sessions_operation ON training_sessions(user_id, operation);
CREATE INDEX idx_sessions_status ON training_sessions(user_id, session_status);
```

#### Tabela: `session_problems`
```sql
CREATE TABLE session_problems (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Problema
  problem_index   INTEGER NOT NULL,  -- posição na sessão (0-based)
  operand1        INTEGER NOT NULL,
  operand2        INTEGER NOT NULL,
  operation       TEXT NOT NULL,
  correct_answer  INTEGER NOT NULL,
  user_answer     INTEGER,

  -- Resultado
  is_correct      BOOLEAN NOT NULL,
  time_ms         INTEGER NOT NULL,  -- tempo de resposta em ms

  answered_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_problems_session ON session_problems(session_id);
CREATE INDEX idx_problems_user ON session_problems(user_id);
CREATE INDEX idx_problems_correct ON session_problems(session_id, is_correct);
```

#### Tabela: `concept_progress`
```sql
CREATE TABLE concept_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  concept_id      INTEGER NOT NULL CHECK (concept_id BETWEEN 1 AND 24),

  -- Estado do conceito
  status          TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'available', 'in_progress', 'completed', 'mastered')),

  -- Progresso por aula (3 aulas por conceito)
  lesson_1_status TEXT DEFAULT 'locked' CHECK (lesson_1_status IN ('locked', 'available', 'completed')),
  lesson_2_status TEXT DEFAULT 'locked' CHECK (lesson_2_status IN ('locked', 'available', 'completed')),
  lesson_3_status TEXT DEFAULT 'locked' CHECK (lesson_3_status IN ('locked', 'available', 'completed')),

  -- Métricas acumuladas do conceito
  total_sessions  INTEGER DEFAULT 0,
  best_precision  NUMERIC(5,2),
  last_precision  NUMERIC(5,2),
  avg_precision   NUMERIC(5,2),

  -- Timestamps
  first_attempted_at  TIMESTAMPTZ,
  last_attempted_at   TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,

  -- Constraints
  UNIQUE(user_id, concept_id)
);

-- Índices
CREATE INDEX idx_concept_progress_user ON concept_progress(user_id);
CREATE INDEX idx_concept_progress_status ON concept_progress(user_id, status);
```

#### Tabela: `daily_metrics`
```sql
CREATE TABLE daily_metrics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date            DATE NOT NULL,

  -- Métricas agregadas do dia
  sessions_count  INTEGER DEFAULT 0,
  problems_total  INTEGER DEFAULT 0,
  problems_correct INTEGER DEFAULT 0,
  total_time_ms   BIGINT DEFAULT 0,

  -- Métricas calculadas
  precision_pct   NUMERIC(5,2),
  avg_time_ms     NUMERIC(10,3),
  time_variability NUMERIC(10,3),

  -- Pilares Numetria
  stability_score   NUMERIC(5,2),   -- calculado: 1 - (variabilidade/avg_time)
  automation_score  NUMERIC(5,2),   -- calculado: consistência entre sessões
  velocity_score    NUMERIC(5,2),   -- calculado: normalizado do avg_time
  precision_score   NUMERIC(5,2),   -- = precision_pct

  -- Status do dia
  day_status      TEXT CHECK (day_status IN ('no_data', 'unstable', 'consolidating', 'stable')),

  -- Controle
  computed_at     TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date)
);

-- Índices
CREATE INDEX idx_daily_metrics_user ON daily_metrics(user_id);
CREATE INDEX idx_daily_metrics_user_date ON daily_metrics(user_id, date DESC);
CREATE INDEX idx_daily_metrics_date ON daily_metrics(date);
```

#### Tabela: `streaks`
```sql
CREATE TABLE streaks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  last_training_date  DATE,
  streak_started_at   DATE,

  updated_at          TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);
```

#### Tabela: `plan_subscriptions`
```sql
CREATE TABLE plan_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_type       TEXT NOT NULL CHECK (plan_type IN ('free', 'pro')),

  -- Controle de billing (futuro — Stripe)
  stripe_customer_id        TEXT,
  stripe_subscription_id    TEXT,

  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT TRUE,

  UNIQUE(user_id, stripe_subscription_id)
);

CREATE INDEX idx_subscriptions_user ON plan_subscriptions(user_id);
CREATE INDEX idx_subscriptions_active ON plan_subscriptions(user_id, is_active);
```

### 4.3 Estratégia de Agregação

**Regra geral:** Métricas calculadas são **armazenadas**, não recalculadas a cada query.

| Dados | Estratégia | Frequência |
|-------|-----------|------------|
| Métricas brutas da sessão | Calculado no cliente, armazenado ao finalizar | Por sessão |
| `daily_metrics` | Edge Function agrega ao final do dia | 1x/dia (cron) |
| `concept_progress` | Atualizado ao finalizar cada sessão | Por sessão |
| `profiles.global_*` | Recalculado como rolling 30d | 1x/dia ou por sessão |
| Dados de gráfico 30d | Query direta em `daily_metrics` | On-demand |
| Score adaptativo | Edge Function analisa padrão | Por sessão |

**Por quê armazenar e não calcular on-demand?**
- Histórico de 30 dias com múltiplas sessões/dia = dezenas de aggregations por query
- Métricas de dashboard devem responder em < 200ms
- Dados históricos não mudam retroativamente

---

## 5. ESTRUTURA DE API E RPC

### 5.1 Operações via SDK Direto (sem RPC)

```typescript
// Padrão: Supabase client direto para CRUD simples

// Buscar sessões recentes
supabase
  .from('training_sessions')
  .select('*')
  .eq('user_id', userId)
  .order('completed_at', { ascending: false })
  .limit(10)

// Inserir sessão completa
supabase
  .from('training_sessions')
  .insert(sessionPayload)

// Buscar métricas dos últimos 30 dias
supabase
  .from('daily_metrics')
  .select('date, precision_pct, avg_time_ms, stability_score')
  .eq('user_id', userId)
  .gte('date', thirtyDaysAgo)
  .order('date', { ascending: true })
```

### 5.2 Funções RPC (PostgreSQL Functions)

#### `get_user_dashboard(user_id UUID)`
Retorna todos os dados do dashboard em uma única chamada:

```sql
CREATE OR REPLACE FUNCTION get_user_dashboard(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'profile', (
      SELECT row_to_json(p)
      FROM profiles p WHERE p.id = p_user_id
    ),
    'streak', (
      SELECT row_to_json(s)
      FROM streaks s WHERE s.user_id = p_user_id
    ),
    'last_30_days', (
      SELECT json_agg(dm ORDER BY dm.date ASC)
      FROM daily_metrics dm
      WHERE dm.user_id = p_user_id
        AND dm.date >= CURRENT_DATE - INTERVAL '30 days'
    ),
    'concept_summary', (
      SELECT json_agg(cp)
      FROM concept_progress cp
      WHERE cp.user_id = p_user_id
    ),
    'recent_sessions', (
      SELECT json_agg(ts ORDER BY ts.completed_at DESC)
      FROM training_sessions ts
      WHERE ts.user_id = p_user_id
      LIMIT 5
    )
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### `complete_session(session_data JSON)`
Processa finalização de sessão atomicamente:

```sql
CREATE OR REPLACE FUNCTION complete_session(session_data JSON)
RETURNS JSON AS $$
DECLARE
  v_session_id UUID;
  v_user_id UUID;
  v_new_status TEXT;
BEGIN
  -- 1. Inserir sessão
  INSERT INTO training_sessions (...) VALUES (...) RETURNING id INTO v_session_id;

  -- 2. Inserir problemas individuais
  INSERT INTO session_problems (...) SELECT ...;

  -- 3. Atualizar concept_progress
  -- 4. Atualizar ou inserir daily_metrics (UPSERT)
  -- 5. Verificar e atualizar streak
  -- 6. Calcular novo adaptive_level no profile
  -- 7. Desbloquear próximo conceito se aplicável

  RETURN json_build_object('session_id', v_session_id, 'status', v_new_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### `get_adaptive_recommendation(user_id UUID, concept_id INTEGER)`
Analisa histórico e retorna configuração recomendada:

```sql
CREATE OR REPLACE FUNCTION get_adaptive_recommendation(
  p_user_id UUID,
  p_concept_id INTEGER
)
RETURNS JSON AS $$
-- Analisa últimas N sessões do conceito
-- Aplica lógica: precisão, variabilidade, trend
-- Retorna { level, mode, timer_mode, reason }
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5.3 Edge Functions

```
supabase/functions/
├── aggregate-daily-metrics/    # Cron: agrega métricas diárias (meia-noite)
│   └── index.ts
├── check-plan-access/          # Valida acesso Pro a conceitos
│   └── index.ts
└── generate-performance-report/ # Relatório semanal (Pro)
    └── index.ts
```

---

## 6. ESTRATÉGIA DE SEGURANÇA (RLS)

### 6.1 Princípio Geral

**"Cada usuário vê e modifica apenas seus próprios dados."**

Toda tabela tem RLS habilitado. Não há dados públicos além de metadados de planos.

### 6.2 Policies por Tabela

```sql
-- ═══════════════════════════════════
-- PROFILES
-- ═══════════════════════════════════
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Profiles são criados via trigger SECURITY DEFINER (sem policy de INSERT para user)


-- ═══════════════════════════════════
-- TRAINING_SESSIONS
-- ═══════════════════════════════════
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON training_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON training_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE e DELETE bloqueados: sessões são imutáveis após criação


-- ═══════════════════════════════════
-- SESSION_PROBLEMS
-- ═══════════════════════════════════
ALTER TABLE session_problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own problems"
  ON session_problems FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own problems"
  ON session_problems FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ═══════════════════════════════════
-- CONCEPT_PROGRESS
-- ═══════════════════════════════════
ALTER TABLE concept_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON concept_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can modify own progress"
  ON concept_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ═══════════════════════════════════
-- DAILY_METRICS
-- ═══════════════════════════════════
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own metrics"
  ON daily_metrics FOR SELECT
  USING (auth.uid() = user_id);

-- Apenas service_role pode escrever (via Edge Function de agregação)


-- ═══════════════════════════════════
-- PLAN_SUBSCRIPTIONS
-- ═══════════════════════════════════
ALTER TABLE plan_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON plan_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Escrita apenas via service_role (webhook do Stripe no futuro)
```

### 6.3 Validação de Acesso Pro

```sql
-- Função helper reutilizável
CREATE OR REPLACE FUNCTION is_pro_user(p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_user_id
      AND plan_type = 'pro'
      AND (plan_expires_at IS NULL OR plan_expires_at > NOW())
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Uso na policy de conceitos avançados:
CREATE POLICY "Pro concepts only for pro users"
  ON concept_progress FOR SELECT
  USING (
    auth.uid() = user_id
    AND (concept_id <= 15 OR is_pro_user(auth.uid()))
  );
```

---

## 7. INTEGRAÇÃO FRONTEND ↔ SUPABASE

### 7.1 Estrutura de Camadas Proposta

```
src/
├── lib/
│   └── supabase.ts              # Cliente Supabase singleton
├── services/
│   ├── auth.service.ts          # Login, logout, signup, reset
│   ├── session.service.ts       # Criar e finalizar sessões de treino
│   ├── metrics.service.ts       # Buscar métricas e histórico
│   ├── user.service.ts          # Profile, plano, progresso
│   └── adaptive.service.ts     # Recomendações adaptativas
├── hooks/
│   ├── useAuth.ts               # Estado de autenticação global
│   ├── useProfile.ts            # Dados do usuário autenticado
│   ├── useSession.ts            # Sessão de treino em andamento
│   ├── useMetrics.ts            # Dashboard e histórico
│   ├── useConceptProgress.ts   # Progresso por conceito/módulo
│   └── useAdaptive.ts           # Recomendações do motor adaptativo
├── contexts/
│   ├── AuthContext.tsx           # Provider global de autenticação
│   └── UserContext.tsx           # Profile e plano do usuário
└── types/
    ├── database.ts              # Tipos gerados pelo Supabase CLI
    ├── training.ts              # Tipos de sessão e configuração
    └── metrics.ts               # Tipos de métricas
```

### 7.2 Inicialização do Client

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables not configured')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
```

### 7.3 Services (contratos)

```typescript
// src/services/auth.service.ts
export const authService = {
  signUp: (email: string, password: string) => Promise<AuthResult>,
  signIn: (email: string, password: string) => Promise<AuthResult>,
  signOut: () => Promise<void>,
  resetPassword: (email: string) => Promise<void>,
  getSession: () => Promise<Session | null>,
}

// src/services/session.service.ts
export const sessionService = {
  createSession: (config: TabuadaConfig) => Promise<{ id: string }>,
  recordProblem: (sessionId: string, problem: ProblemResult) => Promise<void>,
  completeSession: (sessionId: string, metrics: SessionMetrics) => Promise<AdaptiveResult>,
  abortSession: (sessionId: string) => Promise<void>,
}

// src/services/metrics.service.ts
export const metricsService = {
  getDashboardData: () => Promise<DashboardData>,
  getLast30Days: () => Promise<DailyMetric[]>,
  getConceptHistory: (conceptId: number) => Promise<SessionMetrics[]>,
  getRecentSessions: (limit?: number) => Promise<TrainingSession[]>,
}

// src/services/user.service.ts
export const userService = {
  getProfile: () => Promise<Profile>,
  updateProfile: (data: Partial<Profile>) => Promise<Profile>,
  getConceptProgress: () => Promise<ConceptProgress[]>,
  getPlanStatus: () => Promise<PlanStatus>,
}
```

### 7.4 Hooks Personalizados

```typescript
// src/hooks/useAuth.ts
// Estado global de autenticação
// - user: User | null
// - session: Session | null
// - loading: boolean
// - signIn / signOut / signUp
// Escuta onAuthStateChange do Supabase

// src/hooks/useSession.ts
// Gerencia ciclo de vida da sessão de treino
// - startSession(config)
// - recordAnswer(problem, answer, timeMs)
// - finishSession()
// - sessionState: 'idle' | 'active' | 'completing' | 'done'
// - currentMetrics: SessionMetrics

// src/hooks/useMetrics.ts
// Cache de métricas com SWR-like pattern
// - dashboardData, loading, error
// - refetch()
// - invalidate() após nova sessão

// src/hooks/useConceptProgress.ts
// Lista de conceitos com status de desbloqueio
// - Determina se conceito é free ou pro
// - Verifica plano do usuário antes de exibir bloqueado
```

### 7.5 Estratégia de Cache

| Dados | Estratégia | TTL |
|-------|-----------|-----|
| Profile + Plano | React state no Context | Sessão (refresh no login) |
| Dashboard data | useState + fetch na montagem | 5 min (refetch manual) |
| Histórico 30d | useState + fetch lazy | 5 min |
| Concept progress | useState + invalidate pós-sessão | Invalidado manualmente |
| Sessão ativa | Estado local em `useSession` | Duração da sessão |

> Nota: A Fase 4 pode adotar TanStack Query para cache mais robusto. Por ora, padrão manual é suficiente e mantém dependências enxutas.

### 7.6 Fluxo de uma Sessão de Treino

```
1. Usuário configura → TabuadaSetup
2. Frontend chama sessionService.createSession(config)
   → Cria registro em training_sessions com status pendente
   → Retorna session_id

3. TabuadaTraining usa session_id para:
   → sessionService.recordProblem() por questão (opcional — pode ser batch)
   → Coleta métricas localmente via tabuadaEngine

4. Ao finalizar:
   → sessionService.completeSession(session_id, metrics)
   → RPC complete_session() executa atomicamente:
      - Finaliza training_sessions
      - Insere session_problems em batch
      - Atualiza concept_progress
      - Upsert daily_metrics
      - Atualiza streak
      - Recalcula adaptive_level

5. TabuadaResult exibe retorno da RPC
   → Status, recomendação, próximo passo
   → Invalida cache de métricas no hook
```

---

## 8. AJUSTES NECESSÁRIOS NO FRONTEND

### 8.1 Estrutura de Rotas (Protegidas)

```typescript
// routes.tsx — após integração
const router = createBrowserRouter([
  // Públicas
  { path: '/', Component: Landing },
  { path: '/login', Component: Login },
  { path: '/signup', Component: Signup },

  // Protegidas (requerem autenticação)
  {
    path: '/',
    Component: ProtectedLayout,  // verifica auth, redireciona para /login
    children: [
      { path: 'dashboard', Component: Dashboard },
      { path: 'modules', Component: Modules },
      { path: 'modules/:moduleId', Component: Modules },
      { path: 'history', Component: History },

      // Sub-rotas de treino
      { path: 'tabuada/setup', Component: TabuadaSetup },
      { path: 'tabuada/training', Component: TabuadaTraining },
      { path: 'tabuada/result', Component: TabuadaResult },
    ]
  },

  // Protegidas Pro
  {
    path: '/',
    Component: ProLayout,  // verifica plan_type = 'pro'
    children: [
      { path: 'training/:conceptId/:lesson', Component: Training },
    ]
  },

  { path: '/pro', Component: Pro },
  { path: '*', Component: Landing },
])
```

### 8.2 Providers no App.tsx

```typescript
// App.tsx — após integração
export default function App() {
  return (
    <AuthProvider>           {/* useAuth, onAuthStateChange */}
      <UserProvider>          {/* profile, plan, conceptProgress */}
        <RouterProvider router={router} />
      </UserProvider>
    </AuthProvider>
  )
}
```

### 8.3 Páginas a Criar

| Página | Rota | Prioridade |
|--------|------|------------|
| `Login.tsx` | `/login` | Fase 1 |
| `Signup.tsx` | `/signup` | Fase 1 |
| `ForgotPassword.tsx` | `/recuperar-senha` | Fase 1 |
| `ProtectedLayout.tsx` | wrapper | Fase 1 |
| `ProLayout.tsx` | wrapper Pro | Fase 5 |

### 8.4 Refatorações Necessárias

| Componente | Problema Atual | Solução |
|-----------|---------------|---------|
| `Dashboard.tsx` | Mock data hardcoded | Conectar `useMetrics()` |
| `History.tsx` | Mock data hardcoded | Conectar `useMetrics().getLast30Days()` |
| `Modules.tsx` | Mock data hardcoded | Conectar `useConceptProgress()` |
| `Training.tsx` | 10 problemas hardcoded de multiplicação | Conectar `tabuadaEngine` com config real |
| `TabuadaTraining.tsx` | `sessionStorage` temporário | Conectar `useSession()` |
| `TabuadaResult.tsx` | Lê `sessionStorage` | Lê retorno da RPC |
| `Header.tsx` | `isLoggedIn` como prop manual | Lê `useAuth().user` |

### 8.5 Melhorias Estruturais Recomendadas

#### Lazy Loading de Rotas
```typescript
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Modules = lazy(() => import('./pages/Modules'))
// ... todas as páginas

// No router:
{ path: 'dashboard', Component: Dashboard }
// Envolver em <Suspense fallback={<PageSkeleton />}>
```

#### Separar lógica de Training em camadas
```
TabuadaTraining.tsx (view) ← useSession hook (state) ← sessionService (data)
```

#### Mover tipos para `src/types/`
```typescript
// types/training.ts
export type { TabuadaConfig, Problem, SessionMetrics }
// (atualmente em tabuadaEngine.ts — dificulta importação parcial)
```

#### Remover dependências não utilizadas
```bash
pnpm remove @mui/material @mui/icons-material react-dnd react-dnd-html5-backend
             react-responsive-masonry react-slick react-day-picker @emotion/react @emotion/styled
```

---

## 9. PLANO DE IMPLEMENTAÇÃO POR FASES

### Convenções do Plano

- **Complexidade**: S (horas) / M (1-2 dias) / L (3-5 dias) / XL (1+ semana)
- **Dependências**: indicadas com `bloqueado por`
- **Entregável**: o que estará funcional ao final de cada fase

---

### FASE 1 — Estrutura Base e Autenticação
**Objetivo**: Usuário pode criar conta, fazer login e ter sessão persistida.
**Duração estimada**: M-L

| # | Tarefa | Complexidade | Detalhe |
|---|--------|-------------|---------|
| 1.1 | Setup Supabase projeto | S | Criar projeto, salvar URL e anon key |
| 1.2 | Criar `.env` e `lib/supabase.ts` | S | Cliente tipado com variáveis de ambiente |
| 1.3 | Executar migrations das tabelas | M | `profiles`, `plan_subscriptions`, `streaks` (schema base) |
| 1.4 | Implementar trigger `handle_new_user` | S | Auto-create profile no signup |
| 1.5 | Criar `auth.service.ts` | S | signUp, signIn, signOut, getSession |
| 1.6 | Criar `AuthContext.tsx` + `useAuth` | M | onAuthStateChange, estado global |
| 1.7 | Criar `Login.tsx` e `Signup.tsx` | M | Form com validação (usar react-hook-form que já está instalado) |
| 1.8 | Criar `ProtectedLayout.tsx` | S | Redirect para /login se não autenticado |
| 1.9 | Atualizar `routes.tsx` | S | Rotas públicas vs protegidas |
| 1.10 | Atualizar `Header.tsx` | S | Ler `useAuth().user` ao invés de prop `isLoggedIn` |
| 1.11 | Configurar RLS de `profiles` | S | Policies de SELECT e UPDATE |

**Entregável Fase 1**: Fluxo completo de autenticação funcional. Usuário logado vê dashboard (ainda com dados mock). Usuário não logado é redirecionado.

---

### FASE 2 — Persistência de Sessões de Treino
**Objetivo**: Sessões de treino são gravadas no banco e persistem entre acessos.
**Duração estimada**: L
**Bloqueado por**: Fase 1

| # | Tarefa | Complexidade | Detalhe |
|---|--------|-------------|---------|
| 2.1 | Migration `training_sessions` + `session_problems` | M | Schema + índices + RLS |
| 2.2 | Criar `session.service.ts` | M | createSession, recordProblem (batch), completeSession |
| 2.3 | Criar RPC `complete_session` | M | Inserção atômica + atualização streak |
| 2.4 | Criar `useSession` hook | M | Ciclo de vida completo da sessão |
| 2.5 | Refatorar `TabuadaTraining.tsx` | M | Usar `useSession` ao invés de estado local + sessionStorage |
| 2.6 | Refatorar `TabuadaResult.tsx` | S | Ler retorno da RPC ao invés de sessionStorage |
| 2.7 | Criar `concept_progress` migration | S | Schema + RLS |
| 2.8 | Integrar concept_progress na RPC | S | Atualizar status de conceito ao finalizar sessão |
| 2.9 | Criar `user.service.ts` | S | getProfile, getConceptProgress |
| 2.10 | Criar `useConceptProgress` hook | S | Lista com status de desbloqueio |
| 2.11 | Refatorar `Modules.tsx` | M | Ler progress real do banco |

**Entregável Fase 2**: Sessões gravadas no Supabase. Módulos mostram progresso real. Histórico começa a acumular.

---

### FASE 3 — Métricas Agregadas e Dashboard
**Objetivo**: Dashboard e histórico mostram dados reais com métricas calculadas.
**Duração estimada**: L
**Bloqueado por**: Fase 2

| # | Tarefa | Complexidade | Detalhe |
|---|--------|-------------|---------|
| 3.1 | Migration `daily_metrics` | S | Schema + RLS + índices |
| 3.2 | Atualizar RPC `complete_session` | M | Incluir upsert de daily_metrics |
| 3.3 | Criar Edge Function `aggregate-daily-metrics` | M | Cron job noturno para consolidar métricas |
| 3.4 | Criar RPC `get_user_dashboard` | M | Query única para todos os dados do dashboard |
| 3.5 | Criar `metrics.service.ts` | S | getDashboardData, getLast30Days, getRecentSessions |
| 3.6 | Criar `useMetrics` hook | M | Cache local + invalidação |
| 3.7 | Refatorar `Dashboard.tsx` | M | Substituir mock data por `useMetrics()` |
| 3.8 | Refatorar `History.tsx` | M | Substituir mock data por métricas reais 30d |
| 3.9 | Implementar cálculo dos 4 pilares | M | Stability, Automation, Velocity, Precision scores |
| 3.10 | Loading states e skeleton screens | S | Estados de carregamento nas páginas |
| 3.11 | Error states | S | Tratamento de falhas de rede |

**Entregável Fase 3**: Dashboard 100% com dados reais. Histórico acumulando. 4 pilares Numetria calculados e exibidos.

---

### FASE 4 — Sistema Adaptativo
**Objetivo**: Motor pedagógico analisa padrão do usuário e adapta recomendações.
**Duração estimada**: XL
**Bloqueado por**: Fase 3 (precisa de histórico acumulado)

| # | Tarefa | Complexidade | Detalhe |
|---|--------|-------------|---------|
| 4.1 | Criar RPC `get_adaptive_recommendation` | L | Analisa últimas N sessões + trend + variabilidade |
| 4.2 | Implementar lógica de desbloqueio de conceitos | M | Regras: precisão ≥ 80% por 2 sessões consecutivas |
| 4.3 | Criar `adaptive.service.ts` | S | getRecommendation, checkConceptUnlock |
| 4.4 | Criar `useAdaptive` hook | M | Consome recomendações e expõe para UI |
| 4.5 | Integrar em `TabuadaSetup.tsx` | M | Mostrar configuração recomendada com explicação |
| 4.6 | Integrar em `TabuadaResult.tsx` | M | Mostrar próximo passo adaptativo |
| 4.7 | Implementar desbloqueio progressivo de aulas | M | Lesson 2 só após Lesson 1 completa com status ≥ consolidating |
| 4.8 | Atualizar `Modules.tsx` com estados reais | M | Locked/available/in_progress/completed/mastered |
| 4.9 | Adicionar campo `adaptive_level` ao profile | S | Recalculado com regras do motor |
| 4.10 | Refinar thresholds adaptativos | M | Testar com dados reais, ajustar precisão/variabilidade |
| 4.11 | Criar sistema de reforço estrutural | L | Se unstable: sugere revisão do conceito anterior |

**Entregável Fase 4**: Motor adaptativo funcional. Sistema sugere próximo treino com base em histórico real. Conceitos desbloqueiam progressivamente.

---

### FASE 5 — Plano Pro e Controle de Acesso
**Objetivo**: Diferenciação funcional entre Free e Pro com paywall real.
**Duração estimada**: L-XL
**Bloqueado por**: Fase 2 (requer plan_subscriptions)

| # | Tarefa | Complexidade | Detalhe |
|---|--------|-------------|---------|
| 5.1 | Criar `ProLayout.tsx` | S | Verifica plan_type e redireciona |
| 5.2 | Implementar função `is_pro_user()` no banco | S | Helper reutilizável em RLS |
| 5.3 | Aplicar RLS em conceitos 16-24 | M | Apenas pro users acessam |
| 5.4 | Criar flow de upgrade na `Pro.tsx` | M | Botão de upgrade com integração básica |
| 5.5 | Integrar Stripe (fase inicial) | XL | Customer, Subscription, Webhook |
| 5.6 | Criar Edge Function `check-plan-access` | M | Validação server-side do acesso |
| 5.7 | Webhook Stripe → atualizar `plan_subscriptions` | L | Processamento seguro de eventos |
| 5.8 | Criar Edge Function `generate-performance-report` | L | Relatório semanal Pro |
| 5.9 | Atualizar Dashboard Pro com métricas avançadas | M | Exibir Automação e Clareza scores |
| 5.10 | UI de downgrade/cancelamento | M | Gestão de plano pelo usuário |
| 5.11 | Emails transacionais | M | Boas-vindas, confirmação Pro, expiração |

**Entregável Fase 5**: Produto freemium completo. Free e Pro funcionam com features diferenciadas. Pagamento real processado.

---

## RESUMO EXECUTIVO

### Stack Final

```
Frontend:    React 18 + TypeScript + Vite + Tailwind v4 + Framer Motion
Backend:     Supabase (PostgreSQL + Auth + Edge Functions)
Estado:      React Context (auth) + React state + hooks customizados
Cache:       Manual por hora (TanStack Query em Fase 4+ se necessário)
Pagamento:   Stripe (Fase 5)
```

### Princípios de Implementação

1. **Dados no banco, lógica no cliente** — motor pedagógico permanece no frontend, mas resultados são persistidos
2. **Métricas calculadas são armazenadas** — performance do dashboard priorizada
3. **RLS é a primeira linha de defesa** — backend nunca confia no cliente
4. **Sessões são imutáveis** — dados históricos não são editáveis, apenas o adaptativo usa
5. **Sem over-engineering** — Context API é suficiente; Zustand/Redux apenas se a complexidade demandar
6. **Atomicidade via RPC** — finalização de sessão em transaction única previne estados inconsistentes

### Prioridade de Impacto por Fase

| Fase | Impacto Produto | Risco Técnico | Desbloqueio de Valor |
|------|----------------|---------------|---------------------|
| 1 — Auth | Alto | Baixo | Identidade do usuário |
| 2 — Sessões | Alto | Médio | Primeiro dado real |
| 3 — Métricas | Alto | Médio | Dashboard vivo |
| 4 — Adaptativo | Muito Alto | Alto | Diferencial do produto |
| 5 — Pro | Muito Alto | Alto | Monetização |

---

*Documento gerado como artefato técnico de referência para a equipe de engenharia da Numetria.*
*Revisão recomendada antes do início de cada fase.*

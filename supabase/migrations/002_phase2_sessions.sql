-- ============================================================
-- NUMETRIA — FASE 2: Sessões, Problemas e Progresso de Conceitos
-- Execute este SQL no Supabase SQL Editor:
-- Dashboard → SQL Editor → New query → Cole e execute
-- ============================================================


-- ═══════════════════════════════════════════════════════════
-- TABELA: training_sessions
-- Registra cada sessão de treino completa
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS training_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Configuração da sessão
  operation       TEXT NOT NULL CHECK (operation IN ('multiplication', 'division', 'addition', 'subtraction')),
  base_number     INTEGER NOT NULL CHECK (base_number BETWEEN 2 AND 11),
  mode            TEXT NOT NULL CHECK (mode IN ('sequential', 'random')),
  timer_mode      TEXT NOT NULL CHECK (timer_mode IN ('timed', 'untimed')),
  level           INTEGER NOT NULL CHECK (level BETWEEN 1 AND 4),

  -- Identificação pedagógica (NULL na tabuada livre)
  concept_id      INTEGER CHECK (concept_id BETWEEN 1 AND 24),
  lesson_number   INTEGER CHECK (lesson_number BETWEEN 1 AND 3),

  -- Métricas brutas
  total_problems  INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  total_time_ms   INTEGER NOT NULL,

  -- Métricas calculadas (armazenadas para evitar recálculo)
  precision_pct   NUMERIC(5,2) NOT NULL,
  avg_time_ms     NUMERIC(10,3) NOT NULL,
  time_variability NUMERIC(10,3) NOT NULL,

  -- Status adaptativo resultante
  session_status  TEXT NOT NULL CHECK (session_status IN ('stable', 'consolidating', 'unstable')),
  recommendation  TEXT,

  -- Timestamps
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadados
  session_aborted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id   ON training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON training_sessions(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_concept   ON training_sessions(user_id, concept_id);
CREATE INDEX IF NOT EXISTS idx_sessions_operation ON training_sessions(user_id, operation);
CREATE INDEX IF NOT EXISTS idx_sessions_status    ON training_sessions(user_id, session_status);


-- ═══════════════════════════════════════════════════════════
-- TABELA: session_problems
-- Registra cada tentativa individual (inclui re-tentativas)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS session_problems (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  problem_index   INTEGER NOT NULL,   -- índice sequencial da tentativa (0-based)
  operand1        INTEGER NOT NULL,
  operand2        INTEGER NOT NULL,
  operation       TEXT NOT NULL,
  correct_answer  INTEGER NOT NULL,
  user_answer     INTEGER,

  is_correct      BOOLEAN NOT NULL,
  time_ms         INTEGER NOT NULL,

  answered_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_problems_session ON session_problems(session_id);
CREATE INDEX IF NOT EXISTS idx_problems_user    ON session_problems(user_id);


-- ═══════════════════════════════════════════════════════════
-- TABELA: concept_progress
-- Progresso acumulado por conceito pedagógico (1-24)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS concept_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  concept_id      INTEGER NOT NULL CHECK (concept_id BETWEEN 1 AND 24),

  -- Status geral do conceito
  status          TEXT NOT NULL DEFAULT 'locked'
                  CHECK (status IN ('locked', 'available', 'in_progress', 'completed', 'mastered')),

  -- Status por aula (3 aulas por conceito)
  lesson_1_status TEXT DEFAULT 'locked' CHECK (lesson_1_status IN ('locked', 'available', 'completed')),
  lesson_2_status TEXT DEFAULT 'locked' CHECK (lesson_2_status IN ('locked', 'available', 'completed')),
  lesson_3_status TEXT DEFAULT 'locked' CHECK (lesson_3_status IN ('locked', 'available', 'completed')),

  -- Métricas acumuladas
  total_sessions  INTEGER DEFAULT 0,
  best_precision  NUMERIC(5,2),
  last_precision  NUMERIC(5,2),
  avg_precision   NUMERIC(5,2),

  -- Timestamps
  first_attempted_at  TIMESTAMPTZ,
  last_attempted_at   TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,

  UNIQUE(user_id, concept_id)
);

CREATE INDEX IF NOT EXISTS idx_concept_progress_user   ON concept_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_concept_progress_status ON concept_progress(user_id, status);


-- ═══════════════════════════════════════════════════════════
-- RLS: training_sessions
-- ═══════════════════════════════════════════════════════════
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON training_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON training_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE e DELETE bloqueados: sessões são imutáveis após criação


-- ═══════════════════════════════════════════════════════════
-- RLS: session_problems
-- ═══════════════════════════════════════════════════════════
ALTER TABLE session_problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own problems"
  ON session_problems FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own problems"
  ON session_problems FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════
-- RLS: concept_progress
-- ═══════════════════════════════════════════════════════════
ALTER TABLE concept_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON concept_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can modify own progress"
  ON concept_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════
-- RPC: complete_session
-- Finaliza uma sessão atomicamente:
--   1. Insere training_session
--   2. Insere session_problems em batch
--   3. Atualiza concept_progress (se concept_id fornecido)
--   4. Atualiza streak
--   5. Recalcula adaptive_level no perfil
-- Retorna: { session_id, session_status, recommendation, streak, adaptive_level }
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION complete_session(session_data JSON)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id        UUID;
  v_session_id     UUID;
  v_concept_id     INTEGER;
  v_session_status TEXT;
  v_today          DATE;
  v_streak_row     streaks%ROWTYPE;
  v_new_streak     INTEGER;
  v_new_level      INTEGER;
BEGIN
  v_user_id        := auth.uid();
  v_concept_id     := (session_data->>'concept_id')::INTEGER;
  v_session_status := session_data->>'session_status';
  v_today          := CURRENT_DATE;

  -- 1. Inserir sessão
  INSERT INTO training_sessions (
    user_id, operation, base_number, mode, timer_mode, level,
    concept_id, lesson_number,
    total_problems, correct_answers, total_time_ms,
    precision_pct, avg_time_ms, time_variability,
    session_status, recommendation,
    started_at, completed_at
  ) VALUES (
    v_user_id,
    session_data->>'operation',
    (session_data->>'base_number')::INTEGER,
    session_data->>'mode',
    session_data->>'timer_mode',
    (session_data->>'level')::INTEGER,
    v_concept_id,
    (session_data->>'lesson_number')::INTEGER,
    (session_data->>'total_problems')::INTEGER,
    (session_data->>'correct_answers')::INTEGER,
    (session_data->>'total_time_ms')::INTEGER,
    (session_data->>'precision_pct')::NUMERIC,
    (session_data->>'avg_time_ms')::NUMERIC,
    (session_data->>'time_variability')::NUMERIC,
    v_session_status,
    session_data->>'recommendation',
    COALESCE((session_data->>'started_at')::TIMESTAMPTZ, NOW()),
    NOW()
  )
  RETURNING id INTO v_session_id;

  -- 2. Inserir problemas em batch
  INSERT INTO session_problems (
    session_id, user_id,
    problem_index, operand1, operand2, operation,
    correct_answer, user_answer, is_correct, time_ms
  )
  SELECT
    v_session_id,
    v_user_id,
    (p->>'problem_index')::INTEGER,
    (p->>'operand1')::INTEGER,
    (p->>'operand2')::INTEGER,
    p->>'operation',
    (p->>'correct_answer')::INTEGER,
    (p->>'user_answer')::INTEGER,
    (p->>'is_correct')::BOOLEAN,
    (p->>'time_ms')::INTEGER
  FROM json_array_elements(session_data->'problems') AS p;

  -- 3. Atualizar concept_progress (se concept_id fornecido)
  IF v_concept_id IS NOT NULL THEN
    INSERT INTO concept_progress (
      user_id, concept_id, status,
      total_sessions, best_precision, last_precision, avg_precision,
      first_attempted_at, last_attempted_at
    ) VALUES (
      v_user_id, v_concept_id, 'in_progress',
      1,
      (session_data->>'precision_pct')::NUMERIC,
      (session_data->>'precision_pct')::NUMERIC,
      (session_data->>'precision_pct')::NUMERIC,
      NOW(), NOW()
    )
    ON CONFLICT (user_id, concept_id) DO UPDATE SET
      status = CASE
        WHEN (session_data->>'precision_pct')::NUMERIC >= 90
             AND concept_progress.total_sessions >= 1
        THEN 'completed'
        ELSE 'in_progress'
      END,
      total_sessions    = concept_progress.total_sessions + 1,
      best_precision    = GREATEST(concept_progress.best_precision, (session_data->>'precision_pct')::NUMERIC),
      last_precision    = (session_data->>'precision_pct')::NUMERIC,
      avg_precision     = (
        COALESCE(concept_progress.avg_precision, 0) * concept_progress.total_sessions
        + (session_data->>'precision_pct')::NUMERIC
      ) / (concept_progress.total_sessions + 1),
      last_attempted_at = NOW(),
      completed_at      = CASE
        WHEN (session_data->>'precision_pct')::NUMERIC >= 90
             AND concept_progress.total_sessions >= 1
        THEN COALESCE(concept_progress.completed_at, NOW())
        ELSE concept_progress.completed_at
      END;
  END IF;

  -- 4. Atualizar streak
  SELECT * INTO v_streak_row FROM streaks WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    -- Primeira vez treinando
    INSERT INTO streaks (user_id, current_streak_days, longest_streak_days, last_training_date, streak_started_at)
    VALUES (v_user_id, 1, 1, v_today, v_today);
    v_new_streak := 1;

  ELSIF v_streak_row.last_training_date = v_today THEN
    -- Já treinou hoje → sem alteração
    v_new_streak := COALESCE(v_streak_row.current_streak_days, 1);

  ELSIF v_streak_row.last_training_date = v_today - 1 THEN
    -- Treinou ontem → incrementar
    v_new_streak := COALESCE(v_streak_row.current_streak_days, 0) + 1;
    UPDATE streaks SET
      current_streak_days = v_new_streak,
      longest_streak_days = GREATEST(COALESCE(v_streak_row.longest_streak_days, 0), v_new_streak),
      last_training_date  = v_today,
      updated_at          = NOW()
    WHERE user_id = v_user_id;

  ELSE
    -- Sequência quebrada → reiniciar
    v_new_streak := 1;
    UPDATE streaks SET
      current_streak_days = 1,
      streak_started_at   = v_today,
      last_training_date  = v_today,
      updated_at          = NOW()
    WHERE user_id = v_user_id;
  END IF;

  -- 5. Recalcular adaptive_level no perfil
  SELECT adaptive_level INTO v_new_level FROM profiles WHERE id = v_user_id;
  v_new_level := COALESCE(v_new_level, 1);

  IF v_session_status = 'stable' THEN
    v_new_level := LEAST(v_new_level + 1, 4);
  ELSIF v_session_status = 'unstable' THEN
    v_new_level := GREATEST(v_new_level - 1, 1);
  END IF;

  UPDATE profiles SET
    adaptive_level = v_new_level,
    updated_at     = NOW()
  WHERE id = v_user_id;

  -- Retornar resultado
  RETURN json_build_object(
    'session_id',     v_session_id,
    'session_status', v_session_status,
    'recommendation', session_data->>'recommendation',
    'streak',         v_new_streak,
    'adaptive_level', v_new_level
  );
END;
$$;

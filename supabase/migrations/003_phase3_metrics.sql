-- ============================================================
-- NUMETRIA — FASE 3: Métricas Diárias e Dashboard
-- Execute este SQL no Supabase SQL Editor:
-- Dashboard → SQL Editor → New query → Cole e execute
-- ============================================================


-- ═══════════════════════════════════════════════════════════
-- TABELA: daily_metrics
-- Agrega métricas de treino por dia por usuário.
-- Escrita exclusiva via SECURITY DEFINER (complete_session).
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS daily_metrics (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date             DATE NOT NULL,

  -- Contagens do dia
  sessions_count   INTEGER DEFAULT 0,
  problems_total   INTEGER DEFAULT 0,
  problems_correct INTEGER DEFAULT 0,
  total_time_ms    BIGINT DEFAULT 0,

  -- Métricas médias calculadas
  precision_pct    NUMERIC(5,2),
  avg_time_ms      NUMERIC(10,3),
  time_variability NUMERIC(10,3),

  -- 4 Pilares Numetria (0–100)
  -- stability  : consistência (baixa variabilidade relativa = alto)
  -- velocity   : velocidade   (tempo baixo = alto)
  -- precision  : precisão     (= precision_pct)
  -- automation : média dos 3 pilares
  stability_score   NUMERIC(5,2),
  velocity_score    NUMERIC(5,2),
  precision_score   NUMERIC(5,2),
  automation_score  NUMERIC(5,2),

  -- Status consolidado do dia
  day_status       TEXT CHECK (day_status IN ('no_data', 'unstable', 'consolidating', 'stable')),

  computed_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_user      ON daily_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON daily_metrics(user_id, date DESC);


-- ═══════════════════════════════════════════════════════════
-- RLS: daily_metrics
-- Usuários leem apenas os próprios registros.
-- Apenas funções SECURITY DEFINER podem escrever.
-- ═══════════════════════════════════════════════════════════
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily metrics"
  ON daily_metrics FOR SELECT
  USING (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════
-- RPC: complete_session  (ATUALIZADO — Fase 3)
-- Idêntico à Fase 2 + passo 6: upsert em daily_metrics
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

  -- ── 1. Inserir sessão ─────────────────────────────────────
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

  -- ── 2. Inserir problemas em batch ─────────────────────────
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

  -- ── 3. Atualizar concept_progress ────────────────────────
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

  -- ── 4. Atualizar streak ───────────────────────────────────
  SELECT * INTO v_streak_row FROM streaks WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    INSERT INTO streaks (user_id, current_streak_days, longest_streak_days, last_training_date, streak_started_at)
    VALUES (v_user_id, 1, 1, v_today, v_today);
    v_new_streak := 1;

  ELSIF v_streak_row.last_training_date = v_today THEN
    v_new_streak := COALESCE(v_streak_row.current_streak_days, 1);

  ELSIF v_streak_row.last_training_date = v_today - 1 THEN
    v_new_streak := COALESCE(v_streak_row.current_streak_days, 0) + 1;
    UPDATE streaks SET
      current_streak_days = v_new_streak,
      longest_streak_days = GREATEST(COALESCE(v_streak_row.longest_streak_days, 0), v_new_streak),
      last_training_date  = v_today,
      updated_at          = NOW()
    WHERE user_id = v_user_id;

  ELSE
    v_new_streak := 1;
    UPDATE streaks SET
      current_streak_days = 1,
      streak_started_at   = v_today,
      last_training_date  = v_today,
      updated_at          = NOW()
    WHERE user_id = v_user_id;
  END IF;

  -- ── 5. Recalcular adaptive_level ─────────────────────────
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

  -- ── 6. Upsert daily_metrics (agrega todas as sessões do dia) ──
  --
  -- Fórmulas dos 4 pilares:
  --   stability  = GREATEST(0, LEAST(100, (1 - variability/avg_time) × 100))
  --   velocity   = GREATEST(0, LEAST(100, (10 000 - avg_time_ms) / 90))
  --                → 1 000 ms ≈ 100 | 4 000 ms ≈ 67 | 10 000 ms ≈ 0
  --   precision  = precision_pct
  --   automation = média(stability, velocity, precision)
  --
  INSERT INTO daily_metrics (
    user_id, date,
    sessions_count, problems_total, problems_correct, total_time_ms,
    precision_pct, avg_time_ms, time_variability,
    stability_score, velocity_score, precision_score, automation_score,
    day_status,
    computed_at
  )
  SELECT
    v_user_id,
    v_today,
    COUNT(*)::INTEGER,
    SUM(total_problems)::INTEGER,
    SUM(correct_answers)::INTEGER,
    SUM(total_time_ms)::BIGINT,
    ROUND(AVG(precision_pct)::NUMERIC, 2),
    ROUND(AVG(avg_time_ms)::NUMERIC,   3),
    ROUND(AVG(time_variability)::NUMERIC, 3),

    -- stability
    ROUND(GREATEST(0, LEAST(100,
      AVG(CASE
            WHEN avg_time_ms > 0
            THEN (1.0 - time_variability / avg_time_ms) * 100.0
            ELSE 50.0
          END)
    ))::NUMERIC, 2),

    -- velocity
    ROUND(GREATEST(0, LEAST(100,
      (10000.0 - AVG(avg_time_ms)) / 90.0
    ))::NUMERIC, 2),

    -- precision
    ROUND(AVG(precision_pct)::NUMERIC, 2),

    -- automation (média dos 3 pilares)
    ROUND((
      GREATEST(0, LEAST(100, AVG(precision_pct))) +
      GREATEST(0, LEAST(100,
        AVG(CASE
              WHEN avg_time_ms > 0
              THEN (1.0 - time_variability / avg_time_ms) * 100.0
              ELSE 50.0
            END))) +
      GREATEST(0, LEAST(100, (10000.0 - AVG(avg_time_ms)) / 90.0))
    ) / 3.0::NUMERIC, 2),

    -- day_status
    CASE
      WHEN AVG(precision_pct) >= 90
           AND AVG(CASE
                     WHEN avg_time_ms > 0
                     THEN (1.0 - time_variability / avg_time_ms) * 100.0
                     ELSE 50.0
                   END) >= 70
      THEN 'stable'
      WHEN AVG(precision_pct) >= 70
      THEN 'consolidating'
      ELSE 'unstable'
    END,

    NOW()
  FROM training_sessions
  WHERE user_id = v_user_id
    AND completed_at::DATE = v_today
    AND COALESCE(session_aborted, FALSE) = FALSE

  ON CONFLICT (user_id, date) DO UPDATE SET
    sessions_count   = EXCLUDED.sessions_count,
    problems_total   = EXCLUDED.problems_total,
    problems_correct = EXCLUDED.problems_correct,
    total_time_ms    = EXCLUDED.total_time_ms,
    precision_pct    = EXCLUDED.precision_pct,
    avg_time_ms      = EXCLUDED.avg_time_ms,
    time_variability = EXCLUDED.time_variability,
    stability_score  = EXCLUDED.stability_score,
    velocity_score   = EXCLUDED.velocity_score,
    precision_score  = EXCLUDED.precision_score,
    automation_score = EXCLUDED.automation_score,
    day_status       = EXCLUDED.day_status,
    computed_at      = NOW();

  -- ── Retorno ──────────────────────────────────────────────
  RETURN json_build_object(
    'session_id',     v_session_id,
    'session_status', v_session_status,
    'recommendation', session_data->>'recommendation',
    'streak',         v_new_streak,
    'adaptive_level', v_new_level
  );
END;
$$;


-- ═══════════════════════════════════════════════════════════
-- RPC: get_user_dashboard
-- Retorna todos os dados do dashboard em uma única chamada.
-- Segurança: apenas o próprio usuário pode acessar.
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_user_dashboard(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: can only access own dashboard';
  END IF;

  SELECT json_build_object(

    'profile', (
      SELECT row_to_json(p)
      FROM profiles p
      WHERE p.id = p_user_id
    ),

    'streak', (
      SELECT row_to_json(s)
      FROM streaks s
      WHERE s.user_id = p_user_id
    ),

    'last_30_days', (
      SELECT COALESCE(json_agg(dm ORDER BY dm.date ASC), '[]'::json)
      FROM daily_metrics dm
      WHERE dm.user_id = p_user_id
        AND dm.date >= CURRENT_DATE - INTERVAL '30 days'
    ),

    'concept_summary', (
      SELECT COALESCE(json_agg(cp ORDER BY cp.concept_id), '[]'::json)
      FROM concept_progress cp
      WHERE cp.user_id = p_user_id
    ),

    'recent_sessions', (
      SELECT COALESCE(json_agg(ts ORDER BY ts.completed_at DESC), '[]'::json)
      FROM (
        SELECT *
        FROM training_sessions
        WHERE user_id = p_user_id
        ORDER BY completed_at DESC
        LIMIT 10
      ) ts
    )

  ) INTO result;

  RETURN result;
END;
$$;

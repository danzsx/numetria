-- ============================================================
-- NUMETRIA — Protocolo de Performance PRO
-- Migration 008 | Execute no Supabase SQL Editor
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- 1.1  handle_new_user: seed concepts 16-24 como 'locked'
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Cria perfil do usuário
  INSERT INTO profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'display_name'
  );

  -- Seed: primeiro conceito disponível imediatamente
  INSERT INTO concept_progress (
    user_id, concept_id, status,
    lesson_1_status, lesson_2_status, lesson_3_status
  ) VALUES (
    NEW.id, 1, 'available',
    'available', 'locked', 'locked'
  );

  -- Seed PRO: concepts 16-24 criados como locked
  INSERT INTO concept_progress (user_id, concept_id, status, lesson_1_status, lesson_2_status, lesson_3_status)
  SELECT NEW.id, s.id, 'locked', 'locked', 'locked', 'locked'
  FROM generate_series(16, 24) AS s(id)
  ON CONFLICT (user_id, concept_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Backfill: usuários existentes sem registros PRO
INSERT INTO concept_progress (user_id, concept_id, status, lesson_1_status, lesson_2_status, lesson_3_status)
SELECT p.id, s.id, 'locked', 'locked', 'locked', 'locked'
FROM profiles p
CROSS JOIN generate_series(16, 24) AS s(id)
ON CONFLICT (user_id, concept_id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 1.2  RLS: Conceitos PRO requerem plano ativo
-- ─────────────────────────────────────────────────────────────

-- Remover policies existentes (idempotente)
DROP POLICY IF EXISTS "Users can view own progress"              ON concept_progress;
DROP POLICY IF EXISTS "Free users can view foundational concepts" ON concept_progress;
DROP POLICY IF EXISTS "Pro concepts only for pro users"          ON concept_progress;
DROP POLICY IF EXISTS "Users can modify own progress"            ON concept_progress;
DROP POLICY IF EXISTS "Users can insert own progress"            ON concept_progress;
DROP POLICY IF EXISTS "Users can update own progress"            ON concept_progress;

-- SELECT: concepts 1-15 para todos; concepts 16-24 apenas Pro
CREATE POLICY "Free users can view foundational concepts"
  ON concept_progress FOR SELECT
  USING (auth.uid() = user_id AND concept_id <= 15);

CREATE POLICY "Pro concepts only for pro users"
  ON concept_progress FOR SELECT
  USING (
    auth.uid() = user_id
    AND (concept_id <= 15 OR is_pro_user(auth.uid()))
  );

-- Escrita separada para não poluir o SELECT
-- (complete_session é SECURITY DEFINER e bypassa RLS de qualquer forma)
CREATE POLICY "Users can insert own progress"
  ON concept_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON concept_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────
-- 1.3 + 1.4  complete_session: Guard PRO + Gateways de desbloqueio
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION complete_session(session_data JSON)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id            UUID;
  v_session_id         UUID;
  v_concept_id         INTEGER;
  v_lesson_number      INTEGER;
  v_session_status     TEXT;
  v_today              DATE;
  v_streak_row         streaks%ROWTYPE;
  v_new_streak         INTEGER;
  v_new_level          INTEGER;
  v_lesson_completed   BOOLEAN;
  -- PRO
  v_mastered_pct       NUMERIC;
  v_avg_variability    NUMERIC;
  v_new_concept_status TEXT;
BEGIN
  v_user_id        := auth.uid();
  v_concept_id     := (session_data->>'concept_id')::INTEGER;
  v_lesson_number  := (session_data->>'lesson_number')::INTEGER;
  v_session_status := session_data->>'session_status';
  v_today          := CURRENT_DATE;
  v_lesson_completed := (v_session_status IS DISTINCT FROM 'unstable');

  -- ── 1.4 Guard PRO ─────────────────────────────────────────
  -- Impede usuários free de completar sessões de conceitos PRO via URL direta
  IF v_concept_id IS NOT NULL AND v_concept_id >= 16 THEN
    IF NOT is_pro_user(v_user_id) THEN
      RAISE EXCEPTION 'Acesso negado: conceito % requer Protocolo Pro', v_concept_id;
    END IF;
  END IF;

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
    v_lesson_number,
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

  -- ── 3. Atualizar concept_progress ─────────────────────────
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
        WHEN concept_progress.status = 'mastered'  THEN 'mastered'
        WHEN concept_progress.status = 'completed' THEN 'completed'
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
        WHEN concept_progress.status NOT IN ('mastered', 'completed')
             AND (session_data->>'precision_pct')::NUMERIC >= 90
             AND concept_progress.total_sessions >= 1
        THEN COALESCE(concept_progress.completed_at, NOW())
        ELSE concept_progress.completed_at
      END;

    -- ── 3b. Progressão de aulas ────────────────────────────
    IF v_lesson_number IS NOT NULL THEN
      IF v_lesson_number = 1 AND v_lesson_completed THEN
        UPDATE concept_progress SET
          lesson_1_status = 'completed',
          lesson_2_status = CASE
            WHEN COALESCE(lesson_2_status, 'locked') = 'locked' THEN 'available'
            ELSE lesson_2_status
          END
        WHERE user_id = v_user_id AND concept_id = v_concept_id;

      ELSIF v_lesson_number = 2 AND v_lesson_completed THEN
        UPDATE concept_progress SET
          lesson_2_status = 'completed',
          lesson_3_status = CASE
            WHEN COALESCE(lesson_3_status, 'locked') = 'locked' THEN 'available'
            ELSE lesson_3_status
          END
        WHERE user_id = v_user_id AND concept_id = v_concept_id;

      ELSIF v_lesson_number = 3 AND v_lesson_completed THEN
        UPDATE concept_progress SET
          lesson_3_status = 'completed',
          status          = 'mastered',
          completed_at    = COALESCE(completed_at, NOW())
        WHERE user_id = v_user_id AND concept_id = v_concept_id;
      END IF;
    END IF;

    -- ── 3c. Desbloquear próximo conceito (progressão simples) ─
    -- Exclui os gateways PRO (15→16, 18→19, 21→22) que têm regras próprias
    IF v_concept_id < 24
       AND v_concept_id NOT IN (15, 18, 21)
       AND EXISTS (
         SELECT 1 FROM concept_progress
         WHERE user_id    = v_user_id
           AND concept_id = v_concept_id
           AND status IN ('completed', 'mastered')
    ) THEN
      INSERT INTO concept_progress (
        user_id, concept_id, status,
        lesson_1_status, lesson_2_status, lesson_3_status
      ) VALUES (
        v_user_id, v_concept_id + 1, 'available',
        'available', 'locked', 'locked'
      )
      ON CONFLICT (user_id, concept_id) DO UPDATE SET
        status = CASE
          WHEN concept_progress.status = 'locked' THEN 'available'
          ELSE concept_progress.status
        END,
        lesson_1_status = CASE
          WHEN COALESCE(concept_progress.lesson_1_status, 'locked') = 'locked' THEN 'available'
          ELSE concept_progress.lesson_1_status
        END;
    END IF;

    -- ── 3d. Gateways PRO ──────────────────────────────────────

    -- Gateway Automação (15 → 16): todos os conceitos 1-15 completos/masterizados
    IF v_concept_id = 15 THEN
      IF (
        SELECT COUNT(*) FROM concept_progress
        WHERE user_id    = v_user_id
          AND concept_id BETWEEN 1 AND 15
          AND status IN ('completed', 'mastered')
      ) = 15 THEN
        INSERT INTO concept_progress (user_id, concept_id, status, lesson_1_status, lesson_2_status, lesson_3_status)
        VALUES (v_user_id, 16, 'available', 'available', 'locked', 'locked')
        ON CONFLICT (user_id, concept_id) DO UPDATE SET
          status = CASE
            WHEN concept_progress.status = 'locked' THEN 'available'
            ELSE concept_progress.status
          END,
          lesson_1_status = CASE
            WHEN COALESCE(concept_progress.lesson_1_status, 'locked') = 'locked' THEN 'available'
            ELSE concept_progress.lesson_1_status
          END;
      END IF;
    END IF;

    -- Gateway Ritmo (18 → 19): ≥80% de concepts 1-18 masterizados
    IF v_concept_id BETWEEN 1 AND 18 THEN
      SELECT (COUNT(*) FILTER (WHERE status = 'mastered')::NUMERIC / 18.0 * 100)
      INTO v_mastered_pct
      FROM concept_progress
      WHERE user_id = v_user_id AND concept_id BETWEEN 1 AND 18;

      IF COALESCE(v_mastered_pct, 0) >= 80 THEN
        INSERT INTO concept_progress (user_id, concept_id, status, lesson_1_status, lesson_2_status, lesson_3_status)
        VALUES (v_user_id, 19, 'available', 'available', 'locked', 'locked')
        ON CONFLICT (user_id, concept_id) DO UPDATE SET
          status = CASE
            WHEN concept_progress.status = 'locked' THEN 'available'
            ELSE concept_progress.status
          END,
          lesson_1_status = CASE
            WHEN COALESCE(concept_progress.lesson_1_status, 'locked') = 'locked' THEN 'available'
            ELSE concept_progress.lesson_1_status
          END;
      END IF;
    END IF;

    -- Gateway Precisão (21 → 22): variabilidade média < 200ms nas últimas 3 sessões de 19-21
    IF v_concept_id BETWEEN 19 AND 21 THEN
      SELECT AVG(time_variability) INTO v_avg_variability
      FROM (
        SELECT time_variability FROM training_sessions
        WHERE user_id    = v_user_id
          AND concept_id BETWEEN 19 AND 21
          AND COALESCE(session_aborted, FALSE) = FALSE
        ORDER BY completed_at DESC
        LIMIT 3
      ) sub;

      IF v_avg_variability IS NOT NULL AND v_avg_variability < 200 THEN
        INSERT INTO concept_progress (user_id, concept_id, status, lesson_1_status, lesson_2_status, lesson_3_status)
        VALUES (v_user_id, 22, 'available', 'available', 'locked', 'locked')
        ON CONFLICT (user_id, concept_id) DO UPDATE SET
          status = CASE
            WHEN concept_progress.status = 'locked' THEN 'available'
            ELSE concept_progress.status
          END,
          lesson_1_status = CASE
            WHEN COALESCE(concept_progress.lesson_1_status, 'locked') = 'locked' THEN 'available'
            ELSE concept_progress.lesson_1_status
          END;
      END IF;
    END IF;

    -- Captura status final do conceito para retorno
    SELECT status INTO v_new_concept_status
    FROM concept_progress
    WHERE user_id = v_user_id AND concept_id = v_concept_id;

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

  -- ── 6. Upsert daily_metrics ─────────────────────────────
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

    -- automation = média(stability, velocity, precision)
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
    'adaptive_level', v_new_level,
    'new_status',     v_new_concept_status
  );
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- 1.5  get_adaptive_recommendation: adiciona pro_mode + overrides PRO
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_adaptive_recommendation(
  p_user_id    UUID,
  p_concept_id INTEGER DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_count   INTEGER;
  v_avg_precision   NUMERIC;
  v_stable_count    INTEGER;
  v_unstable_count  INTEGER;
  v_last_status     TEXT;
  v_last_level      INTEGER;
  v_rec_level       INTEGER;
  v_rec_mode        TEXT;
  v_rec_timer       TEXT;
  v_reason          TEXT;
  v_prev_concept_id INTEGER;
  v_pro_mode        TEXT;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: pode acessar apenas os próprios dados';
  END IF;

  -- ── Analisar últimas 5 sessões ────────────────────────────
  SELECT
    COUNT(*)::INTEGER,
    ROUND(AVG(precision_pct)::NUMERIC, 1),
    SUM(CASE WHEN session_status = 'stable'   THEN 1 ELSE 0 END)::INTEGER,
    SUM(CASE WHEN session_status = 'unstable' THEN 1 ELSE 0 END)::INTEGER,
    (ARRAY_AGG(session_status ORDER BY completed_at DESC))[1],
    (ARRAY_AGG(level          ORDER BY completed_at DESC))[1]
  INTO
    v_session_count,
    v_avg_precision,
    v_stable_count,
    v_unstable_count,
    v_last_status,
    v_last_level
  FROM (
    SELECT precision_pct, session_status, level, completed_at
    FROM   training_sessions
    WHERE  user_id = p_user_id
      AND  COALESCE(session_aborted, FALSE) = FALSE
      AND  (p_concept_id IS NULL OR concept_id = p_concept_id)
    ORDER BY completed_at DESC
    LIMIT  5
  ) recent;

  -- Defaults para usuário sem histórico
  v_session_count  := COALESCE(v_session_count,  0);
  v_avg_precision  := COALESCE(v_avg_precision,  0);
  v_stable_count   := COALESCE(v_stable_count,   0);
  v_unstable_count := COALESCE(v_unstable_count, 0);
  v_last_status    := COALESCE(v_last_status,    'consolidating');
  v_last_level     := COALESCE(v_last_level,     1);
  v_prev_concept_id := NULL;

  -- ── Determinar nível recomendado ──────────────────────────
  IF v_session_count = 0 THEN
    v_rec_level := 1;
    v_reason    := 'Sem histórico. Iniciando no nível base para construção de padrão linear.';

  ELSIF v_unstable_count >= 2 THEN
    v_rec_level := GREATEST(1, v_last_level - 1);
    v_reason    := 'Instabilidade detectada em ' || v_unstable_count
                   || ' sessões recentes. Reforço estrutural recomendado.';
    IF p_concept_id IS NOT NULL AND p_concept_id > 1 THEN
      v_prev_concept_id := p_concept_id - 1;
    END IF;

  ELSIF v_stable_count >= 2 AND v_avg_precision >= 88 THEN
    v_rec_level := LEAST(4, v_last_level + 1);
    v_reason    := 'Estabilização confirmada em ' || v_stable_count
                   || ' sessões (precisão média ' || v_avg_precision
                   || '%). Avançando para o próximo nível de automação.';

  ELSE
    v_rec_level := v_last_level;
    v_reason    := 'Consolidando no nível atual. Precisão média: '
                   || v_avg_precision || '%.';
  END IF;

  -- ── Mapear nível para mode + timer_mode ──────────────────
  CASE v_rec_level
    WHEN 1 THEN v_rec_mode := 'sequential'; v_rec_timer := 'untimed';
    WHEN 2 THEN v_rec_mode := 'random';     v_rec_timer := 'untimed';
    WHEN 3 THEN v_rec_mode := 'sequential'; v_rec_timer := 'timed';
    WHEN 4 THEN v_rec_mode := 'random';     v_rec_timer := 'timed';
    ELSE        v_rec_mode := 'sequential'; v_rec_timer := 'untimed';
  END CASE;

  -- ── Override para conceitos PRO ──────────────────────────
  -- Sobrescreve level/mode/timer baseado no módulo PRO
  IF p_concept_id BETWEEN 16 AND 18 THEN
    v_rec_level := 3;
    v_rec_mode  := 'random';
    v_rec_timer := 'untimed';
    v_pro_mode  := 'flow';
    v_reason    := 'Módulo Automação — Flow Mode: reconhecimento de padrões sem timer externo.';

  ELSIF p_concept_id BETWEEN 19 AND 21 THEN
    v_rec_level := 3;
    v_rec_mode  := 'sequential';
    v_rec_timer := 'timed';
    v_pro_mode  := 'rhythm';
    v_reason    := 'Módulo Ritmo — Smart Timer: compressão progressiva de janela temporal.';

  ELSIF p_concept_id BETWEEN 22 AND 24 THEN
    v_rec_level := 4;
    v_rec_mode  := 'random';
    v_rec_timer := 'timed';
    v_pro_mode  := 'precision';
    v_reason    := 'Módulo Precisão — Interferência Controlada: alternância multiplicação/divisão.';

  ELSE
    v_pro_mode := NULL;
  END IF;

  RETURN json_build_object(
    'level',               v_rec_level,
    'mode',                v_rec_mode,
    'timer_mode',          v_rec_timer,
    'reason',              v_reason,
    'session_count',       v_session_count,
    'avg_precision',       v_avg_precision,
    'stable_count',        v_stable_count,
    'unstable_count',      v_unstable_count,
    'last_status',         v_last_status,
    'previous_concept_id', v_prev_concept_id,
    'pro_mode',            v_pro_mode
  );
END;
$$;

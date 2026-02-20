-- ============================================================
-- NUMETRIA - FASE 5: Plano Pro e Controle de Acesso
-- Execute este SQL no Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New query -> Cole e execute
-- ============================================================

-- ------------------------------------------------------------
-- HELPER: verifica se usuario possui Pro ativo
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_pro_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = p_user_id
      AND plan_type = 'pro'
      AND (plan_expires_at IS NULL OR plan_expires_at > NOW())
  );
$$;

GRANT EXECUTE ON FUNCTION is_pro_user(UUID) TO authenticated;

-- ------------------------------------------------------------
-- RLS: concept_progress
-- conceitos 1-15: free + pro
-- conceitos 16-24: apenas pro ativo
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own progress" ON concept_progress;
DROP POLICY IF EXISTS "Users can modify own progress" ON concept_progress;

CREATE POLICY "Users can view own progress with pro gating"
  ON concept_progress FOR SELECT
  USING (
    auth.uid() = user_id
    AND (concept_id <= 15 OR is_pro_user(auth.uid()))
  );

CREATE POLICY "Users can insert own progress with pro gating"
  ON concept_progress FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (concept_id <= 15 OR is_pro_user(auth.uid()))
  );

CREATE POLICY "Users can update own progress with pro gating"
  ON concept_progress FOR UPDATE
  USING (
    auth.uid() = user_id
    AND (concept_id <= 15 OR is_pro_user(auth.uid()))
  )
  WITH CHECK (
    auth.uid() = user_id
    AND (concept_id <= 15 OR is_pro_user(auth.uid()))
  );

-- ------------------------------------------------------------
-- RLS: training_sessions
-- protege gravacao de sessoes em conceitos Pro para usuarios free
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own sessions" ON training_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON training_sessions;

CREATE POLICY "Users can view own sessions with pro gating"
  ON training_sessions FOR SELECT
  USING (
    auth.uid() = user_id
    AND (COALESCE(concept_id, 1) <= 15 OR is_pro_user(auth.uid()))
  );

CREATE POLICY "Users can insert own sessions with pro gating"
  ON training_sessions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (COALESCE(concept_id, 1) <= 15 OR is_pro_user(auth.uid()))
  );

-- ------------------------------------------------------------
-- RPC: status de plano (frontend)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_plan_access()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_plan_type TEXT;
  v_plan_expires_at TIMESTAMPTZ;
  v_is_pro BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT plan_type, plan_expires_at
  INTO v_plan_type, v_plan_expires_at
  FROM profiles
  WHERE id = v_user_id;

  v_plan_type := COALESCE(v_plan_type, 'free');
  v_is_pro := is_pro_user(v_user_id);

  RETURN json_build_object(
    'plan_type', v_plan_type,
    'plan_expires_at', v_plan_expires_at,
    'is_active', v_is_pro
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_plan_access() TO authenticated;

-- ------------------------------------------------------------
-- RPC: cancelamento basico de Pro (sem webhook Stripe)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION cancel_my_pro_subscription()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE profiles
  SET
    plan_type = 'free',
    plan_expires_at = NULL,
    updated_at = NOW()
  WHERE id = v_user_id;

  UPDATE plan_subscriptions
  SET
    is_active = FALSE,
    cancelled_at = NOW()
  WHERE user_id = v_user_id
    AND is_active = TRUE;

  RETURN json_build_object(
    'message', 'Plano Pro cancelado',
    'plan_type', 'free'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION cancel_my_pro_subscription() TO authenticated;

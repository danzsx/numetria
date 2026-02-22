-- ============================================================
-- NUMETRIA - Admin Override (Desenvolvimento)
-- Permite testar features Pro sem depender do Stripe.
--
-- Execute no Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New query -> Cole e execute
--
-- Para dar acesso admin ao seu usuário:
--   UPDATE profiles SET role = 'admin' WHERE email = 'seu@email.com';
-- ============================================================

-- ------------------------------------------------------------
-- 1. Adiciona coluna role em profiles
-- ------------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- Garante que nenhum usuário existente fique sem role
UPDATE profiles SET role = 'user' WHERE role IS NULL;

-- ------------------------------------------------------------
-- 2. Atualiza is_pro_user() — admin sempre retorna TRUE
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
      AND (
        -- Admin tem acesso total, independente do plano e do Stripe
        role = 'admin'
        OR
        -- Usuário Pro com plano válido (via Stripe ou manual)
        (plan_type = 'pro' AND (plan_expires_at IS NULL OR plan_expires_at > NOW()))
      )
  );
$$;

GRANT EXECUTE ON FUNCTION is_pro_user(UUID) TO authenticated;

-- ------------------------------------------------------------
-- 3. Atualiza get_plan_access() — retorna role e is_admin
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_plan_access()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id        UUID;
  v_plan_type      TEXT;
  v_plan_expires_at TIMESTAMPTZ;
  v_role           TEXT;
  v_is_active      BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT plan_type, plan_expires_at, role
  INTO v_plan_type, v_plan_expires_at, v_role
  FROM profiles
  WHERE id = v_user_id;

  v_plan_type := COALESCE(v_plan_type, 'free');
  v_role      := COALESCE(v_role, 'user');

  -- is_pro_user já considera admin e plano pro com validade
  v_is_active := is_pro_user(v_user_id);

  RETURN json_build_object(
    'plan_type',      v_plan_type,
    'plan_expires_at', v_plan_expires_at,
    'is_active',      v_is_active,
    'role',           v_role,
    'is_admin',       (v_role = 'admin')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_plan_access() TO authenticated;

-- ------------------------------------------------------------
-- NOTA: cancel_my_pro_subscription NÃO é alterada.
-- Admins não precisam cancelar — o role = 'admin' garante
-- acesso independentemente de plan_type.
-- ------------------------------------------------------------

-- ============================================================
-- COMO USAR
-- ============================================================
-- Para promover seu usuário a admin (substitua o email):
--
--   UPDATE profiles
--   SET role = 'admin'
--   WHERE email = 'seu@email.com';
--
-- Para revogar acesso admin:
--
--   UPDATE profiles
--   SET role = 'user'
--   WHERE email = 'seu@email.com';
--
-- Para verificar:
--
--   SELECT id, email, role, plan_type FROM profiles;
-- ============================================================

-- ============================================================
-- NUMETRIA — FASE 5: Seed de concept_progress para novos usuários
-- Execute este SQL no Supabase SQL Editor:
-- Dashboard → SQL Editor → New query → Cole e execute
-- ============================================================


-- ═══════════════════════════════════════════════════════════
-- TRIGGER: handle_new_user (ATUALIZADO — Fase 5)
-- Adiciona vs. Fase 1:
--   Seed de concept_progress: concept_id=1 disponível para
--   todo novo usuário ao criar conta.
-- ═══════════════════════════════════════════════════════════
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

  -- Seed concept_progress: primeiro conceito disponível imediatamente
  INSERT INTO concept_progress (
    user_id, concept_id, status,
    lesson_1_status, lesson_2_status, lesson_3_status
  ) VALUES (
    NEW.id, 1, 'available',
    'available', 'locked', 'locked'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar trigger (a função é OR REPLACE, o trigger precisa ser recriado)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ═══════════════════════════════════════════════════════════
-- PATCH: Usuários existentes sem concept_id=1
-- Insere concept_id=1 como 'available' para quem ainda não tem.
-- Idempotente: ON CONFLICT não altera dados existentes.
-- ═══════════════════════════════════════════════════════════
INSERT INTO concept_progress (
  user_id, concept_id, status,
  lesson_1_status, lesson_2_status, lesson_3_status
)
SELECT
  p.id, 1, 'available',
  'available', 'locked', 'locked'
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1
  FROM concept_progress cp
  WHERE cp.user_id = p.id
    AND cp.concept_id = 1
);

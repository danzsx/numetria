-- =====================================================
-- FASE 2: Persistencia de module_id em training_sessions
-- Data: 2026-02-22
-- =====================================================

ALTER TABLE training_sessions
ADD COLUMN IF NOT EXISTS module_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'training_sessions_module_id_check'
  ) THEN
    ALTER TABLE training_sessions
    ADD CONSTRAINT training_sessions_module_id_check
    CHECK (
      module_id IS NULL OR module_id IN (
        'tabuada',
        'foundational',
        'consolidation',
        'automacao',
        'ritmo',
        'precisao'
      )
    );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION derive_module_id_from_concept(
  p_concept_id INTEGER
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_concept_id IS NULL THEN
    RETURN 'tabuada';
  ELSIF p_concept_id BETWEEN 1 AND 8 THEN
    RETURN 'foundational';
  ELSIF p_concept_id BETWEEN 9 AND 15 THEN
    RETURN 'consolidation';
  ELSIF p_concept_id BETWEEN 16 AND 18 THEN
    RETURN 'automacao';
  ELSIF p_concept_id BETWEEN 19 AND 21 THEN
    RETURN 'ritmo';
  ELSIF p_concept_id BETWEEN 22 AND 24 THEN
    RETURN 'precisao';
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION set_training_session_module_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.module_id IS NULL THEN
    NEW.module_id := derive_module_id_from_concept(NEW.concept_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_training_session_module_id ON training_sessions;

CREATE TRIGGER trg_set_training_session_module_id
BEFORE INSERT OR UPDATE OF concept_id, module_id ON training_sessions
FOR EACH ROW
EXECUTE FUNCTION set_training_session_module_id();

UPDATE training_sessions
SET module_id = derive_module_id_from_concept(concept_id)
WHERE module_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_module
ON training_sessions(user_id, module_id);

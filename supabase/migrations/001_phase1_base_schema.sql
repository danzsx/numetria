-- ============================================================
-- NUMETRIA — FASE 1: Schema Base
-- Execute este SQL no Supabase SQL Editor:
-- Dashboard → SQL Editor → New query → Cole e execute
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- TABELA: profiles
-- Criada automaticamente no signup via trigger
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS profiles (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                   TEXT NOT NULL,
  display_name            TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Estado do plano
  plan_type               TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'pro')),
  plan_expires_at         TIMESTAMPTZ,

  -- Preferências de treino
  preferred_session_length INTEGER DEFAULT 10,
  onboarding_completed    BOOLEAN DEFAULT FALSE,

  -- Metadados adaptativos (preenchidos nas fases posteriores)
  global_precision        NUMERIC(5,2),
  global_avg_time         NUMERIC(8,3),
  global_variability      NUMERIC(8,3),
  adaptive_level          INTEGER DEFAULT 1 CHECK (adaptive_level BETWEEN 1 AND 4),

  CONSTRAINT profiles_plan_check CHECK (
    (plan_type = 'pro' AND plan_expires_at IS NOT NULL)
    OR plan_type = 'free'
  )
);

CREATE INDEX IF NOT EXISTS idx_profiles_plan_type ON profiles(plan_type);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles(updated_at);

-- ═══════════════════════════════════════════════════════════
-- TRIGGER: cria profile automaticamente no signup
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'display_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════════════════════
-- TABELA: streaks
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS streaks (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak_days   INTEGER DEFAULT 0,
  longest_streak_days   INTEGER DEFAULT 0,
  last_training_date    DATE,
  streak_started_at     DATE,
  updated_at            TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- ═══════════════════════════════════════════════════════════
-- TABELA: plan_subscriptions
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS plan_subscriptions (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_type                 TEXT NOT NULL CHECK (plan_type IN ('free', 'pro')),
  stripe_customer_id        TEXT,
  stripe_subscription_id    TEXT,
  started_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at                TIMESTAMPTZ,
  cancelled_at              TIMESTAMPTZ,
  is_active                 BOOLEAN DEFAULT TRUE,

  UNIQUE(user_id, stripe_subscription_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user    ON plan_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active  ON plan_subscriptions(user_id, is_active);

-- ═══════════════════════════════════════════════════════════
-- RLS: Row Level Security
-- ═══════════════════════════════════════════════════════════

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- streaks
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streak"
  ON streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can modify own streak"
  ON streaks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- plan_subscriptions
ALTER TABLE plan_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON plan_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Escrita em plan_subscriptions apenas via service_role (futuro webhook Stripe)

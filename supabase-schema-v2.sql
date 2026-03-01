-- ============================================================
-- FinançasPro — Schema adicional v2
-- Cole esse SQL no SQL Editor do Supabase (além do schema anterior)
-- ============================================================

-- PARCELAMENTOS
CREATE TABLE IF NOT EXISTS installments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description         TEXT NOT NULL,
  category            TEXT NOT NULL,
  total_amount        NUMERIC(12,2) NOT NULL,
  installment_value   NUMERIC(12,2) NOT NULL,
  total_installments  INTEGER NOT NULL,
  paid_installments   INTEGER NOT NULL DEFAULT 0,
  start_date          DATE NOT NULL,
  card                TEXT,
  created_at          TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_installments" ON installments FOR ALL USING (auth.uid() = user_id);

-- DESPESAS FIXAS RECORRENTES
CREATE TABLE IF NOT EXISTS fixed_expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category    TEXT NOT NULL,
  amount      NUMERIC(12,2) NOT NULL,
  due_day     INTEGER CHECK (due_day BETWEEN 1 AND 31),
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_fixed_expenses" ON fixed_expenses FOR ALL USING (auth.uid() = user_id);

-- RENDA MENSAL ESPERADA
CREATE TABLE IF NOT EXISTS monthly_income_plan (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month     TEXT NOT NULL,
  expected  NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, month)
);
ALTER TABLE monthly_income_plan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_income_plan" ON monthly_income_plan FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_installments_user ON installments(user_id);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_user ON fixed_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_income_plan_user_month ON monthly_income_plan(user_id, month);

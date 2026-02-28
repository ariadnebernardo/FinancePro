-- ============================================================
-- FinançasPro — Schema Supabase
-- Cole esse SQL no SQL Editor do seu projeto Supabase
-- ============================================================

-- Habilita RLS (Row Level Security) — cada usuário só vê seus dados
-- Tabelas criadas com uuid como PK e user_id para isolamento

-- ─── TRANSAÇÕES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT NOT NULL,
  amount      NUMERIC(12,2) NOT NULL,
  category    TEXT NOT NULL,
  date        DATE NOT NULL,
  month       TEXT NOT NULL,   -- formato: YYYY-MM
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);

-- ─── INVESTIMENTOS (ativos) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS assets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker       TEXT NOT NULL,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL,     -- FII, Ação, BDR, ETF
  segment      TEXT NOT NULL,
  cotas        NUMERIC(10,4) NOT NULL DEFAULT 0,
  preco_medio  NUMERIC(12,4) NOT NULL DEFAULT 0,
  preco_atual  NUMERIC(12,4) NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_assets" ON assets
  FOR ALL USING (auth.uid() = user_id);

-- ─── DIVIDENDOS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dividends (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id        UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  month           TEXT NOT NULL,   -- formato: YYYY-MM
  valor_por_cota  NUMERIC(10,6) NOT NULL,
  data_com        DATE,
  data_pag        DATE NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(asset_id, month)
);

ALTER TABLE dividends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_dividends" ON dividends
  FOR ALL USING (auth.uid() = user_id);

-- ─── ORÇAMENTOS (planejamento) ────────────────────────────────
CREATE TABLE IF NOT EXISTS budgets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category   TEXT NOT NULL,
  month      TEXT NOT NULL,        -- formato: YYYY-MM
  "limit"    NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, category, month)
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_budgets" ON budgets
  FOR ALL USING (auth.uid() = user_id);

-- ─── ÍNDICES para performance ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_transactions_user_month ON transactions(user_id, month);
CREATE INDEX IF NOT EXISTS idx_dividends_asset ON dividends(asset_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);

-- Create ENUMS
CREATE TYPE financial_transaction_type AS ENUM ('EXPENSE', 'INCOME', 'TRANSFER', 'SUBSCRIPTION', 'PAYMENT', 'REFUND', 'WITHDRAWAL', 'DEPOSIT', 'FEE', 'TAX', 'OTHER');
CREATE TYPE financial_transaction_status AS ENUM ('DETECTED', 'REVIEWED', 'CONFIRMED', 'REJECTED', 'DUPLICATE', 'ARCHIVED', 'MANUAL', 'DELETED');
CREATE TYPE financial_scan_status AS ENUM ('PROCESSING', 'FAILED', 'COMPLETED');

-- Create Institutions
CREATE TABLE financial_institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Accounts
CREATE TABLE financial_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES financial_institutions(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    account_type TEXT,
    last_four TEXT,
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Categories
CREATE TABLE financial_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Null means system category
    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    parent_id UUID REFERENCES financial_categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Scan Executions
CREATE TABLE financial_scan_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status financial_scan_status NOT NULL DEFAULT 'PROCESSING',
    source TEXT NOT NULL,
    stats JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_details TEXT
);

-- Create Transactions
CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type financial_transaction_type NOT NULL DEFAULT 'EXPENSE',
    status financial_transaction_status NOT NULL DEFAULT 'DETECTED',
    amount NUMERIC(12, 2) NOT NULL,
    original_amount NUMERIC(12, 2),
    currency TEXT NOT NULL DEFAULT 'USD',
    merchant TEXT,
    category_id UUID REFERENCES financial_categories(id) ON DELETE SET NULL,
    institution_id UUID REFERENCES financial_institutions(id) ON DELETE SET NULL,
    account_id UUID REFERENCES financial_accounts(id) ON DELETE SET NULL,
    tags TEXT[],
    notes TEXT,
    possible_duplicate BOOLEAN DEFAULT FALSE,
    execution_id UUID REFERENCES financial_scan_executions(id) ON DELETE SET NULL,
    origin_stats JSONB,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Audit Logs
CREATE TABLE financial_transaction_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES financial_transactions(id) ON DELETE CASCADE,
    changed_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance and search
CREATE INDEX idx_financial_transactions_owner ON financial_transactions(owner_user_id);
CREATE INDEX idx_financial_transactions_date ON financial_transactions(date DESC);
CREATE INDEX idx_financial_transactions_status ON financial_transactions(status);
CREATE INDEX idx_financial_transactions_merchant ON financial_transactions USING gin (to_tsvector('english', coalesce(merchant, '')));

-- RLS (Row Level Security)
ALTER TABLE financial_institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_scan_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transaction_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own financial_institutions" ON financial_institutions FOR SELECT USING (auth.uid() = owner_user_id);
CREATE POLICY "Users can insert own financial_institutions" ON financial_institutions FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Users can update own financial_institutions" ON financial_institutions FOR UPDATE USING (auth.uid() = owner_user_id);
CREATE POLICY "Users can delete own financial_institutions" ON financial_institutions FOR DELETE USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can view own financial_accounts" ON financial_accounts FOR SELECT USING (auth.uid() = owner_user_id);
CREATE POLICY "Users can insert own financial_accounts" ON financial_accounts FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Users can update own financial_accounts" ON financial_accounts FOR UPDATE USING (auth.uid() = owner_user_id);
CREATE POLICY "Users can delete own financial_accounts" ON financial_accounts FOR DELETE USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can view own and system financial_categories" ON financial_categories FOR SELECT USING (owner_user_id IS NULL OR auth.uid() = owner_user_id);
CREATE POLICY "Users can insert own financial_categories" ON financial_categories FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Users can update own financial_categories" ON financial_categories FOR UPDATE USING (auth.uid() = owner_user_id);
CREATE POLICY "Users can delete own financial_categories" ON financial_categories FOR DELETE USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can view own financial_scan_executions" ON financial_scan_executions FOR SELECT USING (auth.uid() = owner_user_id);
CREATE POLICY "Users can insert own financial_scan_executions" ON financial_scan_executions FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Users can update own financial_scan_executions" ON financial_scan_executions FOR UPDATE USING (auth.uid() = owner_user_id);
CREATE POLICY "Users can delete own financial_scan_executions" ON financial_scan_executions FOR DELETE USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can view own financial_transactions" ON financial_transactions FOR SELECT USING (auth.uid() = owner_user_id);
CREATE POLICY "Users can insert own financial_transactions" ON financial_transactions FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Users can update own financial_transactions" ON financial_transactions FOR UPDATE USING (auth.uid() = owner_user_id);
CREATE POLICY "Users can delete own financial_transactions" ON financial_transactions FOR DELETE USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can view own financial_transaction_audit_logs" ON financial_transaction_audit_logs FOR SELECT USING (auth.uid() = changed_by_user_id);
CREATE POLICY "Users can insert own financial_transaction_audit_logs" ON financial_transaction_audit_logs FOR INSERT WITH CHECK (auth.uid() = changed_by_user_id);

-- Create Scanner Transactions (Landing Zone for N8N)
CREATE TABLE financial_scanner_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    execution_id UUID REFERENCES financial_scan_executions(id) ON DELETE SET NULL,
    raw_text TEXT,
    extracted_amount NUMERIC(12, 2),
    extracted_date TIMESTAMP WITH TIME ZONE,
    extracted_merchant TEXT,
    extracted_bank TEXT,
    extracted_account_last_four TEXT,
    extracted_type TEXT,
    is_processed BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX idx_financial_scanner_transactions_owner ON financial_scanner_transactions(owner_user_id);
CREATE INDEX idx_financial_scanner_transactions_processed ON financial_scanner_transactions(is_processed);

-- RLS
ALTER TABLE financial_scanner_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own financial_scanner_transactions" ON financial_scanner_transactions FOR SELECT USING (auth.uid() = owner_user_id);
CREATE POLICY "Users can insert own financial_scanner_transactions" ON financial_scanner_transactions FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Users can update own financial_scanner_transactions" ON financial_scanner_transactions FOR UPDATE USING (auth.uid() = owner_user_id);
CREATE POLICY "Users can delete own financial_scanner_transactions" ON financial_scanner_transactions FOR DELETE USING (auth.uid() = owner_user_id);

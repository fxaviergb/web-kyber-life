ALTER TABLE financial_transactions
    ADD COLUMN IF NOT EXISTS paid_with_credit BOOLEAN NOT NULL DEFAULT FALSE;

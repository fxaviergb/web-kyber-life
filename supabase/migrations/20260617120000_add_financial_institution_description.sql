-- Add an optional free-text description to financial institutions so users can
-- annotate a vendor/institution and fix/clarify it directly from the
-- transaction forms (in addition to its name and type).
ALTER TABLE financial_institutions
    ADD COLUMN IF NOT EXISTS description TEXT;

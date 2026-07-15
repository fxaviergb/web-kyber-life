-- "Fondeo ingresos" was created as a per-user category but represents a
-- general concept (money flowing back into spendable balance, e.g. from
-- savings) that should be available to every user, like the other base
-- categories (e.g. "Ahorros e Inversiones", "Pagos"). Promote it in place so
-- existing transactions referencing it keep the same category id.
UPDATE financial_categories
SET owner_user_id = NULL, updated_at = now()
WHERE name = 'Fondeo ingresos' AND owner_user_id IS NOT NULL;

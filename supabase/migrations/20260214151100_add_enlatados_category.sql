-- Add 'Enlatados' to market_categories if it doesn't exist

INSERT INTO public.market_categories (id, owner_user_id, name, created_at, updated_at, is_deleted)
SELECT 
  uuid_generate_v4(), -- generate a new uuid
  NULL,               -- system category (no owner)
  'Enlatados', 
  NOW(), 
  NOW(), 
  FALSE
WHERE NOT EXISTS (
    SELECT 1 FROM public.market_categories WHERE name = 'Enlatados' AND owner_user_id IS NULL
);

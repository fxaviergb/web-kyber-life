CREATE OR REPLACE FUNCTION get_unique_financial_tags(p_user_id uuid)
RETURNS TABLE (tag text) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT unnest(tags) AS tag
  FROM financial_transactions
  WHERE owner_user_id = p_user_id AND tags IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

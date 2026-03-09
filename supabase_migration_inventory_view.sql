-- IMPORTANT: Drop the existing view first if we are fundamentally changing it, or just OR REPLACE.
-- Assuming the view uses products and stock_movements as standard.

CREATE OR REPLACE VIEW inventory_view AS
SELECT
  p.id,
  p.name,
  COALESCE(sum(m.quantity) FILTER (WHERE m.type = 'IN'), 0::numeric) AS entry,
  COALESCE(sum(m.quantity) FILTER (WHERE m.type = 'OUT'), 0::numeric) AS output,
  COALESCE(sum(m.quantity) FILTER (WHERE m.type = 'IN'), 0::numeric) - COALESCE(sum(m.quantity) FILTER (WHERE m.type = 'OUT'), 0::numeric) AS stock
FROM products p
LEFT JOIN stock_movements m ON p.id = m.product_id
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.name;

-- Ensure roles can select it 
GRANT SELECT ON inventory_view TO authenticated;
GRANT SELECT ON inventory_view TO anon;

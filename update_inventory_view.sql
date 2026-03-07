CREATE OR REPLACE VIEW public.inventory_view AS
 SELECT products.id,
    products.barcode,
    products.name,
    COALESCE(sum(
        CASE
            WHEN stock_movements.type = 'IN'::text THEN stock_movements.quantity
            ELSE 0
        END), 0::numeric) AS entry,
    COALESCE(sum(
        CASE
            WHEN stock_movements.type = 'OUT'::text THEN stock_movements.quantity
            ELSE 0
        END), 0::numeric) AS output,
    COALESCE(sum(
             CASE
                 WHEN stock_movements.type = 'IN'::text THEN stock_movements.quantity
                 WHEN stock_movements.type = 'OUT'::text THEN -stock_movements.quantity
                 ELSE 0
             END), 0::numeric) AS stock
   FROM products
     LEFT JOIN stock_movements ON products.id = stock_movements.product_id
  GROUP BY products.id, products.barcode, products.name;

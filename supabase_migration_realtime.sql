-- 🚀 ACTIVA LA REPLICACIÓN "REALTIME" EN TU BASE DE DATOS SUPABASE 🚀
-- Corre esto en el "SQL Editor" de tu Dashboard de Supabase.

-- IMPORTANTE:
-- Supabase desactiva la propagación por WebSocket (Realtime) por defecto en todas las tablas
-- para ahorrar recursos y por seguridad. Si esto no está activo, el hook `useInventoryRealtime.ts` 
-- nunca recibirá las notificaciones (aunque el código en React esté perfecto).

BEGIN;

-- Añadir la tabla 'products' a la publicación en tiempo real
ALTER PUBLICATION supabase_realtime ADD TABLE products;

-- Añadir la tabla 'stock_movements' a la publicación en tiempo real
ALTER PUBLICATION supabase_realtime ADD TABLE stock_movements;

COMMIT;

-- Nota: Si te sale un error que dice "relation products is already in publication",
-- significa que ya estaba activa. En ese caso tu problema es RLS (Row Level Security).
-- Para arreglar RLS en eventos de Realtime, asegúrate de que tienes una política SELECT:
-- CREATE POLICY "Asegurar Realtime Products" ON products FOR SELECT TO authenticated USING (true);
-- CREATE POLICY "Asegurar Realtime Movements" ON stock_movements FOR SELECT TO authenticated USING (true);

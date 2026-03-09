-- 1. Asegurarnos de que los campos deleted_at y deleted_by existan en la tabla products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by UUID DEFAULT NULL;

-- 2. Crear la vista v_active_products que excluye los eliminados lógicamente
CREATE OR REPLACE VIEW v_active_products AS
SELECT *
FROM products
WHERE deleted_at IS NULL;

-- 3. Asegurar de que los perfiles/roles correctos tengan permisos de SELECT sobre la nueva vista
-- Dependiendo de tu configuración de RLS (Row Level Security), podrías necesitar otorgar permisos a roles autenticados.
GRANT SELECT ON v_active_products TO authenticated;
GRANT SELECT ON v_active_products TO anon;

-- NOTA: Si usas RLS en 'products', las políticas aplican automáticamente cuando se consulta a través de la vista
-- asumiendo que el usuario que consulta tiene permisos sobre las filas base.

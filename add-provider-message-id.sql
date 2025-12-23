-- Migración: Agregar columna provider_message_id a email_logs
-- Ejecutar esto en Railway Query (Data -> Query)

-- Verificar si la columna ya existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'email_logs' 
        AND column_name = 'provider_message_id'
    ) THEN
        -- Agregar la columna
        ALTER TABLE email_logs 
        ADD COLUMN provider_message_id TEXT NULL;
        
        RAISE NOTICE 'Columna provider_message_id agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna provider_message_id ya existe';
    END IF;
END $$;

-- Verificar la estructura de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'email_logs'
ORDER BY ordinal_position;

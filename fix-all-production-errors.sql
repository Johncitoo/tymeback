-- ============================================================
-- Script para arreglar todos los errores de producción
-- ============================================================

-- 1. AGREGAR 'PAYMENT_RECEIPT' AL ENUM file_purpose_enum
DO $$ 
BEGIN
  -- Verificar si el valor ya existe en el enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'PAYMENT_RECEIPT' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'file_purpose_enum')
  ) THEN
    ALTER TYPE file_purpose_enum ADD VALUE 'PAYMENT_RECEIPT';
    RAISE NOTICE '✅ Agregado PAYMENT_RECEIPT al enum file_purpose_enum';
  ELSE
    RAISE NOTICE '⚠️ PAYMENT_RECEIPT ya existe en file_purpose_enum';
  END IF;
END $$;

-- 2. RENOMBRAR COLUMNA availableVariables -> available_variables
DO $$ 
BEGIN
  -- Verificar si la columna con camelCase existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'automated_email_templates' 
    AND column_name = 'availablevariables'
  ) THEN
    ALTER TABLE automated_email_templates 
    RENAME COLUMN "availablevariables" TO available_variables;
    RAISE NOTICE '✅ Renombrada columna availablevariables -> available_variables';
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'automated_email_templates' 
    AND column_name = 'available_variables'
  ) THEN
    -- Si no existe ninguna, crearla
    ALTER TABLE automated_email_templates 
    ADD COLUMN available_variables jsonb DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Creada columna available_variables';
  ELSE
    RAISE NOTICE '⚠️ Columna available_variables ya existe correctamente';
  END IF;
END $$;

-- 3. HACER created_by_user_id NULLABLE en mass_emails
DO $$ 
BEGIN
  -- Hacer la columna nullable
  ALTER TABLE mass_emails 
  ALTER COLUMN created_by_user_id DROP NOT NULL;
  
  RAISE NOTICE '✅ Columna created_by_user_id ahora es nullable';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Error al modificar created_by_user_id: %', SQLERRM;
END $$;

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================

-- Verificar enum file_purpose_enum
SELECT '🔍 Valores en file_purpose_enum:' as status;
SELECT enumlabel as valor 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'file_purpose_enum')
ORDER BY enumlabel;

-- Verificar columnas de automated_email_templates
SELECT '🔍 Columnas de automated_email_templates:' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'automated_email_templates'
AND column_name LIKE '%variable%';

-- Verificar created_by_user_id en mass_emails
SELECT '🔍 Columna created_by_user_id en mass_emails:' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'mass_emails'
AND column_name = 'created_by_user_id';

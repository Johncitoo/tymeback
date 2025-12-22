-- ============================================
-- SCRIPT DE ARREGLO COMPLETO PARA RAILWAY
-- Ejecutar en Railway CLI o en la consola de Railway
-- ============================================

-- 1. Agregar columna receipt_file_id si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='payments' AND column_name='receipt_file_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN receipt_file_id uuid NULL;
    ALTER TABLE payments ADD CONSTRAINT fk_payments_receipt_file 
      FOREIGN KEY (receipt_file_id) REFERENCES files(id) ON DELETE SET NULL;
    RAISE NOTICE 'Columna receipt_file_id agregada exitosamente';
  ELSE
    RAISE NOTICE 'Columna receipt_file_id ya existe';
  END IF;
END $$;

-- 2. Crear tablas de comunicaciones si no existen
CREATE TABLE IF NOT EXISTS automated_email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  type varchar(50) NOT NULL,
  name varchar(200) NOT NULL,
  subject varchar(200) NOT NULL,
  content_body text NOT NULL,
  available_variables jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_automated_email_gym_type 
ON automated_email_templates(gym_id, type);

CREATE TABLE IF NOT EXISTS mass_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject varchar(200) NOT NULL,
  content_body text NOT NULL,
  filter_type varchar(50) NOT NULL,
  filter_params jsonb,
  total_recipients int NOT NULL DEFAULT 0,
  sent_count int NOT NULL DEFAULT 0,
  failed_count int NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'DRAFT',
  sent_at timestamptz,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mass_emails_gym_created 
ON mass_emails(gym_id, created_at);

-- 3. Verificar que todo esté correcto
SELECT 
  'payments.receipt_file_id' as columna,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='payments' AND column_name='receipt_file_id'
  ) THEN '✅ Existe' ELSE '❌ Falta' END as estado
UNION ALL
SELECT 
  'automated_email_templates' as columna,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name='automated_email_templates'
  ) THEN '✅ Existe' ELSE '❌ Falta' END as estado
UNION ALL
SELECT 
  'mass_emails' as columna,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name='mass_emails'
  ) THEN '✅ Existe' ELSE '❌ Falta' END as estado;

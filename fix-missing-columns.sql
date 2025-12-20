-- Fix: Agregar columnas faltantes en payments y email_logs

-- 1. Agregar processed_by a payments (si no existe)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'processed_by_user_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN processed_by_user_id UUID REFERENCES users(id);
    COMMENT ON COLUMN payments.processed_by_user_id IS 'Usuario que procesó el pago';
  END IF;
END $$;

-- 2. Remover campaign_id de email_logs (si existe, ya que no se usa)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_logs' AND column_name = 'campaign_id'
  ) THEN
    ALTER TABLE email_logs DROP COLUMN campaign_id;
  END IF;
END $$;

-- 3. Verificar que template_id sea opcional
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_logs' 
      AND column_name = 'template_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE email_logs ALTER COLUMN template_id DROP NOT NULL;
  END IF;
END $$;

SELECT 'Columnas arregladas exitosamente' AS status;

-- Crear tabla automated_email_templates
CREATE TABLE IF NOT EXISTS automated_email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  type varchar(50) NOT NULL,
  name varchar(200) NOT NULL,
  subject varchar(200) NOT NULL,
  content_body text NOT NULL,
  available_variables jsonb NOT NULL DEFAULT '[]',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- Índice único para gym_id + type
CREATE UNIQUE INDEX IF NOT EXISTS IDX_AUTOMATED_EMAIL_GYM_TYPE 
ON automated_email_templates(gym_id, type);

-- Crear tabla mass_emails
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

-- Índice para consultas de historial
CREATE INDEX IF NOT EXISTS IDX_MASS_EMAILS_GYM_CREATED 
ON mass_emails(gym_id, created_at);

-- Insertar registro en la tabla migrations para marcar como ejecutada
INSERT INTO migrations (timestamp, name) 
VALUES (1734830000000, 'CreateAutomatedEmailsTablesRevisado1734830000000')
ON CONFLICT DO NOTHING;

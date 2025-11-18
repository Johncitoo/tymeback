-- =====================================================
-- MIGRACIÓN: Crear tabla auth_tokens
-- Fecha: 2024-11-18
-- Descripción: Sistema de tokens de activación de cuenta
-- =====================================================

-- Paso 1: Crear el enum de tipos de token
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'token_type_enum') THEN
        CREATE TYPE token_type_enum AS ENUM (
            'ACCOUNT_ACTIVATION',
            'PASSWORD_RESET',
            'EMAIL_VERIFICATION'
        );
    END IF;
END $$;

-- Paso 2: Crear la tabla auth_tokens
CREATE TABLE IF NOT EXISTS auth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token TEXT UNIQUE NOT NULL,
    type token_type_enum NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT false,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Foreign key con CASCADE delete
    CONSTRAINT fk_auth_tokens_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- Paso 3: Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_auth_tokens_token 
    ON auth_tokens(token);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_type 
    ON auth_tokens(user_id, type);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires_at 
    ON auth_tokens(expires_at);

-- Paso 4: Agregar comentarios para documentación
COMMENT ON TABLE auth_tokens IS 'Almacena tokens de seguridad para activación de cuenta, reset de password y verificación de email';
COMMENT ON COLUMN auth_tokens.token IS 'Token único de 64 caracteres generado con crypto.randomBytes';
COMMENT ON COLUMN auth_tokens.expires_at IS 'Fecha de expiración del token (72 horas para activación)';
COMMENT ON COLUMN auth_tokens.is_used IS 'Flag para one-time use del token';

-- Verificación: Mostrar estructura de la tabla creada
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'auth_tokens'
ORDER BY ordinal_position;

-- Verificación: Mostrar índices creados
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'auth_tokens';

-- Verificación: Contar registros (debe ser 0)
SELECT COUNT(*) as total_tokens FROM auth_tokens;

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================

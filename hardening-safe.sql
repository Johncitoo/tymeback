-- hardening-safe.sql
-- Aplicar cambios de hardening y performance (cero-riesgo)
-- Ejecutado: 20 de diciembre de 2025

-- ============================================================================
-- 1. ÍNDICE ÚNICO: Evitar duplicados activos en gym_users
-- ============================================================================
-- Pre-check confirmó: 0 duplicados activos ✅

CREATE UNIQUE INDEX IF NOT EXISTS idx_gym_users_unique_active
ON public.gym_users(gym_id, user_id)
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_gym_users_unique_active IS 
'Evita duplicados activos en gym_users. Soft-delete compatible.';

-- ============================================================================
-- 2. ÍNDICES DE PERFORMANCE: Queries más rápidas
-- ============================================================================

-- Memberships: lookup por gym + cliente
CREATE INDEX IF NOT EXISTS idx_memberships_gym_client
ON public.memberships(gym_id, client_gym_user_id);

COMMENT ON INDEX idx_memberships_gym_client IS 
'Acelera queries de membresías por gym y cliente';

-- Attendance: filtros por gym + fecha
CREATE INDEX IF NOT EXISTS idx_attendance_gym_date
ON public.attendance(gym_id, check_in_at);

COMMENT ON INDEX idx_attendance_gym_date IS 
'Acelera queries de asistencia por gym y fecha';

-- Gym Users: lookup completo con filtro de activos
CREATE INDEX IF NOT EXISTS idx_gym_users_lookup
ON public.gym_users(gym_id, user_id, is_active)
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_gym_users_lookup IS 
'Acelera queries de usuarios por gym, optimizado para registros activos';

-- ============================================================================
-- 3. VERIFICACIÓN
-- ============================================================================

-- Verificar índices creados
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE indexname IN (
  'idx_gym_users_unique_active',
  'idx_memberships_gym_client',
  'idx_attendance_gym_date',
  'idx_gym_users_lookup'
)
ORDER BY tablename, indexname;

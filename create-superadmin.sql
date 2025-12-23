-- Script para crear Super Admin
-- Ejecutar en la base de datos de Railway

-- 1. Primero generamos el hash de la contraseña SuperAdmin123!
-- Este hash es válido pero necesitas regenerarlo con el script generate-password-hash.js
-- Por ahora usamos un placeholder que debes reemplazar

-- 2. Crear el usuario Super Admin
INSERT INTO users (
  id,
  email,
  hashed_password,
  first_name,
  last_name,
  phone,
  rut,
  is_active,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'superadmin@tyme.cl',
  'REEMPLAZAR_CON_HASH', -- ⚠️ Ejecutar: node backend/generate-password-hash.js "SuperAdmin123!"
  'Super',
  'Admin',
  '+56911111111',
  '11111111-1',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING
RETURNING id;

-- 3. Obtener el ID del gym TYME (asumiendo que ya existe)
-- Si no existe, primero debes crearlo

-- 4. Crear entrada en gym_users con rol SUPER_ADMIN
-- ⚠️ IMPORTANTE: Reemplazar USER_ID_AQUI con el ID retornado del INSERT anterior
-- ⚠️ IMPORTANTE: Reemplazar GYM_ID_AQUI con el ID del gym TYME

INSERT INTO gym_users (
  id,
  gym_id,
  user_id,
  role,
  is_active,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'GYM_ID_AQUI', -- ⚠️ Obtener con: SELECT id FROM gyms WHERE slug = 'tyme';
  'USER_ID_AQUI', -- ⚠️ ID del usuario creado arriba
  'SUPER_ADMIN',
  true,
  NOW(),
  NOW()
);

-- ALTERNATIVA: Todo en una sola transacción usando WITH
WITH new_user AS (
  INSERT INTO users (
    id,
    email,
    hashed_password,
    first_name,
    last_name,
    phone,
    rut,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    'superadmin@tyme.cl',
    'REEMPLAZAR_CON_HASH',
    'Super',
    'Admin',
    '+56911111111',
    '11111111-1',
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
  RETURNING id
),
tyme_gym AS (
  SELECT id FROM gyms WHERE slug = 'tyme' LIMIT 1
)
INSERT INTO gym_users (
  id,
  gym_id,
  user_id,
  role,
  is_active,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  tyme_gym.id,
  new_user.id,
  'SUPER_ADMIN',
  true,
  NOW(),
  NOW()
FROM new_user, tyme_gym
ON CONFLICT (gym_id, user_id) DO NOTHING;

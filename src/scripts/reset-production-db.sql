-- ========================================
-- RESET PRODUCTION DATABASE
-- Fecha: 1 de enero de 2026
-- ADVERTENCIA: Este script ELIMINA TODOS LOS DATOS
-- ========================================

-- 1. ELIMINAR TODOS LOS DATOS EN ORDEN CORRECTO
-- ========================================
-- Primero eliminar todas las referencias que dependen de gym_users
DELETE FROM payments WHERE processed_by_gym_user_id IS NOT NULL;
DELETE FROM payments WHERE gym_id IS NOT NULL;
DELETE FROM appointments;
DELETE FROM attendance;
DELETE FROM memberships;
DELETE FROM routine_assignments;
DELETE FROM body_evaluations;
DELETE FROM inbody_scans;
DELETE FROM nutrition_anamneses;
DELETE FROM nutrition_plans;
DELETE FROM clients;
DELETE FROM gym_users;

-- Luego eliminar usuarios
DELETE FROM users;

-- Finalmente eliminar gimnasios
DELETE FROM gyms;

-- 2. CREAR USUARIOS GLOBALES (tabla users)
-- ========================================

-- SUPER_ADMIN 1: Juan Contreras
-- Email: juanjacontrerasra@gmail.com
-- Password: apocalipto11
INSERT INTO users (id, email, hashed_password, first_name, last_name, is_active, created_at, updated_at)
VALUES (
  'a1111111-1111-1111-1111-111111111111',
  'juanjacontrerasra@gmail.com',
  'pbkdf2$100000$5581c2a7d547b23dda3d4b8be2241dfe$f742134d9f8d96c6e30af0cd7fa4c84da7e69f2aabdcdae378384417a68e248b233208ec07dcbab9629a6a108d3a90255e88ed68378b25698b7b62e082cd409c',
  'Juan',
  'Contreras',
  true,
  NOW(),
  NOW()
);

-- SUPER_ADMIN 2: Esteban Diaz
-- Email: estebandiazaranda@gmail.com
-- Password: somosTYME.2025
INSERT INTO users (id, email, hashed_password, first_name, last_name, is_active, created_at, updated_at)
VALUES (
  'a2222222-2222-2222-2222-222222222222',
  'estebandiazaranda@gmail.com',
  'pbkdf2$100000$55a0ea02a25e78d7829b8175929dda40$19861ca605eb844141bea472fb30338a900abcf4bf2a336e87cf7f48c3dcd2512cfad924ee9a408b1aeb6c764fc5d85c44f87f54fd0c551e950c68ff799cf655',
  'Esteban',
  'Diaz',
  true,
  NOW(),
  NOW()
);

-- ADMIN 1: Nicolas Barrera
-- Email: nbarreraprado@gmail.com
-- Password: Xk9$pL2#vM8wQ!nR7z
INSERT INTO users (id, email, hashed_password, first_name, last_name, is_active, created_at, updated_at)
VALUES (
  'a3333333-3333-3333-3333-333333333333',
  'nbarreraprado@gmail.com',
  'pbkdf2$100000$798e1b35c6b193fb406e80d4d60835be$ea9703d54ca4053ad21c227f1e1ede49c08ed7929211acdcb5309b897453ce308ab2d5dd3d7424ae4a851c2af04d9e68887b2090407bff0934e5fd86fbae551c',
  'Nicolas',
  'Barrera',
  true,
  NOW(),
  NOW()
);

-- ADMIN 2: Diego Diaz
-- Email: diego.f.pinzon@icloud.com
-- Password: Xk9$pL2#vM8wQ!nR7z
INSERT INTO users (id, email, hashed_password, first_name, last_name, is_active, created_at, updated_at)
VALUES (
  'a4444444-4444-4444-4444-444444444444',
  'diego.f.pinzon@icloud.com',
  'pbkdf2$100000$e8a95e791e78094f17a3e74d7c71bf73$2c61e01eb3ca3b15a5fba1901b5196e5560079408d20b74dfee247ff1df0de13c46a37e9b0aa2f31045b4847994619e133027f61f40aa339871c05a9ca9472ba',
  'Diego',
  'Diaz',
  true,
  NOW(),
  NOW()
);

-- 3. CREAR GIMNASIO
-- ========================================
INSERT INTO gyms (id, name, slug, timezone, currency, primary_color, is_active, created_at, updated_at)
VALUES (
  'a1a1a1a1-1111-1111-1111-111111111111',
  'somostyme',
  'somostyme',
  'America/Santiago',
  'CLP',
  '#3B82F6', -- Azul (color del logo tm-blue.png)
  true,
  NOW(),
  NOW()
);

-- NOTA: Información adicional del gimnasio (no está en la tabla gyms):
-- Dirección: Av Ossandón #19
-- Teléfono: 941776740
-- Logo: Pendiente de subir (C:\Users\YeCoBz\Desktop\App\TM\frontend\public\images\login\logos\tm-blue.png)

-- 4. CREAR RELACIONES GYM_USERS
-- ========================================

-- SUPER_ADMIN 1 (Juan Contreras) - Acceso global a todos los gyms
INSERT INTO gym_users (id, gym_id, user_id, role, is_active, created_at, updated_at)
VALUES (
  'b1b1b1b1-1111-1111-1111-111111111111',
  'a1a1a1a1-1111-1111-1111-111111111111', -- somostyme
  'a1111111-1111-1111-1111-111111111111', -- Juan Contreras
  'SUPER_ADMIN',
  true,
  NOW(),
  NOW()
);

-- SUPER_ADMIN 2 (Esteban Diaz) - Acceso global a todos los gyms
INSERT INTO gym_users (id, gym_id, user_id, role, is_active, created_at, updated_at)
VALUES (
  'b2b2b2b2-2222-2222-2222-222222222222',
  'a1a1a1a1-1111-1111-1111-111111111111', -- somostyme
  'a2222222-2222-2222-2222-222222222222', -- Esteban Diaz
  'SUPER_ADMIN',
  true,
  NOW(),
  NOW()
);

-- ADMIN 1 (Nicolas Barrera) - Admin del gym somostyme
INSERT INTO gym_users (id, gym_id, user_id, role, is_active, created_at, updated_at)
VALUES (
  'b3b3b3b3-3333-3333-3333-333333333333',
  'a1a1a1a1-1111-1111-1111-111111111111', -- somostyme
  'a3333333-3333-3333-3333-333333333333', -- Nicolas Barrera
  'ADMIN',
  true,
  NOW(),
  NOW()
);

-- ADMIN 2 (Diego Diaz) - Admin del gym somostyme
INSERT INTO gym_users (id, gym_id, user_id, role, is_active, created_at, updated_at)
VALUES (
  'b4b4b4b4-4444-4444-4444-444444444444',
  'a1a1a1a1-1111-1111-1111-111111111111', -- somostyme
  'a4444444-4444-4444-4444-444444444444', -- Diego Diaz
  'ADMIN',
  true,
  NOW(),
  NOW()
);

-- ========================================
-- VERIFICACIÓN
-- ========================================
SELECT 'USUARIOS CREADOS:' as info;
SELECT u.email, u.first_name, u.last_name, gu.role, g.name as gimnasio
FROM users u
INNER JOIN gym_users gu ON gu.user_id = u.id
INNER JOIN gyms g ON g.id = gu.gym_id
ORDER BY gu.role, u.email;

SELECT '' as info;
SELECT 'GIMNASIOS CREADOS:' as info;
SELECT name, slug FROM gyms;

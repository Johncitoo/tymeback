-- Script SQL para crear usuarios de prueba en Railway
-- Ejecutar este script directamente en la consola de PostgreSQL de Railway

-- 1. Verificar que exista un gimnasio, si no crearlo
INSERT INTO gyms (id, name, slug, "createdAt", "updatedAt")
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'TYME Gym Principal',
  'tyme-gym-principal',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. Crear usuario ADMIN
-- Password: Admin123! (hasheado con PBKDF2)
INSERT INTO users (
  id,
  "gymId",
  role,
  "fullName",
  email,
  "hashedPassword",
  phone,
  rut,
  "isActive",
  "createdAt",
  "updatedAt"
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'ADMIN',
  'Admin Tyme',
  'admin@tyme.cl',
  'pbkdf2$100000$a8f02a9d907523a1c7273417978cccca$9729929a17a2d53be484e622db22860b22280834677e61b9e9682130df3bcc5d6f827cc7edb0071337e301bd7720a9219a02bd62418da4de12b97ec948e4756e',
  '+56912345601',
  '11111111-1',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- 3. Crear usuario CLIENTE
-- Password: Cliente123!
INSERT INTO users (
  id,
  "gymId",
  role,
  "fullName",
  email,
  "hashedPassword",
  phone,
  rut,
  "birthDate",
  gender,
  "isActive",
  "createdAt",
  "updatedAt"
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'CLIENT',
  'Cliente Demo',
  'cliente@tyme.cl',
  'pbkdf2$100000$d5870e9301a28d32471be3722a51ec1f$450a8839273ac77931621d268211c47c0d1e067a3f52cc3933b702bc4d31706ea099b0abd3cb8299a259079e1e8b5874477d01f62e1c9c8ffffad7f112a411ae',
  '+56912345602',
  '22222222-2',
  '1990-05-15',
  'MALE',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- 4. Crear usuario ENTRENADOR
-- Password: Entrenador123!
INSERT INTO users (
  id,
  "gymId",
  role,
  "fullName",
  email,
  "hashedPassword",
  phone,
  rut,
  "isActive",
  "createdAt",
  "updatedAt"
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'TRAINER',
  'Entrenador Demo',
  'entrenador@tyme.cl',
  'pbkdf2$100000$ed1aeefc8065036f42583f11ccf1934f$b22007cc6d0be19b80e04271f55e73096157d69ee9cdc3e41c47686951fe639d5ba14f7774df6ea1489f044f9985c4fda5636342f4ca67f085834504fd26109d',
  '+56912345603',
  '33333333-3',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- 5. Crear usuario NUTRICIONISTA
-- Password: Nutricionista123!
INSERT INTO users (
  id,
  "gymId",
  role,
  "fullName",
  email,
  "hashedPassword",
  phone,
  rut,
  "isActive",
  "createdAt",
  "updatedAt"
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'NUTRITIONIST',
  'Nutricionista Demo',
  'nutricionista@tyme.cl',
  'pbkdf2$100000$5956d7d7198f4dbd8effa9c944863925$240980b59ef9654b00a81597371c0cdf627ac7f87bf89e7ae1afaa37af463be5431ed5d30b46067cd62f44a3dfa989beec7171cb37f2fc8f672ed6b397c3cb32',
  '+56912345604',
  '44444444-4',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Verificar usuarios creados
SELECT id, email, role, "fullName", "isActive" FROM users WHERE email LIKE '%@tyme.cl';

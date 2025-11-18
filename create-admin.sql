-- Crear usuario admin para producción
-- Password: admin123 (hasheado con PBKDF2 como el backend)

INSERT INTO users (
  id,
  gym_id,
  email,
  rut,
  full_name,
  phone,
  role,
  is_active,
  hashed_password,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'admin@tyme.local',
  '11.111.111-1',
  'Admin TYME',
  '+56900000000',
  'ADMIN',
  TRUE,
  'pbkdf2$100000$fae574db4cdbb2e62838c1ff9114983a$26255dc64d70c0c690c81e77563e7683cc8be7aac9fa8db84d00758ac7894445b2e6e632adcf133b1bf76cd9b48c85f3189cc2fec62b729a9056cc19be79ae27',
  NOW(),
  NOW()
);


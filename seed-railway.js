// Script para insertar datos seed en Railway
const { Client } = require('pg');

// Credenciales de Railway
const connectionString = 'postgresql://postgres:DanpBohSbQluYBnEIpTGDoYVCDiUslqG@maglev.proxy.rlwy.net:51300/railway';

async function seedData() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Conectado a Railway DB\n');

    // Verificar si ya existen
    const gymCheck = await client.query("SELECT id FROM gyms WHERE slug = 'tyme-demo'");
    const userCheck = await client.query("SELECT id FROM users WHERE email = 'admin@tyme.demo'");

    if (gymCheck.rows.length > 0 && userCheck.rows.length > 0) {
      console.log('⚠️  Los datos ya existen en la base de datos');
      console.log('   Gym:', gymCheck.rows[0].id);
      console.log('   User:', userCheck.rows[0].id);
      return;
    }

    console.log('📝 Insertando datos...\n');

    // 1. Insertar gym
    await client.query(`
      INSERT INTO gyms (id, name, slug, is_active, timezone, currency, primary_color, settings, created_at, updated_at)
      VALUES (
        'a0000000-0000-0000-0000-000000000001'::uuid,
        'Tyme Demo',
        'tyme-demo',
        true,
        'America/Santiago',
        'CLP',
        '#71c7e0',
        '{}'::jsonb,
        NOW(),
        NOW()
      )
      ON CONFLICT (slug) DO NOTHING
    `);
    console.log('✅ Gym "tyme-demo" creado');

    // 2. Insertar usuario
    await client.query(`
      INSERT INTO users (id, email, hashed_password, first_name, last_name, platform_role, is_active, created_at, updated_at)
      VALUES (
        'b0000000-0000-0000-0000-000000000001'::uuid,
        'admin@tyme.demo',
        'pbkdf2$100000$f3d236b52fdde66c79f56e4e84741390$222d067a4fb09e0555d236d5790b2dc8fbd3e2ad55d8ae90022cb89ac0d226cc2bbef8a7fb1fb2a88ba14fa9ae468cd437973289781bd59ad2c1ceff520fef56',
        'Admin',
        'Demo',
        'USER',
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO NOTHING
    `);
    console.log('✅ User "admin@tyme.demo" creado (password: Admin123)');

    // 3. Insertar gym_users
    await client.query(`
      INSERT INTO gym_users (id, gym_id, user_id, role, is_active, created_at, updated_at)
      VALUES (
        'c0000000-0000-0000-0000-000000000001'::uuid,
        'a0000000-0000-0000-0000-000000000001'::uuid,
        'b0000000-0000-0000-0000-000000000001'::uuid,
        'ADMIN',
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (gym_id, user_id, role) WHERE deleted_at IS NULL DO NOTHING
    `);
    console.log('✅ Membership ADMIN creado\n');

    // Verificar
    const gym = await client.query("SELECT id, name, slug FROM gyms WHERE slug = 'tyme-demo'");
    const user = await client.query("SELECT id, email, first_name, last_name FROM users WHERE email = 'admin@tyme.demo'");
    const gymUser = await client.query(`
      SELECT gu.id, gu.role, gu.is_active 
      FROM gym_users gu 
      WHERE gu.user_id = 'b0000000-0000-0000-0000-000000000001' 
        AND gu.gym_id = 'a0000000-0000-0000-0000-000000000001'
    `);

    console.log('📊 Verificación:');
    console.log('   Gym:', gym.rows[0]);
    console.log('   User:', user.rows[0]);
    console.log('   GymUser:', gymUser.rows[0]);
    console.log('\n🎉 Seed completado exitosamente!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.detail) console.error('   Detail:', error.detail);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedData();

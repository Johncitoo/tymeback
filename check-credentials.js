const pg = require('pg');
const { Client } = pg;

const DATABASE_URL = 'postgresql://postgres:DanpBohSbQluYBnEIpTGDoYVCDiUslqG@maglev.proxy.rlwy.net:51300/railway';

async function checkCredentials() {
  const client = new Client({ 
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔌 Conectado a Railway...\n');

    const result = await client.query(`
      SELECT 
        u.id,
        u.email,
        u.full_name,
        u.is_active,
        u.platform_role,
        gu.role as gym_role,
        g.name as gym_name,
        g.slug as gym_slug
      FROM users u
      INNER JOIN gym_users gu ON gu.user_id = u.id
      INNER JOIN gyms g ON g.id = gu.gym_id
      WHERE u.email = 'juanjacontrerasra@gmail.com'
    `);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('═══════════════════════════════════════════════════');
      console.log('📋 CREDENCIALES DE ACCESO');
      console.log('═══════════════════════════════════════════════════');
      console.log('');
      console.log('🏢 Gimnasio:');
      console.log(`   Nombre: ${user.gym_name}`);
      console.log(`   Slug: ${user.gym_slug}`);
      console.log('');
      console.log('👤 Usuario:');
      console.log(`   Email: ${user.email}`);
      console.log(`   Nombre: ${user.full_name}`);
      console.log(`   Contraseña: apocalipto11`);
      console.log('');
      console.log('🔐 Permisos:');
      console.log(`   Role en Gym: ${user.gym_role}`);
      console.log(`   Platform Role: ${user.platform_role || 'N/A'}`);
      console.log(`   Estado: ${user.is_active ? '✅ Activo' : '❌ Inactivo'}`);
      console.log('');
      console.log('═══════════════════════════════════════════════════');
      console.log('🔑 Para iniciar sesión:');
      console.log('═══════════════════════════════════════════════════');
      console.log(`   Gym: ${user.gym_slug}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: apocalipto11`);
      console.log(`   Tipo de usuario: ${user.gym_role === 'TRAINER' ? 'Staff/Entrenador' : user.gym_role === 'CLIENT' ? 'Cliente' : user.gym_role}`);
      console.log('═══════════════════════════════════════════════════');
    } else {
      console.log('❌ Usuario no encontrado');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

checkCredentials();

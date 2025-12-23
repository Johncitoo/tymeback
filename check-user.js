const pg = require('pg');
const { Client } = pg;

const DATABASE_URL = 'postgresql://postgres:DanpBohSbQluYBnEIpTGDoYVCDiUslqG@maglev.proxy.rlwy.net:51300/railway';

async function checkUser() {
  const client = new Client({ 
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const result = await client.query(`
      SELECT 
        u.id,
        u.email,
        u.full_name,
        u.is_active,
        gu.role,
        g.name as gym_name,
        g.slug as gym_slug
      FROM users u
      LEFT JOIN gym_users gu ON gu.user_id = u.id
      LEFT JOIN gyms g ON g.id = gu.gym_id
      WHERE u.email = 'elchoripanbrayan2002@gmail.com'
    `);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('\n✅ USUARIO ENCONTRADO\n');
      console.log('══════════════════════════════════════════════════');
      console.log(`👤 ${user.full_name}`);
      console.log(`📧 ${user.email}`);
      console.log(`🏢 Gym: ${user.gym_name || 'Sin gym asignado'}`);
      console.log(`🔑 Gym Slug: ${user.gym_slug || 'N/A'}`);
      console.log(`📋 Rol: ${user.role || 'Sin rol'}`);
      console.log(`📊 Estado: ${user.is_active ? '✅ Activo' : '❌ Inactivo'}`);
      console.log('══════════════════════════════════════════════════');
    } else {
      console.log('\n❌ Usuario NO encontrado\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkUser();

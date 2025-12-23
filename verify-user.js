const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:DanpBohSbQluYBnEIpTGDoYVCDiUslqG@maglev.proxy.rlwy.net:51300/railway'
});

async function verify() {
  try {
    await client.connect();
    console.log('✅ Conectado\n');

    // Verificar usuario
    const userResult = await client.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, 
              u.hashed_password, gu.role, g.slug as gym_slug, g.name as gym_name
       FROM users u 
       LEFT JOIN gym_users gu ON u.id = gu.user_id 
       LEFT JOIN gyms g ON gu.gym_id = g.id 
       WHERE u.email = $1`,
      ['superadmin@tyme.cl']
    );

    if (userResult.rows.length === 0) {
      console.log('❌ Usuario NO encontrado en la base de datos\n');
    } else {
      console.log('✅ USUARIO ENCONTRADO:');
      console.log('Email:', userResult.rows[0].email);
      console.log('Nombre:', userResult.rows[0].first_name, userResult.rows[0].last_name);
      console.log('Password (primeros 50 chars):', userResult.rows[0].hashed_password?.substring(0, 50) + '...');
      console.log('Rol:', userResult.rows[0].role);
      console.log('Gym:', userResult.rows[0].gym_name, '(slug:', userResult.rows[0].gym_slug + ')');
    }

    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await client.end();
  }
}

verify();

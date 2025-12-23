const pg = require('pg');
const { Client } = pg;

const DATABASE_URL = 'postgresql://postgres:DanpBohSbQluYBnEIpTGDoYVCDiUslqG@maglev.proxy.rlwy.net:51300/railway';

async function checkRole() {
  const client = new Client({ 
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const result = await client.query(`
      SELECT 
        u.email,
        u.full_name,
        gu.role,
        g.name as gym_name
      FROM users u
      INNER JOIN gym_users gu ON gu.user_id = u.id
      INNER JOIN gyms g ON g.id = gu.gym_id
      WHERE u.email = 'juanjacontrerasra@gmail.com'
    `);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log(`\n👤 ${user.full_name} (${user.email})`);
      console.log(`🏢 Gym: ${user.gym_name}`);
      console.log(`\n📋 ROL: ${user.role}`);
      
      if (user.role === 'TRAINER') {
        console.log('\n✅ Es TRAINER (Staff/Entrenador)');
      } else if (user.role === 'CLIENT') {
        console.log('\n✅ Es CLIENT (Cliente)');
      } else {
        console.log(`\n✅ Es ${user.role}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkRole();

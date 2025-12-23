const pg = require('pg');
const { Client } = pg;

const DATABASE_URL = 'postgresql://postgres:DanpBohSbQluYBnEIpTGDoYVCDiUslqG@maglev.proxy.rlwy.net:51300/railway';

async function checkMembership() {
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
        u.is_active,
        gu.id as gym_user_id,
        gu.role,
        m.id as membership_id,
        m.starts_on,
        m.ends_on,
        p.name as plan_name
      FROM users u
      INNER JOIN gym_users gu ON gu.user_id = u.id
      LEFT JOIN memberships m ON m.client_gym_user_id = gu.id
      LEFT JOIN plans p ON p.id = m.plan_id
      WHERE u.email = 'elchoripanbrayan2002@gmail.com'
    `);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('\n══════════════════════════════════════════════════');
      console.log('📊 ESTADO DEL CLIENTE');
      console.log('══════════════════════════════════════════════════');
      console.log(`👤 ${user.full_name} (${user.email})`);
      console.log(`📋 Rol: ${user.role}`);
      console.log(`📊 Usuario Activo: ${user.is_active ? '✅ Sí' : '❌ No'}`);
      console.log('');
      console.log('💳 MEMBRESÍA:');
      if (user.membership_id) {
        console.log(`   ID: ${user.membership_id}`);
        console.log(`   Plan: ${user.plan_name}`);
        console.log(`   Inicio: ${user.starts_on}`);
        console.log(`   Fin: ${user.ends_on}`);
        
        const now = new Date();
        const endDate = new Date(user.ends_on);
        const isExpired = endDate < now;
        
        console.log(`   ${isExpired ? '❌ VENCIDA' : '✅ VIGENTE'}`);
      } else {
        console.log('   ❌ Sin membresía registrada');
      }
      console.log('══════════════════════════════════════════════════');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkMembership();

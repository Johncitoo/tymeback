const pg = require('pg');
const { Client } = pg;

const DATABASE_URL = 'postgresql://postgres:DanpBohSbQluYBnEIpTGDoYVCDiUslqG@maglev.proxy.rlwy.net:51300/railway';

async function createMembership() {
  const client = new Client({ 
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // 1. Obtener gym_user_id y plan
    const gymUserResult = await client.query(`
      SELECT gu.id, gu.gym_id
      FROM gym_users gu
      INNER JOIN users u ON u.id = gu.user_id
      WHERE u.email = 'elchoripanbrayan2002@gmail.com'
    `);

    if (gymUserResult.rows.length === 0) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    const gymUserId = gymUserResult.rows[0].id;
    const gymId = gymUserResult.rows[0].gym_id;

    // 2. Obtener un plan activo
    const planResult = await client.query(`
      SELECT id, name FROM plans WHERE gym_id = $1 AND is_active = true LIMIT 1
    `, [gymId]);

    if (planResult.rows.length === 0) {
      console.log('❌ No hay planes activos en el gym');
      return;
    }

    const planId = planResult.rows[0].id;
    const planName = planResult.rows[0].name;

    // 3. Crear un pago
    const paymentResult = await client.query(`
      INSERT INTO payments (gym_id, client_gym_user_id, amount, method, created_by_user_id, created_at)
      VALUES ($1, $2, 0, 'OTHER', $2, NOW())
      RETURNING id
    `, [gymId, gymUserId]);

    const paymentId = paymentResult.rows[0].id;

    // 4. Crear payment_item
    const paymentItemResult = await client.query(`
      INSERT INTO payment_items (payment_id, type, quantity, unit_price, total_price)
      VALUES ($1, 'MEMBERSHIP', 1, 0, 0)
      RETURNING id
    `, [paymentId]);

    const paymentItemId = paymentItemResult.rows[0].id;

    // 5. Crear membresía (30 días)
    const startsOn = new Date();
    const endsOn = new Date();
    endsOn.setDate(endsOn.getDate() + 30);

    const membershipResult = await client.query(`
      INSERT INTO memberships (gym_id, client_gym_user_id, plan_id, payment_item_id, starts_on, ends_on, sessions_quota, sessions_used)
      VALUES ($1, $2, $3, $4, $5, $6, 999, 0)
      RETURNING id
    `, [gymId, gymUserId, planId, paymentItemId, startsOn.toISOString().split('T')[0], endsOn.toISOString().split('T')[0]]);

    console.log('\n✅ Membresía creada exitosamente\n');
    console.log('══════════════════════════════════════════════════');
    console.log(`📋 ID: ${membershipResult.rows[0].id}`);
    console.log(`👤 Cliente: elchoripanbrayan2002@gmail.com`);
    console.log(`💳 Plan: ${planName}`);
    console.log(`📅 Inicio: ${startsOn.toISOString().split('T')[0]}`);
    console.log(`📅 Fin: ${endsOn.toISOString().split('T')[0]}`);
    console.log(`🏋️ Sesiones: 999 (ilimitadas)`);
    console.log('══════════════════════════════════════════════════');
    console.log('\n✅ Ahora puedes iniciar sesión');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

createMembership();

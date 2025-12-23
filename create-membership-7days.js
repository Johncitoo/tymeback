const pg = require('pg');
const { Client } = pg;

const DATABASE_URL = 'postgresql://postgres:DanpBohSbQluYBnEIpTGDoYVCDiUslqG@maglev.proxy.rlwy.net:51300/railway';

async function createMembershipExpiring7Days() {
  const client = new Client({ 
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // 1. Obtener gym_user_id y gym_id
    const gymUserResult = await client.query(`
      SELECT gu.id, gu.gym_id
      FROM gym_users gu
      INNER JOIN users u ON u.id = gu.user_id
      WHERE u.email = 'elchoripanbrayan2002@gmail.com'
    `);

    const gymUserId = gymUserResult.rows[0].id;
    const gymId = gymUserResult.rows[0].gym_id;

    // 2. Obtener un plan activo
    const planResult = await client.query(`
      SELECT id, name FROM plans WHERE gym_id = $1 AND is_active = true LIMIT 1
    `, [gymId]);

    const planId = planResult.rows[0].id;
    const planName = planResult.rows[0].name;
    const planPrice = 0; // Pago demo

    // 3. Ver estructura de payments
    const paymentColumns = await client.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'payments' ORDER BY ordinal_position
    `);
    
    console.log('Columnas de payments:', paymentColumns.rows.map(r => r.column_name).join(', '));

    // 4. Crear un pago
    const paymentResult = await client.query(`
      INSERT INTO payments (gym_id, total_amount_clp, method, processed_by_gym_user_id, paid_at, created_at)
      VALUES ($1, $2, 'cash', $3, NOW(), NOW())
      RETURNING id
    `, [gymId, planPrice, gymUserId]);

    const paymentId = paymentResult.rows[0].id;

    // 5. Crear payment_item
    const paymentItemResult = await client.query(`
      INSERT INTO payment_items (payment_id, type, quantity, unit_price, total_price)
      VALUES ($1, 'MEMBERSHIP', 1, $2, $2)
      RETURNING id
    `, [paymentId, planPrice]);

    const paymentItemId = paymentItemResult.rows[0].id;

    // 6. Crear membresía que vence en 7 días
    const startsOn = new Date();
    const endsOn = new Date();
    endsOn.setDate(endsOn.getDate() + 7); // 7 días desde hoy

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
    console.log(`📅 Fin: ${endsOn.toISOString().split('T')[0]} (en 7 días)`);
    console.log(`🏋️ Sesiones: 999`);
    console.log('══════════════════════════════════════════════════');
    console.log('\n📧 El sistema enviará correos automáticos:');
    console.log(`   - Hoy (7 días antes): Recordatorio inicial`);
    console.log(`   - ${new Date(Date.now() + 4*24*60*60*1000).toISOString().split('T')[0]}: Recordatorio 3 días antes`);
    console.log(`   - ${new Date(Date.now() + 6*24*60*60*1000).toISOString().split('T')[0]}: Recordatorio 1 día antes (urgente)`);
    console.log(`   - ${endsOn.toISOString().split('T')[0]}: Email de membresía vencida`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

createMembershipExpiring7Days();

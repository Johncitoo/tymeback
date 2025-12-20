const { Client } = require('pg');

async function checkClientsQuery() {
  const db = new Client({
    connectionString: 'postgresql://postgres:DanpBohSbQluYBnEIpTGDoYVCDiUslqG@maglev.proxy.rlwy.net:51300/railway',
  });

  try {
    await db.connect();
    console.log('✅ Conectado a Railway DB');

    const gymId = '0534eb53-544d-48a4-9eca-a2912025c725';

    // Test 1: Ver todos los roles en gym_users
    console.log('\n📋 ROLES en gym_users:');
    const roles = await db.query(`
      SELECT DISTINCT role
      FROM gym_users
      WHERE gym_id = $1
    `, [gymId]);
    console.table(roles.rows);

    // Test 2: Contar clientes
    console.log('\n📊 CLIENTES en la BD:');
    const clientsCount = await db.query(`
      SELECT COUNT(*) as total
      FROM gym_users gu
      INNER JOIN clients c ON c.gym_user_id = gu.id
      WHERE gu.gym_id = $1
    `, [gymId]);
    console.log('Total clientes:', clientsCount.rows[0].total);

    // Test 3: Query completo como en el servicio
    console.log('\n🧪 TEST: Query completo de clients.findAll:');
    const fullQuery = await db.query(`
      SELECT 
        u.id, u.email, u.first_name as "firstName", u.last_name as "lastName",
        u.full_name as "fullName", u.phone, u.rut, u.birth_date as "birthDate",
        u.gender, u.sex, u.address, u.avatar_url as "avatarUrl",
        u.platform_role as "platformRole", u.is_active as "isActive",
        u.created_at as "createdAt", u.updated_at as "updatedAt",
        COUNT(*) OVER() as total
      FROM users u
      INNER JOIN gym_users gu ON gu.user_id = u.id
      INNER JOIN clients c ON c.gym_user_id = gu.id
      WHERE gu.gym_id = $1 
        AND gu.role = $2
        AND u.deleted_at IS NULL
      ORDER BY u.created_at DESC
      LIMIT 10 OFFSET 0
    `, [gymId, 'CLIENT']);

    if (fullQuery.rows.length > 0) {
      console.log(`✅ Query funciona: ${fullQuery.rows.length} clientes`);
      console.log('Primer cliente:', fullQuery.rows[0].fullName || fullQuery.rows[0].firstName);
    } else {
      console.log('⚠️ Query no retorna resultados');
    }

    await db.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await db.end();
  }
}

checkClientsQuery();

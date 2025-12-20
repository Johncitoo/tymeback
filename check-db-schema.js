// Verificar schema real de la BD
const { Client } = require('pg');

const connectionString = 'postgresql://postgres:DanpBohSbQluYBnEIpTGDoYVCDiUslqG@maglev.proxy.rlwy.net:51300/railway';

async function checkSchema() {
  const db = new Client({ connectionString });
  
  try {
    await db.connect();
    console.log('✅ Conectado a Railway DB\n');

    // 1. Ver columnas de tabla users
    console.log('📋 COLUMNAS DE TABLA USERS:');
    const usersCols = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    console.table(usersCols.rows);

    // 2. Ver columnas de tabla gym_users
    console.log('\n📋 COLUMNAS DE TABLA GYM_USERS:');
    const gymUsersCols = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'gym_users'
      ORDER BY ordinal_position
    `);
    console.table(gymUsersCols.rows);

    // 3. Verificar si hay columna 'role' en users
    const hasRole = usersCols.rows.find(c => c.column_name === 'role');
    console.log('\n🔍 ¿Tabla users tiene columna "role"?', hasRole ? '✅ SÍ' : '❌ NO');
    
    if (hasRole) {
      console.log('   Tipo:', hasRole.data_type);
      console.log('   Nullable:', hasRole.is_nullable);
      console.log('\n⚠️  PROBLEMA: La columna role EXISTE en users pero NO debería estar ahí');
      console.log('   Solución: Eliminar columna role de tabla users');
    }

    // 4. Test query simple
    console.log('\n🧪 TEST: SELECT básico de users');
    try {
      const testResult = await db.query('SELECT id, email, first_name, last_name FROM users LIMIT 1');
      console.log('✅ Query básico funciona:', testResult.rows[0]);
    } catch (err) {
      console.log('❌ Error en query:', err.message);
    }

    // 5. Test query con JOIN como hace el backend
    console.log('\n🧪 TEST: Query con JOIN (como en findAll)');
    try {
      const gymId = '0534eb53-544d-48a4-9eca-a2912025c725';
      const testJoin = await db.query(`
        SELECT u.id, u.email, u.first_name, u.last_name, gu.role as gym_role
        FROM users u
        INNER JOIN gym_users gu ON gu.user_id = u.id
        WHERE gu.gym_id = $1
        LIMIT 1
      `, [gymId]);
      console.log('✅ Query JOIN funciona:', testJoin.rows[0]);
    } catch (err) {
      console.log('❌ Error en JOIN:', err.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await db.end();
  }
}

checkSchema();

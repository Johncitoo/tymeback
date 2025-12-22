const { Client } = require('pg');
require('dotenv').config();

async function showPaymentsStructure() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // Mostrar todas las columnas de payments
    console.log('📋 Columnas de la tabla payments:');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'payments'
      ORDER BY ordinal_position;
    `);
    
    console.table(columns.rows);

    // Intentar hacer un SELECT simple
    console.log('\n📋 Probando SELECT simple...');
    const test = await client.query(`SELECT * FROM payments LIMIT 1;`);
    if (test.rows.length > 0) {
      console.log('✅ Columnas disponibles:', Object.keys(test.rows[0]));
    } else {
      console.log('⚠️ No hay registros, pero la tabla existe');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

showPaymentsStructure();

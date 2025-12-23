const { Client } = require('pg');
require('dotenv').config();

async function verifyDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // 1. Verificar columna receipt_file_id en payments
    console.log('📋 1. Verificando columna receipt_file_id en payments...');
    const paymentsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'payments' AND column_name = 'receipt_file_id';
    `);
    if (paymentsColumns.rows.length > 0) {
      console.log('✅ Columna receipt_file_id existe:', paymentsColumns.rows[0]);
    } else {
      console.log('❌ Columna receipt_file_id NO existe');
    }

    // 2. Verificar tabla automated_email_templates
    console.log('\n📋 2. Verificando tabla automated_email_templates...');
    const templatesTable = await client.query(`
      SELECT COUNT(*) as count FROM automated_email_templates;
    `);
    console.log(`✅ Tabla existe con ${templatesTable.rows[0].count} registros`);

    // 3. Verificar tabla mass_emails
    console.log('\n📋 3. Verificando tabla mass_emails...');
    const massEmailsTable = await client.query(`
      SELECT COUNT(*) as count FROM mass_emails;
    `);
    console.log(`✅ Tabla existe con ${massEmailsTable.rows[0].count} registros`);

    // 4. Verificar migraciones registradas
    console.log('\n📋 4. Verificando migraciones registradas...');
    const migrations = await client.query(`
      SELECT name FROM migrations 
      WHERE name LIKE '%Automated%' OR name LIKE '%Receipt%'
      ORDER BY timestamp DESC;
    `);
    console.log('✅ Migraciones registradas:');
    migrations.rows.forEach(row => console.log(`   - ${row.name}`));

    // 5. Test query on payments table
    console.log('\n📋 5. Probando query en payments...');
    const testPayment = await client.query(`
      SELECT id, client_id, membership_id, receipt_file_id, created_at 
      FROM payments 
      LIMIT 1;
    `);
    console.log('✅ Query exitosa, columnas disponibles:', Object.keys(testPayment.rows[0] || {}));

    console.log('\n✅ ¡Todas las verificaciones pasaron correctamente!');
  } catch (error) {
    console.error('\n❌ Error en verificación:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifyDatabase();

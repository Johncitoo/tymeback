const { Client } = require('pg');
require('dotenv').config();

async function finalVerification() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos Railway\n');

    console.log('═══════════════════════════════════════════');
    console.log('  VERIFICACIÓN COMPLETA DE LA BASE DE DATOS');
    console.log('═══════════════════════════════════════════\n');

    // 1. Payments table
    console.log('1️⃣  TABLA PAYMENTS');
    console.log('─────────────────────────────────────────');
    const paymentsCheck = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'payments' AND column_name = 'receipt_file_id';
    `);
    console.log(paymentsCheck.rows.length > 0 ? 
      '✅ Columna receipt_file_id existe' : 
      '❌ Columna receipt_file_id NO existe'
    );
    
    const paymentsCount = await client.query(`SELECT COUNT(*) FROM payments;`);
    console.log(`📊 Total de pagos: ${paymentsCount.rows[0].count}`);

    // 2. Automated email templates table
    console.log('\n2️⃣  TABLA AUTOMATED_EMAIL_TEMPLATES');
    console.log('─────────────────────────────────────────');
    try {
      const templatesCount = await client.query(`SELECT COUNT(*) FROM automated_email_templates;`);
      console.log(`✅ Tabla existe`);
      console.log(`📊 Total de templates: ${templatesCount.rows[0].count}`);
    } catch (err) {
      console.log('❌ Tabla NO existe');
    }

    // 3. Mass emails table
    console.log('\n3️⃣  TABLA MASS_EMAILS');
    console.log('─────────────────────────────────────────');
    try {
      const massEmailsCount = await client.query(`SELECT COUNT(*) FROM mass_emails;`);
      console.log(`✅ Tabla existe`);
      console.log(`📊 Total de mass emails: ${massEmailsCount.rows[0].count}`);
    } catch (err) {
      console.log('❌ Tabla NO existe');
    }

    // 4. Migrations
    console.log('\n4️⃣  MIGRACIONES REGISTRADAS');
    console.log('─────────────────────────────────────────');
    const migrations = await client.query(`
      SELECT name, timestamp FROM migrations 
      WHERE name LIKE '%Automated%' OR name LIKE '%Receipt%' OR name LIKE '%Email%'
      ORDER BY timestamp DESC;
    `);
    if (migrations.rows.length > 0) {
      console.log('✅ Migraciones encontradas:');
      migrations.rows.forEach(row => {
        console.log(`   📝 ${row.name}`);
      });
    } else {
      console.log('⚠️  No se encontraron migraciones relacionadas');
    }

    // 5. Test query payments
    console.log('\n5️⃣  TEST QUERY PAYMENTS');
    console.log('─────────────────────────────────────────');
    try {
      const testQuery = await client.query(`
        SELECT id, gym_id, total_amount_clp, receipt_file_id 
        FROM payments 
        LIMIT 1;
      `);
      console.log('✅ Query SELECT funciona correctamente');
      console.log('📋 Columnas disponibles:', Object.keys(testQuery.rows[0] || {
        id: 'uuid', 
        gym_id: 'uuid', 
        total_amount_clp: 'integer', 
        receipt_file_id: 'uuid'
      }));
    } catch (err) {
      console.log('❌ Error en query:', err.message);
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('  ✅ VERIFICACIÓN COMPLETADA');
    console.log('═══════════════════════════════════════════\n');

    console.log('📋 PRÓXIMOS PASOS:');
    console.log('1. Verificar que Railway haya redesplegado el backend');
    console.log('2. Probar endpoint: GET /api/payments');
    console.log('3. Probar endpoint: GET /api/communications/automated-templates');
    console.log('4. Registrar un pago de prueba en la UI');
    
  } catch (error) {
    console.error('\n❌ Error general:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

finalVerification();

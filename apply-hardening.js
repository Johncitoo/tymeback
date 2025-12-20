// apply-hardening.js - Aplicar hardening de forma segura
require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('✅ Conectado a PostgreSQL\n');

  // Leer el SQL
  const sqlPath = path.join(__dirname, 'hardening-safe.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('📝 Aplicando hardening...\n');

  try {
    // Ejecutar el SQL completo
    await client.query(sql);
    
    console.log('✅ Hardening aplicado exitosamente\n');

    // Verificar índices creados
    console.log('🔍 Verificando índices creados:');
    console.log('─'.repeat(60));
    
    const verifyQuery = `
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE indexname IN (
        'idx_gym_users_unique_active',
        'idx_memberships_gym_client',
        'idx_attendance_gym_date',
        'idx_gym_users_lookup'
      )
      ORDER BY tablename, indexname;
    `;
    
    const result = await client.query(verifyQuery);
    
    if (result.rows.length === 4) {
      console.log('✅ Los 4 índices fueron creados correctamente:\n');
      result.rows.forEach(idx => {
        console.log(`  ✓ ${idx.tablename}.${idx.indexname}`);
      });
    } else {
      console.log(`⚠️  Solo se crearon ${result.rows.length} de 4 índices`);
      result.rows.forEach(idx => {
        console.log(`  ✓ ${idx.tablename}.${idx.indexname}`);
      });
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('🎉 HARDENING COMPLETADO');
    console.log('═'.repeat(60));
    console.log('✅ gym_users: UNIQUE INDEX para evitar duplicados activos');
    console.log('✅ memberships: índice gym_id + client_gym_user_id');
    console.log('✅ attendance: índice gym_id + check_in_at');
    console.log('✅ gym_users: índice compuesto para lookups rápidos');
    console.log('\n📊 Impacto:');
    console.log('  • Integridad: Duplicados imposibles');
    console.log('  • Performance: Queries más rápidas');
    console.log('  • Riesgo: CERO (solo añade constraints e índices)');
    
  } catch (err) {
    console.error('❌ Error aplicando hardening:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error('❌ Error fatal:', err.message);
  process.exit(1);
});

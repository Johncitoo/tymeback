/**
 * Script para limpiar TODAS las URLs públicas de la base de datos
 * Con Opción A (bucket privado), NO guardamos URLs - todo on-demand via signed URLs
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('rlwy.net') ? { rejectUnauthorized: false } : false
});

async function cleanAllPublicUrls() {
  const client = await pool.connect();
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    
    // 1. Limpiar todas las public_url de files
    console.log('\n🧹 Limpiando public_url de TODOS los archivos...');
    const filesResult = await client.query(
      `UPDATE files 
       SET public_url = NULL 
       WHERE public_url IS NOT NULL
       RETURNING id, purpose, original_name`
    );
    
    console.log(`✅ ${filesResult.rowCount} archivos limpiados`);
    if (filesResult.rows.length > 0) {
      const grouped = {};
      filesResult.rows.forEach(row => {
        grouped[row.purpose] = (grouped[row.purpose] || 0) + 1;
      });
      console.log('\n📊 Por tipo:');
      Object.entries(grouped).forEach(([purpose, count]) => {
        console.log(`   - ${purpose}: ${count}`);
      });
    }
    
    // 2. Limpiar avatar_url de users
    console.log('\n👤 Limpiando avatar_url de usuarios...');
    const usersResult = await client.query(
      `UPDATE users 
       SET avatar_url = NULL 
       WHERE avatar_url IS NOT NULL
       RETURNING id, first_name, last_name, email`
    );
    
    console.log(`✅ ${usersResult.rowCount} usuarios actualizados`);
    if (usersResult.rows.length > 0) {
      usersResult.rows.slice(0, 10).forEach(row => {
        console.log(`   - ${row.first_name} ${row.last_name} (${row.email})`);
      });
      if (usersResult.rows.length > 10) {
        console.log(`   ... y ${usersResult.rows.length - 10} más`);
      }
    }
    
    console.log('\n✅ Limpieza completada');
    console.log('\n📋 Resumen:');
    console.log(`   - ${filesResult.rowCount} archivos sin public_url`);
    console.log(`   - ${usersResult.rowCount} usuarios sin avatar_url`);
    console.log('\n🔐 Ahora TODO usa signed URLs temporales:');
    console.log('   - Cada acceso requiere JWT + validación gym_id');
    console.log('   - URLs válidas por 10 minutos');
    console.log('   - Frontend usa hooks con auto-renovación');
    console.log('\n📝 Próximo paso:');
    console.log('   - Actualizar UserManager.tsx para usar useFileUrl hook');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

cleanAllPublicUrls();

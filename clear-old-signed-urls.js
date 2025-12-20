/**
 * Script para limpiar URLs firmadas antiguas de la base de datos
 * Con la nueva arquitectura, NO guardamos signed URLs en la BD
 * Solo archivos públicos (AVATAR, EXERCISE_IMAGE, MACHINE_IMAGE) pueden tener URL estática
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('rlwy.net') ? { rejectUnauthorized: false } : false
});

async function clearOldSignedUrls() {
  const client = await pool.connect();
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    
    // 1. Limpiar URLs firmadas de archivos privados (CERTIFICATE, INBODY_PDF, etc.)
    console.log('\n🔒 Limpiando URLs de archivos privados...');
    const privatePurposes = ['CERTIFICATE', 'INBODY_PDF', 'PROGRESS_PHOTO', 'PROOF', 'DOCUMENT', 'OTHER'];
    
    const privateResult = await client.query(
      `UPDATE files 
       SET public_url = NULL 
       WHERE purpose = ANY($1) 
       AND public_url IS NOT NULL
       RETURNING id, original_name, purpose`,
      [privatePurposes]
    );
    
    console.log(`✅ ${privateResult.rowCount} archivos privados limpiados`);
    if (privateResult.rows.length > 0) {
      privateResult.rows.slice(0, 5).forEach(row => {
        console.log(`   - ${row.purpose}: ${row.original_name}`);
      });
      if (privateResult.rows.length > 5) {
        console.log(`   ... y ${privateResult.rows.length - 5} más`);
      }
    }
    
    // 2. Convertir URLs firmadas de archivos públicos a URLs estáticas
    console.log('\n🌐 Convirtiendo URLs de archivos públicos a formato estático...');
    const publicPurposes = ['AVATAR', 'EXERCISE_IMAGE', 'MACHINE_IMAGE'];
    
    const publicFiles = await client.query(
      `SELECT id, storage_bucket, storage_key, public_url, purpose, original_name
       FROM files 
       WHERE purpose = ANY($1) 
       AND public_url IS NOT NULL
       AND public_url LIKE '%X-Goog-%'`,
      [publicPurposes]
    );
    
    console.log(`📁 Encontrados ${publicFiles.rowCount} archivos públicos con signed URLs`);
    
    let converted = 0;
    for (const file of publicFiles.rows) {
      // Generar URL estática
      const staticUrl = `https://storage.googleapis.com/${file.storage_bucket}/${encodeURIComponent(file.storage_key)}`;
      
      await client.query(
        'UPDATE files SET public_url = $1 WHERE id = $2',
        [staticUrl, file.id]
      );
      
      converted++;
      console.log(`   ✅ ${file.purpose}: ${file.original_name}`);
      console.log(`      ${staticUrl.substring(0, 80)}...`);
    }
    
    console.log(`\n✅ ${converted} archivos públicos convertidos a URLs estáticas`);
    
    // 3. Actualizar users.avatar_url con las URLs estáticas
    console.log('\n👤 Actualizando avatares de usuarios...');
    
    // Primero, obtener el mapping de storage_key a avatar_url
    const avatarFiles = await client.query(
      `SELECT storage_key, public_url 
       FROM files 
       WHERE purpose = 'AVATAR' 
       AND public_url IS NOT NULL`
    );
    
    let userUpdatesCount = 0;
    for (const file of avatarFiles.rows) {
      // Actualizar usuarios que tengan esta URL en su avatar_url
      const result = await client.query(
        `UPDATE users 
         SET avatar_url = $1 
         WHERE avatar_url LIKE '%' || $2 || '%'
         RETURNING id, first_name, last_name`,
        [file.public_url, file.storage_key.split('/').pop()] // último segmento del path
      );
      
      if (result.rowCount > 0) {
        userUpdatesCount += result.rowCount;
        result.rows.forEach(row => {
          console.log(`   ✅ ${row.first_name} ${row.last_name}`);
        });
      }
    }
    
    console.log(`✅ ${userUpdatesCount} usuarios actualizados`);
    
    console.log('\n🎉 Limpieza completada');
    console.log('\n📋 Resumen:');
    console.log(`   - ${privateResult.rowCount} archivos privados sin URL pública`);
    console.log(`   - ${converted} archivos públicos con URL estática`);
    console.log(`   - ${userUpdatesCount} avatares de usuarios actualizados`);
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   - Los archivos privados ahora requieren signed URLs temporales');
    console.log('   - Usa GET /files/:id/download-url para obtener URLs de descarga');
    console.log('   - Las URLs estáticas de archivos públicos solo funcionarán si el bucket es público');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

clearOldSignedUrls();

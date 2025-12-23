/**
 * Script mejorado para relacionar avatares con usuarios
 */
require('dotenv').config();
const { Client } = require('pg');

async function fixAvatars() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Conectado\n');

    // Buscar usuarios con avatar_url
    const usersResult = await client.query(`
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.avatar_url,
        gu.gym_id
      FROM users u
      INNER JOIN gym_users gu ON gu.user_id = u.id
      WHERE u.avatar_url IS NOT NULL
      ORDER BY u.created_at DESC
    `);

    console.log(`📊 ${usersResult.rows.length} usuarios con avatar_url\n`);

    let fixed = 0;

    for (const user of usersResult.rows) {
      console.log(`👤 ${user.full_name} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   URL: ${user.avatar_url}`);

      // Decodificar URL y extraer storage_key
      const decoded = decodeURIComponent(user.avatar_url);
      const match = decoded.match(/tyme-dev-uploads\/(.+?)(\?|$)/);
      
      if (match) {
        const storageKey = match[1];
        console.log(`   Storage: ${storageKey}`);

        // Buscar archivo
        const fileResult = await client.query(
          `SELECT id, uploaded_by_user_id FROM files WHERE gym_id = $1 AND storage_key = $2 AND purpose = 'AVATAR'`,
          [user.gym_id, storageKey]
        );

        if (fileResult.rows.length > 0) {
          const file = fileResult.rows[0];
          console.log(`   ✅ Archivo encontrado: ${file.id}`);
          console.log(`   Current owner: ${file.uploaded_by_user_id || 'NULL'}`);

          if (file.uploaded_by_user_id !== user.id) {
            await client.query(
              'UPDATE files SET uploaded_by_user_id = $1 WHERE id = $2',
              [user.id, file.id]
            );
            console.log(`   🔧 Actualizado a owner = ${user.id}`);
            fixed++;
          } else {
            console.log(`   ✓  Ya es owner correcto`);
          }
        } else {
          console.log(`   ❌ Archivo no encontrado`);
        }
      } else {
        console.log(`   ⚠️  No se pudo extraer storage_key`);
      }

      console.log('');
    }

    console.log(`\n📊 Actualizados: ${fixed} archivos`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

fixAvatars();

/**
 * Script para arreglar uploaded_by_user_id de avatares existentes
 * Relaciona archivos de avatar con sus usuarios basándose en avatar_url
 */
require('dotenv').config();
const { Client } = require('pg');

async function fixAvatarOwnership() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔌 Conectando a la base de datos...');
    await client.connect();
    console.log('✅ Conectado\n');

    // 1. Buscar usuarios con avatar_url pero sin avatar file asociado
    console.log('🔍 Buscando usuarios con avatares sin ownership...\n');
    
    const usersResult = await client.query(`
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.avatar_url,
        f.id as file_id,
        f.uploaded_by_user_id
      FROM users u
      LEFT JOIN gym_users gu ON gu.user_id = u.id
      LEFT JOIN files f ON 
        f.gym_id = gu.gym_id 
        AND f.purpose = 'AVATAR'
        AND f.storage_key LIKE '%' || SUBSTRING(u.avatar_url FROM '[^/]+$') || '%'
      WHERE u.avatar_url IS NOT NULL
      ORDER BY u.created_at DESC
    `);

    if (usersResult.rows.length === 0) {
      console.log('✅ No hay usuarios con avatares por arreglar');
      return;
    }

    console.log(`📊 Encontrados ${usersResult.rows.length} usuarios con avatar_url:\n`);

    let fixed = 0;
    let alreadyOk = 0;
    let notFound = 0;

    for (const row of usersResult.rows) {
      const status = row.file_id 
        ? (row.uploaded_by_user_id === row.id ? '✅ OK' : '⚠️ Diferente owner')
        : '❌ Archivo no encontrado';
      
      console.log(`${status} ${row.full_name} (${row.email})`);
      console.log(`   User ID: ${row.id}`);
      console.log(`   Avatar URL: ${row.avatar_url}`);
      console.log(`   File ID: ${row.file_id || 'N/A'}`);
      console.log(`   Owner: ${row.uploaded_by_user_id || 'NULL'}`);

      if (row.file_id && row.uploaded_by_user_id !== row.id) {
        // Actualizar ownership
        await client.query(
          'UPDATE files SET uploaded_by_user_id = $1 WHERE id = $2',
          [row.id, row.file_id]
        );
        console.log(`   🔧 Actualizado a owner = ${row.id}`);
        fixed++;
      } else if (row.file_id) {
        alreadyOk++;
      } else {
        notFound++;
      }
      
      console.log('');
    }

    console.log('\n📊 RESUMEN:');
    console.log(`   ✅ Actualizados: ${fixed}`);
    console.log(`   ✓  Ya correctos: ${alreadyOk}`);
    console.log(`   ❌ Archivo no encontrado: ${notFound}`);
    console.log(`   📝 Total procesados: ${usersResult.rows.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Desconectado');
  }
}

fixAvatarOwnership();

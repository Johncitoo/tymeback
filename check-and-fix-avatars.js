// Verificar y actualizar avatarUrl para usuarios con archivos de avatar
require('dotenv').config();
const { Client } = require('pg');

async function checkAndFixAvatars() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔌 Conectando a la base de datos...');
    await client.connect();
    console.log('✅ Conectado');

    // 1. Ver usuarios con sus avatarUrl actuales
    console.log('\n📋 Usuarios actuales y sus avatarUrl:');
    const users = await client.query(`
      SELECT id, first_name, last_name, email, avatar_url 
      FROM users 
      ORDER BY first_name, last_name
      LIMIT 20;
    `);
    
    console.log(`\nEncontrados ${users.rows.length} usuarios:`);
    users.rows.forEach(user => {
      console.log(`  ${user.first_name} ${user.last_name}: ${user.avatar_url || '(sin avatar)'}`);
    });

    // 2. Ver archivos de tipo AVATAR
    console.log('\n📁 Archivos de tipo AVATAR en el sistema:');
    const files = await client.query(`
      SELECT 
        f.id,
        f.original_name,
        f.public_url,
        f.storage_key,
        f.uploaded_by_user_id,
        u.first_name,
        u.last_name
      FROM files f
      LEFT JOIN users u ON f.uploaded_by_user_id = u.id
      WHERE f.purpose = 'AVATAR' AND f.status = 'READY'
      ORDER BY f.created_at DESC;
    `);

    console.log(`\nEncontrados ${files.rows.length} archivos de avatar:`);
    files.rows.forEach(file => {
      console.log(`  ${file.original_name}`);
      console.log(`    Subido por: ${file.first_name} ${file.last_name || '(usuario eliminado)'}`);
      console.log(`    URL: ${file.public_url}`);
      console.log(`    User ID: ${file.uploaded_by_user_id}`);
      console.log('');
    });

    // 3. Buscar si hay usuarios con archivos AVATAR pero sin avatarUrl asignado
    console.log('\n🔍 Buscando desajustes...');
    const mismatches = await client.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.avatar_url,
        f.public_url as file_public_url,
        f.id as file_id
      FROM users u
      INNER JOIN files f ON f.uploaded_by_user_id = u.id
      WHERE f.purpose = 'AVATAR' 
        AND f.status = 'READY'
        AND (u.avatar_url IS NULL OR u.avatar_url != f.public_url)
      ORDER BY f.created_at DESC;
    `);

    if (mismatches.rows.length > 0) {
      console.log(`\n⚠️ Encontrados ${mismatches.rows.length} usuarios con archivos de avatar pero sin avatarUrl correcto:`);
      mismatches.rows.forEach(m => {
        console.log(`  ${m.first_name} ${m.last_name} (${m.email})`);
        console.log(`    avatar_url actual: ${m.avatar_url || '(null)'}`);
        console.log(`    archivo disponible: ${m.file_public_url}`);
      });

      // Preguntar si queremos actualizar
      console.log('\n❓ ¿Actualizar estos usuarios con sus avatares correctos?');
      console.log('   Ejecuta: UPDATE users SET avatar_url = files.public_url FROM files WHERE...');
      
      // Auto-fix (comentar si no quieres que se ejecute automáticamente)
      console.log('\n🔧 Actualizando avatarUrl...');
      const updateResult = await client.query(`
        UPDATE users u
        SET avatar_url = f.public_url
        FROM files f
        WHERE f.uploaded_by_user_id = u.id
          AND f.purpose = 'AVATAR'
          AND f.status = 'READY'
          AND (u.avatar_url IS NULL OR u.avatar_url != f.public_url)
        RETURNING u.id, u.first_name, u.last_name, u.avatar_url;
      `);

      console.log(`✅ Actualizados ${updateResult.rows.length} usuarios:`);
      updateResult.rows.forEach(u => {
        console.log(`  ${u.first_name} ${u.last_name}: ${u.avatar_url}`);
      });
    } else {
      console.log('✅ Todos los usuarios tienen sus avatares correctamente asignados');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Conexión cerrada');
  }
}

checkAndFixAvatars();

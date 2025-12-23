// Script para asignar avatar existente a un usuario
require('dotenv').config();
const { Client } = require('pg');

const USER_EMAIL = process.argv[2]; // Email del usuario
const FILE_ID = process.argv[3]; // ID del archivo de avatar

if (!USER_EMAIL || !FILE_ID) {
  console.log('');
  console.log('Uso: node assign-avatar.js <email_usuario> <file_id>');
  console.log('');
  console.log('Ejemplo: node assign-avatar.js estudiante@ejemplo.com dea0fc51-b8de-45dc-8f75-1eff1031734e');
  console.log('');
  process.exit(1);
}

async function assignAvatar() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔌 Conectando a la base de datos...');
    await client.connect();
    console.log('✅ Conectado\n');

    // 1. Buscar usuario
    console.log(`🔍 Buscando usuario: ${USER_EMAIL}`);
    const userResult = await client.query(
      'SELECT id, first_name, last_name, email, avatar_url FROM users WHERE email = $1',
      [USER_EMAIL]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ Usuario no encontrado');
      process.exit(1);
    }

    const user = userResult.rows[0];
    console.log(`✅ Usuario encontrado: ${user.first_name} ${user.last_name}`);
    console.log(`   Avatar actual: ${user.avatar_url || '(sin avatar)'}\n`);

    // 2. Buscar archivo
    console.log(`🔍 Buscando archivo: ${FILE_ID}`);
    const fileResult = await client.query(
      'SELECT id, original_name, public_url, purpose, status FROM files WHERE id = $1',
      [FILE_ID]
    );

    if (fileResult.rows.length === 0) {
      console.log('❌ Archivo no encontrado');
      process.exit(1);
    }

    const file = fileResult.rows[0];
    console.log(`✅ Archivo encontrado: ${file.original_name}`);
    console.log(`   Purpose: ${file.purpose}`);
    console.log(`   Status: ${file.status}`);
    console.log(`   URL: ${file.public_url}\n`);

    if (file.purpose !== 'AVATAR') {
      console.log('⚠️  Advertencia: El archivo no es de tipo AVATAR');
    }

    if (file.status !== 'READY') {
      console.log('❌ El archivo no está listo (status no es READY)');
      process.exit(1);
    }

    // 3. Actualizar usuario
    console.log('📝 Actualizando avatarUrl del usuario...');
    await client.query(
      'UPDATE users SET avatar_url = $1 WHERE id = $2',
      [file.public_url, user.id]
    );

    // 4. Actualizar uploaded_by_user_id del archivo si es null
    if (!file.uploaded_by_user_id) {
      console.log('📝 Asignando ownership del archivo al usuario...');
      await client.query(
        'UPDATE files SET uploaded_by_user_id = $1 WHERE id = $2',
        [user.id, file.id]
      );
    }

    console.log('✅ Avatar asignado correctamente\n');
    
    // 5. Verificar
    const verifyResult = await client.query(
      'SELECT first_name, last_name, email, avatar_url FROM users WHERE id = $1',
      [user.id]
    );
    
    const updated = verifyResult.rows[0];
    console.log('📋 Usuario actualizado:');
    console.log(`   Nombre: ${updated.first_name} ${updated.last_name}`);
    console.log(`   Email: ${updated.email}`);
    console.log(`   Avatar: ${updated.avatar_url}`);
    console.log('');
    console.log('🎉 ¡Listo! Refresca la página para ver el avatar');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

assignAvatar();

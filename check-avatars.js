/**
 * Script para ver todos los archivos AVATAR y usuarios con avatar_url
 */
require('dotenv').config();
const { Client } = require('pg');

async function checkAvatars() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Conectado\n');

    // 1. Archivos AVATAR
    console.log('📁 ARCHIVOS AVATAR:');
    console.log('='.repeat(80));
    const filesResult = await client.query(`
      SELECT 
        id,
        gym_id,
        uploaded_by_user_id,
        storage_key,
        original_name,
        status,
        created_at
      FROM files
      WHERE purpose = 'AVATAR'
      ORDER BY created_at DESC
    `);

    for (const file of filesResult.rows) {
      console.log(`\nID: ${file.id}`);
      console.log(`Gym: ${file.gym_id}`);
      console.log(`Owner: ${file.uploaded_by_user_id || 'NULL ❌'}`);
      console.log(`Storage: ${file.storage_key}`);
      console.log(`Original: ${file.original_name}`);
      console.log(`Status: ${file.status}`);
      console.log(`Created: ${file.created_at}`);
    }

    console.log('\n\n👤 USUARIOS CON AVATAR_URL:');
    console.log('='.repeat(80));
    const usersResult = await client.query(`
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.avatar_url,
        gu.gym_id
      FROM users u
      LEFT JOIN gym_users gu ON gu.user_id = u.id
      WHERE u.avatar_url IS NOT NULL
      ORDER BY u.created_at DESC
    `);

    for (const user of usersResult.rows) {
      console.log(`\nID: ${user.id}`);
      console.log(`Name: ${user.full_name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Gym: ${user.gym_id}`);
      console.log(`Avatar URL: ${user.avatar_url}`);
      
      // Extraer nombre de archivo
      const match = user.avatar_url.match(/([^\/]+)\.(jpg|jpeg|png|webp)/i);
      if (match) {
        console.log(`Filename pattern: *${match[1]}*`);
      }
    }

    console.log('\n\n📊 RESUMEN:');
    console.log(`Archivos AVATAR: ${filesResult.rows.length}`);
    console.log(`Usuarios con avatar_url: ${usersResult.rows.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkAvatars();

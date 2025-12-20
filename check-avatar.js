require('dotenv').config();
const { Client } = require('pg');

async function checkAvatar() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.avatar_url,
        (SELECT COUNT(*) FROM files WHERE uploaded_by_user_id = u.id) as files_count
      FROM users u
      INNER JOIN gym_users gu ON gu.user_id = u.id
      WHERE gu.gym_id = '68703e85-cfb2-441d-b00c-b4217b39416d'
        AND gu.role = 'CLIENT'
      ORDER BY u.created_at DESC
      LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ Cliente encontrado:');
      console.log(`   Nombre: ${user.first_name} ${user.last_name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Avatar: ${user.avatar_url ? '✅ SÍ TIENE' : '❌ NO TIENE'}`);
      console.log(`   Archivos: ${user.files_count}`);
      
      if (user.avatar_url) {
        console.log(`\n📸 URL del avatar:`);
        console.log(`   ${user.avatar_url}`);
      }
    } else {
      console.log('❌ No se encontró el cliente');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkAvatar();

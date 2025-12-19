// Verificar datos exactos en Railway
const { Client } = require('pg');

const connectionString = 'postgresql://postgres:DanpBohSbQluYBnEIpTGDoYVCDiUslqG@maglev.proxy.rlwy.net:51300/railway';

async function checkData() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Conectado a Railway DB\n');

    // Check gym
    const gym = await client.query("SELECT id, name, slug, is_active FROM gyms WHERE slug = 'tyme-demo'");
    console.log('🏢 GYM:');
    console.log(gym.rows[0] || 'NO ENCONTRADO');
    
    // Check user
    const user = await client.query("SELECT id, email, first_name, last_name, is_active, LEFT(hashed_password, 50) as hash_preview FROM users WHERE email = 'admin@tyme.demo'");
    console.log('\n👤 USER:');
    console.log(user.rows[0] || 'NO ENCONTRADO');
    
    // Check gym_users
    if (gym.rows.length > 0 && user.rows.length > 0) {
      const gymUser = await client.query(
        "SELECT id, role, is_active FROM gym_users WHERE user_id = $1 AND gym_id = $2",
        [user.rows[0].id, gym.rows[0].id]
      );
      console.log('\n🔗 GYM_USERS:');
      console.log(gymUser.rows[0] || 'NO ENCONTRADO');
    }

    // Verificar si el hash es correcto probando con crypto
    if (user.rows.length > 0 && user.rows[0].hash_preview) {
      const fullUser = await client.query("SELECT hashed_password FROM users WHERE email = 'admin@tyme.demo'");
      const storedHash = fullUser.rows[0].hashed_password;
      
      console.log('\n🔐 PASSWORD CHECK:');
      console.log('Stored hash format:', storedHash.substring(0, 20) + '...');
      
      // Verificar con crypto
      const crypto = require('crypto');
      const password = 'Admin123';
      const match = storedHash.match(/^pbkdf2\$(\d+)\$([a-f0-9]+)\$([a-f0-9]+)$/i);
      
      if (match) {
        const iterations = parseInt(match[1]);
        const salt = match[2];
        const hash = match[3];
        
        const testHash = crypto.pbkdf2Sync(password, salt, iterations, hash.length / 2, 'sha512').toString('hex');
        const matches = testHash === hash;
        
        console.log('Password "Admin123" matches:', matches ? '✅ SI' : '❌ NO');
      } else {
        console.log('❌ Hash format invalid');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkData();

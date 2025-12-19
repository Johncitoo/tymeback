// Actualizar password hash a pbkdf2
const { Client } = require('pg');
const crypto = require('crypto');

const connectionString = 'postgresql://postgres:DanpBohSbQluYBnEIpTGDoYVCDiUslqG@maglev.proxy.rlwy.net:51300/railway';

function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(plain, salt, 100000, 64, 'sha512').toString('hex');
  return `pbkdf2$100000$${salt}$${hash}`;
}

async function updatePassword() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Conectado a Railway DB\n');

    const password = 'Admin123';
    const newHash = hashPassword(password);
    
    console.log('🔐 Generando nuevo hash pbkdf2...');
    console.log('Password:', password);
    console.log('Hash:', newHash.substring(0, 50) + '...\n');

    // Actualizar el hash
    const result = await client.query(
      "UPDATE users SET hashed_password = $1, updated_at = NOW() WHERE email = 'admin@tyme.demo' RETURNING id, email",
      [newHash]
    );

    if (result.rows.length > 0) {
      console.log('✅ Password actualizado para:', result.rows[0].email);
      console.log('   User ID:', result.rows[0].id);
      
      // Verificar que funciona
      const user = await client.query("SELECT hashed_password FROM users WHERE email = 'admin@tyme.demo'");
      const storedHash = user.rows[0].hashed_password;
      
      const match = storedHash.match(/^pbkdf2\$(\d+)\$([a-f0-9]+)\$([a-f0-9]+)$/i);
      if (match) {
        const iterations = parseInt(match[1]);
        const salt = match[2];
        const hash = match[3];
        
        const testHash = crypto.pbkdf2Sync(password, salt, iterations, hash.length / 2, 'sha512').toString('hex');
        const matches = testHash === hash;
        
        console.log('\n✅ Verificación: Password "Admin123" matches:', matches ? '✅ SI' : '❌ NO');
      }
      
      console.log('\n🎉 Ahora puedes hacer login con:');
      console.log('   gymSlug: tyme-demo');
      console.log('   login: admin@tyme.demo');
      console.log('   password: Admin123');
    } else {
      console.log('❌ No se encontró el usuario');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

updatePassword();

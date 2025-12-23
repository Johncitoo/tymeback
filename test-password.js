const crypto = require('crypto');
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:DanpBohSbQluYBnEIpTGDoYVCDiUslqG@maglev.proxy.rlwy.net:51300/railway'
});

function verifyPbkdf2(plain, stored) {
  if (!stored || !stored.startsWith('pbkdf2$')) return false;
  const parts = stored.split('$');
  if (parts.length !== 4) return false;
  
  const iterations = parseInt(parts[1], 10);
  const salt = parts[2];
  const hash = parts[3];
  
  const calc = crypto
    .pbkdf2Sync(plain, salt, iterations, hash.length / 2, 'sha512')
    .toString('hex');
  
  return crypto.timingSafeEqual(Buffer.from(calc, 'hex'), Buffer.from(hash, 'hex'));
}

async function testPassword() {
  try {
    await client.connect();
    console.log('✅ Conectado\n');

    // Obtener usuario
    const result = await client.query(
      'SELECT email, hashed_password FROM users WHERE email = $1',
      ['superadmin@tyme.cl']
    );

    if (result.rows.length === 0) {
      console.log('❌ Usuario no encontrado');
      await client.end();
      return;
    }

    const user = result.rows[0];
    console.log('Usuario:', user.email);
    console.log('Hash guardado:', user.hashed_password.substring(0, 50) + '...\n');

    // Probar contraseñas
    const passwords = [
      'SuperAdmin123!',
      'superadmin123!',
      'SuperAdmin123',
    ];

    for (const pwd of passwords) {
      const isValid = verifyPbkdf2(pwd, user.hashed_password);
      console.log(`Probando "${pwd}":`, isValid ? '✅ VÁLIDA' : '❌ Inválida');
    }

    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await client.end();
  }
}

testPassword();

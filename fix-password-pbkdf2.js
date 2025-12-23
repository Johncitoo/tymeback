const pg = require('pg');
const crypto = require('crypto');
const { Client } = pg;

const DATABASE_URL = 'postgresql://postgres:DanpBohSbQluYBnEIpTGDoYVCDiUslqG@maglev.proxy.rlwy.net:51300/railway';

// Función EXACTA del backend NestJS
function hashPassword(plain) {
  const iterations = 100000;
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(plain, salt, iterations, 64, 'sha512')
    .toString('hex');
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

async function fixPassword() {
  const client = new Client({ 
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔌 Conectado a Railway...\n');

    const newPassword = 'apocalipto11';
    const correctHash = hashPassword(newPassword);

    const result = await client.query(`
      UPDATE users 
      SET hashed_password = $1 
      WHERE email = 'juanjacontrerasra@gmail.com'
      RETURNING id, email, full_name
    `, [correctHash]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ Contraseña actualizada correctamente');
      console.log('');
      console.log('══════════════════════════════════════════════════');
      console.log('🔑 CREDENCIALES ACTUALIZADAS');
      console.log('══════════════════════════════════════════════════');
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${newPassword}`);
      console.log(`   Gym: tyme`);
      console.log('══════════════════════════════════════════════════');
      console.log('');
      console.log('✅ Ahora puedes iniciar sesión en el frontend');
    } else {
      console.log('❌ Usuario no encontrado');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

fixPassword();

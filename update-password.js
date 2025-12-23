const { Client } = require('pg');
const bcrypt = require('bcrypt');

const connectionString = 'postgresql://postgres:DanpBohSbQluYBnEIpTGDoYVCDiUslqG@maglev.proxy.rlwy.net:51300/railway';

async function updatePassword() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('🔌 Conectado a Railway...');

    const email = 'juanjacontrerasra@gmail.com';
    const newPassword = 'apocalipto11';
    
    // Hashear la contraseña (mismo proceso que el backend)
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña del usuario
    const result = await client.query(
      `UPDATE users SET hashed_password = $1 WHERE email = $2 RETURNING id, email, first_name, last_name`,
      [hashedPassword, email]
    );

    if (result.rows.length > 0) {
      console.log('✅ Contraseña actualizada exitosamente');
      console.log(`   Usuario: ${result.rows[0].first_name} ${result.rows[0].last_name}`);
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`   Nueva contraseña: ${newPassword}`);
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

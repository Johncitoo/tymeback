const { Client } = require('pg');
const crypto = require('crypto');

const client = new Client({
  connectionString: 'postgresql://postgres:DanpBohSbQluYBnEIpTGDoYVCDiUslqG@maglev.proxy.rlwy.net:51300/railway'
});

function hashPassword(password) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `pbkdf2$100000$${salt}$${hash}`;
}

async function createAdmin() {
  try {
    await client.connect();
    console.log('✅ Conectado\n');

    // Obtener gym TYME
    const gymResult = await client.query(
      "SELECT id FROM gyms WHERE slug = 'tyme'"
    );
    
    if (gymResult.rows.length === 0) {
      console.log('❌ Gym TYME no existe');
      await client.end();
      return;
    }
    
    const gymId = gymResult.rows[0].id;
    console.log('✅ Gym TYME encontrado:', gymId);

    // Crear usuario admin@tyme.cl
    const email = 'admin@tyme.cl';
    const password = 'AdminTyme123!';
    const hashedPassword = hashPassword(password);

    // Verificar si ya existe
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    let userId;
    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
      console.log('⚠️  Usuario ya existe, actualizando password...');
      await client.query(
        'UPDATE users SET hashed_password = $1, is_active = true WHERE id = $2',
        [hashedPassword, userId]
      );
      console.log('✅ Password actualizado');
    } else {
      console.log('⚠️  Usuario no existe, creándolo...');
      const newUser = await client.query(
        `INSERT INTO users (id, email, first_name, last_name, hashed_password, is_active, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, 'Admin', 'TYME', $2, true, NOW(), NOW())
         RETURNING id`,
        [email, hashedPassword]
      );
      userId = newUser.rows[0].id;
      console.log('✅ Usuario creado:', userId);
    }

    // Crear/actualizar gym_users entry con rol ADMIN
    const gymUserCheck = await client.query(
      'SELECT id FROM gym_users WHERE user_id = $1 AND gym_id = $2',
      [userId, gymId]
    );

    if (gymUserCheck.rows.length > 0) {
      await client.query(
        `UPDATE gym_users SET role = 'ADMIN', is_active = true WHERE user_id = $1 AND gym_id = $2`,
        [userId, gymId]
      );
      console.log('✅ gym_users actualizado a ADMIN');
    } else {
      await client.query(
        `INSERT INTO gym_users (id, gym_id, user_id, role, is_active, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, 'ADMIN', true, NOW(), NOW())`,
        [gymId, userId]
      );
      console.log('✅ gym_users creado con rol ADMIN');
    }

    console.log('\n✅✅✅ ADMIN CREADO EXITOSAMENTE ✅✅✅');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Rol: ADMIN');
    console.log('Gym: TYME (tyme)');

    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await client.end();
  }
}

createAdmin();

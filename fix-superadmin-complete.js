const { Client } = require('pg');
const crypto = require('crypto');
const fetch = require('node-fetch');

const client = new Client({
  connectionString: 'postgresql://postgres:DanpBohSbQluYBnEIpTGDoYVCDiUslqG@maglev.proxy.rlwy.net:51300/railway'
});

function hashPassword(password) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `pbkdf2$100000$${salt}$${hash}`;
}

async function fixEverything() {
  try {
    await client.connect();
    console.log('✅ Conectado a PostgreSQL\n');

    // 1. ASEGURAR QUE EL GYM 'tyme' EXISTE Y ESTÁ ACTIVO
    console.log('🔧 Verificando gym tyme...');
    let gymResult = await client.query(
      "SELECT id, name, slug, is_active FROM gyms WHERE slug = 'tyme'"
    );

    let gymId;
    if (gymResult.rows.length === 0) {
      console.log('⚠️  Gym no existe, creándolo...');
      const newGymResult = await client.query(
        `INSERT INTO gyms (id, name, slug, is_active, created_at, updated_at)
         VALUES (gen_random_uuid(), 'TYME Gym', 'tyme', true, NOW(), NOW())
         RETURNING id, name, slug, is_active`
      );
      gymId = newGymResult.rows[0].id;
      console.log('✅ Gym creado:', newGymResult.rows[0]);
    } else {
      gymId = gymResult.rows[0].id;
      // Asegurar que está activo
      if (!gymResult.rows[0].is_active) {
        await client.query("UPDATE gyms SET is_active = true WHERE slug = 'tyme'");
        console.log('✅ Gym reactivado');
      } else {
        console.log('✅ Gym existe y está activo:', gymResult.rows[0]);
      }
    }

    // 2. CREAR/ACTUALIZAR USUARIO SUPERADMIN
    console.log('\n🔧 Verificando usuario superadmin@tyme.cl...');
    const email = 'superadmin@tyme.cl';
    const password = 'SuperAdmin123!';
    const hashedPassword = hashPassword(password);

    let userResult = await client.query(
      'SELECT id, email, is_active FROM users WHERE email = $1',
      [email]
    );

    let userId;
    if (userResult.rows.length === 0) {
      console.log('⚠️  Usuario no existe, creándolo...');
      const newUserResult = await client.query(
        `INSERT INTO users (id, email, first_name, last_name, hashed_password, is_active, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, 'Super', 'Admin', $2, true, NOW(), NOW())
         RETURNING id, email`,
        [email, hashedPassword]
      );
      userId = newUserResult.rows[0].id;
      console.log('✅ Usuario creado:', newUserResult.rows[0]);
    } else {
      userId = userResult.rows[0].id;
      // Actualizar password y asegurar que está activo
      await client.query(
        'UPDATE users SET hashed_password = $1, is_active = true WHERE id = $2',
        [hashedPassword, userId]
      );
      console.log('✅ Usuario actualizado y activado:', userResult.rows[0]);
    }

    // 3. VERIFICAR ENUM SUPER_ADMIN
    console.log('\n🔧 Verificando enum SUPER_ADMIN...');
    const enumCheck = await client.query(
      `SELECT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'SUPER_ADMIN' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'role_enum')
      ) as exists`
    );

    if (!enumCheck.rows[0].exists) {
      try {
        await client.query(`ALTER TYPE role_enum ADD VALUE 'SUPER_ADMIN'`);
        console.log('✅ SUPER_ADMIN agregado al enum');
      } catch (err) {
        console.log('⚠️  Error agregando enum (puede ya existir):', err.message);
      }
    } else {
      console.log('✅ SUPER_ADMIN existe en enum');
    }

    // 4. CREAR/ACTUALIZAR GYM_USERS ENTRY
    console.log('\n🔧 Verificando gym_users entry...');
    const gymUserResult = await client.query(
      'SELECT id, role, is_active FROM gym_users WHERE user_id = $1 AND gym_id = $2',
      [userId, gymId]
    );

    if (gymUserResult.rows.length === 0) {
      console.log('⚠️  gym_users entry no existe, creándolo...');
      await client.query(
        `INSERT INTO gym_users (id, gym_id, user_id, role, is_active, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, 'SUPER_ADMIN', true, NOW(), NOW())`,
        [gymId, userId]
      );
      console.log('✅ gym_users entry creado con rol SUPER_ADMIN');
    } else {
      // Actualizar para asegurar SUPER_ADMIN y activo
      await client.query(
        `UPDATE gym_users SET role = 'SUPER_ADMIN', is_active = true 
         WHERE user_id = $1 AND gym_id = $2`,
        [userId, gymId]
      );
      console.log('✅ gym_users entry actualizado:', gymUserResult.rows[0]);
    }

    // 5. VERIFICACIÓN FINAL
    console.log('\n📋 VERIFICACIÓN FINAL:');
    const finalCheck = await client.query(
      `SELECT u.id as user_id, u.email, u.is_active as user_active,
              g.id as gym_id, g.name as gym_name, g.slug, g.is_active as gym_active,
              gu.role, gu.is_active as gymuser_active
       FROM users u
       JOIN gym_users gu ON u.id = gu.user_id
       JOIN gyms g ON gu.gym_id = g.id
       WHERE u.email = $1 AND g.slug = $2`,
      [email, 'tyme']
    );

    if (finalCheck.rows.length > 0) {
      const row = finalCheck.rows[0];
      console.log('✅ TODO CONFIGURADO CORRECTAMENTE:');
      console.log('   User:', email, '(active:', row.user_active + ')');
      console.log('   Gym:', row.gym_name, '(slug:', row.slug + ', active:', row.gym_active + ')');
      console.log('   Role:', row.role, '(active:', row.gymuser_active + ')');
      console.log('   Password:', password);
    } else {
      console.log('❌ VERIFICACIÓN FALLÓ - revisar datos');
    }

    await client.end();

    // 6. PROBAR LOGIN CONTRA RAILWAY
    console.log('\n🧪 PROBANDO LOGIN CONTRA RAILWAY...');
    try {
      const response = await fetch('https://tymeback-staging.up.railway.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gymSlug: 'tyme',
          login: email,
          password: password
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('✅✅✅ LOGIN EXITOSO ✅✅✅');
        console.log('Token:', data.access_token?.substring(0, 50) + '...');
        console.log('User:', data.user?.email, '- Role:', data.user?.role);
      } else {
        console.log('❌ LOGIN FALLÓ:');
        console.log('Status:', response.status);
        console.log('Error:', data);
      }
    } catch (err) {
      console.log('❌ Error en test de login:', err.message);
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    await client.end();
  }
}

fixEverything();

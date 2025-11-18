/**
 * Script para crear usuarios directamente en Railway PostgreSQL
 * Ejecutar: node create-users-railway.js
 */

const { Client } = require('pg');
const crypto = require('crypto');

// Credenciales de Railway
const DATABASE_URL = 'postgresql://postgres:aUYsbYwjBKMuYVuWUJesLhkfYYVnHDTW@switchback.proxy.rlwy.net:37224/railway';

function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(plain, salt, 100000, 64, 'sha512').toString('hex');
  return `pbkdf2$100000$${salt}$${hash}`;
}

async function createUsers() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Conectando a Railway PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado exitosamente\n');

    // 1. Crear gimnasio si no existe
    console.log('🏢 Verificando gimnasio...');
    const gymResult = await client.query(`
      INSERT INTO gyms (id, name, slug, created_at, updated_at)
      VALUES (
        '00000000-0000-0000-0000-000000000001',
        'TYME Gym Principal',
        'tyme-gym-principal',
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO NOTHING
      RETURNING id, name;
    `);

    if (gymResult.rowCount > 0) {
      console.log('✅ Gimnasio creado:', gymResult.rows[0].name);
    } else {
      console.log('ℹ️  Gimnasio ya existe');
    }

    // 2. Crear usuarios
    const users = [
      {
        role: 'ADMIN',
        fullName: 'Admin Tyme',
        email: 'admin@tyme.cl',
        password: 'Admin123!',
        phone: '+56912345601',
        rut: '11111111-1',
        birthDate: null,
        gender: null
      },
      {
        role: 'CLIENT',
        fullName: 'Cliente Demo',
        email: 'cliente@tyme.cl',
        password: 'Cliente123!',
        phone: '+56912345602',
        rut: '22222222-2',
        birthDate: '1990-05-15',
        gender: 'MALE'
      },
      {
        role: 'TRAINER',
        fullName: 'Entrenador Demo',
        email: 'entrenador@tyme.cl',
        password: 'Entrenador123!',
        phone: '+56912345603',
        rut: '33333333-3',
        birthDate: null,
        gender: null
      },
      {
        role: 'NUTRITIONIST',
        fullName: 'Nutricionista Demo',
        email: 'nutricionista@tyme.cl',
        password: 'Nutricionista123!',
        phone: '+56912345604',
        rut: '44444444-4',
        birthDate: null,
        gender: null
      }
    ];

    console.log('\n👥 Creando usuarios...\n');

    for (const user of users) {
      try {
        // Verificar si el usuario ya existe
        const checkResult = await client.query(`
          SELECT id, email FROM users WHERE email = $1;
        `, [user.email]);

        if (checkResult.rowCount > 0) {
          console.log(`ℹ️  Usuario ya existe: ${user.email}\n`);
          continue;
        }

        const hashedPassword = hashPassword(user.password);
        
        const result = await client.query(`
          INSERT INTO users (
            id,
            gym_id,
            role,
            full_name,
            email,
            hashed_password,
            phone,
            rut,
            birth_date,
            gender,
            is_active,
            created_at,
            updated_at
          )
          VALUES (
            gen_random_uuid(),
            '00000000-0000-0000-0000-000000000001',
            $1, $2, $3, $4, $5, $6, $7, $8,
            true,
            NOW(),
            NOW()
          )
          RETURNING id, email, role, full_name;
        `, [
          user.role,
          user.fullName,
          user.email,
          hashedPassword,
          user.phone,
          user.rut,
          user.birthDate,
          user.gender
        ]);

        if (result.rowCount > 0) {
          console.log(`✅ Usuario creado: ${user.email} (${user.role})`);
          console.log(`   Password: ${user.password}`);
          console.log(`   ID: ${result.rows[0].id}\n`);
        }
      } catch (err) {
        console.error(`❌ Error creando ${user.email}:`, err.message);
      }
    }

    // 3. Verificar usuarios creados
    console.log('\n📋 Verificando usuarios en base de datos...\n');
    const verifyResult = await client.query(`
      SELECT id, email, role, full_name, is_active
      FROM users
      WHERE email LIKE '%@tyme.cl'
      ORDER BY role;
    `);

    console.log('Usuarios encontrados:');
    console.table(verifyResult.rows);

    console.log('\n✅ ¡Proceso completado exitosamente!');
    console.log('\n🎯 Puedes hacer login en: https://tyme-front2.vercel.app');
    console.log('\nCredenciales:');
    users.forEach(u => {
      console.log(`  ${u.email} / ${u.password}`);
    });

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
    console.log('\n🔌 Desconectado de Railway');
  }
}

// Ejecutar
createUsers();

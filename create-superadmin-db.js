/**
 * Script para crear Super Admin en la base de datos
 * Ejecutar: node create-superadmin-db.js
 */

const { Client } = require('pg');
const crypto = require('crypto');

// Connection string de Railway
const connectionString = 'postgresql://postgres:DanpBohSbQluYBnEIpTGDoYVCDiUslqG@maglev.proxy.rlwy.net:51300/railway';

// Generar hash de contraseña
function hashPassword(password) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `pbkdf2$100000$${salt}$${hash}`;
}

async function createSuperAdmin() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Conectado a PostgreSQL en Railway\n');

    // 0. Verificar y agregar SUPER_ADMIN al enum si no existe
    console.log('🔧 Verificando enum role_enum...\n');
    
    const enumCheck = await client.query(
      `SELECT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'SUPER_ADMIN' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'role_enum')
      ) as exists`
    );

    if (!enumCheck.rows[0].exists) {
      console.log('⚠️  SUPER_ADMIN no existe en enum role_enum, agregándolo...\n');
      
      try {
        await client.query(`ALTER TYPE role_enum ADD VALUE 'SUPER_ADMIN'`);
        console.log('✅ SUPER_ADMIN agregado al enum role_enum\n');
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log('✅ SUPER_ADMIN ya existe en el enum (ignorando error)\n');
        } else {
          throw err;
        }
      }
    } else {
      console.log('✅ SUPER_ADMIN ya existe en enum role_enum\n');
    }

    const password = 'SuperAdmin123!';
    const hashedPassword = hashPassword(password);

    console.log('🔐 Password hasheada:', hashedPassword.substring(0, 50) + '...\n');

    // 1. Verificar si el gym 'tyme' existe, si no, crearlo
    let gymResult = await client.query(
      `SELECT id, name, slug FROM gyms WHERE slug = 'tyme' LIMIT 1`
    );

    let tyme_gym_id;

    if (gymResult.rows.length === 0) {
      console.log('⚠️  Gym TYME no existe, creándolo...\n');

      const newGymResult = await client.query(
        `INSERT INTO gyms (
          id,
          name,
          slug,
          timezone,
          is_active,
          created_at,
          updated_at
        )
        VALUES (
          gen_random_uuid(),
          'TYME Gym',
          'tyme',
          'America/Santiago',
          true,
          NOW(),
          NOW()
        )
        RETURNING id, name, slug`
      );

      tyme_gym_id = newGymResult.rows[0].id;
      console.log('✅ Gym TYME creado:', newGymResult.rows[0].name, `(${tyme_gym_id})\n`);
    } else {
      tyme_gym_id = gymResult.rows[0].id;
      console.log('✅ Gym TYME encontrado:', gymResult.rows[0].name, `(${tyme_gym_id})\n`);
    }

    // 2. Verificar si el usuario ya existe
    const existingUser = await client.query(
      `SELECT id, email, full_name FROM users WHERE email = 'superadmin@tyme.cl'`
    );

    let userId;

    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
      console.log('⚠️  Usuario Super Admin ya existe:', existingUser.rows[0].full_name, `(${userId})`);
      console.log('   Actualizando contraseña...\n');

      // Actualizar contraseña
      await client.query(
        `UPDATE users SET hashed_password = $1, is_active = true, updated_at = NOW() WHERE id = $2`,
        [hashedPassword, userId]
      );

      console.log('✅ Contraseña actualizada\n');
    } else {
      // Crear nuevo usuario
      console.log('📝 Creando usuario Super Admin...\n');

      const userResult = await client.query(
        `INSERT INTO users (
          id,
          email,
          hashed_password,
          first_name,
          last_name,
          phone,
          rut,
          is_active,
          created_at,
          updated_at
        )
        VALUES (
          gen_random_uuid(),
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          true,
          NOW(),
          NOW()
        )
        RETURNING id, email, full_name`,
        [
          'superadmin@tyme.cl',
          hashedPassword,
          'Super',
          'Admin',
          '+56911111111',
          '11111111-1'
        ]
      );

      userId = userResult.rows[0].id;
      console.log('✅ Usuario creado:', userResult.rows[0].full_name, `(${userId})\n`);
    }

    // 3. Verificar si ya existe gym_user con rol SUPER_ADMIN
    const existingGymUser = await client.query(
      `SELECT id, role FROM gym_users WHERE user_id = $1 AND gym_id = $2`,
      [userId, tyme_gym_id]
    );

    if (existingGymUser.rows.length > 0) {
      console.log('⚠️  gym_users ya existe para este usuario');
      
      if (existingGymUser.rows[0].role !== 'SUPER_ADMIN') {
        console.log('   Actualizando rol a SUPER_ADMIN...\n');
        
        await client.query(
          `UPDATE gym_users SET role = 'SUPER_ADMIN', is_active = true, updated_at = NOW() WHERE id = $1`,
          [existingGymUser.rows[0].id]
        );
        
        console.log('✅ Rol actualizado a SUPER_ADMIN\n');
      } else {
        console.log('   Rol ya es SUPER_ADMIN ✅\n');
      }
    } else {
      // Crear gym_user con rol SUPER_ADMIN
      console.log('📝 Creando gym_user con rol SUPER_ADMIN...\n');

      await client.query(
        `INSERT INTO gym_users (
          id,
          gym_id,
          user_id,
          role,
          is_active,
          created_at,
          updated_at
        )
        VALUES (
          gen_random_uuid(),
          $1,
          $2,
          'SUPER_ADMIN',
          true,
          NOW(),
          NOW()
        )`,
        [tyme_gym_id, userId]
      );

      console.log('✅ gym_user creado con rol SUPER_ADMIN\n');
    }

    // 4. Verificación final
    const verification = await client.query(
      `SELECT 
        u.id,
        u.email,
        u.full_name,
        u.is_active,
        gu.role,
        g.name as gym_name,
        g.slug as gym_slug
      FROM users u
      JOIN gym_users gu ON gu.user_id = u.id
      JOIN gyms g ON g.id = gu.gym_id
      WHERE u.email = 'superadmin@tyme.cl'`
    );

    if (verification.rows.length > 0) {
      console.log('═══════════════════════════════════════════════════════');
      console.log('✅ SUPER ADMIN CREADO EXITOSAMENTE');
      console.log('═══════════════════════════════════════════════════════\n');
      console.log('📋 Credenciales:');
      console.log('   Email:    superadmin@tyme.cl');
      console.log('   Password: SuperAdmin123!');
      console.log('   GymSlug:  tyme (o cualquier gym válido)\n');
      console.log('👤 Detalles del usuario:');
      console.log('   ID:       ', verification.rows[0].id);
      console.log('   Nombre:   ', verification.rows[0].full_name);
      console.log('   Rol:      ', verification.rows[0].role);
      console.log('   Activo:   ', verification.rows[0].is_active ? 'Sí' : 'No');
      console.log('   Gym:      ', verification.rows[0].gym_name, `(${verification.rows[0].gym_slug})\n`);
      console.log('═══════════════════════════════════════════════════════\n');
    } else {
      console.log('❌ Error: No se pudo verificar la creación del usuario\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nDetalle del error:', error);
  } finally {
    await client.end();
    console.log('🔌 Desconectado de PostgreSQL\n');
  }
}

// Ejecutar
createSuperAdmin();

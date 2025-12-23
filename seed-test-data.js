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

async function seedData() {
  try {
    await client.connect();
    console.log('✅ Conectado\n');

    const gymResult = await client.query("SELECT id FROM gyms WHERE slug = 'tyme'");
    const gymId = gymResult.rows[0].id;
    console.log('✅ Gym ID:', gymId, '\n');

    // 1. CREAR PLANES
    console.log('📝 Creando planes...');
    const plans = [
      { name: 'Plan Básico', description: 'Acceso al gym + 1 clase grupal/semana', durationMonths: 1, durationDays: 30, priceClp: 25000, privateSessions: 0 },
      { name: 'Plan Premium', description: 'Acceso al gym + clases grupales ilimitadas + 4 sesiones personalizadas', durationMonths: 1, durationDays: 30, priceClp: 45000, privateSessions: 4 }
    ];

    for (const plan of plans) {
      const existing = await client.query(
        'SELECT id FROM plans WHERE gym_id = $1 AND name = $2',
        [gymId, plan.name]
      );

      if (existing.rows.length === 0) {
        await client.query(
          `INSERT INTO plans (id, gym_id, name, description, duration_months, duration_days, price_clp, private_sessions_per_period, is_active, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())`,
          [gymId, plan.name, plan.description, plan.durationMonths, plan.durationDays, plan.priceClp, plan.privateSessions]
        );
        console.log(`  ✅ ${plan.name} creado`);
      } else {
        console.log(`  ⚠️  ${plan.name} ya existe`);
      }
    }

    // 2. CREAR TRAINERS
    console.log('\n👟 Creando trainers...');
    const trainers = [
      { email: 'trainer1@tyme.cl', firstName: 'Carlos', lastName: 'Pérez', password: 'Trainer123!' },
      { email: 'trainer2@tyme.cl', firstName: 'María', lastName: 'González', password: 'Trainer123!' }
    ];

    for (const trainer of trainers) {
      const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [trainer.email]);
      
      let userId;
      if (existingUser.rows.length === 0) {
        const newUser = await client.query(
          `INSERT INTO users (id, email, first_name, last_name, hashed_password, is_active, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW(), NOW())
           RETURNING id`,
          [trainer.email, trainer.firstName, trainer.lastName, hashPassword(trainer.password)]
        );
        userId = newUser.rows[0].id;
        console.log(`  ✅ Usuario ${trainer.email} creado`);
      } else {
        userId = existingUser.rows[0].id;
        console.log(`  ⚠️  Usuario ${trainer.email} ya existe`);
      }

      // Crear gym_users entry
      const existingGymUser = await client.query(
        'SELECT id FROM gym_users WHERE user_id = $1 AND gym_id = $2',
        [userId, gymId]
      );

      if (existingGymUser.rows.length === 0) {
        await client.query(
          `INSERT INTO gym_users (id, gym_id, user_id, role, is_active, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, 'TRAINER', true, NOW(), NOW())`,
          [gymId, userId]
        );
        console.log(`  ✅ gym_users (TRAINER) creado para ${trainer.email}`);
      }
    }

    // 3. CREAR NUTRITIONISTS
    console.log('\n🥗 Creando nutritionists...');
    const nutritionists = [
      { email: 'nutri1@tyme.cl', firstName: 'Ana', lastName: 'Martínez', password: 'Nutri123!' },
      { email: 'nutri2@tyme.cl', firstName: 'José', lastName: 'Rodríguez', password: 'Nutri123!' }
    ];

    for (const nutri of nutritionists) {
      const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [nutri.email]);
      
      let userId;
      if (existingUser.rows.length === 0) {
        const newUser = await client.query(
          `INSERT INTO users (id, email, first_name, last_name, hashed_password, is_active, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW(), NOW())
           RETURNING id`,
          [nutri.email, nutri.firstName, nutri.lastName, hashPassword(nutri.password)]
        );
        userId = newUser.rows[0].id;
        console.log(`  ✅ Usuario ${nutri.email} creado`);
      } else {
        userId = existingUser.rows[0].id;
        console.log(`  ⚠️  Usuario ${nutri.email} ya existe`);
      }

      // Crear gym_users entry
      const existingGymUser = await client.query(
        'SELECT id FROM gym_users WHERE user_id = $1 AND gym_id = $2',
        [userId, gymId]
      );

      if (existingGymUser.rows.length === 0) {
        await client.query(
          `INSERT INTO gym_users (id, gym_id, user_id, role, is_active, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, 'NUTRITIONIST', true, NOW(), NOW())`,
          [gymId, userId]
        );
        console.log(`  ✅ gym_users (NUTRITIONIST) creado para ${nutri.email}`);
      }
    }

    console.log('\n✅✅✅ DATOS DE PRUEBA CREADOS ✅✅✅');
    console.log('\n📋 RESUMEN:');
    console.log('  Planes: Plan Básico ($25,000), Plan Premium ($45,000)');
    console.log('  Trainers: trainer1@tyme.cl, trainer2@tyme.cl (password: Trainer123!)');
    console.log('  Nutritionists: nutri1@tyme.cl, nutri2@tyme.cl (password: Nutri123!)');

    await client.end();
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    await client.end();
  }
}

seedData();

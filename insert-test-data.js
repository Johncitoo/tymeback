// Insertar datos de prueba en Railway
const { Client } = require('pg');
const crypto = require('crypto');

const connectionString = 'postgresql://postgres:DanpBohSbQluYBnEIpTGDoYVCDiUslqG@maglev.proxy.rlwy.net:51300/railway';

function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(plain, salt, 100000, 64, 'sha512').toString('hex');
  return `pbkdf2$100000$${salt}$${hash}`;
}

async function insertTestData() {
  const db = new Client({ connectionString });
  
  try {
    await db.connect();
    console.log('✅ Conectado a Railway DB\n');

    // Obtener gym_id
    const gymRes = await db.query("SELECT id FROM gyms WHERE slug = 'tyme-demo'");
    if (gymRes.rows.length === 0) {
      console.log('❌ Gym tyme-demo no encontrado');
      return;
    }
    const gymId = gymRes.rows[0].id;
    console.log(`🏢 Gym ID: ${gymId}\n`);

    // 1. Insertar Trainer
    console.log('📝 Creando trainer...');
    const trainerUserId = crypto.randomUUID();
    const trainerGymUserId = crypto.randomUUID();
    
    // Verificar si ya existe
    const existingTrainer = await db.query("SELECT id FROM users WHERE email = 'trainer1@tyme.demo'");
    const actualTrainerUserId = existingTrainer.rows.length > 0 ? existingTrainer.rows[0].id : trainerUserId;
    
    if (existingTrainer.rows.length === 0) {
      await db.query(`
        INSERT INTO users (id, email, hashed_password, first_name, last_name, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
      `, [trainerUserId, 'trainer1@tyme.demo', hashPassword('Trainer123'), 'Juan', 'Pérez']);
    }
    
    const existingGymUser = await db.query(
      "SELECT id FROM gym_users WHERE gym_id = $1 AND user_id = $2 AND role = 'TRAINER'",
      [gymId, actualTrainerUserId]
    );
    const actualTrainerGymUserId = existingGymUser.rows.length > 0 ? existingGymUser.rows[0].id : trainerGymUserId;
    
    if (existingGymUser.rows.length === 0) {
      await db.query(`
        INSERT INTO gym_users (id, gym_id, user_id, role, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, 'TRAINER', true, NOW(), NOW())
      `, [trainerGymUserId, gymId, actualTrainerUserId]);
    }
    
    const existingTrainerExt = await db.query(
      "SELECT gym_user_id FROM trainers WHERE gym_user_id = $1",
      [actualTrainerGymUserId]
    );
    
    if (existingTrainerExt.rows.length === 0) {
      await db.query(`
        INSERT INTO trainers (gym_user_id, specialties, is_active, created_at, updated_at)
        VALUES ($1, ARRAY['Fuerza', 'Hipertrofia'], true, NOW(), NOW())
      `, [actualTrainerGymUserId]);
    }
    
    console.log('✅ Trainer: trainer1@tyme.demo / Trainer123');

    // 2. Insertar 3 Clientes
    console.log('\n📝 Creando clientes...');
    for (let i = 1; i <= 3; i++) {
      // Check if exists
      const existingClient = await db.query("SELECT id FROM users WHERE email = $1", [`client${i}@tyme.demo`]);
      
      if (existingClient.rows.length === 0) {
        const clientUserId = crypto.randomUUID();
        const clientGymUserId = crypto.randomUUID();
        
        await db.query(`
          INSERT INTO users (id, email, hashed_password, first_name, last_name, rut, phone, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
        `, [
          clientUserId,
          `client${i}@tyme.demo`,
          hashPassword('Client123'),
          `Cliente${i}`,
          'Test',
          `12345678-${i}`,
          `+56912345${String(i).padStart(3, '0')}`
        ]);
        
        await db.query(`
          INSERT INTO gym_users (id, gym_id, user_id, role, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, 'CLIENT', true, NOW(), NOW())
        `, [clientGymUserId, gymId, clientUserId]);
        
        await db.query(`
          INSERT INTO clients (gym_user_id, trainer_gym_user_id, created_at, updated_at)
          VALUES ($1, $2, NOW(), NOW())
        `, [clientGymUserId, actualTrainerGymUserId]);
        
        console.log(`✅ Cliente${i}: client${i}@tyme.demo / Client123`);
      } else {
        console.log(`⚠️  Cliente${i} ya existe`);
      }
    }

    // 3. Crear segundo Gym para test cross-gym
    console.log('\n📝 Creando segundo gym para test de seguridad...');
    const existingGym2 = await db.query("SELECT id FROM gyms WHERE slug = 'tyme-demo-2'");
    const gym2Id = existingGym2.rows.length > 0 ? existingGym2.rows[0].id : crypto.randomUUID();
    
    if (existingGym2.rows.length === 0) {
      await db.query(`
        INSERT INTO gyms (id, name, slug, is_active, created_at, updated_at)
        VALUES ($1, 'Tyme Demo 2', 'tyme-demo-2', true, NOW(), NOW())
      `, [gym2Id]);
    }
    
    const existingAdmin2 = await db.query("SELECT id FROM users WHERE email = 'admin2@tyme.demo'");
    
    if (existingAdmin2.rows.length === 0) {
      const admin2UserId = crypto.randomUUID();
      const admin2GymUserId = crypto.randomUUID();
      
      await db.query(`
        INSERT INTO users (id, email, hashed_password, first_name, last_name, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
      `, [admin2UserId, 'admin2@tyme.demo', hashPassword('Admin123'), 'Admin', 'Gym2']);
      
      await db.query(`
        INSERT INTO gym_users (id, gym_id, user_id, role, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, 'ADMIN', true, NOW(), NOW())
      `, [admin2GymUserId, gym2Id, admin2UserId]);
    }, role, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, 'ADMIN', true, NOW(), NOW())
      ON CONFLICT (gym_id, user_id, role) WHERE deleted_at IS NULL DO NOTHING
    `, [admin2GymUserId, gym2Id, admin2UserId]);
    
    console.log('✅ Gym2: tyme-demo-2 / admin2@tyme.demo / Admin123');

    // Verificar totales
    console.log('\n📊 Totales en BD:');
    const counts = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM gyms) as gyms,
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM gym_users) as gym_users,
        (SELECT COUNT(*) FROM clients) as clients,
        (SELECT COUNT(*) FROM trainers) as trainers
    `);
    console.log(counts.rows[0]);
    
    console.log('\n✅ Datos de prueba insertados correctamente!');
    console.log('\n📋 Credenciales de prueba:');
    console.log('   Admin: admin@tyme.demo / Admin123');
    console.log('   Trainer: trainer1@tyme.demo / Trainer123');
    console.log('   Cliente1: client1@tyme.demo / Client123');
    console.log('   Cliente2: client2@tyme.demo / Client123');
    console.log('   Cliente3: client3@tyme.demo / Client123');
    console.log('   Admin Gym2: admin2@tyme.demo / Admin123');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.detail) console.error('   Detail:', error.detail);
  } finally {
    await db.end();
  }
}

insertTestData();

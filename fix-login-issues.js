const pg = require('pg');
const bcrypt = require('bcrypt');
const { Client } = pg;

const DATABASE_URL = 'postgresql://postgres:DanpBohSbQluYBnEIpTGDoYVCDiUslqG@maglev.proxy.rlwy.net:51300/railway';

async function fixLoginIssues() {
  const client = new Client({ 
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔌 Conectado a Railway...\n');

    // 1. Verificar gym slug
    const gymResult = await client.query(`
      SELECT id, name, slug 
      FROM gyms 
      WHERE name = 'TYME' OR slug = 'tyme'
    `);

    if (gymResult.rows.length > 0) {
      const gym = gymResult.rows[0];
      console.log('🏢 Gym encontrado:');
      console.log(`   ID: ${gym.id}`);
      console.log(`   Name: ${gym.name}`);
      console.log(`   Slug: ${gym.slug}`);
      console.log('');

      // 2. Verificar usuario
      const userResult = await client.query(`
        SELECT u.id, u.email, u.full_name, u.hashed_password
        FROM users u
        WHERE u.email = 'juanjacontrerasra@gmail.com'
      `);

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        console.log('👤 Usuario encontrado:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Nombre: ${user.full_name}`);
        console.log(`   Hash actual: ${user.hashed_password.substring(0, 30)}...`);
        console.log('');

        // 3. Verificar relación gym_users
        const gymUserResult = await client.query(`
          SELECT gu.role, gu.gym_id
          FROM gym_users gu
          WHERE gu.user_id = $1 AND gu.gym_id = $2
        `, [user.id, gym.id]);

        if (gymUserResult.rows.length > 0) {
          console.log('✅ Usuario está vinculado al gym');
          console.log(`   Role: ${gymUserResult.rows[0].role}`);
          console.log('');
        } else {
          console.log('❌ Usuario NO está vinculado al gym');
          console.log('');
        }

        // 4. Actualizar contraseña con hash nuevo
        console.log('🔐 Actualizando contraseña...');
        const newPassword = 'apocalipto11';
        const newHash = await bcrypt.hash(newPassword, 10);
        
        await client.query(`
          UPDATE users 
          SET hashed_password = $1 
          WHERE id = $2
        `, [newHash, user.id]);

        console.log('✅ Contraseña actualizada');
        console.log(`   Nueva contraseña: ${newPassword}`);
        console.log(`   Nuevo hash: ${newHash.substring(0, 30)}...`);
        console.log('');

        // 5. Verificar que el hash funciona
        const testMatch = await bcrypt.compare(newPassword, newHash);
        console.log(`🔍 Test de bcrypt.compare: ${testMatch ? '✅ OK' : '❌ FAIL'}`);

      } else {
        console.log('❌ Usuario no encontrado');
      }
    } else {
      console.log('❌ Gym no encontrado');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

fixLoginIssues();

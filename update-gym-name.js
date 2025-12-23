const { Client } = require('pg');

const connectionString = 'postgresql://postgres:DanpBohSbQluYBnEIpTGDoYVCDiUslqG@maglev.proxy.rlwy.net:51300/railway';

async function updateGymName() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('🔌 Conectado a Railway...');

    // Actualizar nombre del gym
    const result = await client.query(
      `UPDATE gyms SET name = $1 WHERE id = $2 RETURNING *`,
      ['TYME', '0534eb53-544d-48a4-9eca-a2912025c725']
    );

    if (result.rows.length > 0) {
      console.log('✅ Nombre del gimnasio actualizado exitosamente');
      console.log(`   Nuevo nombre: ${result.rows[0].name}`);
    } else {
      console.log('❌ No se encontró el gimnasio');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

updateGymName();

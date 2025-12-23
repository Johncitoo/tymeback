const pg = require('pg');
const { Client } = pg;

const DATABASE_URL = 'postgresql://postgres:DanpBohSbQluYBnEIpTGDoYVCDiUslqG@maglev.proxy.rlwy.net:51300/railway';

async function runMigration() {
  const client = new Client({ 
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('🔌 Conectado a Railway...');

    // Verificar si la columna ya existe
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'email_logs' 
      AND column_name = 'provider_message_id'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('✅ La columna provider_message_id ya existe');
    } else {
      console.log('📝 Agregando columna provider_message_id...');
      await client.query(`
        ALTER TABLE email_logs 
        ADD COLUMN provider_message_id TEXT NULL
      `);
      console.log('✅ Columna provider_message_id agregada exitosamente');
    }

    // Verificar estructura final
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'email_logs'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Estructura de email_logs:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

runMigration();

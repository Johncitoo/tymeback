const pg = require('pg');
const { Client } = pg;

const DATABASE_URL = 'postgresql://postgres:DanpBohSbQluYBnEIpTGDoYVCDiUslqG@maglev.proxy.rlwy.net:51300/railway';

async function checkView() {
  const client = new Client({ 
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'v_active_memberships'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Columnas de v_active_memberships:\n');
    result.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkView();

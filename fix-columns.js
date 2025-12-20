require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');

async function fixColumns() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');
    
    const sql = fs.readFileSync('./fix-missing-columns.sql', 'utf8');
    const result = await client.query(sql);
    
    console.log('✅ Columnas arregladas:', result[result.length - 1].rows[0]);
    
    // Verificar payments
    const paymentsCheck = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
        AND column_name IN ('processed_by_user_id', 'processed_by')
      ORDER BY column_name
    `);
    
    console.log('\n📋 Columnas en payments:');
    console.table(paymentsCheck.rows);
    
    // Verificar email_logs
    const emailLogsCheck = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'email_logs' 
        AND column_name IN ('template_id', 'campaign_id')
      ORDER BY column_name
    `);
    
    console.log('\n📋 Columnas en email_logs:');
    console.table(emailLogsCheck.rows);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixColumns();

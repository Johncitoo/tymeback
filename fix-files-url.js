require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');

async function fixFilesTable() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');
    
    const sql = fs.readFileSync('./fix-files-url-nullable.sql', 'utf8');
    await client.query(sql);
    
    console.log('✅ Columna url ahora es nullable');
    
    // Verificar
    const check = await client.query(`
      SELECT column_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'files' AND column_name = 'url'
    `);
    
    console.log('\n📋 Columna url en files:');
    console.table(check.rows);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixFilesTable();

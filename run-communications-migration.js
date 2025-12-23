const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    const sql = fs.readFileSync('./create-communications-tables.sql', 'utf8');
    
    console.log('🔄 Ejecutando migración...');
    await client.query(sql);
    
    console.log('✅ Migración ejecutada correctamente');
    console.log('✅ Tablas creadas: automated_email_templates, mass_emails');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();

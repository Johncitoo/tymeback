// Script para agregar DOCUMENT al enum file_purpose_enum
require('dotenv').config();
const { Client } = require('pg');

async function addDocumentEnum() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔌 Conectando a la base de datos...');
    await client.connect();
    console.log('✅ Conectado');

    console.log('📝 Verificando valores actuales del enum...');
    const current = await client.query(`
      SELECT unnest(enum_range(NULL::file_purpose_enum)) AS purpose_value;
    `);
    
    console.log('Valores actuales:');
    current.rows.forEach(row => console.log(`  - ${row.purpose_value}`));

    console.log('');
    console.log('➕ Agregando DOCUMENT al enum...');
    await client.query(`ALTER TYPE file_purpose_enum ADD VALUE IF NOT EXISTS 'DOCUMENT';`);
    console.log('✅ DOCUMENT agregado al enum');

    console.log('');
    console.log('📝 Verificando valores actualizados...');
    const updated = await client.query(`
      SELECT unnest(enum_range(NULL::file_purpose_enum)) AS purpose_value;
    `);
    
    console.log('Valores actualizados:');
    updated.rows.forEach(row => console.log(`  - ${row.purpose_value}`));

    console.log('');
    console.log('🎉 Migración completada exitosamente');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Conexión cerrada');
  }
}

addDocumentEnum();

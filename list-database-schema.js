// list-database-schema.js - Lista todas las tablas y columnas de la base de datos
const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

async function listSchema() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Conectado a PostgreSQL\n');

    // Obtener todas las tablas
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('📊 TABLAS EN LA BASE DE DATOS:\n');
    console.log('='.repeat(80));

    for (const row of tablesResult.rows) {
      const tableName = row.table_name;
      
      // Obtener columnas de cada tabla
      const columnsResult = await client.query(`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);

      console.log(`\n📋 Tabla: ${tableName.toUpperCase()}`);
      console.log('-'.repeat(80));
      
      columnsResult.rows.forEach(col => {
        const type = col.character_maximum_length 
          ? `${col.data_type}(${col.character_maximum_length})`
          : col.data_type;
        
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        
        console.log(`  • ${col.column_name.padEnd(30)} ${type.padEnd(20)} ${nullable}${defaultVal}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ Total de tablas: ${tablesResult.rows.length}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

listSchema();

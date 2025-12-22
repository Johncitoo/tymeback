#!/usr/bin/env node

/**
 * Script para ejecutar el arreglo completo en Railway
 * Uso: node fix-railway.js
 */

const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function fixRailwayDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔌 Conectando a Railway database...');
    await client.connect();
    console.log('✅ Conectado exitosamente\n');

    const sql = fs.readFileSync('./fix-railway-database.sql', 'utf8');
    
    console.log('🔧 Ejecutando arreglos...\n');
    await client.query(sql);
    
    console.log('\n✅ ¡Arreglos aplicados exitosamente!');
    console.log('\n📋 Verificando estado...\n');
    
    // Verificar columnas
    const checkColumns = await client.query(`
      SELECT 
        column_name, 
        data_type,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      AND column_name IN ('receipt_file_id')
    `);
    
    console.log('Columnas en payments:');
    checkColumns.rows.forEach(row => {
      console.log(`  ✅ ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
    });
    
    // Verificar tablas
    const checkTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('automated_email_templates', 'mass_emails')
    `);
    
    console.log('\nTablas de comunicaciones:');
    checkTables.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });
    
    console.log('\n🎉 ¡Todo listo! La base de datos está configurada correctamente.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nDetalles:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Conexión cerrada');
  }
}

fixRailwayDatabase();

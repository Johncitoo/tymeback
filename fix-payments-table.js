const { Client } = require('pg');
require('dotenv').config();

async function fixPaymentsTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    const sql = `
      -- Agregar columna receipt_file_id a la tabla payments
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_file_id uuid NULL;

      -- Agregar foreign key a la tabla files si existe
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'fk_payments_receipt_file_id'
        ) THEN
          ALTER TABLE payments 
          ADD CONSTRAINT fk_payments_receipt_file_id 
          FOREIGN KEY (receipt_file_id) REFERENCES files(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `;
    
    console.log('🔄 Agregando columna receipt_file_id...');
    await client.query(sql);
    
    console.log('✅ Columna agregada correctamente');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixPaymentsTable();

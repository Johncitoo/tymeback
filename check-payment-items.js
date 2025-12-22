const { Client } = require('pg');

(async () => {
  const client = new Client({ 
    connectionString: process.env.DATABASE_URL 
  });
  
  await client.connect();
  console.log('🔌 Conectado a Railway...\n');
  
  // Verificar columnas de payment_items
  const result = await client.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'payment_items' 
    ORDER BY ordinal_position
  `);
  
  console.log('📋 Columnas en payment_items:');
  console.table(result.rows);
  
  await client.end();
})();

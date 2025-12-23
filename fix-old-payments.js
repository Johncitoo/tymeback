const { Client } = require('pg');

(async () => {
  const client = new Client({ 
    connectionString: process.env.DATABASE_URL 
  });
  
  await client.connect();
  console.log('🔌 Conectado a Railway...\n');
  
  // 1. Ver qué payment_items tienen client_gym_user_id null
  const nullItems = await client.query(`
    SELECT id, payment_id, gym_id, client_gym_user_id 
    FROM payment_items 
    WHERE client_gym_user_id IS NULL
    LIMIT 10
  `);
  
  console.log('❌ Payment items con client_gym_user_id NULL:', nullItems.rows.length);
  
  if (nullItems.rows.length > 0) {
    console.log('\n🔧 No hay forma de recuperar el client_gym_user_id automáticamente.');
    console.log('⚠️ Estos registros quedarán sin cliente asociado.\n');
  }
  
  // 2. Ver qué payment_items tienen datos correctos
  const validItems = await client.query(`
    SELECT 
      pi.id,
      pi.payment_id,
      pi.client_gym_user_id,
      gu.user_id,
      u.full_name
    FROM payment_items pi
    LEFT JOIN gym_users gu ON gu.id = pi.client_gym_user_id
    LEFT JOIN users u ON u.id = gu.user_id
    WHERE pi.client_gym_user_id IS NOT NULL
    LIMIT 5
  `);
  
  console.log('✅ Payment items válidos:', validItems.rows.length);
  if (validItems.rows.length > 0) {
    console.table(validItems.rows);
  }
  
  await client.end();
  console.log('\n✅ Verificación completa');
})();

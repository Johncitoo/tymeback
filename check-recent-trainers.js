// check-recent-trainers.js - Ver entrenadores recientes
require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  
  console.log('🔍 Entrenadores recientes (últimas 24 horas):\n');
  
  const query = `
    SELECT 
      u.id,
      u.first_name,
      u.last_name,
      u.email,
      u.avatar_url,
      gu.role,
      gu.created_at,
      (SELECT COUNT(*) FROM files WHERE owner_gym_user_id = gu.id) as files_count
    FROM users u
    JOIN gym_users gu ON gu.user_id = u.id
    WHERE gu.role = 'TRAINER'
    AND gu.created_at > NOW() - INTERVAL '24 hours'
    ORDER BY gu.created_at DESC
    LIMIT 5;
  `;
  
  const result = await client.query(query);
  
  if (result.rows.length === 0) {
    console.log('❌ No se encontraron entrenadores recientes');
  } else {
    console.table(result.rows);
  }
  
  await client.end();
}

main().catch(console.error);

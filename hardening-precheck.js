// hardening-precheck.js - Pre-checks antes de aplicar índices
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
  console.log('✅ Conectado a PostgreSQL\n');

  // 1. Check duplicados activos en gym_users
  console.log('🔍 Pre-check 1: Duplicados activos en gym_users');
  console.log('─'.repeat(60));
  const duplicatesQuery = `
    SELECT gym_id, user_id, COUNT(*) AS n
    FROM public.gym_users
    WHERE deleted_at IS NULL
    GROUP BY gym_id, user_id
    HAVING COUNT(*) > 1;
  `;
  
  const duplicates = await client.query(duplicatesQuery);
  if (duplicates.rows.length === 0) {
    console.log('✅ No hay duplicados activos - seguro crear UNIQUE INDEX\n');
  } else {
    console.log('⚠️  DUPLICADOS ENCONTRADOS:');
    console.table(duplicates.rows);
    console.log('❌ Hay que limpiar duplicados antes de crear el índice\n');
  }

  // 2. Check gyms sin slug
  console.log('🔍 Pre-check 2: Gyms sin slug o slug vacío');
  console.log('─'.repeat(60));
  const slugsQuery = `
    SELECT id, name, slug
    FROM public.gyms
    WHERE slug IS NULL OR btrim(slug) = '';
  `;
  
  const missingSlug = await client.query(slugsQuery);
  if (missingSlug.rows.length === 0) {
    console.log('✅ Todos los gyms tienen slug\n');
  } else {
    console.log('⚠️  Gyms sin slug:');
    console.table(missingSlug.rows);
    console.log('ℹ️  Puedes generar slugs automáticamente si lo necesitas\n');
  }

  // 3. Check índices existentes relevantes
  console.log('🔍 Pre-check 3: Índices existentes');
  console.log('─'.repeat(60));
  const indexesQuery = `
    SELECT 
      schemaname,
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public' 
    AND (
      tablename IN ('gym_users', 'memberships', 'attendance')
      OR indexname LIKE '%gym%' 
      OR indexname LIKE '%client%'
    )
    ORDER BY tablename, indexname;
  `;
  
  const indexes = await client.query(indexesQuery);
  console.log(`Total de índices relevantes: ${indexes.rows.length}`);
  indexes.rows.forEach(idx => {
    console.log(`  • ${idx.tablename}.${idx.indexname}`);
  });
  console.log();

  // 4. Resumen
  console.log('═'.repeat(60));
  console.log('📊 RESUMEN');
  console.log('═'.repeat(60));
  console.log(`Duplicados en gym_users: ${duplicates.rows.length === 0 ? '✅ Ninguno' : '❌ ' + duplicates.rows.length}`);
  console.log(`Gyms sin slug: ${missingSlug.rows.length === 0 ? '✅ Ninguno' : '⚠️  ' + missingSlug.rows.length}`);
  console.log(`Índices existentes: ${indexes.rows.length}`);
  
  await client.end();
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

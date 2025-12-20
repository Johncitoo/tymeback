// Script para hacer públicos los archivos AVATAR en GCS
require('dotenv').config();
const { Storage } = require('@google-cloud/storage');
const { Client } = require('pg');

const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  credentials: {
    client_email: process.env.GCS_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

const bucket = storage.bucket(process.env.GCS_BUCKET_NAME || 'tyme-dev-uploads');

async function makeAvatarsPublic() {
  const dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔌 Conectando a la base de datos...');
    await dbClient.connect();
    console.log('✅ Conectado\n');

    // Obtener todos los archivos AVATAR
    console.log('📁 Buscando archivos AVATAR...');
    const result = await dbClient.query(`
      SELECT id, original_name, storage_key, public_url, status
      FROM files
      WHERE purpose = 'AVATAR' AND status = 'READY'
      ORDER BY created_at DESC;
    `);

    console.log(`Encontrados ${result.rows.length} archivos\n`);

    for (const file of result.rows) {
      console.log(`📸 ${file.original_name}`);
      console.log(`   Key: ${file.storage_key}`);
      
      try {
        const gcsFile = bucket.file(file.storage_key);
        
        // Verificar si existe
        const [exists] = await gcsFile.exists();
        if (!exists) {
          console.log(`   ⚠️  Archivo no existe en GCS`);
          continue;
        }

        // Hacer público
        await gcsFile.makePublic();
        console.log(`   ✅ Hecho público`);
        
        // Actualizar URL en BD si es necesario
        const expectedUrl = `https://storage.googleapis.com/${bucket.name}/${encodeURIComponent(file.storage_key)}`;
        if (file.public_url !== expectedUrl) {
          await dbClient.query(
            'UPDATE files SET public_url = $1 WHERE id = $2',
            [expectedUrl, file.id]
          );
          console.log(`   📝 URL actualizada en BD`);
        }

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
      console.log('');
    }

    console.log('🎉 Proceso completado');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await dbClient.end();
  }
}

makeAvatarsPublic();

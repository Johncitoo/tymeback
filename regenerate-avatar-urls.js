// Regenerar URLs firmadas para avatares existentes
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

const bucketName = process.env.GCS_BUCKET_NAME || 'tyme-dev-uploads';
const bucket = storage.bucket(bucketName);

async function regenerateSignedUrls() {
  const dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔌 Conectando a la base de datos...');
    await dbClient.connect();
    console.log('✅ Conectado\n');

    // Obtener archivos AVATAR
    console.log('📁 Buscando archivos AVATAR...');
    const result = await dbClient.query(`
      SELECT id, original_name, storage_key
      FROM files
      WHERE purpose = 'AVATAR' AND status = 'READY'
      ORDER BY created_at DESC;
    `);

    console.log(`Encontrados ${result.rows.length} archivos\n`);

    for (const file of result.rows) {
      console.log(`📸 ${file.original_name}`);
      
      try {
        const gcsFile = bucket.file(file.storage_key);
        
        // Verificar existencia
        const [exists] = await gcsFile.exists();
        if (!exists) {
          console.log(`   ⚠️  No existe en GCS`);
          continue;
        }

        // Generar URL firmada (válida por 7 días)
        const [signedUrl] = await gcsFile.getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 días
        });

        // Actualizar en BD
        await dbClient.query(
          'UPDATE files SET public_url = $1 WHERE id = $2',
          [signedUrl, file.id]
        );

        console.log(`   ✅ URL firmada generada`);
        console.log(`   📝 Válida por 7 días`);

        // También actualizar avatarUrl en users
        await dbClient.query(`
          UPDATE users 
          SET avatar_url = $1 
          WHERE id IN (
            SELECT uploaded_by_user_id 
            FROM files 
            WHERE id = $2 AND uploaded_by_user_id IS NOT NULL
          )
        `, [signedUrl, file.id]);

        console.log(`   👤 Usuario actualizado`);

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
      console.log('');
    }

    console.log('🎉 Proceso completado');
    console.log('');
    console.log('⏰ Las URLs firmadas expiran en 7 días');
    console.log('📋 Refresca Gestión de Usuarios para ver los avatares');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await dbClient.end();
  }
}

regenerateSignedUrls();

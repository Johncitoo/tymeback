/**
 * Test: Verificar que GCS se inicializa correctamente con las variables de Railway
 */
require('dotenv').config();

const projectId = process.env.GCS_PROJECT_ID;
const privateKey = process.env.GCS_PRIVATE_KEY;
const clientEmail = process.env.GCS_SERVICE_ACCOUNT_EMAIL;
const bucketName = process.env.GCS_BUCKET_NAME;

console.log('📋 Variables de entorno GCS:');
console.log(`  GCS_PROJECT_ID: ${projectId ? '✅ Set' : '❌ Not set'}`);
console.log(`  GCS_PRIVATE_KEY: ${privateKey ? `✅ Set (${privateKey.length} chars)` : '❌ Not set'}`);
console.log(`  GCS_SERVICE_ACCOUNT_EMAIL: ${clientEmail ? '✅ Set' : '❌ Not set'}`);
console.log(`  GCS_BUCKET_NAME: ${bucketName ? '✅ Set' : '❌ Not set'}`);

if (!projectId || !privateKey || !clientEmail) {
  console.error('\n❌ Variables GCS incompletas. GCS service will fail.');
  process.exit(1);
}

// Intentar inicializar Storage
const { Storage } = require('@google-cloud/storage');

try {
  const formattedKey = privateKey.includes('\\n') 
    ? privateKey.replace(/\\n/g, '\n')
    : privateKey;

  const storage = new Storage({
    projectId,
    credentials: {
      client_email: clientEmail,
      private_key: formattedKey,
    },
  });

  console.log('\n✅ GCS Storage client initialized successfully');
  console.log(`   Project: ${projectId}`);
  console.log(`   Bucket: ${bucketName}`);
  
  // Intentar listar bucket
  storage.bucket(bucketName).exists()
    .then(([exists]) => {
      if (exists) {
        console.log(`\n✅ Bucket "${bucketName}" exists and is accessible`);
      } else {
        console.error(`\n❌ Bucket "${bucketName}" does not exist`);
      }
    })
    .catch(err => {
      console.error(`\n❌ Error accessing bucket: ${err.message}`);
    });

} catch (error) {
  console.error('\n❌ Failed to initialize GCS Storage:');
  console.error(error.message);
  process.exit(1);
}

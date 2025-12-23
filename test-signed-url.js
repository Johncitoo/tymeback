/**
 * Test: Generar signed URL sin verificar bucket
 */
require('dotenv').config();
const { Storage } = require('@google-cloud/storage');

const projectId = process.env.GCS_PROJECT_ID;
const privateKey = process.env.GCS_PRIVATE_KEY;
const clientEmail = process.env.GCS_SERVICE_ACCOUNT_EMAIL;
const bucketName = process.env.GCS_BUCKET_NAME;

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

const testKey = `68703e85-cfb2-441d-b00c-b4217b39416d/AVATAR/2025/12/test-${Date.now()}.png`;

console.log('🔍 Intentando generar signed URL...');
console.log(`   Bucket: ${bucketName}`);
console.log(`   Key: ${testKey}`);

storage.bucket(bucketName).file(testKey).getSignedUrl({
  version: 'v4',
  action: 'write',
  expires: Date.now() + 15 * 60 * 1000, // 15 minutos
  contentType: 'image/png',
})
.then(([url]) => {
  console.log('\n✅ Signed URL generada exitosamente:');
  console.log(url.substring(0, 100) + '...');
  console.log('\n✅ El problema NO es la generación de URLs firmadas');
})
.catch(err => {
  console.error('\n❌ Error generando signed URL:');
  console.error(err.message);
});

// test-gcs-upload.js - Prueba de conexión a Google Cloud Storage
const { Storage } = require('@google-cloud/storage');
require('dotenv').config();

const projectId = process.env.GCS_PROJECT_ID;
const clientEmail = process.env.GCS_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GCS_PRIVATE_KEY;
const bucketName = process.env.GCS_BUCKET_NAME || 'tyme-dev-uploads';

console.log('🔧 Configuración GCS:');
console.log('  Project ID:', projectId);
console.log('  Bucket:', bucketName);
console.log('  Service Account:', clientEmail);
console.log('  Private Key:', privateKey ? '✅ Presente' : '❌ Faltante');

if (!projectId || !clientEmail || !privateKey) {
  console.error('❌ Faltan variables de entorno. Verifica tu .env');
  process.exit(1);
}

const storage = new Storage({
  projectId,
  credentials: {
    client_email: clientEmail,
    private_key: privateKey.replace(/\\n/g, '\n'),
  },
});

async function testUpload() {
  try {
    console.log('\n📦 Conectando al bucket...');
    
    const bucket = storage.bucket(bucketName);
    
    console.log('✅ Bucket configurado');

    // Crear archivos de prueba para cada tipo
    const testFiles = [
      {
        name: 'test-avatar.txt',
        content: 'Este es un avatar de prueba',
        purpose: 'AVATAR',
        mimeType: 'text/plain'
      },
      {
        name: 'test-certificate.txt',
        content: 'Este es un certificado de prueba',
        purpose: 'CERTIFICATE',
        mimeType: 'text/plain'
      },
      {
        name: 'test-payment-receipt.txt',
        content: 'Este es un comprobante de pago de prueba',
        purpose: 'PAYMENT_RECEIPT',
        mimeType: 'text/plain'
      }
    ];

    console.log('\n📤 Subiendo archivos de prueba...\n');

    for (const testFile of testFiles) {
      const fileName = `test/${testFile.purpose}/${Date.now()}-${testFile.name}`;
      const file = bucket.file(fileName);

      // Subir archivo
      await file.save(testFile.content, {
        contentType: testFile.mimeType,
        metadata: {
          purpose: testFile.purpose,
          uploadedBy: 'test-script',
          uploadedAt: new Date().toISOString()
        }
      });

      // Generar URL pública (temporal para verificación)
      const [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 60 * 1000, // 1 minuto
      });

      console.log(`✅ ${testFile.purpose}:`);
      console.log(`   Archivo: ${fileName}`);
      console.log(`   URL (válida 1 min): ${signedUrl.substring(0, 80)}...`);
      console.log('');
    }

    console.log('✅✅✅ CONEXIÓN GCS EXITOSA ✅✅✅');
    console.log('\n🎉 Todos los archivos se subieron correctamente');
    console.log('💡 Puedes verificarlos en Google Cloud Console:');
    console.log(`   https://console.cloud.google.com/storage/browser/${bucketName}/test`);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.code) console.error('   Código:', error.code);
    if (error.errors) console.error('   Detalles:', error.errors);
    process.exit(1);
  }
}

testUpload();

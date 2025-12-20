// Configurar bucket para acceso público (uniform bucket-level access)
require('dotenv').config();
const { Storage } = require('@google-cloud/storage');

const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  credentials: {
    client_email: process.env.GCS_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

const bucketName = process.env.GCS_BUCKET_NAME || 'tyme-dev-uploads';

async function makeBucketPublic() {
  try {
    console.log(`📦 Configurando bucket: ${bucketName}\n`);

    const bucket = storage.bucket(bucketName);

    // Hacer el bucket público para lectura
    console.log('🔓 Haciendo bucket público para lectura...');
    
    // Obtener política actual
    const [policy] = await bucket.iam.getPolicy({ requestedPolicyVersion: 3 });
    
    // Agregar binding para allUsers
    policy.bindings = policy.bindings || [];
    policy.bindings.push({
      role: 'roles/storage.objectViewer',
      members: ['allUsers'],
    });
    
    // Aplicar nueva política
    await bucket.iam.setPolicy(policy);

    console.log('✅ Bucket configurado como público para lectura');
    console.log('');
    console.log('Ahora TODOS los archivos en el bucket son accesibles públicamente');
    console.log('URLs tienen formato:');
    console.log(`https://storage.googleapis.com/${bucketName}/[ruta-del-archivo]`);
    console.log('');
    console.log('🎉 Configuración completada');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Si el error es de permisos, necesitas:');
    console.error('1. Ir a Google Cloud Console');
    console.error('2. Storage → Buckets → tyme-dev-uploads');
    console.error('3. Permissions tab');
    console.error('4. Grant Access → Add Principal: allUsers');
    console.error('5. Role: Storage Object Viewer');
    process.exit(1);
  }
}

makeBucketPublic();

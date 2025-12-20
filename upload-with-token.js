/**
 * Upload avatar usando token del usuario
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'https://tymeback-staging.up.railway.app/api';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlOGZhYzliMy05ODQ3LTRjNjMtYmFkYS1mNWVlZTVjYWQ0MTQiLCJneW1JZCI6IjY4NzAzZTg1LWNmYjItNDQxZC1iMDBjLWI0MjE3YjM5NDE2ZCIsInJvbGUiOiJBRE1JTiIsImVtYWlsIjoiYWRtaW5AdHltZS5jbCIsImZpcnN0TmFtZSI6IkFkbWluIiwibGFzdE5hbWUiOiJUWU1FIiwiZnVsbE5hbWUiOiJBZG1pbiBUWU1FIiwiaWF0IjoxNzY2MjE5MTE5LCJleHAiOjE3NjY4MjM5MTl9.5-zd03IifajyyMWtSbWdaPRhoqIQCcL1TjyxFW2_-vU';
const GYM_ID = '68703e85-cfb2-441d-b00c-b4217b39416d';

async function main() {
  try {
    // 1. Obtener cliente
    console.log('👤 1. Obteniendo cliente...');
    const clientsRes = await axios.get(`${API_URL}/clients`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      params: { gymId: GYM_ID, limit: 1 }
    });
    
    if (clientsRes.data.data.length === 0) {
      console.log('❌ No hay clientes en el gimnasio');
      return;
    }
    
    const client = clientsRes.data.data[0];
    console.log(`✅ Cliente: ${client.firstName} ${client.lastName}`);
    console.log(`   ID: ${client.id}`);
    console.log(`   Avatar actual: ${client.avatarUrl || 'null'}`);
    
    // 2. Buscar la imagen
    console.log('\n📁 2. Buscando imagen gym-3.jpg...');
    const imagePath = path.join(__dirname, '..', 'gym-3.jpg');
    
    if (!fs.existsSync(imagePath)) {
      console.log(`❌ No se encontró la imagen en: ${imagePath}`);
      console.log('   Por favor, coloca gym-3.jpg en la raíz del proyecto');
      return;
    }
    
    const fileStats = fs.statSync(imagePath);
    console.log(`✅ Imagen encontrada: ${fileStats.size} bytes`);
    
    // 3. Solicitar presigned URL
    console.log('\n📤 3. Solicitando presigned URL...');
    const presignRes = await axios.post(
      `${API_URL}/files/presign`,
      {
        gymId: GYM_ID,
        ownerUserId: client.id,
        purpose: 'AVATAR',
        originalName: 'gym-3.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: fileStats.size
      },
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    
    console.log('✅ Presigned URL obtenida:');
    console.log(`   File ID: ${presignRes.data.fileId}`);
    console.log(`   Storage Bucket: ${presignRes.data.storageBucket}`);
    console.log(`   Storage Key: ${presignRes.data.storageKey}`);
    
    // 4. Subir a GCS
    console.log('\n☁️  4. Subiendo a Google Cloud Storage...');
    const fileBuffer = fs.readFileSync(imagePath);
    
    await axios.put(presignRes.data.uploadUrl, fileBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': fileStats.size
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });
    
    console.log('✅ Archivo subido a GCS exitosamente');
    
    // 5. Completar subida
    console.log('\n✅ 5. Completando subida...');
    const completeRes = await axios.post(
      `${API_URL}/files/complete`,
      {
        fileId: presignRes.data.fileId,
        gymId: GYM_ID,
        makePublic: true
      },
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    
    console.log('✅ Subida completada:');
    console.log(`   Public URL: ${completeRes.data.publicUrl}`);
    
    // 6. Actualizar avatar del usuario
    console.log('\n👤 6. Actualizando avatar del usuario...');
    await axios.patch(
      `${API_URL}/users/${client.id}`,
      {
        avatarUrl: completeRes.data.publicUrl
      },
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    
    console.log('✅ Avatar actualizado exitosamente!');
    console.log(`\n🎉 ÉXITO! El cliente ${client.firstName} ${client.lastName} ahora tiene foto de perfil`);
    console.log(`   URL: ${completeRes.data.publicUrl}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    
    if (error.response?.status === 500) {
      console.error('\n🔴 Error 500 en Railway - VERIFICA:');
      console.error('   1. Que las variables GCS estén en Railway (Project → Variables)');
      console.error('   2. Que Railway haya redesplegado (mira los logs)');
      console.error('   3. Ve a Railway logs y busca "GCS" para ver si se inicializó');
    }
  }
}

main();

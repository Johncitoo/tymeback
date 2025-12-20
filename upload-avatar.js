/**
 * Script para subir imagen de perfil a un cliente
 * Flujo completo: presign -> upload -> complete
 */
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const API_URL = process.env.VITE_API_URL || 'https://tymeback-staging.up.railway.app/api';
const FRONTEND_URL = 'https://tymeadmin.vercel.app';

async function uploadClientAvatar() {
  try {
    console.log('🔐 1. Login...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      gymSlug: 'tyme',
      login: 'admin@tyme.cl',
      password: 'AdminTyme123!'
    });
    
    console.log('Login response:', JSON.stringify(loginRes.data, null, 2));
    
    const token = loginRes.data.accessToken;
    const gymId = loginRes.data.user?.gymId || loginRes.data.gymId || '68703e85-cfb2-441d-b00c-b4217b39416d';
    console.log(`✅ Login exitoso, gymId: ${gymId}`);
    
    // 2. Obtener el cliente
    console.log('\n👤 2. Obteniendo cliente...');
    const clientsRes = await axios.get(`${API_URL}/clients`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { gymId, limit: 1 }
    });
    
    if (clientsRes.data.data.length === 0) {
      console.log('❌ No hay clientes');
      return;
    }
    
    const client = clientsRes.data.data[0];
    console.log(`✅ Cliente encontrado: ${client.firstName} ${client.lastName} (${client.id})`);
    console.log(`   Avatar actual: ${client.avatarUrl || 'null'}`);
    
    // 3. Preparar archivo (simulado por ahora)
    const fileName = 'gym-3.jpg';
    const mimeType = 'image/jpeg';
    const fileSize = 500000; // ~500KB estimado
    
    console.log('\n📤 3. Solicitando presigned URL...');
    const presignRes = await axios.post(
      `${API_URL}/files/presign`,
      {
        gymId,
        ownerUserId: client.id,
        purpose: 'AVATAR',
        originalName: fileName,
        mimeType,
        sizeBytes: fileSize
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('✅ Presigned URL obtenida:');
    console.log(`   File ID: ${presignRes.data.fileId}`);
    console.log(`   Upload URL: ${presignRes.data.uploadUrl.substring(0, 80)}...`);
    console.log(`   Expires: ${presignRes.data.expiresAt}`);
    
    // 4. Aquí debería subir el archivo real a GCS
    console.log('\n⚠️  4. Subida del archivo a GCS:');
    console.log('   Para subir el archivo real, necesitas usar el uploadUrl con PUT');
    console.log('   Comando curl:');
    console.log(`   curl -X PUT "${presignRes.data.uploadUrl}" -H "Content-Type: ${mimeType}" --data-binary "@gym-3.jpg"`);
    
    // 5. Completar la subida (simulado)
    console.log('\n✅ 5. Una vez subido, completa con:');
    console.log(`   POST ${API_URL}/files/complete`);
    console.log(`   Body: { fileId: "${presignRes.data.fileId}", gymId: "${gymId}", makePublic: true }`);
    
    // 6. Actualizar avatar del usuario
    console.log('\n👤 6. Actualizar avatar en usuario:');
    console.log(`   PATCH ${API_URL}/users/${client.id}`);
    console.log(`   Body: { avatarUrl: "<publicUrl_from_complete>" }`);
    
    return {
      fileId: presignRes.data.fileId,
      uploadUrl: presignRes.data.uploadUrl,
      clientId: client.id,
      gymId
    };
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 500) {
      console.error('\n🔴 Error 500 - Verifica:');
      console.error('   1. Variables GCS configuradas en Railway');
      console.error('   2. Railway haya redesplegado después de agregar variables');
      console.error('   3. Logs de Railway para más detalles');
    }
  }
}

uploadClientAvatar();

// test-presign-endpoint.js - Probar endpoint de presign
const axios = require('axios');

const API_URL = 'https://tymeback-staging.up.railway.app/api';

async function testPresign() {
  try {
    console.log('🔍 Testing /api/files/presign endpoint...\n');
    
    // Simular login de admin
    console.log('1. Login como admin...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      gymSlug: 'tyme',
      login: 'admin@tyme.cl',
      password: 'AdminTyme123!',
    });
    
    const token = loginRes.data.accessToken;
    console.log('✅ Login exitoso\n');
    
    // Intentar presign
    console.log('2. Solicitando presigned URL...');
    const presignRes = await axios.post(
      `${API_URL}/files/presign`,
      {
        gymId: '68703e85-cfb2-441d-b00c-b4217b39416d',
        ownerUserId: loginRes.data.user.id,
        originalName: 'test-avatar.png',
        mimeType: 'image/png',
        sizeBytes: 50000,
        purpose: 'AVATAR',
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    console.log('✅ Presigned URL obtenida:');
    console.log(JSON.stringify(presignRes.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

testPresign();

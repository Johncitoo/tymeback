// Obtener logs de error de Railway
const https = require('https');

async function testUsersEndpoint() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjN2Y4YTRjMC1jZDJjLTRjMjAtYTQ4ZS01NjBjMDU0ODUyMTQiLCJneW1JZCI6IjA1MzRlYjUzLTU0NGQtNDhhNC05ZWNhLWEyOTEyMDI1YzcyNSIsInJvbGUiOiJBRE1JTiIsImVtYWlsIjoiYWRtaW5AdHltZS5kZW1vIiwiZmlyc3ROYW1lIjoiQWRtaW4iLCJsYXN0TmFtZSI6IlR5bWUiLCJmdWxsTmFtZSI6IkFkbWluIFR5bWUiLCJpYXQiOjE3NjYxMjg2NjQsImV4cCI6MTc2NjczMzQ2NH0.dmkPO1LOX463XIYebgwj1KNv43xzhsDy0tZF8QD6uVQ';

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'tymeback-staging.up.railway.app',
      path: '/api/users',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Headers:', res.headers);
        console.log('Body:', data);
        resolve();
      });
    });

    req.on('error', reject);
    req.end();
  });
}

testUsersEndpoint();

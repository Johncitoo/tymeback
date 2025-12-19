// Testing exhaustivo del backend en Railway
const https = require('https');
const { Client } = require('pg');

const API_URL = 'https://tymeback-staging.up.railway.app';
const DB_URL = 'postgresql://postgres:DanpBohSbQluYBnEIpTGDoYVCDiUslqG@maglev.proxy.rlwy.net:51300/railway';

let JWT_TOKEN = '';
let ADMIN_USER_ID = '';
let GYM_ID = '';

// Helper para hacer requests HTTP
function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Tests
async function runTests() {
  console.log('🧪 INICIANDO TESTING EXHAUSTIVO DEL BACKEND\n');
  console.log('='.repeat(60));

  try {
    // 1. LOGIN
    console.log('\n📝 TEST 1: Login');
    const loginRes = await request('POST', '/api/auth/login', {
      gymSlug: 'tyme-demo',
      login: 'admin@tyme.demo',
      password: 'Admin123'
    });
    
    if (loginRes.status === 200 || loginRes.status === 201) {
      JWT_TOKEN = loginRes.data.access_token;
      ADMIN_USER_ID = loginRes.data.user.id;
      GYM_ID = loginRes.data.user.gymId;
      console.log('✅ Login exitoso');
      console.log(`   User ID: ${ADMIN_USER_ID}`);
      console.log(`   Gym ID: ${GYM_ID}`);
      console.log(`   Role: ${loginRes.data.user.role}`);
    } else {
      console.log('❌ Login falló:', loginRes.status, loginRes.data);
      return;
    }

    // 2. GET /users
    console.log('\n📝 TEST 2: GET /users');
    const usersRes = await request('GET', '/api/users', null, JWT_TOKEN);
    console.log(`   Status: ${usersRes.status}`);
    if (usersRes.status === 200) {
      console.log(`✅ Users listados: ${usersRes.data.total || usersRes.data.length} usuarios`);
      if (usersRes.data.data) {
        console.log(`   Primeros usuarios:`, usersRes.data.data.slice(0, 2).map(u => `${u.firstName} ${u.lastName}`));
      }
    } else {
      console.log('❌ Error:', usersRes.data);
    }

    // 3. GET /clients
    console.log('\n📝 TEST 3: GET /clients');
    const clientsRes = await request('GET', '/api/clients', null, JWT_TOKEN);
    console.log(`   Status: ${clientsRes.status}`);
    if (clientsRes.status === 200) {
      console.log(`✅ Clients listados: ${clientsRes.data.total || clientsRes.data.length} clientes`);
    } else {
      console.log('⚠️  Error o sin clientes:', clientsRes.data);
    }

    // 4. GET /gyms/:id
    console.log('\n📝 TEST 4: GET /gyms/:id');
    const gymRes = await request('GET', `/api/gyms/${GYM_ID}`, null, JWT_TOKEN);
    console.log(`   Status: ${gymRes.status}`);
    if (gymRes.status === 200) {
      console.log(`✅ Gym info: ${gymRes.data.name} (${gymRes.data.slug})`);
    } else {
      console.log('❌ Error:', gymRes.data);
    }

    // 5. POST /users (crear cliente de prueba)
    console.log('\n📝 TEST 5: POST /users (crear cliente)');
    const newUserRes = await request('POST', '/api/users', {
      email: `test.client.${Date.now()}@tyme.demo`,
      firstName: 'Test',
      lastName: 'Client',
      role: 'CLIENT',
      password: 'Test123',
      gymId: GYM_ID
    }, JWT_TOKEN);
    console.log(`   Status: ${newUserRes.status}`);
    if (newUserRes.status === 201 || newUserRes.status === 200) {
      console.log(`✅ Usuario creado: ${newUserRes.data.firstName} ${newUserRes.data.lastName}`);
      console.log(`   ID: ${newUserRes.data.id}`);
    } else {
      console.log('⚠️  Error o validación:', newUserRes.data);
    }

    // 6. Test autenticación sin token
    console.log('\n📝 TEST 6: Seguridad - Request sin JWT');
    const noAuthRes = await request('GET', '/api/users', null, null);
    console.log(`   Status: ${noAuthRes.status}`);
    if (noAuthRes.status === 401) {
      console.log('✅ Correctamente bloqueado sin token');
    } else {
      console.log('❌ PROBLEMA DE SEGURIDAD: No requiere autenticación');
    }

    // 7. GET /attendance
    console.log('\n📝 TEST 7: GET /attendance');
    const attendanceRes = await request('GET', '/api/attendance', null, JWT_TOKEN);
    console.log(`   Status: ${attendanceRes.status}`);
    if (attendanceRes.status === 200) {
      console.log(`✅ Attendance endpoint funcional`);
    } else {
      console.log('⚠️  Status:', attendanceRes.data);
    }

    // 8. Verificar base de datos
    console.log('\n📝 TEST 8: Verificación de BD');
    const db = new Client({ connectionString: DB_URL });
    await db.connect();
    
    const gymCount = await db.query('SELECT COUNT(*) FROM gyms');
    const userCount = await db.query('SELECT COUNT(*) FROM users');
    const gymUserCount = await db.query('SELECT COUNT(*) FROM gym_users');
    const clientCount = await db.query('SELECT COUNT(*) FROM clients');
    
    console.log('✅ Totales en BD:');
    console.log(`   - Gyms: ${gymCount.rows[0].count}`);
    console.log(`   - Users: ${userCount.rows[0].count}`);
    console.log(`   - Gym_users: ${gymUserCount.rows[0].count}`);
    console.log(`   - Clients: ${clientCount.rows[0].count}`);
    
    await db.end();

    console.log('\n' + '='.repeat(60));
    console.log('✅ TESTING COMPLETADO');
    
  } catch (error) {
    console.error('\n❌ ERROR EN TESTING:', error.message);
    console.error(error.stack);
  }
}

runTests();

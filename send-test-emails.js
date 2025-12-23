const { Client } = require('pg');

const connectionString = 'postgresql://postgres:DanpBohSbQluYBnEIpTGDoYVCDiUslqG@maglev.proxy.rlwy.net:51300/railway';
const testEmail = 'juanjacontrerasra@gmail.com';

async function sendTestEmails() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('🔌 Conectado a Railway...');

    // Obtener primer gym
    const gymResult = await client.query('SELECT id, name FROM gyms LIMIT 1');
    if (gymResult.rows.length === 0) {
      console.log('❌ No hay gyms en la base de datos');
      return;
    }
    const gym = gymResult.rows[0];
    console.log(`✅ Usando gym: ${gym.name} (${gym.id})`);

    // Obtener o crear usuario de prueba
    let user = await client.query('SELECT * FROM users WHERE email = $1', [testEmail]);
    
    if (user.rows.length === 0) {
      console.log('📝 Creando usuario de prueba...');
      const insertResult = await client.query(
        `INSERT INTO users (first_name, last_name, email, is_active) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        ['Juan', 'Contreras', testEmail, true]
      );
      user = insertResult;
      
      // Crear gym_user
      await client.query(
        `INSERT INTO gym_users (gym_id, user_id, role, is_active) 
         VALUES ($1, $2, $3, $4)`,
        [gym.id, user.rows[0].id, 'CLIENT', true]
      );
      console.log('✅ Usuario de prueba creado');
    } else {
      console.log('✅ Usuario de prueba encontrado');
    }

    const testUser = user.rows[0];
    console.log(`📧 Usuario: ${testUser.first_name} ${testUser.last_name} (${testUser.email})`);

    // Invocar endpoint de backend para enviar cada tipo de correo
    const backendUrl = 'https://tymeback-staging.up.railway.app';
    
    console.log('\n📬 Enviando correos de prueba...\n');

    // 1. Correo de Bienvenida/Activación
    console.log('1️⃣ Enviando correo de bienvenida/activación...');
    const activationToken = require('crypto').randomBytes(32).toString('hex');
    await client.query(
      `INSERT INTO auth_tokens (user_id, token, type, expires_at, is_used) 
       VALUES ($1, $2, $3, NOW() + INTERVAL '72 hours', false)`,
      [testUser.id, activationToken, 'ACCOUNT_ACTIVATION']
    );
    
    const activationResponse = await fetch(`${backendUrl}/api/auth/test/send-activation-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gymId: gym.id,
        userId: testUser.id,
        toEmail: testEmail,
        userName: `${testUser.first_name} ${testUser.last_name}`,
        activationToken: activationToken
      })
    }).catch(() => ({ ok: false }));
    
    console.log(activationResponse.ok ? '   ✅ Correo de bienvenida enviado' : '   ⚠️ No se pudo enviar (endpoint no disponible)');

    // 2. Correo de Recuperación de Contraseña
    console.log('\n2️⃣ Enviando correo de recuperación de contraseña...');
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    await client.query(
      `INSERT INTO auth_tokens (user_id, token, type, expires_at, is_used) 
       VALUES ($1, $2, $3, NOW() + INTERVAL '1 hour', false)`,
      [testUser.id, resetToken, 'PASSWORD_RESET']
    );
    
    const resetResponse = await fetch(`${backendUrl}/api/auth/test/send-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gymId: gym.id,
        userId: testUser.id,
        toEmail: testEmail,
        userName: `${testUser.first_name} ${testUser.last_name}`,
        resetToken: resetToken
      })
    }).catch(() => ({ ok: false }));
    
    console.log(resetResponse.ok ? '   ✅ Correo de recuperación enviado' : '   ⚠️ No se pudo enviar (endpoint no disponible)');

    // 3. Correo de Confirmación de Pago
    console.log('\n3️⃣ Enviando correo de confirmación de pago...');
    const paymentResponse = await fetch(`${backendUrl}/api/auth/test/send-payment-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gymId: gym.id,
        toEmail: testEmail,
        clientName: `${testUser.first_name} ${testUser.last_name}`,
        planName: 'Plan Mensual Premium',
        amount: 35000,
        paymentDate: new Date().toISOString().slice(0, 10)
      })
    }).catch(() => ({ ok: false }));
    
    console.log(paymentResponse.ok ? '   ✅ Correo de pago enviado' : '   ⚠️ No se pudo enviar (endpoint no disponible)');

    // 4. Recordatorios de Vencimiento (7, 3 y 1 día)
    console.log('\n4️⃣ Enviando recordatorios de vencimiento...');
    
    // 4a. Recordatorio de 7 días
    console.log('   📅 Recordatorio 7 días antes...');
    const expiryDate7 = new Date();
    expiryDate7.setDate(expiryDate7.getDate() + 7);
    
    const reminder7Response = await fetch(`${backendUrl}/api/auth/test/send-expiration-reminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gymId: gym.id,
        userId: testUser.id,
        toEmail: testEmail,
        userName: `${testUser.first_name} ${testUser.last_name}`,
        planName: 'Plan Mensual Premium',
        expiryDate: expiryDate7.toISOString().slice(0, 10),
        daysUntilExpiry: 7
      })
    }).catch(() => ({ ok: false }));
    
    console.log(reminder7Response.ok ? '      ✅ Recordatorio 7 días enviado' : '      ⚠️ No se pudo enviar');

    // 4b. Recordatorio de 3 días
    console.log('   📅 Recordatorio 3 días antes...');
    const expiryDate3 = new Date();
    expiryDate3.setDate(expiryDate3.getDate() + 3);
    
    const reminder3Response = await fetch(`${backendUrl}/api/auth/test/send-expiration-reminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gymId: gym.id,
        userId: testUser.id,
        toEmail: testEmail,
        userName: `${testUser.first_name} ${testUser.last_name}`,
        planName: 'Plan Mensual Premium',
        expiryDate: expiryDate3.toISOString().slice(0, 10),
        daysUntilExpiry: 3
      })
    }).catch(() => ({ ok: false }));
    
    console.log(reminder3Response.ok ? '      ✅ Recordatorio 3 días enviado' : '      ⚠️ No se pudo enviar');

    // 4c. Recordatorio de 1 día (URGENTE)
    console.log('   📅 Recordatorio 1 día antes (URGENTE)...');
    const expiryDate1 = new Date();
    expiryDate1.setDate(expiryDate1.getDate() + 1);
    
    const reminder1Response = await fetch(`${backendUrl}/api/auth/test/send-expiration-reminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gymId: gym.id,
        userId: testUser.id,
        toEmail: testEmail,
        userName: `${testUser.first_name} ${testUser.last_name}`,
        planName: 'Plan Mensual Premium',
        expiryDate: expiryDate1.toISOString().slice(0, 10),
        daysUntilExpiry: 1
      })
    }).catch(() => ({ ok: false }));
    
    console.log(reminder1Response.ok ? '      ✅ Recordatorio 1 día enviado (URGENTE)' : '      ⚠️ No se pudo enviar');

    // 5. Membresía Expirada (ya pasó la fecha)
    console.log('\n5️⃣ Enviando correo de membresía expirada...');
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 5); // Expiró hace 5 días
    
    const expiredResponse = await fetch(`${backendUrl}/api/auth/test/send-membership-expired`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gymId: gym.id,
        userId: testUser.id,
        toEmail: testEmail,
        userName: `${testUser.first_name} ${testUser.last_name}`,
        planName: 'Plan Mensual Premium',
        expiryDate: expiredDate.toISOString().slice(0, 10)
      })
    }).catch(() => ({ ok: false }));
    
    console.log(expiredResponse.ok ? '   ✅ Correo de membresía expirada enviado' : '   ⚠️ No se pudo enviar');

    console.log('\n✅ Proceso completado');
    console.log(`\n📬 Revisa tu bandeja de entrada: ${testEmail}`);
    console.log('💡 Si no ves los correos, revisa la carpeta de spam/correo no deseado');
    console.log('\n📊 Resumen de correos enviados:');
    console.log('   1. Bienvenida/Activación (72h de validez)');
    console.log('   2. Recuperación de Contraseña (1h de validez)');
    console.log('   3. Confirmación de Pago');
    console.log('   4. Recordatorio 7 días antes del vencimiento');
    console.log('   5. Recordatorio 3 días antes del vencimiento');
    console.log('   6. Recordatorio 1 día antes del vencimiento (URGENTE)');
    console.log('   7. Membresía Expirada (pasó la fecha)');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

sendTestEmails();

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
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    
    console.log('\n📬 Enviando correos de prueba...\n');

    // 1. Correo de Bienvenida/Activación
    console.log('1️⃣ Enviando correo de bienvenida/activación...');
    const activationToken = require('crypto').randomBytes(32).toString('hex');
    await client.query(
      `INSERT INTO auth_tokens (user_id, token, type, expires_at, is_used) 
       VALUES ($1, $2, $3, NOW() + INTERVAL '72 hours', false)`,
      [testUser.id, activationToken, 'ACCOUNT_ACTIVATION']
    );
    
    const activationResponse = await fetch(`${backendUrl}/api/test/send-activation-email`, {
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
    
    const resetResponse = await fetch(`${backendUrl}/api/test/send-password-reset-email`, {
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
    const paymentResponse = await fetch(`${backendUrl}/api/test/send-payment-confirmation`, {
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

    // 4. Correo de Recordatorio de Vencimiento
    console.log('\n4️⃣ Enviando correo de recordatorio de vencimiento...');
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 3);
    
    const reminderResponse = await fetch(`${backendUrl}/api/test/send-expiration-reminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gymId: gym.id,
        userId: testUser.id,
        userEmail: testEmail,
        userName: `${testUser.first_name} ${testUser.last_name}`,
        planName: 'Plan Mensual Premium',
        expiryDate: expiryDate.toISOString().slice(0, 10),
        daysUntilExpiry: 3
      })
    }).catch(() => ({ ok: false }));
    
    console.log(reminderResponse.ok ? '   ✅ Correo de recordatorio enviado' : '   ⚠️ No se pudo enviar (endpoint no disponible)');

    console.log('\n✅ Proceso completado');
    console.log(`\n📬 Revisa tu bandeja de entrada: ${testEmail}`);
    console.log('💡 Si no ves los correos, revisa la carpeta de spam/correo no deseado');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

sendTestEmails();

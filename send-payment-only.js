const fetch = require('node-fetch');

const backendUrl = 'https://tymeback-staging.up.railway.app';
const testEmail = 'juanjacontrerasra@gmail.com';
const gymId = '0534eb53-544d-48a4-9eca-a2912025c725';

async function sendPaymentEmail() {
  console.log('📧 Enviando correo de confirmación de pago...');
  
  try {
    const response = await fetch(`${backendUrl}/test/send-payment-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gymId: gymId,
        toEmail: testEmail,
        clientName: 'Juan Contreras',
        planName: 'Plan Mensual Premium',
        amount: 35000,
        paymentDate: new Date().toISOString().slice(0, 10)
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Correo de pago enviado exitosamente');
      console.log('📬 Revisa tu bandeja:', testEmail);
      console.log('💡 Si no lo ves, revisa spam/correo no deseado');
    } else {
      console.log('❌ Error:', response.status, response.statusText);
      const text = await response.text();
      console.log('Respuesta:', text);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

sendPaymentEmail();

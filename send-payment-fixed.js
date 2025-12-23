const fetch = require('node-fetch');

const backendUrl = 'https://tymeback-staging.up.railway.app';

async function sendPaymentEmail() {
  console.log('🚀 Enviando correo de confirmación de pago...');

  try {
    // Llamar al endpoint de test en auth controller
    const response = await fetch(`${backendUrl}/auth/test/send-payment-confirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gymId: '0534eb53-544d-48a4-9eca-a2912025c725',
        toEmail: 'juanjacontrerasra@gmail.com',
        clientName: 'Juan Contreras',
        planName: 'Plan Mensual Premium',
        amount: 35000,
        paymentDate: new Date().toISOString().slice(0, 10),
        discountClp: 5000,
        promotionName: 'Descuento de Bienvenida'
      }),
    });

    if (response.ok) {
      console.log('✅ Correo de pago enviado exitosamente');
    } else {
      const errorText = await response.text();
      console.error(`❌ Error: ${response.status} ${response.statusText}`);
      console.error(errorText);
    }
  } catch (error) {
    console.error('❌ Error al enviar:', error.message);
  }
}

sendPaymentEmail();

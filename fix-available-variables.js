const { Client } = require('pg');

const connectionString = 'postgresql://postgres:DanpBohSbQluYBnEIpTGDoYVCDiUslqG@maglev.proxy.rlwy.net:51300/railway';

async function fixAvailableVariables() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('🔌 Conectado a Railway...');

    // Actualizar cada tipo de plantilla con el formato correcto
    const updates = [
      {
        type: 'PASSWORD_RESET',
        variables: { nombre: 'Nombre del usuario', resetLink: 'Enlace de recuperación' }
      },
      {
        type: 'PAYMENT_CONFIRMATION',
        variables: { nombre: 'Nombre del usuario', plan: 'Nombre del plan', monto: 'Monto pagado', fecha: 'Fecha del pago' }
      },
      {
        type: 'MEMBERSHIP_EXPIRATION',
        variables: { nombre: 'Nombre del usuario', plan: 'Nombre del plan', dias: 'Días restantes', fecha: 'Fecha de vencimiento' }
      },
      {
        type: 'WELCOME',
        variables: { nombre: 'Nombre del usuario' }
      },
      {
        type: 'ACCOUNT_INACTIVE',
        variables: { nombre: 'Nombre del usuario' }
      }
    ];

    for (const update of updates) {
      await client.query(
        `UPDATE automated_email_templates 
         SET available_variables = $1::jsonb 
         WHERE type = $2`,
        [JSON.stringify(update.variables), update.type]
      );
      console.log(`✅ Actualizado ${update.type}`);
    }

    console.log('✅ Todas las plantillas actualizadas');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

fixAvailableVariables();

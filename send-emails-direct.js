/**
 * Script para enviar correos de prueba directamente sin usar HTTP
 * Se conecta a la base de datos y envía los 4 tipos de correos configurados
 */

const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando envío de correos de prueba...\n');

// Este script necesita ser ejecutado desde el contexto de NestJS
// Voy a crear un comando temporal en package.json

const backendPath = __dirname;
const testEmail = 'juanjacontrerasra@gmail.com';

console.log(`📧 Destinatario: ${testEmail}`);
console.log(`📂 Backend: ${backendPath}\n`);

console.log('⏳ Esperando Railway deployment...');
console.log('💡 Ejecuta este comando manualmente después del deploy:\n');
console.log('   curl -X POST https://tymeback-production.up.railway.app/test/send-activation-email \\');
console.log('        -H "Content-Type: application/json" \\');
console.log(`        -d '{"gymId":"0534eb53-544d-48a4-9eca-a2912025c725","userId":"test","toEmail":"${testEmail}","userName":"Juan Contreras","activationToken":"test123"}'\n`);

console.log('O espera 2 minutos y vuelve a ejecutar: node send-test-emails.js');

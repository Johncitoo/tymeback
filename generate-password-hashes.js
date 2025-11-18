/**
 * Script para generar hashes de contraseña compatibles con el backend
 * Ejecutar: node generate-password-hashes.js
 */

const crypto = require('crypto');

function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(plain, salt, 100000, 64, 'sha512').toString('hex');
  return `pbkdf2$100000$${salt}$${hash}`;
}

const passwords = {
  'admin@tyme.cl': 'Admin123!',
  'cliente@tyme.cl': 'Cliente123!',
  'entrenador@tyme.cl': 'Entrenador123!',
  'nutricionista@tyme.cl': 'Nutricionista123!'
};

console.log('\n🔐 Hashes de contraseñas generados:\n');
console.log('Copiar estos valores en el SQL de Railway:\n');

for (const [email, password] of Object.entries(passwords)) {
  const hash = hashPassword(password);
  console.log(`-- ${email} (password: ${password})`);
  console.log(`'${hash}'`);
  console.log('');
}

console.log('\n✅ Listo! Usa estos hashes en el archivo seed-users.sql\n');

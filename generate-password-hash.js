/**
 * Script para generar hashes de contraseñas compatibles con el backend
 * Usa pbkdf2 con 100,000 iteraciones, sha512, 64 bytes
 * 
 * Uso:
 *   node generate-password-hash.js
 *   node generate-password-hash.js "MiContraseña123"
 */

const crypto = require('crypto');

/**
 * Hash password usando pbkdf2 (compatible con backend NestJS)
 * @param {string} password - Contraseña en texto plano
 * @returns {string} Hash en formato: pbkdf2$100000$salt$hash
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `pbkdf2$100000$${salt}$${hash}`;
}

// Si se pasa un argumento, hashear solo esa contraseña
if (process.argv[2]) {
  const password = process.argv[2];
  console.log(`\nHash para: "${password}"`);
  console.log(hashPassword(password));
  console.log('');
  process.exit(0);
}

// Si no hay argumentos, generar hashes para las contraseñas del seed
console.log('\n=== Generador de Hashes para Seed Data ===\n');

const passwords = {
  'SuperAdmin123!': 'Super Admin',
  'AdminTyme123!': 'Admin TYME',
  'AdminX123!': 'Admin X'
};

console.log('Contraseñas para seed data:\n');

for (const [password, description] of Object.entries(passwords)) {
  const hash = hashPassword(password);
  console.log(`${description}:`);
  console.log(`  Password: ${password}`);
  console.log(`  Hash:     ${hash}`);
  console.log('');
}

console.log('===========================================');
console.log('\n📋 Copiar estos hashes en SEED_SUPER_ADMIN.md');
console.log('   Reemplazar donde dice: HASH_AQUI_SuperAdmin123, etc.\n');
console.log('💡 Para generar hash de otra contraseña:');
console.log('   node generate-password-hash.js "TuContraseña"\n');

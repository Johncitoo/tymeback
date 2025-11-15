/**
 * Script para generar hash de contraseña compatible con TYME Gym
 * Usa el mismo algoritmo PBKDF2 que el backend
 * 
 * Uso:
 *   node hash-password.js [contraseña]
 * 
 * Ejemplo:
 *   node hash-password.js admin123
 */

const crypto = require('crypto');

function hashPassword(plainPassword) {
  const iterations = 100000;
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(plainPassword, salt, iterations, 64, 'sha512')
    .toString('hex');
  
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

// Obtener contraseña de argumentos o usar default
const password = process.argv[2] || 'admin123';

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║         🔐 Generador de Hash de Contraseña - TYME Gym           ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

console.log(`📝 Contraseña: ${password}`);
console.log(`🔢 Iteraciones: 100,000 (PBKDF2-SHA512)`);
console.log(`\n🔐 Hash generado:`);

const hashedPassword = hashPassword(password);
console.log(`\x1b[36m${hashedPassword}\x1b[0m`);

console.log(`\n📋 Query SQL para actualizar administrador:\n`);
console.log(`\x1b[33mUPDATE users`);
console.log(`SET hashed_password = '${hashedPassword}'`);
console.log(`WHERE email = 'admin@tyme.local'`);
console.log(`  AND gym_id = '00000000-0000-0000-0000-000000000001';\x1b[0m`);

console.log(`\n✅ Cómo usar este hash:\n`);
console.log(`1. Conéctate a PostgreSQL:`);
console.log(`   \x1b[32mdocker-compose exec postgres psql -U postgres -d tyme_db\x1b[0m`);
console.log(`\n2. Pega el query SQL de arriba`);
console.log(`\n3. Verifica:`);
console.log(`   \x1b[32mSELECT email, role, hashed_password IS NOT NULL as has_password`);
console.log(`   FROM users WHERE email = 'admin@tyme.local';\x1b[0m`);
console.log(`\n4. Sal de PostgreSQL:`);
console.log(`   \x1b[32m\\q\x1b[0m`);
console.log(`\n5. Ahora puedes hacer login en http://localhost:5173 con:`);
console.log(`   - Gym ID: \x1b[36m00000000-0000-0000-0000-000000000001\x1b[0m`);
console.log(`   - Usuario: \x1b[36madmin@tyme.local\x1b[0m o \x1b[36m11.111.111-1\x1b[0m`);
console.log(`   - Contraseña: \x1b[36m${password}\x1b[0m`);
console.log(`\n════════════════════════════════════════════════════════════════════\n`);

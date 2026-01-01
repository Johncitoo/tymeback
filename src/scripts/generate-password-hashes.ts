import { pbkdf2Sync, randomBytes } from 'crypto';

/**
 * Genera hash de contraseña usando pbkdf2 (mismo método que usa el backend)
 */
function hashPassword(password: string): string {
  const iterations = 100000;
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

// Generar hashes para las contraseñas
const passwords = [
  { user: 'Juan Contreras (SUPER_ADMIN)', password: 'apocalipto11' },
  { user: 'Esteban Diaz (SUPER_ADMIN)', password: 'somosTYME.2025' },
  { user: 'Nicolas Barrera (ADMIN)', password: 'Xk9$pL2#vM8wQ!nR7z' },
  { user: 'Diego Diaz (ADMIN)', password: 'Xk9$pL2#vM8wQ!nR7z' },
];

console.log('='.repeat(80));
console.log('HASHES DE CONTRASEÑAS PARA PRODUCCIÓN');
console.log('='.repeat(80));
console.log('');

passwords.forEach((item) => {
  const hash = hashPassword(item.password);
  console.log(`${item.user}:`);
  console.log(`  Password: ${item.password}`);
  console.log(`  Hash: ${hash}`);
  console.log('');
});

console.log('='.repeat(80));
console.log('Copia estos hashes al archivo reset-production-db.sql');
console.log('='.repeat(80));

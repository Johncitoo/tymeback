const crypto = require('crypto');

const iterations = 100000;
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto
  .pbkdf2Sync('admin123', salt, iterations, 64, 'sha512')
  .toString('hex');

console.log(`pbkdf2$${iterations}$${salt}$${hash}`);

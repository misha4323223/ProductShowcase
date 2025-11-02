const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  const hashVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === hashVerify;
}

function generateJWT(userId, email, role = 'user') {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const payload = {
    userId,
    email,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
  };
  
  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'default-secret-key')
    .update(`${base64Header}.${base64Payload}`)
    .digest('base64url');
  
  return `${base64Header}.${base64Payload}.${signature}`;
}

function verifyJWT(token) {
  try {
    const [header, payload, signature] = token.split('.');
    
    const expectedSignature = crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'default-secret-key')
      .update(`${header}.${payload}`)
      .digest('base64url');
    
    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' };
    }
    
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());
    
    if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, error: 'Token expired' };
    }
    
    return { valid: true, payload: decodedPayload };
  } catch (error) {
    return { valid: false, error: 'Invalid token format' };
  }
}

function generateResetCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  if (password.length < 6) {
    return { valid: false, error: 'Пароль должен содержать минимум 6 символов' };
  }
  return { valid: true };
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateJWT,
  verifyJWT,
  generateResetCode,
  validateEmail,
  validatePassword
};

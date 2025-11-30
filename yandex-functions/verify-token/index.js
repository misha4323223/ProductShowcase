const crypto = require('crypto');

function verifyToken(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const expectedSignature = crypto.createHmac('sha256', secret).update(`${headerB64}.${payloadB64}`).digest('base64url');

    if (signatureB64 !== expectedSignature) {
      console.error('🔴 Signature mismatch. Got:', signatureB64, 'Expected:', expectedSignature);
      return null;
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      console.error('🔴 Token expired at', new Date(payload.exp * 1000));
      return null;
    }

    console.log('✅ Token verified successfully for:', payload.email);
    return payload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

function createResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  };
}

exports.handler = async (event) => {
  try {
    const { token } = JSON.parse(event.body || '{}');
    
    if (!token) {
      return createResponse(400, { error: 'No token provided' });
    }

    const secret = process.env.JWT_SECRET || 'telegram-secret-key';
    const payload = verifyToken(token, secret);

    if (!payload) {
      return createResponse(401, { valid: false, error: 'Invalid or expired token' });
    }

    return createResponse(200, {
      valid: true,
      user: {
        userId: payload.userId,
        email: payload.email,
        role: payload.role || 'user',
        telegramId: payload.telegramId,
        telegramUsername: payload.telegramUsername,
        telegramFirstName: payload.telegramFirstName,
        emailVerified: payload.emailVerified,
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

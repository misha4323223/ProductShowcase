const { verifyJWT } = require('../lib/auth-utils');
const { createResponse } = require('../lib/response-helper');

module.exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { token } = body;

    if (!token) {
      return createResponse(400, { error: 'Токен обязателен' });
    }

    const verification = verifyJWT(token);

    if (!verification.valid) {
      return createResponse(401, { error: verification.error || 'Неверный токен' });
    }

    return createResponse(200, {
      valid: true,
      user: {
        userId: verification.payload.userId,
        email: verification.payload.email,
        role: verification.payload.role
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    return createResponse(500, { error: 'Ошибка при проверке токена' });
  }
};

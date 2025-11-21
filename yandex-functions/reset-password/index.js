const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { hashPassword, generateResetCode, validateEmail, validatePassword } = require('../lib/auth-utils');
const { createResponse } = require('../lib/response-helper');

const client = new DynamoDBClient({
  region: 'ru-central1',
  endpoint: process.env.YDB_ENDPOINT,
  credentials: {
    accessKeyId: process.env.YDB_ACCESS_KEY_ID,
    secretAccessKey: process.env.YDB_SECRET_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

module.exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, action, resetCode, newPassword } = body;

    if (!email) {
      return createResponse(400, { error: 'Email обязателен' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!validateEmail(trimmedEmail)) {
      return createResponse(400, { error: 'Неверный формат email' });
    }

    const getCommand = new GetCommand({
      TableName: 'users',
      Key: { email: trimmedEmail }
    });

    const result = await docClient.send(getCommand);

    if (!result.Item) {
      return createResponse(404, { error: 'Пользователь не найден' });
    }

    if (action === 'request') {
      const resetCode = generateResetCode();
      const resetExpiry = Date.now() + (15 * 60 * 1000);

      const updateCommand = new UpdateCommand({
        TableName: 'users',
        Key: { email: trimmedEmail },
        UpdateExpression: 'SET resetCode = :code, resetExpiry = :expiry',
        ExpressionAttributeValues: {
          ':code': resetCode,
          ':expiry': resetExpiry,
        },
      });

      await docClient.send(updateCommand);

      const sendEmailResponse = await fetch(process.env.SEND_EMAIL_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'password_reset',
          to: trimmedEmail,
          data: {
            resetCode: resetCode
          }
        }),
      });

      if (!sendEmailResponse.ok) {
        console.error('Failed to send reset email');
      }

      return createResponse(200, {
        success: true,
        message: 'Код для сброса пароля отправлен на email'
      });
    }

    if (action === 'verify') {
      const user = result.Item;

      if (!user.resetCode || !user.resetExpiry) {
        return createResponse(400, { error: 'Код сброса не был запрошен' });
      }

      if (Date.now() > user.resetExpiry) {
        return createResponse(400, { error: 'Код сброса истек. Запросите новый' });
      }

      if (user.resetCode !== resetCode) {
        return createResponse(400, { error: 'Неверный код сброса' });
      }

      if (!newPassword) {
        return createResponse(400, { error: 'Новый пароль обязателен' });
      }

      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return createResponse(400, { error: passwordValidation.error });
      }

      const { salt, hash } = hashPassword(newPassword);

      const updateCommand = new UpdateCommand({
        TableName: 'users',
        Key: { email: trimmedEmail },
        UpdateExpression: 'SET passwordSalt = :salt, passwordHash = :hash REMOVE resetCode, resetExpiry',
        ExpressionAttributeValues: {
          ':salt': salt,
          ':hash': hash,
        },
      });

      await docClient.send(updateCommand);

      return createResponse(200, {
        success: true,
        message: 'Пароль успешно изменен'
      });
    }

    return createResponse(400, { error: 'Неверное действие. Используйте action: "request" или "verify"' });

  } catch (error) {
    console.error('Password reset error:', error);
    return createResponse(500, { error: 'Ошибка при сбросе пароля' });
  }
};

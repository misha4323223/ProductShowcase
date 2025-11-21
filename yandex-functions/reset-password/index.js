const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { hashPassword, generateResetCode, validateEmail, validatePassword } = require('./auth-utils');
const { createResponse } = require('./response-helper');

const client = new DynamoDBClient({
  region: 'ru-central1',
  endpoint: process.env.YDB_ENDPOINT,
  credentials: {
    accessKeyId: process.env.YDB_ACCESS_KEY_ID,
    secretAccessKey: process.env.YDB_SECRET_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

async function sendResetCodeEmail(email, resetCode) {
  try {
    const sendEmailUrl = process.env.SEND_EMAIL_FUNCTION_URL;
    console.log('Отправка кода сброса пароля на', email, 'URL:', sendEmailUrl);
    
    if (!sendEmailUrl) {
      console.error('SEND_EMAIL_FUNCTION_URL не установлена!');
      return false;
    }

    const response = await fetch(sendEmailUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'password_reset',
        to: email,
        data: {
          resetCode: resetCode
        }
      })
    });

    const responseText = await response.text();
    console.log('Ответ от send-email:', response.status, responseText);
    
    if (!response.ok) {
      console.error('Ошибка отправки письма. Статус:', response.status);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Ошибка отправки письма сброса пароля:', error.message);
    return false;
  }
}

module.exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, action, resetCode, newPassword } = body;

    if (!email || !action) {
      return createResponse(400, { error: 'Email и action обязательны' });
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
      const code = generateResetCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      const updateCommand = new UpdateCommand({
        TableName: 'users',
        Key: { email: trimmedEmail },
        UpdateExpression: 'SET resetCode = :code, resetCodeExpires = :expires',
        ExpressionAttributeValues: {
          ':code': code,
          ':expires': expiresAt
        }
      });

      await docClient.send(updateCommand);

      const emailSent = await sendResetCodeEmail(trimmedEmail, code);

      return createResponse(200, {
        success: true,
        message: emailSent 
          ? 'Код отправлен на email' 
          : 'Код создан, но email не отправлен',
        code: emailSent ? undefined : code
      });

    } else if (action === 'verify') {
      if (!resetCode || !newPassword) {
        return createResponse(400, { error: 'Код и новый пароль обязательны' });
      }

      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return createResponse(400, { error: passwordValidation.error });
      }

      const user = result.Item;

      if (!user.resetCode || !user.resetCodeExpires) {
        return createResponse(400, { error: 'Код сброса не запрашивался' });
      }

      if (new Date(user.resetCodeExpires) < new Date()) {
        return createResponse(400, { error: 'Код истёк' });
      }

      if (user.resetCode !== resetCode.toUpperCase()) {
        return createResponse(400, { error: 'Неверный код' });
      }

      const { salt, hash } = hashPassword(newPassword);

      const updateCommand = new UpdateCommand({
        TableName: 'users',
        Key: { email: trimmedEmail },
        UpdateExpression: 'SET passwordSalt = :salt, passwordHash = :hash REMOVE resetCode, resetCodeExpires',
        ExpressionAttributeValues: {
          ':salt': salt,
          ':hash': hash
        }
      });

      await docClient.send(updateCommand);

      return createResponse(200, {
        success: true,
        message: 'Пароль успешно изменён'
      });

    } else {
      return createResponse(400, { error: 'Неверный action' });
    }

  } catch (error) {
    console.error('Reset password error:', error);
    return createResponse(500, { error: 'Ошибка при сбросе пароля' });
  }
};

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { hashPassword, generateJWT, validateEmail, validatePassword, generateResetCode } = require('./auth-utils');
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

async function sendVerificationEmail(email, verificationCode) {
  try {
    const sendEmailUrl = process.env.SEND_EMAIL_FUNCTION_URL;
    console.log('Отправка письма на', email, 'URL:', sendEmailUrl);
    
    if (!sendEmailUrl) {
      console.error('SEND_EMAIL_FUNCTION_URL не установлена!');
      return false;
    }

    const response = await fetch(sendEmailUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'email_verification',
        to: email,
        data: {
          verificationCode: verificationCode
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
    console.error('Ошибка отправки письма верификации:', error.message);
    return false;
  }
}

module.exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, password, action, verificationCode } = body;

    if (!email || !password) {
      return createResponse(400, { error: 'Email и пароль обязательны' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!validateEmail(trimmedEmail)) {
      return createResponse(400, { error: 'Неверный формат email' });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return createResponse(400, { error: passwordValidation.error });
    }

    const getCommand = new GetCommand({
      TableName: 'users',
      Key: { email: trimmedEmail }
    });

    const existingUser = await docClient.send(getCommand);

    // Шаг 1: Отправить код верификации
    if (action === 'send_verification') {
      if (existingUser.Item && existingUser.Item.isVerified) {
        return createResponse(400, { error: 'Пользователь с таким email уже существует' });
      }

      const newVerificationCode = generateResetCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      if (existingUser.Item) {
        // Обновить существующую незаверифицированную запись
        const updateCommand = new UpdateCommand({
          TableName: 'users',
          Key: { email: trimmedEmail },
          UpdateExpression: 'SET verificationCode = :code, verificationCodeExpires = :expires, tempPassword = :pass',
          ExpressionAttributeValues: {
            ':code': newVerificationCode,
            ':expires': expiresAt,
            ':pass': password
          }
        });
        await docClient.send(updateCommand);
      } else {
        // Создать новую незаверифицированную запись
        const putCommand = new PutCommand({
          TableName: 'users',
          Item: {
            email: trimmedEmail,
            verificationCode: newVerificationCode,
            verificationCodeExpires: expiresAt,
            tempPassword: password,
            isVerified: false,
            createdAt: new Date().toISOString(),
          }
        });
        await docClient.send(putCommand);
      }

      const emailSent = await sendVerificationEmail(trimmedEmail, newVerificationCode);
      if (!emailSent) {
        console.warn('Письмо не отправлено, но код сохранён');
      }

      return createResponse(200, {
        success: true,
        message: 'Код верификации отправлен на почту'
      });
    }

    // Шаг 2: Проверить код и создать аккаунт
    if (action === 'verify_email') {
      if (!verificationCode) {
        return createResponse(400, { error: 'Код верификации обязателен' });
      }

      const user = await docClient.send(getCommand);
      if (!user.Item) {
        return createResponse(404, { error: 'Пользователь не найден' });
      }

      // Проверить код
      if (!user.Item.verificationCode) {
        return createResponse(400, { error: 'Код верификации истёк или не существует' });
      }

      if (user.Item.verificationCode !== verificationCode.toUpperCase()) {
        return createResponse(400, { error: 'Неверный код верификации' });
      }

      // Проверить срок действия
      const expiresAt = new Date(user.Item.verificationCodeExpires);
      if (expiresAt < new Date()) {
        return createResponse(400, { error: 'Код верификации истёк' });
      }

      // Создать аккаунт
      const { salt, hash } = hashPassword(password);
      const userId = Date.now().toString(36) + Math.random().toString(36).substring(2);

      const updateCommand = new UpdateCommand({
        TableName: 'users',
        Key: { email: trimmedEmail },
        UpdateExpression: 'SET userId = :userId, passwordSalt = :salt, passwordHash = :hash, isVerified = :verified, role = :role REMOVE verificationCode, verificationCodeExpires, tempPassword',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':salt': salt,
          ':hash': hash,
          ':verified': true,
          ':role': 'user'
        }
      });

      await docClient.send(updateCommand);

      const token = generateJWT(userId, trimmedEmail, 'user');

      return createResponse(200, {
        success: true,
        token,
        user: {
          userId,
          email: trimmedEmail,
          role: 'user'
        }
      });
    }

    // Старая логика для прямой регистрации (если action не указан)
    if (existingUser.Item) {
      return createResponse(400, { error: 'Пользователь с таким email уже существует' });
    }

    const { salt, hash } = hashPassword(password);
    const userId = Date.now().toString(36) + Math.random().toString(36).substring(2);

    const putCommand = new PutCommand({
      TableName: 'users',
      Item: {
        email: trimmedEmail,
        userId,
        passwordSalt: salt,
        passwordHash: hash,
        role: 'user',
        isVerified: true,
        createdAt: new Date().toISOString(),
      }
    });

    await docClient.send(putCommand);

    const token = generateJWT(userId, trimmedEmail, 'user');

    return createResponse(200, {
      success: true,
      token,
      user: {
        userId,
        email: trimmedEmail,
        role: 'user'
      }
    });

  } catch (error) {
    console.error('Ошибка регистрации:', error);
    return createResponse(500, { error: `Ошибка при регистрации: ${error.message}` });
  }
};

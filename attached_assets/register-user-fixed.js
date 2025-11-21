const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const AWS_SES = require("@aws-sdk/client-sesv2");
const SESv2Client = AWS_SES.SESv2Client;
const SendEmailCommand = AWS_SES.SendEmailCommand;
const { hashPassword, generateJWT, validateEmail, validatePassword, generateResetCode } = require('./lib/auth-utils');
const { createResponse } = require('./lib/response-helper');

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

const sesClient = new SESv2Client({
  region: "ru-central1",
  endpoint: "https://postbox.cloud.yandex.net",
  credentials: {
    accessKeyId: process.env.POSTBOX_ACCESS_KEY_ID,
    secretAccessKey: process.env.POSTBOX_SECRET_ACCESS_KEY,
  },
});

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function getLogoHtml() {
  return `<div style="text-align: center; margin-bottom: 30px;">
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="display: inline-block;">
      <rect x="45" y="60" width="10" height="35" fill="#8B4513"/>
      <circle cx="50" cy="25" r="25" fill="#EC4899"/>
      <circle cx="50" cy="25" r="18" fill="#FF66B8"/>
      <path d="M 40 15 Q 32 25 40 35" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>
  </div>`;
}

async function sendVerificationEmail(email, verificationCode) {
  try {
    const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${getLogoHtml()}
      <h2 style="color: #EC4899;">Подтверждение адреса электронной почты</h2>
      <p style="font-size: 16px; line-height: 1.6;">
        Спасибо за регистрацию в Sweet Delights! 
      </p>
      <p style="font-size: 16px; line-height: 1.6;">
        Используйте код ниже для подтверждения вашего адреса электронной почты:
      </p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <p style="font-size: 24px; font-weight: bold; color: #EC4899; letter-spacing: 2px;">
          ${verificationCode}
        </p>
      </div>
      <p style="font-size: 14px; color: #666;">
        Код действителен в течение 15 минут.
      </p>
      <p style="font-size: 14px; color: #666;">
        Если вы не регистрировались в Sweet Delights, проигнорируйте это письмо.
      </p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
      <p style="font-size: 14px; color: #666;">
        С наилучшими пожеланиями,<br/>
        Команда Sweet Delights
      </p>
    </div>
    `;

    const textBody = `
Подтверждение адреса электронной почты

Спасибо за регистрацию в Sweet Delights!

Используйте код ниже для подтверждения вашего адреса электронной почты:

${verificationCode}

Код действителен в течение 15 минут.

Если вы не регистрировались в Sweet Delights, проигнорируйте это письмо.

С наилучшими пожеланиями,
Команда Sweet Delights
    `;

    const params = {
      FromEmailAddress: process.env.FROM_EMAIL || 'noreply@sweetdelights.store',
      Destination: {
        ToAddresses: [email],
      },
      Content: {
        Simple: {
          Subject: {
            Data: 'Подтверждение адреса электронной почты - Sweet Delights',
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: htmlBody,
              Charset: 'UTF-8',
            },
            Text: {
              Data: textBody,
              Charset: 'UTF-8',
            },
          },
        },
      },
    };

    const command = new SendEmailCommand(params);
    await sesClient.send(command);
    return true;
  } catch (error) {
    console.error('Ошибка отправки письма верификации:', error);
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

      if (!user.Item.verificationCode) {
        return createResponse(400, { error: 'Код верификации истёк или не существует' });
      }

      if (user.Item.verificationCode !== verificationCode.toUpperCase()) {
        return createResponse(400, { error: 'Неверный код верификации' });
      }

      const expiresAt = new Date(user.Item.verificationCodeExpires);
      if (expiresAt < new Date()) {
        return createResponse(400, { error: 'Код верификации истёк' });
      }

      const { salt, hash } = hashPassword(password);
      const userId = generateId();

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
    const userId = generateId();

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
    console.error('Registration error:', error);
    return createResponse(500, { error: 'Ошибка при регистрации' });
  }
};

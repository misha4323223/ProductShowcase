import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config({ path: 'client/.env' });

const client = new DynamoDBClient({
  region: 'ru-central1',
  endpoint: process.env.VITE_YDB_ENDPOINT,
  credentials: {
    accessKeyId: process.env.VITE_YDB_ACCESS_KEY_ID!,
    secretAccessKey: process.env.VITE_YDB_SECRET_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

async function createAdminUser() {
  const adminEmail = 'Pimashin2015@gmail.com';
  const adminPassword = 'Positive2009#';

  console.log('🔍 Проверяем существует ли админ...');

  try {
    const getCommand = new GetCommand({
      TableName: 'users',
      Key: { email: adminEmail }
    });

    const existingUser = await docClient.send(getCommand);
    
    if (existingUser.Item) {
      console.log('⚠️  Пользователь admin@sweetdelights.com уже существует!');
      console.log('📋 Данные пользователя:', {
        email: existingUser.Item.email,
        userId: existingUser.Item.userId,
        role: existingUser.Item.role,
        createdAt: existingUser.Item.createdAt
      });
      return;
    }

    console.log('✅ Админ не найден, создаем нового...');

    const { salt, hash } = hashPassword(adminPassword);
    const userId = `admin_${Date.now()}`;

    const putCommand = new PutCommand({
      TableName: 'users',
      Item: {
        email: adminEmail,
        userId,
        passwordSalt: salt,
        passwordHash: hash,
        role: 'admin',
        createdAt: new Date().toISOString(),
      }
    });

    await docClient.send(putCommand);

    console.log('✅ Администратор успешно создан!');
    console.log('📧 Email: admin@sweetdelights.com');
    console.log('🔑 Пароль: 119944Alisa');
    console.log('👤 UserId:', userId);
    console.log('🎭 Роль: admin');

  } catch (error) {
    console.error('❌ Ошибка при создании администратора:', error);
    throw error;
  }
}

createAdminUser()
  .then(() => {
    console.log('\n✅ Готово!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Ошибка:', error);
    process.exit(1);
  });

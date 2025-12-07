const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const https = require('https');

const client = new DynamoDBClient({
  region: "ru-central1",
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

async function sendTelegramMessage(chatId, message) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken || !chatId) return null;

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload = JSON.stringify({
    chat_id: chatId,
    text: message,
    parse_mode: 'HTML',
  });

  return new Promise((resolve) => {
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(res.statusCode === 200));
    });
    req.on('error', () => resolve(false));
    req.write(payload);
    req.end();
  });
}

async function sendTelegramPhoto(chatId, photoUrl, caption) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken || !chatId) return null;

  const url = `https://api.telegram.org/bot${botToken}/sendPhoto`;
  const payload = JSON.stringify({
    chat_id: chatId,
    photo: photoUrl,
    caption: caption,
    parse_mode: 'HTML',
  });

  return new Promise((resolve) => {
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(res.statusCode === 200));
    });
    req.on('error', () => resolve(false));
    req.write(payload);
    req.end();
  });
}

function getCertificateImageUrl(designTemplate) {
  const SITE_URL = 'https://sweetdelights.store';
  const templates = {
    default: `${SITE_URL}/assets/certificates/classic_pink_gift_card.png`,
    birthday: `${SITE_URL}/assets/certificates/birthday_purple_gift_card.png`,
    celebration: `${SITE_URL}/assets/certificates/celebration_orange_gift_card.png`,
    love: `${SITE_URL}/assets/certificates/love_red_gift_card.png`,
  };
  return templates[designTemplate] || templates.default;
}

async function sendEmail(type, to, data) {
  const emailFunctionUrl = process.env.SEND_EMAIL_FUNCTION_URL;
  if (!emailFunctionUrl) return false;

  const payload = JSON.stringify({ type, to, data });

  return new Promise((resolve) => {
    const url = new URL(emailFunctionUrl);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(res.statusCode === 200));
    });
    req.on('error', () => resolve(false));
    req.write(payload);
    req.end();
  });
}

function formatCertificateMessage(cert) {
  const expiresDate = new Date(cert.expiresAt).toLocaleDateString('ru-RU');
  
  let message = `🎁 <b>Вам подарили сертификат!</b>\n\n`;
  if (cert.senderName) {
    message += `👤 От: <b>${cert.senderName}</b>\n`;
  }
  if (cert.message) {
    message += `\n💬 <i>"${cert.message}"</i>\n`;
  }
  message += `\n💳 <b>Номинал:</b> ${cert.amount}₽\n`;
  message += `🔑 <b>Код сертификата:</b>\n<code>${cert.code}</code>\n\n`;
  message += `📅 Действителен до: ${expiresDate}\n\n`;
  message += `Используйте код при оформлении заказа в Sweet Delights! 🍰`;
  return message;
}

async function sendCertificateToRecipient(cert) {
  console.log(`📨 Sending scheduled certificate ${cert.code} to recipient...`);

  const recipientMessage = formatCertificateMessage(cert);
  const imageUrl = getCertificateImageUrl(cert.designTemplate);

  let telegramSent = false;
  let emailSent = false;

  if (cert.recipientTelegramId) {
    telegramSent = await sendTelegramPhoto(cert.recipientTelegramId, imageUrl, recipientMessage);
    if (!telegramSent) {
      console.log(`⚠️ Photo send failed, falling back to text message`);
      telegramSent = await sendTelegramMessage(cert.recipientTelegramId, recipientMessage);
    }
    console.log(`Telegram send result: ${telegramSent ? 'success' : 'failed'}`);
  }

  if (cert.recipientEmail) {
    emailSent = await sendEmail('gift_certificate', cert.recipientEmail, {
      senderName: cert.senderName,
      recipientName: cert.recipientName,
      amount: cert.amount,
      code: cert.code,
      message: cert.message,
      expiresAt: cert.expiresAt,
      designTemplate: cert.designTemplate,
    });
    console.log(`Email send result: ${emailSent ? 'success' : 'failed'}`);
  }

  await docClient.send(new UpdateCommand({
    TableName: "giftCertificates",
    Key: { id: cert.id },
    UpdateExpression: "SET deliveryStatus = :status",
    ExpressionAttributeValues: {
      ":status": "delivered"
    }
  }));

  console.log(`✅ Certificate ${cert.code} marked as delivered`);
  return { telegramSent, emailSent };
}

exports.handler = async (event) => {
  try {
    console.log('Processing scheduled certificates...');
    const now = new Date();

    const result = await docClient.send(new ScanCommand({
      TableName: "giftCertificates",
      FilterExpression: "#status = :activeStatus AND deliveryStatus = :scheduled AND isGift = :isGift",
      ExpressionAttributeNames: {
        "#status": "status"
      },
      ExpressionAttributeValues: {
        ":activeStatus": "active",
        ":scheduled": "scheduled",
        ":isGift": true
      }
    }));

    const certificates = result.Items || [];
    console.log(`Found ${certificates.length} scheduled certificates to check`);

    let processedCount = 0;
    const results = [];

    for (const cert of certificates) {
      if (!cert.deliveryDate) continue;

      const deliveryDate = new Date(cert.deliveryDate);
      
      if (deliveryDate <= now) {
        console.log(`📅 Certificate ${cert.code} is due for delivery (scheduled: ${cert.deliveryDate})`);
        
        try {
          const sendResult = await sendCertificateToRecipient(cert);
          processedCount++;
          results.push({
            code: cert.code,
            recipientEmail: cert.recipientEmail,
            recipientTelegramId: cert.recipientTelegramId,
            ...sendResult
          });
        } catch (sendError) {
          console.error(`Error sending certificate ${cert.code}:`, sendError);
          results.push({
            code: cert.code,
            error: sendError.message
          });
        }
      }
    }

    console.log(`✅ Processed ${processedCount} scheduled certificates`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        processedCount,
        totalChecked: certificates.length,
        results
      }),
    };

  } catch (error) {
    console.error("Error processing scheduled certificates:", error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};

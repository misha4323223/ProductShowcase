const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, ScanCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
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

const VALID_AMOUNTS = [500, 1000, 2000, 3000, 5000, 7000, 10000];
const CERTIFICATE_VALIDITY_DAYS = 365;

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function generateCertificateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'GC-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  code += '-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function createResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  };
}

async function sendTelegramMessage(chatId, message) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken || !chatId) return null;

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload = JSON.stringify({
    chat_id: chatId,
    text: message,
    parse_mode: 'HTML',
  });

  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(res.statusCode === 200 ? JSON.parse(data) : null));
    });
    req.on('error', () => resolve(null));
    req.write(payload);
    req.end();
  });
}

async function sendEmail(type, to, data) {
  const emailFunctionUrl = process.env.SEND_EMAIL_FUNCTION_URL;
  if (!emailFunctionUrl) {
    console.log('SEND_EMAIL_FUNCTION_URL not configured, skipping email');
    return null;
  }

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

function formatCertificateMessage(cert, isForRecipient = true) {
  const expiresDate = new Date(cert.expiresAt).toLocaleDateString('ru-RU');
  
  if (isForRecipient) {
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
  } else {
    let message = `✅ <b>Сертификат успешно приобретён!</b>\n\n`;
    message += `💳 <b>Номинал:</b> ${cert.amount}₽\n`;
    message += `🔑 <b>Код:</b> <code>${cert.code}</code>\n`;
    message += `📅 Действителен до: ${expiresDate}\n`;
    if (cert.isGift && cert.recipientName) {
      message += `\n🎁 Получатель: ${cert.recipientName}\n`;
      if (cert.deliveryDate && cert.deliveryStatus === 'pending') {
        const deliveryDate = new Date(cert.deliveryDate).toLocaleDateString('ru-RU');
        message += `📨 Будет отправлен: ${deliveryDate}`;
      } else {
        message += `📨 Отправлен получателю`;
      }
    }
    return message;
  }
}

async function handleCreate(body) {
  const { 
    amount, 
    purchaserEmail, 
    purchaserName,
    isGift,
    recipientEmail,
    recipientTelegramId,
    recipientName,
    senderName,
    message,
    designTemplate,
    deliveryDate
  } = body;

  if (!amount || !VALID_AMOUNTS.includes(amount)) {
    return createResponse(400, { 
      error: `Invalid amount. Valid amounts: ${VALID_AMOUNTS.join(', ')}` 
    });
  }

  if (!purchaserEmail) {
    return createResponse(400, { error: "purchaserEmail is required" });
  }

  if (isGift && !recipientEmail && !recipientTelegramId) {
    return createResponse(400, { 
      error: "For gift certificates, recipientEmail or recipientTelegramId is required" 
    });
  }

  const id = generateId();
  const code = generateCertificateCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CERTIFICATE_VALIDITY_DAYS * 24 * 60 * 60 * 1000);

  const shouldSendNow = isGift && !deliveryDate;
  
  const certificate = {
    id,
    code,
    amount,
    balance: amount,
    status: 'pending',
    purchaserEmail: purchaserEmail.toLowerCase().trim(),
    purchaserName: purchaserName || null,
    recipientEmail: recipientEmail ? recipientEmail.toLowerCase().trim() : null,
    recipientTelegramId: recipientTelegramId || null,
    recipientName: recipientName || null,
    senderName: senderName || purchaserName || null,
    message: message || null,
    designTemplate: designTemplate || 'default',
    isGift: isGift || false,
    deliveryDate: deliveryDate || null,
    deliveryStatus: isGift ? (shouldSendNow ? 'pending' : 'scheduled') : null,
    createdAt: now.toISOString(),
    paidAt: null,
    expiresAt: expiresAt.toISOString(),
    usedAt: null,
    usedInOrderId: null,
  };

  await docClient.send(new PutCommand({
    TableName: "giftCertificates",
    Item: certificate,
  }));

  console.log(`✅ Gift certificate created: ${id}, code: ${code}, amount: ${amount}₽`);

  return createResponse(200, {
    success: true,
    certificate: {
      id: certificate.id,
      code: certificate.code,
      amount: certificate.amount,
      status: certificate.status,
      expiresAt: certificate.expiresAt,
    }
  });
}

async function handleGet(params) {
  const { code, id, userId } = params;

  if (userId) {
    const result = await docClient.send(new ScanCommand({
      TableName: "giftCertificates",
      FilterExpression: "purchaserEmail = :email OR recipientEmail = :email",
      ExpressionAttributeValues: {
        ":email": userId.toLowerCase().trim()
      }
    }));

    return createResponse(200, {
      success: true,
      certificates: result.Items || []
    });
  }

  if (code) {
    const result = await docClient.send(new ScanCommand({
      TableName: "giftCertificates",
      FilterExpression: "code = :code",
      ExpressionAttributeValues: {
        ":code": code.toUpperCase().trim()
      }
    }));

    const cert = result.Items?.[0];
    if (!cert) {
      return createResponse(404, { error: "Certificate not found" });
    }

    return createResponse(200, { success: true, certificate: cert });
  }

  if (id) {
    const result = await docClient.send(new GetCommand({
      TableName: "giftCertificates",
      Key: { id }
    }));

    if (!result.Item) {
      return createResponse(404, { error: "Certificate not found" });
    }

    return createResponse(200, { success: true, certificate: result.Item });
  }

  return createResponse(400, { error: "code, id, or userId parameter required" });
}

async function handleValidate(body) {
  const { code, orderTotal } = body;

  if (!code) {
    return createResponse(400, { error: "code is required" });
  }

  const result = await docClient.send(new ScanCommand({
    TableName: "giftCertificates",
    FilterExpression: "code = :code",
    ExpressionAttributeValues: {
      ":code": code.toUpperCase().trim()
    }
  }));

  const cert = result.Items?.[0];

  if (!cert) {
    return createResponse(200, { valid: false, message: "Сертификат не найден" });
  }

  if (cert.status === 'pending') {
    return createResponse(200, { valid: false, message: "Сертификат ещё не оплачен" });
  }

  if (cert.status === 'used') {
    return createResponse(200, { valid: false, message: "Сертификат уже использован" });
  }

  if (cert.status === 'expired' || new Date(cert.expiresAt) < new Date()) {
    return createResponse(200, { valid: false, message: "Сертификат истёк" });
  }

  if (cert.balance <= 0) {
    return createResponse(200, { valid: false, message: "Баланс сертификата исчерпан" });
  }

  const discountAmount = orderTotal ? Math.min(cert.balance, orderTotal) : cert.balance;

  return createResponse(200, {
    valid: true,
    certificate: {
      id: cert.id,
      code: cert.code,
      balance: cert.balance,
      expiresAt: cert.expiresAt,
    },
    discountAmount
  });
}

async function handleApply(body) {
  const { code, orderId, amountToUse } = body;

  if (!code || !orderId || !amountToUse) {
    return createResponse(400, { error: "code, orderId, and amountToUse are required" });
  }

  const result = await docClient.send(new ScanCommand({
    TableName: "giftCertificates",
    FilterExpression: "code = :code",
    ExpressionAttributeValues: {
      ":code": code.toUpperCase().trim()
    }
  }));

  const cert = result.Items?.[0];

  if (!cert || cert.status !== 'active' || cert.balance < amountToUse) {
    return createResponse(400, { error: "Invalid certificate or insufficient balance" });
  }

  const newBalance = cert.balance - amountToUse;
  const newStatus = newBalance <= 0 ? 'used' : 'active';

  await docClient.send(new UpdateCommand({
    TableName: "giftCertificates",
    Key: { id: cert.id },
    UpdateExpression: "SET balance = :balance, #status = :status, usedAt = :usedAt, usedInOrderId = :orderId",
    ExpressionAttributeNames: {
      "#status": "status"
    },
    ExpressionAttributeValues: {
      ":balance": newBalance,
      ":status": newStatus,
      ":usedAt": new Date().toISOString(),
      ":orderId": orderId,
    }
  }));

  console.log(`✅ Certificate ${cert.code} applied: -${amountToUse}₽, new balance: ${newBalance}₽`);

  return createResponse(200, {
    success: true,
    appliedAmount: amountToUse,
    remainingBalance: newBalance,
    certificateStatus: newStatus
  });
}

async function handleActivate(body) {
  const { id, code } = body;

  let cert;

  if (id) {
    const result = await docClient.send(new GetCommand({
      TableName: "giftCertificates",
      Key: { id }
    }));
    cert = result.Item;
  } else if (code) {
    const result = await docClient.send(new ScanCommand({
      TableName: "giftCertificates",
      FilterExpression: "code = :code",
      ExpressionAttributeValues: {
        ":code": code.toUpperCase().trim()
      }
    }));
    cert = result.Items?.[0];
  }

  if (!cert) {
    return createResponse(404, { error: "Certificate not found" });
  }

  if (cert.status !== 'pending') {
    return createResponse(400, { error: `Cannot activate certificate with status: ${cert.status}` });
  }

  const now = new Date().toISOString();

  await docClient.send(new UpdateCommand({
    TableName: "giftCertificates",
    Key: { id: cert.id },
    UpdateExpression: "SET #status = :status, paidAt = :paidAt",
    ExpressionAttributeNames: {
      "#status": "status"
    },
    ExpressionAttributeValues: {
      ":status": "active",
      ":paidAt": now,
    }
  }));

  cert.status = 'active';
  cert.paidAt = now;

  console.log(`✅ Certificate ${cert.code} activated after payment`);

  if (cert.isGift) {
    const shouldSendNow = !cert.deliveryDate || new Date(cert.deliveryDate) <= new Date();
    
    if (shouldSendNow) {
      await sendCertificateToRecipient(cert);
    }
  }

  const purchaserMessage = formatCertificateMessage(cert, false);
  
  const userResult = await docClient.send(new ScanCommand({
    TableName: "users",
    FilterExpression: "email = :email",
    ExpressionAttributeValues: {
      ":email": cert.purchaserEmail
    }
  }));
  
  const purchaser = userResult.Items?.[0];
  if (purchaser?.telegramId) {
    await sendTelegramMessage(purchaser.telegramId, purchaserMessage);
  }

  return createResponse(200, {
    success: true,
    certificate: cert
  });
}

async function sendCertificateToRecipient(cert) {
  console.log(`📨 Sending certificate ${cert.code} to recipient...`);

  const recipientMessage = formatCertificateMessage(cert, true);

  if (cert.recipientTelegramId) {
    await sendTelegramMessage(cert.recipientTelegramId, recipientMessage);
    console.log(`✅ Certificate sent to Telegram: ${cert.recipientTelegramId}`);
  }

  if (cert.recipientEmail) {
    await sendEmail('gift_certificate', cert.recipientEmail, {
      senderName: cert.senderName,
      recipientName: cert.recipientName,
      amount: cert.amount,
      code: cert.code,
      message: cert.message,
      expiresAt: cert.expiresAt,
      designTemplate: cert.designTemplate,
    });
    console.log(`✅ Certificate sent to email: ${cert.recipientEmail}`);
  }

  await docClient.send(new UpdateCommand({
    TableName: "giftCertificates",
    Key: { id: cert.id },
    UpdateExpression: "SET deliveryStatus = :status",
    ExpressionAttributeValues: {
      ":status": "delivered"
    }
  }));
}

async function handleSend(body) {
  const { id, code } = body;

  let cert;
  if (id) {
    const result = await docClient.send(new GetCommand({
      TableName: "giftCertificates",
      Key: { id }
    }));
    cert = result.Item;
  } else if (code) {
    const result = await docClient.send(new ScanCommand({
      TableName: "giftCertificates",
      FilterExpression: "code = :code",
      ExpressionAttributeValues: {
        ":code": code.toUpperCase().trim()
      }
    }));
    cert = result.Items?.[0];
  }

  if (!cert) {
    return createResponse(404, { error: "Certificate not found" });
  }

  if (cert.status !== 'active') {
    return createResponse(400, { error: "Certificate must be active to send" });
  }

  await sendCertificateToRecipient(cert);

  return createResponse(200, { success: true, message: "Certificate sent to recipient" });
}

async function handleInitPayment(body) {
  const { certificateId, email } = body;

  if (!certificateId) {
    return createResponse(400, { error: "certificateId is required" });
  }

  const certResult = await docClient.send(new GetCommand({
    TableName: "giftCertificates",
    Key: { id: certificateId }
  }));

  const cert = certResult.Item;
  if (!cert) {
    return createResponse(404, { error: "Certificate not found" });
  }

  if (cert.status !== 'pending') {
    return createResponse(400, { error: `Certificate already has status: ${cert.status}` });
  }

  const orderId = `cert-${certificateId}`;
  const now = new Date().toISOString();

  await docClient.send(new PutCommand({
    TableName: "orders",
    Item: {
      id: orderId,
      type: 'certificate',
      certificateId: certificateId,
      total: cert.amount,
      status: 'pending',
      paymentStatus: 'pending',
      customerEmail: email || cert.purchaserEmail,
      customerName: cert.purchaserName || 'Покупатель',
      createdAt: now,
      items: [{
        name: `Подарочный сертификат ${cert.amount}₽`,
        price: cert.amount,
        quantity: 1,
      }],
    }
  }));

  console.log(`✅ Certificate order created: ${orderId} for certificate ${certificateId}`);

  const initPaymentUrl = process.env.INIT_PAYMENT_ROBOKASSA_URL;
  if (!initPaymentUrl) {
    return createResponse(500, { error: "Payment service not configured" });
  }

  const paymentPayload = JSON.stringify({
    orderId,
    amount: cert.amount,
    email: email || cert.purchaserEmail,
    description: `Подарочный сертификат ${cert.amount}₽`,
    paymentMethod: 'card'
  });

  return new Promise((resolve) => {
    const url = new URL(initPaymentUrl);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(paymentPayload),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode === 200 && result.success && result.paymentUrl) {
            resolve(createResponse(200, {
              success: true,
              paymentUrl: result.paymentUrl,
              orderId,
              certificateId,
              amount: cert.amount
            }));
          } else {
            console.error('Payment init failed:', result);
            resolve(createResponse(500, { 
              error: result.error || "Failed to initialize payment",
              details: result
            }));
          }
        } catch (e) {
          console.error('Error parsing payment response:', e);
          resolve(createResponse(500, { error: "Failed to parse payment response" }));
        }
      });
    });
    req.on('error', (error) => {
      console.error('Payment request error:', error);
      resolve(createResponse(500, { error: "Payment service unavailable" }));
    });
    req.write(paymentPayload);
    req.end();
  });
}

exports.handler = async (event) => {
  try {
    console.log('Gift certificates request:', event);

    if (event.httpMethod === 'OPTIONS') {
      return createResponse(200, {});
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const params = event.queryStringParameters || {};
    const action = body.action || params.action;

    if (event.httpMethod === 'GET') {
      return await handleGet(params);
    }

    if (event.httpMethod === 'POST') {
      switch (action) {
        case 'create':
          return await handleCreate(body);
        case 'validate':
          return await handleValidate(body);
        case 'apply':
          return await handleApply(body);
        case 'activate':
          return await handleActivate(body);
        case 'send':
          return await handleSend(body);
        case 'initPayment':
          return await handleInitPayment(body);
        default:
          if (!action && body.amount) {
            return await handleCreate(body);
          }
          return createResponse(400, { 
            error: "Invalid action. Valid actions: create, validate, apply, activate, send" 
          });
      }
    }

    return createResponse(405, { error: "Method not allowed" });

  } catch (error) {
    console.error("Error in gift-certificates:", error);
    return createResponse(500, { error: error.message });
  }
};

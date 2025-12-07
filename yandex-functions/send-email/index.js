const AWS_SES = require("@aws-sdk/client-sesv2");
const SESv2Client = AWS_SES.SESv2Client;
const SendEmailCommand = AWS_SES.SendEmailCommand;

const sesClient = new SESv2Client({
  region: "ru-central1",
  endpoint: "https://postbox.cloud.yandex.net",
  credentials: {
    accessKeyId: process.env.POSTBOX_ACCESS_KEY_ID,
    secretAccessKey: process.env.POSTBOX_SECRET_ACCESS_KEY,
  },
});

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

async function sendEmail({ to, subject, htmlBody, textBody, from }) {
  const params = {
    FromEmailAddress: from || process.env.FROM_EMAIL,
    Destination: {
      ToAddresses: Array.isArray(to) ? to : [to],
    },
    Content: {
      Simple: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: htmlBody ? {
            Data: htmlBody,
            Charset: "UTF-8",
          } : undefined,
          Text: textBody ? {
            Data: textBody,
            Charset: "UTF-8",
          } : undefined,
        },
      },
    },
  };

  const command = new SendEmailCommand(params);
  const result = await sesClient.send(command);
  
  return {
    messageId: result.MessageId,
    success: true
  };
}

exports.handler = async (event) => {
  try {
    const requestBody = JSON.parse(event.body || '{}');
    const { type, to, data } = requestBody;

    if (!type || !to) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: "Missing required fields: type, to" }),
      };
    }

    let emailParams;

    switch (type) {
      case 'order_confirmation':
        emailParams = buildOrderConfirmationEmail(to, data);
        break;
      
      case 'stock_notification':
        emailParams = buildStockNotificationEmail(to, data);
        break;
      
      case 'newsletter':
        emailParams = buildNewsletterEmail(to, data);
        break;
      
      case 'welcome_newsletter':
        emailParams = buildWelcomeNewsletterEmail(to);
        break;
      
      case 'password_reset':
        emailParams = buildPasswordResetEmail(to, data);
        break;
      
      case 'email_verification':
        emailParams = buildEmailVerificationEmail(to, data);
        break;
      
      case 'gift_certificate':
        emailParams = buildGiftCertificateEmail(to, data);
        break;
      
      case 'certificate_purchase_confirmation':
        emailParams = buildCertificatePurchaseConfirmationEmail(to, data);
        break;
      
      case 'certificate_expiry_reminder':
        emailParams = buildCertificateExpiryReminderEmail(to, data);
        break;
      
      default:
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: `Unknown email type: ${type}` }),
        };
    }

    await sendEmail(emailParams);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ success: true, message: 'Email sent successfully' }),
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};

function buildOrderConfirmationEmail(to, data) {
  const { customerName, orderNumber, orderDate, items, totalAmount, shippingAddress, phone, deliveryMethod, deliveryCost } = data;
  
  const itemsList = items
    .map(item => `${item.name} - ${item.quantity} шт. × ${item.price}₽`)
    .join('\n');

  const deliveryInfo = deliveryMethod 
    ? `
      <h4 style="color: #333;">Способ доставки:</h4>
      <p style="background: #fff3e0; padding: 12px; border-radius: 6px; border-left: 4px solid #EC4899;">
        <strong>${deliveryMethod}</strong>${deliveryCost ? ` - ${deliveryCost}₽` : ''}
      </p>
    `
    : '';

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${getLogoHtml()}
      <h2 style="color: #EC4899;">Спасибо за ваш заказ!</h2>
      <p>Здравствуйте, ${customerName}!</p>
      <p>Ваш заказ <strong>#${orderNumber}</strong> успешно оформлен.</p>
      
      <h3 style="color: #333; border-bottom: 2px solid #EC4899; padding-bottom: 8px;">Детали заказа:</h3>
      <p><strong>Дата:</strong> ${orderDate}</p>
      <p><strong>Номер заказа:</strong> ${orderNumber}</p>
      
      <h4 style="color: #333;">Товары:</h4>
      <pre style="background: #f5f5f5; padding: 12px; border-radius: 6px;">${itemsList}</pre>
      
      ${deliveryInfo}
      
      <p style="font-size: 18px; font-weight: bold; color: #EC4899;">Итого: ${totalAmount}₽</p>
      
      <h4 style="color: #333;">Адрес доставки:</h4>
      <p>${shippingAddress}</p>
      
      <h4 style="color: #333;">Телефон:</h4>
      <p>${phone}</p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
      <p style="color: #666; font-size: 14px;">
        С наилучшими пожеланиями,<br/>
        Команда Sweet Delights
      </p>
    </div>
  `;

  const deliveryInfoText = deliveryMethod 
    ? `\nСпособ доставки: ${deliveryMethod}${deliveryCost ? ` - ${deliveryCost}₽` : ''}\n`
    : '';

  const textBody = `
Спасибо за ваш заказ!

Здравствуйте, ${customerName}!
Ваш заказ #${orderNumber} успешно оформлен.

Детали заказа:
Дата: ${orderDate}
Номер заказа: ${orderNumber}

Товары:
${itemsList}
${deliveryInfoText}
Итого: ${totalAmount}₽

Адрес доставки: ${shippingAddress}
Телефон: ${phone}

С наилучшими пожеланиями,
Команда Sweet Delights
  `;

  return {
    to,
    from: process.env.ORDERS_EMAIL || process.env.FROM_EMAIL,
    subject: `Подтверждение заказа #${orderNumber} - Sweet Delights`,
    htmlBody,
    textBody,
  };
}

function buildStockNotificationEmail(to, data) {
  const { productName, productUrl } = data;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${getLogoHtml()}
      <h2 style="color: #EC4899;">Отличные новости!</h2>
      <p style="font-size: 16px; line-height: 1.5;">
        Товар <strong>${productName}</strong>, на который вы подписались, снова в наличии!
      </p>
      <p style="font-size: 16px; line-height: 1.5;">
        Поспешите оформить заказ, пока товар не закончился снова.
      </p>
      <a href="${productUrl}" style="display: inline-block; background-color: #EC4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">
        Перейти к товару
      </a>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
      <p style="font-size: 14px; color: #666;">
        С наилучшими пожеланиями,<br/>
        Команда Sweet Delights
      </p>
    </div>
  `;

  const textBody = `
Отличные новости!

Товар "${productName}", на который вы подписались, снова в наличии!
Поспешите оформить заказ, пока товар не закончился снова.

Перейти к товару: ${productUrl}

С наилучшими пожеланиями,
Команда Sweet Delights
  `;

  return {
    to,
    from: process.env.NOTIFICATIONS_EMAIL || process.env.FROM_EMAIL,
    subject: `${productName} снова в наличии! - Sweet Delights`,
    htmlBody,
    textBody,
  };
}

function buildNewsletterEmail(to, data) {
  const { subject, message, title } = data;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${getLogoHtml()}
      <h2 style="color: #EC4899;">${title || 'Новости Sweet Delights'}</h2>
      <div style="font-size: 16px; line-height: 1.6;">
        ${message}
      </div>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
      <p style="font-size: 14px; color: #666;">
        С наилучшими пожеланиями,<br/>
        Команда Sweet Delights
      </p>
      <p style="font-size: 12px; color: #999; margin-top: 20px;">
        Если вы хотите отписаться от рассылки, свяжитесь с нами.
      </p>
    </div>
  `;

  const textBody = `
${title || 'Новости Sweet Delights'}

${message.replace(/<[^>]*>/g, '')}

С наилучшими пожеланиями,
Команда Sweet Delights

Если вы хотите отписаться от рассылки, свяжитесь с нами.
  `;

  return {
    to,
    from: process.env.NEWSLETTER_EMAIL || process.env.FROM_EMAIL,
    subject: subject || 'Новости Sweet Delights',
    htmlBody,
    textBody,
  };
}

function buildWelcomeNewsletterEmail(to) {
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${getLogoHtml()}
      <h2 style="color: #EC4899;">Добро пожаловать в Sweet Delights!</h2>
      <p style="font-size: 16px; line-height: 1.6;">
        Спасибо за подписку на нашу рассылку!
      </p>
      <p style="font-size: 16px; line-height: 1.6;">
        Мы рады приветствовать вас в семье любителей сладостей Sweet Delights. 
        Теперь вы первыми узнаете о:
      </p>
      <ul style="font-size: 16px; line-height: 1.8; color: #333;">
        <li>Открытии нашего магазина</li>
        <li>Новых поступлениях товаров</li>
        <li>Эксклюзивных предложениях и скидках</li>
        <li>Специальных акциях только для подписчиков</li>
      </ul>
      <p style="font-size: 16px; line-height: 1.6;">
        Следите за нашими новостями - скоро мы откроемся и порадуем вас самыми вкусными сладостями!
      </p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
      <p style="font-size: 14px; color: #666;">
        С наилучшими пожеланиями,<br/>
        Команда Sweet Delights
      </p>
    </div>
  `;

  const textBody = `
Добро пожаловать в Sweet Delights!

Спасибо за подписку на нашу рассылку!

Мы рады приветствовать вас в семье любителей сладостей Sweet Delights. 
Теперь вы первыми узнаете о:

Открытии нашего магазина
Новых поступлениях товаров
Эксклюзивных предложениях и скидках
Специальных акциях только для подписчиков

Следите за нашими новостями - скоро мы откроемся и порадуем вас самыми вкусными сладостями!

С наилучшими пожеланиями,
Команда Sweet Delights
  `;

  return {
    to,
    from: process.env.NEWSLETTER_EMAIL || process.env.FROM_EMAIL,
    subject: 'Добро пожаловать в Sweet Delights!',
    htmlBody,
    textBody,
  };
}

function buildPasswordResetEmail(to, data) {
  const { resetCode } = data;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${getLogoHtml()}
      <h2 style="color: #EC4899;">Восстановление пароля</h2>
      <p style="font-size: 16px; line-height: 1.6;">
        Вы запросили восстановление пароля. Используйте код ниже для смены пароля:
      </p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <p style="font-size: 24px; font-weight: bold; color: #EC4899; letter-spacing: 2px;">
          ${resetCode}
        </p>
      </div>
      <p style="font-size: 14px; color: #666;">
        Код действителен в течение 15 минут.
      </p>
      <p style="font-size: 14px; color: #666;">
        Если вы не запрашивали сброс пароля, проигнорируйте это письмо.
      </p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
      <p style="font-size: 14px; color: #666;">
        С наилучшими пожеланиями,<br/>
        Команда Sweet Delights
      </p>
    </div>
  `;

  const textBody = `
Восстановление пароля

Вы запросили восстановление пароля. Используйте код ниже для смены пароля:

${resetCode}

Код действителен в течение 15 минут.

Если вы не запрашивали сброс пароля, проигнорируйте это письмо.

С наилучшими пожеланиями,
Команда Sweet Delights
  `;

  return {
    to,
    from: process.env.SUPPORT_EMAIL || process.env.FROM_EMAIL,
    subject: 'Восстановление пароля Sweet Delights',
    htmlBody,
    textBody,
  };
}

function buildEmailVerificationEmail(to, data) {
  const { verificationCode } = data;

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

  return {
    to,
    from: process.env.SUPPORT_EMAIL || process.env.FROM_EMAIL,
    subject: 'Подтверждение адреса электронной почты - Sweet Delights',
    htmlBody,
    textBody,
  };
}

function buildGiftCertificateEmail(to, data) {
  const { senderName, recipientName, amount, code, message, expiresAt, designTemplate } = data;
  
  const SITE_URL = 'https://sweetdelights.store';
  
  const DESIGN_TEMPLATES = {
    default: {
      image: `${SITE_URL}/assets/certificates/classic_pink_gift_card.png`,
      name: 'Классика'
    },
    birthday: {
      image: `${SITE_URL}/assets/certificates/birthday_purple_gift_card.png`,
      name: 'День рождения'
    },
    celebration: {
      image: `${SITE_URL}/assets/certificates/celebration_orange_gift_card.png`,
      name: 'Праздник'
    },
    love: {
      image: `${SITE_URL}/assets/certificates/love_red_gift_card.png`,
      name: 'С любовью'
    }
  };
  
  const template = DESIGN_TEMPLATES[designTemplate] || DESIGN_TEMPLATES.default;
  
  const expiresDate = new Date(expiresAt).toLocaleDateString('ru-RU');
  const greeting = recipientName ? `Здравствуйте, ${recipientName}!` : 'Здравствуйте!';
  const fromText = senderName ? `<p style="font-size: 16px; color: #666;">От: <strong>${senderName}</strong></p>` : '';
  const personalMessage = message ? `
    <div style="background: #fff3e0; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EC4899;">
      <p style="font-size: 16px; font-style: italic; color: #333; margin: 0;">"${message}"</p>
    </div>
  ` : '';

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${getLogoHtml()}
      <h2 style="color: #EC4899; text-align: center;">Вам подарили сертификат!</h2>
      <p style="font-size: 16px; line-height: 1.6;">${greeting}</p>
      ${fromText}
      ${personalMessage}
      
      <!-- Красивая карточка сертификата с фоновым изображением -->
      <div style="position: relative; border-radius: 16px; overflow: hidden; margin: 20px 0; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
        <img src="${template.image}" alt="Подарочный сертификат" style="width: 100%; height: auto; display: block; min-height: 280px; object-fit: cover;" />
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.35); display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 30px; text-align: center;">
          <p style="font-size: 14px; color: white; margin: 0 0 8px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Подарочный сертификат</p>
          <p style="font-size: 42px; font-weight: bold; color: white; margin: 0 0 20px 0; text-shadow: 0 2px 8px rgba(0,0,0,0.4);">${amount}₽</p>
          <div style="background: rgba(255,255,255,0.25); backdrop-filter: blur(4px); padding: 15px 25px; border-radius: 10px;">
            <p style="font-size: 11px; color: white; margin: 0 0 5px 0; opacity: 0.9;">Код сертификата</p>
            <p style="font-size: 22px; font-weight: bold; letter-spacing: 3px; color: white; margin: 0; text-shadow: 0 1px 3px rgba(0,0,0,0.3);">${code}</p>
          </div>
          ${recipientName ? `<p style="font-size: 14px; color: white; margin: 15px 0 0 0; text-shadow: 0 1px 3px rgba(0,0,0,0.3);">Для: <strong>${recipientName}</strong></p>` : ''}
          ${senderName ? `<p style="font-size: 13px; color: white; margin: 5px 0 0 0; opacity: 0.9; text-shadow: 0 1px 3px rgba(0,0,0,0.3);">От: ${senderName}</p>` : ''}
        </div>
      </div>
      
      <p style="font-size: 14px; color: #666; text-align: center;">
        Действителен до: <strong>${expiresDate}</strong>
      </p>
      <p style="font-size: 16px; line-height: 1.6; text-align: center;">
        Используйте код при оформлении заказа в Sweet Delights!
      </p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${SITE_URL}/login" style="display: inline-block; background: #EC4899; color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Перейти в магазин</a>
      </div>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
      <p style="font-size: 14px; color: #666;">
        С наилучшими пожеланиями,<br/>
        Команда Sweet Delights
      </p>
    </div>
  `;

  const fromTextPlain = senderName ? `От: ${senderName}\n` : '';
  const personalMessagePlain = message ? `\n"${message}"\n` : '';

  const textBody = `
Вам подарили сертификат!

${greeting}
${fromTextPlain}${personalMessagePlain}
Номинал сертификата: ${amount}₽
Код сертификата: ${code}

Действителен до: ${expiresDate}

Используйте код при оформлении заказа в Sweet Delights!

С наилучшими пожеланиями,
Команда Sweet Delights
  `;

  return {
    to,
    from: process.env.GIFTS_EMAIL || process.env.FROM_EMAIL,
    subject: 'Вам подарили сертификат Sweet Delights!',
    htmlBody,
    textBody,
  };
}

function buildCertificatePurchaseConfirmationEmail(to, data) {
  const { purchaserName, amount, code, expiresAt, isGift, recipientName, recipientEmail } = data;
  
  const expiresDate = new Date(expiresAt).toLocaleDateString('ru-RU');
  const greeting = purchaserName ? `Здравствуйте, ${purchaserName}!` : 'Здравствуйте!';
  
  const giftInfo = isGift ? `
    <div style="background: #e8f5e9; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
      <p style="font-size: 14px; color: #333; margin: 0;">
        Сертификат будет отправлен получателю${recipientName ? ` (${recipientName})` : ''}${recipientEmail ? ` на ${recipientEmail}` : ''}.
      </p>
    </div>
  ` : '';

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${getLogoHtml()}
      <h2 style="color: #EC4899; text-align: center;">Сертификат успешно приобретён!</h2>
      <p style="font-size: 16px; line-height: 1.6;">${greeting}</p>
      <p style="font-size: 16px; line-height: 1.6;">
        Спасибо за покупку подарочного сертификата Sweet Delights!
      </p>
      ${giftInfo}
      <div style="background: linear-gradient(135deg, #EC4899 0%, #F472B6 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0; color: white;">
        <p style="font-size: 14px; margin: 0 0 10px 0; opacity: 0.9;">Номинал сертификата</p>
        <p style="font-size: 36px; font-weight: bold; margin: 0 0 20px 0;">${amount}₽</p>
        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
          <p style="font-size: 12px; margin: 0 0 5px 0; opacity: 0.9;">Код сертификата</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 0;">${code}</p>
        </div>
      </div>
      <p style="font-size: 14px; color: #666; text-align: center;">
        Действителен до: <strong>${expiresDate}</strong>
      </p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
      <p style="font-size: 14px; color: #666;">
        С наилучшими пожеланиями,<br/>
        Команда Sweet Delights
      </p>
    </div>
  `;

  const giftInfoPlain = isGift 
    ? `\nСертификат будет отправлен получателю${recipientName ? ` (${recipientName})` : ''}${recipientEmail ? ` на ${recipientEmail}` : ''}.\n` 
    : '';

  const textBody = `
Сертификат успешно приобретён!

${greeting}

Спасибо за покупку подарочного сертификата Sweet Delights!
${giftInfoPlain}
Номинал сертификата: ${amount}₽
Код сертификата: ${code}

Действителен до: ${expiresDate}

С наилучшими пожеланиями,
Команда Sweet Delights
  `;

  return {
    to,
    from: process.env.GIFTS_EMAIL || process.env.FROM_EMAIL,
    subject: 'Подарочный сертификат Sweet Delights - подтверждение покупки',
    htmlBody,
    textBody,
  };
}

function buildCertificateExpiryReminderEmail(to, data) {
  const { recipientName, amount, code, expiresAt, balance, daysUntilExpiry } = data;
  
  const expiresDate = new Date(expiresAt).toLocaleDateString('ru-RU');
  const greeting = recipientName ? `Здравствуйте, ${recipientName}!` : 'Здравствуйте!';
  const remainingBalance = balance || amount;
  
  const urgencyText = daysUntilExpiry <= 7 
    ? `<p style="font-size: 16px; line-height: 1.6; color: #d32f2f; font-weight: bold;">
        Осталось всего ${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'день' : daysUntilExpiry < 5 ? 'дня' : 'дней'}!
      </p>`
    : `<p style="font-size: 16px; line-height: 1.6;">
        До окончания срока действия осталось ${daysUntilExpiry} дней.
      </p>`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${getLogoHtml()}
      <h2 style="color: #EC4899; text-align: center;">Не забудьте использовать сертификат!</h2>
      <p style="font-size: 16px; line-height: 1.6;">${greeting}</p>
      <p style="font-size: 16px; line-height: 1.6;">
        Напоминаем, что срок действия вашего подарочного сертификата Sweet Delights скоро истекает.
      </p>
      ${urgencyText}
      <div style="background: linear-gradient(135deg, #ff9800 0%, #ffc107 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0; color: white;">
        <p style="font-size: 14px; margin: 0 0 10px 0; opacity: 0.9;">Остаток на сертификате</p>
        <p style="font-size: 36px; font-weight: bold; margin: 0 0 20px 0;">${remainingBalance}₽</p>
        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
          <p style="font-size: 12px; margin: 0 0 5px 0; opacity: 0.9;">Код сертификата</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 0;">${code}</p>
        </div>
      </div>
      <p style="font-size: 14px; color: #d32f2f; text-align: center; font-weight: bold;">
        Срок действия: до ${expiresDate}
      </p>
      <p style="font-size: 16px; line-height: 1.6; text-align: center;">
        Успейте использовать сертификат при оформлении заказа!
      </p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
      <p style="font-size: 14px; color: #666;">
        С наилучшими пожеланиями,<br/>
        Команда Sweet Delights
      </p>
    </div>
  `;

  const urgencyTextPlain = daysUntilExpiry <= 7 
    ? `Осталось всего ${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'день' : daysUntilExpiry < 5 ? 'дня' : 'дней'}!`
    : `До окончания срока действия осталось ${daysUntilExpiry} дней.`;

  const textBody = `
Не забудьте использовать сертификат!

${greeting}

Напоминаем, что срок действия вашего подарочного сертификата Sweet Delights скоро истекает.

${urgencyTextPlain}

Остаток на сертификате: ${remainingBalance}₽
Код сертификата: ${code}

Срок действия: до ${expiresDate}

Успейте использовать сертификат при оформлении заказа!

С наилучшими пожеланиями,
Команда Sweet Delights
  `;

  return {
    to,
    from: process.env.GIFTS_EMAIL || process.env.FROM_EMAIL,
    subject: 'Срок действия вашего сертификата Sweet Delights истекает!',
    htmlBody,
    textBody,
  };
}

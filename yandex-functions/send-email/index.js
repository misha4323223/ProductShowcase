const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const sesClient = new SESClient({
  region: "ru-central1",
  endpoint: "https://postbox.cloud.yandex.net",
  credentials: {
    accessKeyId: process.env.POSTBOX_ACCESS_KEY_ID,
    secretAccessKey: process.env.POSTBOX_SECRET_KEY,
  },
});

async function sendEmail({ to, subject, htmlBody, textBody, from }) {
  const params = {
    Source: from || process.env.POSTBOX_FROM_EMAIL,
    Destination: {
      ToAddresses: Array.isArray(to) ? to : [to],
    },
    Message: {
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
  };

  const command = new SendEmailCommand(params);
  return await sesClient.send(command);
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
  const { customerName, orderNumber, orderDate, items, totalAmount, shippingAddress, phone } = data;
  
  const itemsList = items
    .map(item => `${item.name} - ${item.quantity} шт. × ${item.price}₽`)
    .join('\n');

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #EC4899;">Спасибо за ваш заказ! 🎉</h2>
      <p>Здравствуйте, ${customerName}!</p>
      <p>Ваш заказ <strong>#${orderNumber}</strong> успешно оформлен.</p>
      
      <h3 style="color: #333; border-bottom: 2px solid #EC4899; padding-bottom: 8px;">Детали заказа:</h3>
      <p><strong>Дата:</strong> ${orderDate}</p>
      <p><strong>Номер заказа:</strong> ${orderNumber}</p>
      
      <h4 style="color: #333;">Товары:</h4>
      <pre style="background: #f5f5f5; padding: 12px; border-radius: 6px;">${itemsList}</pre>
      
      <p style="font-size: 18px; font-weight: bold; color: #EC4899;">Итого: ${totalAmount}₽</p>
      
      <h4 style="color: #333;">Адрес доставки:</h4>
      <p>${shippingAddress}</p>
      
      <h4 style="color: #333;">Телефон:</h4>
      <p>${phone}</p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
      <p style="color: #666; font-size: 14px;">
        С наилучшими пожеланиями,<br/>
        Команда Sweet Delights 🍬
      </p>
    </div>
  `;

  const textBody = `
Спасибо за ваш заказ!

Здравствуйте, ${customerName}!
Ваш заказ #${orderNumber} успешно оформлен.

Детали заказа:
Дата: ${orderDate}
Номер заказа: ${orderNumber}

Товары:
${itemsList}

Итого: ${totalAmount}₽

Адрес доставки: ${shippingAddress}
Телефон: ${phone}

С наилучшими пожеланиями,
Команда Sweet Delights 🍬
  `;

  return {
    to,
    subject: `Подтверждение заказа #${orderNumber} - Sweet Delights`,
    htmlBody,
    textBody,
  };
}

function buildStockNotificationEmail(to, data) {
  const { productName, productUrl } = data;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #EC4899;">Отличные новости! 🎉</h2>
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
        Команда Sweet Delights 🍬
      </p>
    </div>
  `;

  const textBody = `
Отличные новости!

Товар "${productName}", на который вы подписались, снова в наличии!
Поспешите оформить заказ, пока товар не закончился снова.

Перейти к товару: ${productUrl}

С наилучшими пожеланиями,
Команда Sweet Delights 🍬
  `;

  return {
    to,
    subject: `${productName} снова в наличии! - Sweet Delights`,
    htmlBody,
    textBody,
  };
}

function buildNewsletterEmail(to, data) {
  const { subject, message, title } = data;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #EC4899;">${title || 'Новости Sweet Delights'}</h2>
      <div style="font-size: 16px; line-height: 1.6;">
        ${message}
      </div>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
      <p style="font-size: 14px; color: #666;">
        С наилучшими пожеланиями,<br/>
        Команда Sweet Delights 🍬
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
Команда Sweet Delights 🍬

Если вы хотите отписаться от рассылки, свяжитесь с нами.
  `;

  return {
    to,
    subject: subject || 'Новости Sweet Delights',
    htmlBody,
    textBody,
  };
}

function buildWelcomeNewsletterEmail(to) {
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #EC4899;">Добро пожаловать в Sweet Delights! 🎉</h2>
      <p style="font-size: 16px; line-height: 1.6;">
        Спасибо за подписку на нашу рассылку!
      </p>
      <p style="font-size: 16px; line-height: 1.6;">
        Мы рады приветствовать вас в семье любителей сладостей Sweet Delights. 
        Теперь вы первыми узнаете о:
      </p>
      <ul style="font-size: 16px; line-height: 1.8; color: #333;">
        <li>🎊 Открытии нашего магазина</li>
        <li>🍬 Новых поступлениях товаров</li>
        <li>💝 Эксклюзивных предложениях и скидках</li>
        <li>🎁 Специальных акциях только для подписчиков</li>
      </ul>
      <p style="font-size: 16px; line-height: 1.6;">
        Следите за нашими новостями - скоро мы откроемся и порадуем вас самыми вкусными сладостями!
      </p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
      <p style="font-size: 14px; color: #666;">
        С наилучшими пожеланиями,<br/>
        Команда Sweet Delights 🍬
      </p>
    </div>
  `;

  const textBody = `
Добро пожаловать в Sweet Delights! 🎉

Спасибо за подписку на нашу рассылку!

Мы рады приветствовать вас в семье любителей сладостей Sweet Delights. 
Теперь вы первыми узнаете о:

🎊 Открытии нашего магазина
🍬 Новых поступлениях товаров
💝 Эксклюзивных предложениях и скидках
🎁 Специальных акциях только для подписчиков

Следите за нашими новостями - скоро мы откроемся и порадуем вас самыми вкусными сладостями!

С наилучшими пожеланиями,
Команда Sweet Delights 🍬
  `;

  return {
    to,
    subject: 'Добро пожаловать в Sweet Delights! 🍬',
    htmlBody,
    textBody,
  };
}

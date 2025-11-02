const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL 
  || 'https://d5dimdj7itkijbl4s0g4.y5sm01em.apigw.yandexcloud.net';

export interface OrderEmailParams {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  orderDate: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  shippingAddress: string;
  phone: string;
}

export interface StockNotificationParams {
  customerEmail: string;
  productName: string;
  productUrl: string;
}

export interface NewsletterParams {
  subject: string;
  message: string;
  title?: string;
}

async function sendEmailViaCloudFunction(type: string, to: string | string[], data: any): Promise<void> {
  const response = await fetch(`${API_GATEWAY_URL}/send-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type,
      to,
      data,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to send email');
  }

  return response.json();
}

export async function sendOrderConfirmation(params: OrderEmailParams): Promise<void> {
  try {
    await sendEmailViaCloudFunction('order_confirmation', params.customerEmail, {
      customerName: params.customerName,
      orderNumber: params.orderNumber,
      orderDate: params.orderDate,
      items: params.items,
      totalAmount: params.totalAmount,
      shippingAddress: params.shippingAddress,
      phone: params.phone,
    });
    console.log('Письмо о заказе успешно отправлено:', params.customerEmail);
  } catch (error) {
    console.error('Ошибка отправки письма о заказе:', error);
    throw new Error('Не удалось отправить подтверждение заказа');
  }
}

export async function sendStockNotification(params: StockNotificationParams): Promise<void> {
  try {
    await sendEmailViaCloudFunction('stock_notification', params.customerEmail, {
      productName: params.productName,
      productUrl: params.productUrl,
    });
    console.log('Уведомление о наличии отправлено:', params.customerEmail);
  } catch (error) {
    console.error('Ошибка отправки уведомления о наличии:', error);
    throw error;
  }
}

export async function sendBulkStockNotifications(
  emails: string[],
  productName: string,
  productUrl: string
): Promise<number> {
  let sentCount = 0;
  
  for (const email of emails) {
    try {
      await sendStockNotification({
        customerEmail: email,
        productName,
        productUrl,
      });
      sentCount++;
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Не удалось отправить уведомление на ${email}:`, error);
    }
  }
  
  return sentCount;
}

export async function sendNewsletter(emails: string[], params: NewsletterParams): Promise<number> {
  let sentCount = 0;
  
  for (const email of emails) {
    try {
      await sendEmailViaCloudFunction('newsletter', email, {
        subject: params.subject,
        message: params.message,
        title: params.title,
      });
      sentCount++;
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Не удалось отправить рассылку на ${email}:`, error);
    }
  }
  
  return sentCount;
}

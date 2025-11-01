import emailjs from '@emailjs/browser';

emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '');

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

export async function sendOrderConfirmation(params: OrderEmailParams): Promise<void> {
  try {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_ORDER_TEMPLATE_ID;

    if (!serviceId || !templateId) {
      console.error('EmailJS не настроен. Проверьте переменные окружения.');
      return;
    }

    const itemsList = params.items
      .map(item => `${item.name} - ${item.quantity} шт. × ${item.price}₽`)
      .join('\n');

    const templateParams = {
      to_email: params.customerEmail,
      customer_name: params.customerName,
      order_number: params.orderNumber,
      order_date: params.orderDate,
      items_list: itemsList,
      total_amount: params.totalAmount,
      shipping_address: params.shippingAddress,
      phone: params.phone,
    };

    await emailjs.send(serviceId, templateId, templateParams);
    console.log('Письмо о заказе успешно отправлено:', params.customerEmail);
  } catch (error) {
    console.error('Ошибка отправки письма о заказе:', error);
    throw new Error('Не удалось отправить подтверждение заказа');
  }
}

export async function sendStockNotification(params: StockNotificationParams): Promise<void> {
  try {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_STOCK_TEMPLATE_ID;

    if (!serviceId || !templateId) {
      console.error('EmailJS не настроен. Проверьте переменные окружения.');
      return;
    }

    const templateParams = {
      to_email: params.customerEmail,
      product_name: params.productName,
      product_url: params.productUrl,
    };

    await emailjs.send(serviceId, templateId, templateParams);
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
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Не удалось отправить уведомление на ${email}:`, error);
    }
  }
  
  return sentCount;
}

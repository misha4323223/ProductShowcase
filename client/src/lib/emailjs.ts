
import emailjs from '@emailjs/browser';

// Инициализация EmailJS с публичным ключом
emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

export const EMAIL_CONFIG = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  orderTemplateId: import.meta.env.VITE_EMAILJS_ORDER_TEMPLATE_ID,
  stockTemplateId: import.meta.env.VITE_EMAILJS_STOCK_TEMPLATE_ID,
};

// Отправка письма о заказе
export const sendOrderEmail = async (orderData: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
}) => {
  try {
    const templateParams = {
      customer_name: orderData.customerName,
      customer_email: orderData.customerEmail,
      customer_phone: orderData.customerPhone,
      order_items: orderData.items.map(item => 
        `${item.name} - ${item.quantity} шт. - ${item.price * item.quantity} ₽`
      ).join('\n'),
      total_amount: orderData.total,
      order_date: new Date().toLocaleDateString('ru-RU'),
    };

    const response = await emailjs.send(
      EMAIL_CONFIG.serviceId,
      EMAIL_CONFIG.orderTemplateId,
      templateParams
    );

    return { success: true, response };
  } catch (error) {
    console.error('Ошибка отправки письма о заказе:', error);
    return { success: false, error };
  }
};

// Отправка уведомления о низком остатке
export const sendStockAlert = async (productData: {
  productName: string;
  currentStock: number;
  minStock: number;
}) => {
  try {
    const templateParams = {
      product_name: productData.productName,
      current_stock: productData.currentStock,
      min_stock: productData.minStock,
      alert_date: new Date().toLocaleDateString('ru-RU'),
    };

    const response = await emailjs.send(
      EMAIL_CONFIG.serviceId,
      EMAIL_CONFIG.stockTemplateId,
      templateParams
    );

    return { success: true, response };
  } catch (error) {
    console.error('Ошибка отправки уведомления об остатках:', error);
    return { success: false, error };
  }
};

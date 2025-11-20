import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, ShoppingBag, Package } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL;

interface PaymentInfo {
  orderId: string;
  orderStatus: string;
  paymentStatus: string;
  total: number;
  subtotal?: number;
  discount?: number;
  isPaid: boolean;
  isPending: boolean;
  isFailed: boolean;
  paidAt?: string;
  createdAt: string;
}

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [orderInfo, setOrderInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { clearCart } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    window.scrollTo(0, 0);
    checkPayment();
  }, []);

  async function checkPayment() {
    try {
      // Получаем orderId из URL параметров (когда ROBOKASSA перенаправляет)
      const urlParams = new URLSearchParams(window.location.search);
      
      // 1. ПРИОРИТЕТ - Shp_OrderId из URL (передается Робокассой обратно)
      let orderId = urlParams.get('Shp_OrderId');
      
      // 2. Если нет в URL, берем из localStorage (fallback для прямого захода на страницу)
      if (!orderId) {
        orderId = localStorage.getItem('pendingPaymentOrderId');
        console.log('📦 OrderId взят из localStorage:', orderId);
      } else {
        console.log('🔗 OrderId получен из URL (Shp_OrderId):', orderId);
      }
      
      // 3. В крайнем случае используем обычный orderId из URL
      if (!orderId) {
        orderId = urlParams.get('orderId');
        console.log('📋 OrderId взят из URL (orderId):', orderId);
      }

      if (!orderId) {
        setError('Не удалось найти информацию о заказе');
        setLoading(false);
        return;
      }

      console.log(`🔍 Проверяем статус платежа для заказа: ${orderId}`);
      
      // Проверяем статус платежа через API
      const response = await fetch(
        `${API_GATEWAY_URL}/api/payment/robokassa/check?orderId=${orderId}`
      );
      
      if (!response.ok) {
        throw new Error('Не удалось проверить статус платежа');
      }

      const data: PaymentInfo = await response.json();
      console.log('📊 Статус платежа:', data);
      setOrderInfo(data);

      // Если оплата успешна - очищаем корзину и localStorage
      if (data.isPaid) {
        console.log('✅ Оплата успешна, очищаем корзину');
        clearCart();
        localStorage.removeItem('pendingPaymentOrderId');
        
        toast({
          title: "Заказ успешно оплачен! 🎉",
          description: `Номер заказа: ${data.orderId.substring(0, 8).toUpperCase()}`,
        });
      } else if (data.isPending) {
        // Платеж в обработке - очищаем pendingPaymentOrderId для предотвращения стагнации
        console.log('⏳ Платеж в обработке');
        localStorage.removeItem('pendingPaymentOrderId');
      } else if (data.isFailed) {
        // Платеж неудачный - очищаем pendingPaymentOrderId
        console.log('❌ Платеж не прошел');
        localStorage.removeItem('pendingPaymentOrderId');
        setError('Платеж не был завершен');
      }
    } catch (err: any) {
      console.error('Ошибка проверки статуса платежа:', err);
      setError(err.message || 'Произошла ошибка при проверке статуса платежа');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col candy-pattern">
        <Header cartCount={0} onCartClick={() => {}} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Проверяем статус платежа...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !orderInfo) {
    return (
      <div className="min-h-screen flex flex-col candy-pattern">
        <Header cartCount={0} onCartClick={() => {}} />
        <main className="flex-1 py-8">
          <div className="max-w-2xl mx-auto px-4 md:px-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-destructive">Ошибка</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">
                  {error || 'Не удалось получить информацию о заказе'}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    variant="default" 
                    onClick={() => {
                      setLoading(true);
                      setError(null);
                      checkPayment();
                    }}
                    data-testid="button-retry"
                  >
                    Повторить проверку
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setLocation('/account')}
                    data-testid="button-view-orders"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Мои заказы
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setLocation('/')}
                    data-testid="button-home"
                  >
                    На главную
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col candy-pattern">
      <Header cartCount={0} onCartClick={() => {}} />
      <main className="flex-1 py-8">
        <div className="max-w-2xl mx-auto px-4 md:px-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                {orderInfo.isPaid ? (
                  <CheckCircle className="w-16 h-16 text-green-500" data-testid="icon-success" />
                ) : orderInfo.isPending ? (
                  <Loader2 className="w-16 h-16 text-yellow-500 animate-spin" data-testid="icon-pending" />
                ) : (
                  <ShoppingBag className="w-16 h-16 text-muted-foreground" data-testid="icon-info" />
                )}
              </div>
              <CardTitle className="text-center text-2xl md:text-3xl">
                {orderInfo.isPaid ? (
                  <>Оплата прошла успешно! 🎉</>
                ) : orderInfo.isPending ? (
                  <>Платеж обрабатывается</>
                ) : (
                  <>Информация о заказе</>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6 bg-muted p-4 rounded-md space-y-2">
                <p data-testid="text-order-id">
                  <strong>Номер заказа:</strong> #{orderInfo.orderId.substring(0, 8).toUpperCase()}
                </p>
                <p data-testid="text-order-total">
                  <strong>Сумма:</strong> {orderInfo.total} ₽
                </p>
                {orderInfo.subtotal && orderInfo.discount && (
                  <>
                    <p data-testid="text-order-subtotal">
                      <strong>Подытог:</strong> {orderInfo.subtotal} ₽
                    </p>
                    <p data-testid="text-order-discount">
                      <strong>Скидка:</strong> -{orderInfo.discount} ₽
                    </p>
                  </>
                )}
                <p data-testid="text-payment-status">
                  <strong>Статус платежа:</strong>{' '}
                  {orderInfo.isPaid ? (
                    <span className="text-green-600 font-semibold">✅ Оплачен</span>
                  ) : orderInfo.isPending ? (
                    <span className="text-yellow-600 font-semibold">⏳ Ожидает подтверждения</span>
                  ) : orderInfo.isFailed ? (
                    <span className="text-red-600 font-semibold">❌ Не завершен</span>
                  ) : (
                    <span className="text-muted-foreground">Неизвестно</span>
                  )}
                </p>
                {orderInfo.paidAt && (
                  <p data-testid="text-paid-at">
                    <strong>Дата оплаты:</strong>{' '}
                    {new Date(orderInfo.paidAt).toLocaleString('ru-RU')}
                  </p>
                )}
              </div>
              
              {orderInfo.isPaid ? (
                <div className="text-center mb-6">
                  <p className="text-muted-foreground mb-2">
                    Мы получили ваш платёж и начали обработку заказа.
                  </p>
                  <p className="text-muted-foreground">
                    На ваш email отправлено подтверждение с деталями заказа.
                  </p>
                </div>
              ) : orderInfo.isPending ? (
                <div className="text-center mb-6">
                  <p className="text-muted-foreground mb-2">
                    Ваш платеж обрабатывается банком.
                  </p>
                  <p className="text-muted-foreground">
                    Это может занять несколько минут. Мы отправим вам email-подтверждение после завершения.
                  </p>
                </div>
              ) : (
                <div className="text-center mb-6">
                  <p className="text-muted-foreground">
                    Если у вас возникли вопросы, пожалуйста, свяжитесь с нашей службой поддержки.
                  </p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="default" 
                  onClick={() => setLocation('/account')}
                  data-testid="button-view-orders"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Мои заказы
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation('/')}
                  data-testid="button-home"
                >
                  На главную
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

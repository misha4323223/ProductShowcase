import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShoppingCart from "@/components/ShoppingCart";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronRight, HelpCircle } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";

export default function FaqPage() {
  const [cartOpen, setCartOpen] = useState(false);
  const { cartItems, updateQuantity, removeItem, cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const [, setLocation] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleCheckout = () => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    setLocation('/checkout');
  };

  return (
    <div className="min-h-screen flex flex-col candy-pattern">
      <Header 
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onCartClick={() => setCartOpen(true)}
      />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center gap-2 mb-6">
          <Link 
            href="/" 
            className="px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-br from-pink-400 via-pink-500 to-pink-600 hover:scale-110 transition-all shadow-md hover:shadow-lg jelly-wobble" 
            style={{
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              boxShadow: '0 3px 0 rgba(219, 39, 119, 0.4), 0 4px 8px rgba(236, 72, 153, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)'
            }}
            data-testid="link-home"
          >
            Главная
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 shadow-md" 
            style={{
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              boxShadow: '0 3px 0 rgba(245, 158, 11, 0.4), 0 4px 8px rgba(251, 191, 36, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)'
            }}
            data-testid="text-current-page"
          >
            Частые вопросы
          </span>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-full bg-gradient-to-br from-pink-100 to-purple-100">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-primary to-purple-600">
              Частые вопросы
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ответы на самые популярные вопросы о Sweet Delights
            </p>
          </div>
        </div>

        <Card className="shadow-lg" data-testid="card-faq-content">
          <CardContent className="p-6 md:p-8">
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem value="item-1" className="border rounded-lg px-4" data-testid="faq-order">
                <AccordionTrigger className="text-left font-semibold hover:text-primary">
                  Как оформить заказ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                  <ol className="list-decimal list-inside space-y-2 ml-2">
                    <li>Выберите понравившиеся товары и добавьте их в корзину</li>
                    <li>Перейдите в корзину и нажмите «Оформить заказ»</li>
                    <li>Заполните форму с контактными данными и адресом доставки</li>
                    <li>Выберите способ оплаты и доставки</li>
                    <li>Подтвердите заказ - готово!</li>
                  </ol>
                  <p className="mt-3">
                    После оформления вы получите письмо с подтверждением на указанный email.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border rounded-lg px-4" data-testid="faq-payment">
                <AccordionTrigger className="text-left font-semibold hover:text-primary">
                  Какие способы оплаты доступны?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                  <p className="mb-2">Мы принимаем следующие способы оплаты:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Карты МІР</strong> - российские банковские карты (онлайн оплата)</li>
                    <li><strong>СБП</strong> - Система Быстрых Платежей (перевод по номеру телефона)</li>
                  </ul>
                  <p className="mt-3 text-sm">
                    💡 Все платежи защищены и проходят через безопасное соединение.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border rounded-lg px-4" data-testid="faq-delivery">
                <AccordionTrigger className="text-left font-semibold hover:text-primary">
                  Как работает доставка?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                  <p className="mb-3">Доставляем по всей России с помощью транспортных компаний:</p>
                  <p className="font-semibold text-foreground mb-3">СДЭК • Боксберри • Яндекс Доставка</p>
                  <div className="space-y-2">
                    <p>📦 До пункта выдачи или курьером до двери</p>
                    <p>⏱️ Сроки: 2-10 дней по России</p>
                    <p>💰 Стоимость: от 150₽ (рассчитывается при заказе)</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border rounded-lg px-4" data-testid="faq-return">
                <AccordionTrigger className="text-left font-semibold hover:text-primary">
                  Можно ли вернуть или обменять товар?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                  <p className="mb-3 text-sm bg-accent/10 p-3 rounded-md">
                    ⚠️ <strong>Важная информация о возврате продовольственных товаров</strong>
                  </p>
                  <p className="mb-3 text-sm">
                    Согласно законодательству РФ (Постановление Правительства № 2463 от 31.12.2020), 
                    продовольственные товары надлежащего качества (шоколад, конфеты, печенье, 
                    мармелад и другие сладости) не подлежат возврату и обмену.
                  </p>
                  
                  <p className="mb-2 font-semibold text-foreground">✅ Когда возврат ВОЗМОЖЕН:</p>
                  <p className="mb-2">Вы можете вернуть товар ненадлежащего качества, если:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 mb-3">
                    <li>Товар имеет производственный брак</li>
                    <li>Истёк или подходит к концу срок годности (менее 7 дней)</li>
                    <li>Нарушена целостность упаковки при доставке (товар повреждён)</li>
                    <li>Товар не соответствует описанию на сайте</li>
                  </ul>
                  
                  <p className="mb-2 font-semibold text-foreground">📋 Условия возврата:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 mb-3">
                    <li>Срок: в течение срока годности товара</li>
                    <li>Упаковка: необходимо сохранить (если не повреждена)</li>
                    <li>Документы: чек или подтверждение заказа</li>
                    <li>Возврат денег: в течение 3-5 рабочих дней</li>
                  </ul>
                  
                  <p className="mb-2 font-semibold text-foreground">📞 Как оформить возврат:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2 mb-3">
                    <li>Сфотографируйте товар (брак, повреждение, срок годности)</li>
                    <li>Свяжитесь с нами по телефону или email</li>
                    <li>Опишите проблему и прикрепите фото</li>
                    <li>Мы рассмотрим заявку в течение 24 часов</li>
                  </ol>
                  
                  <p className="mt-3 text-sm">
                    Мы дорожим вашим доверием и всегда готовы помочь решить любую ситуацию! 💝
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border rounded-lg px-4" data-testid="faq-track">
                <AccordionTrigger className="text-left font-semibold hover:text-primary">
                  Как отследить мой заказ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                  <p className="mb-2">
                    Отследить статус заказа можно несколькими способами:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 ml-2">
                    <li>Проверьте email - мы отправим на него трек-номер</li>
                    <li>
                      Войдите в <Link href="/account" className="text-primary hover:underline">Личный кабинет</Link> 
                      {' '}→ раздел "Мои заказы"
                    </li>
                    <li>Позвоните нам или напишите - сообщим актуальный статус</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="border rounded-lg px-4" data-testid="faq-promo">
                <AccordionTrigger className="text-left font-semibold hover:text-primary">
                  Как использовать промокод?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                  <ol className="list-decimal list-inside space-y-2 ml-2">
                    <li>Добавьте товары в корзину</li>
                    <li>Перейдите к оформлению заказа</li>
                    <li>Найдите поле "Промокод" в форме оформления</li>
                    <li>Введите код и нажмите "Применить"</li>
                    <li>Скидка автоматически пересчитается!</li>
                  </ol>
                  <p className="mt-3 text-sm">
                    💡 Промокоды можно получить в рассылке, соцсетях или на специальных акциях.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="border rounded-lg px-4" data-testid="faq-storage">
                <AccordionTrigger className="text-left font-semibold hover:text-primary">
                  Как правильно хранить сладости?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                  <div className="space-y-2">
                    <p><strong>🍫 Шоколад:</strong> хранить при температуре 15-18°C в тёмном месте</p>
                    <p><strong>🍬 Конфеты:</strong> в сухом прохладном месте, избегать прямых солнечных лучей</p>
                    <p><strong>🍪 Печенье:</strong> в герметичной упаковке при комнатной температуре</p>
                  </div>
                  <p className="mt-3 text-sm bg-accent/10 p-3 rounded-md">
                    ⚠️ Сроки годности указаны на каждом товаре. Рекомендуем употребить в течение этого периода.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8" className="border rounded-lg px-4" data-testid="faq-contact">
                <AccordionTrigger className="text-left font-semibold hover:text-primary">
                  Как с вами связаться?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                  <p className="mb-3">Мы всегда рады помочь! Выберите удобный способ связи:</p>
                  <div className="space-y-2">
                    <p>📞 <strong>Телефон:</strong> +7 953 181 41 36 (ежедневно 11:00-18:00)</p>
                    <p>📧 <strong>Email:</strong> Storesweeet@gmail.com</p>
                    <p>📍 <strong>Адрес:</strong> г. Фантазия ул. Сладкая, 8</p>
                  </div>
                  <p className="mt-3 text-sm">
                    Обычно отвечаем в течение 1-2 часов в рабочее время.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-9" className="border rounded-lg px-4" data-testid="faq-gift">
                <AccordionTrigger className="text-left font-semibold hover:text-primary">
                  Можно ли оформить подарочную упаковку?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                  <p className="mb-2">
                    Конечно! Мы предлагаем красивую подарочную упаковку для ваших заказов.
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Подарочная коробка с лентой - 150₽</li>
                    <li>Праздничная упаковка с открыткой - 250₽</li>
                    <li>Премиум-упаковка с персонализацией - 400₽</li>
                  </ul>
                  <p className="mt-3 text-sm">
                    💝 Укажите пожелание по упаковке в комментарии к заказу, и мы всё красиво оформим!
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-10" className="border rounded-lg px-4" data-testid="faq-wholesale">
                <AccordionTrigger className="text-left font-semibold hover:text-primary">
                  Есть ли оптовые цены?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                  <p className="mb-2">
                    Да, мы работаем с оптовыми покупателями! Специальные условия при заказе:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>От 10 000₽ - скидка 5%</li>
                    <li>От 30 000₽ - скидка 10%</li>
                    <li>От 50 000₽ - скидка 15% + индивидуальные условия</li>
                  </ul>
                  <p className="mt-3">
                    Для обсуждения оптовых закупок свяжитесь с нами по email: <strong>opt@sweetdelights.ru</strong>
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="mt-8 p-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200/50">
              <p className="text-center text-sm text-muted-foreground">
                <strong className="text-foreground">Не нашли ответ на свой вопрос?</strong>
                <br />
                Напишите нам на{" "}
                <a href="mailto:Storesweeet@gmail.com" className="text-primary hover:underline">
                  Storesweeet@gmail.com
                </a>
                {" "}или позвоните{" "}
                <a href="tel:+79531814136" className="text-primary hover:underline">
                  +7 953 181 41 36
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />

      <ShoppingCart 
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onCheckout={handleCheckout}
      />
    </div>
  );
}

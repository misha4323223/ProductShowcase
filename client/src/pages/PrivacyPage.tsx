import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Shield } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useState, useEffect } from "react";
import ShoppingCart from "@/components/ShoppingCart";
import { useLocation } from "wouter";

export default function PrivacyPage() {
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
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-br from-teal-400 via-cyan-500 to-teal-600 shadow-md" 
            style={{
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              boxShadow: '0 3px 0 rgba(20, 184, 166, 0.4), 0 4px 8px rgba(6, 182, 212, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)'
            }}
            data-testid="text-current-page"
          >
            Политика конфиденциальности
          </span>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-full bg-gradient-to-br from-pink-100 to-purple-100">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-primary to-purple-600">
              Политика конфиденциальности
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Обновлено: {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <Card className="shadow-lg" data-testid="card-privacy-content">
          <CardContent className="prose prose-sm max-w-none p-6 md:p-8 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-primary mb-3">1. Общие положения</h2>
              <p className="text-muted-foreground leading-relaxed">
                Настоящая Политика конфиденциальности персональных данных (далее — Политика) действует в отношении всей информации, 
                которую интернет-магазин <strong>Sweet Delights</strong> может получить о Пользователе во время использования сайта.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Использование сайта означает безоговорочное согласие Пользователя с настоящей Политикой и указанными в ней условиями 
                обработки его персональной информации.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary mb-3">2. Какие данные мы собираем</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                При использовании нашего сайта мы можем собирать следующие персональные данные:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Имя и фамилия</li>
                <li>Адрес электронной почты</li>
                <li>Номер телефона</li>
                <li>Адрес доставки</li>
                <li>Почтовый индекс</li>
                <li>История заказов</li>
                <li>Информация о товарах в корзине и избранном</li>
                <li>Отзывы и рейтинги товаров</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary mb-3">3. Цели сбора данных</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Мы используем ваши персональные данные для:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Обработки и выполнения ваших заказов</li>
                <li>Доставки товаров по указанному адресу</li>
                <li>Отправки уведомлений о статусе заказа</li>
                <li>Отправки email-уведомлений о наличии товаров</li>
                <li>Улучшения качества обслуживания и персонализации</li>
                <li>Связи с вами по вопросам заказа</li>
                <li>Предоставления доступа к личному кабинету</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary mb-3">4. Как мы храним ваши данные</h2>
              <p className="text-muted-foreground leading-relaxed">
                Все персональные данные хранятся на защищенных серверах <strong>Firebase (Google Cloud Platform)</strong> с применением 
                современных методов шифрования и защиты информации.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Мы принимаем технические и организационные меры для защиты персональных данных от несанкционированного доступа, 
                изменения, раскрытия или уничтожения.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary mb-3">5. Использование cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Наш сайт использует cookies (файлы cookie) для:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mt-2">
                <li>Сохранения товаров в корзине между сеансами</li>
                <li>Запоминания авторизации пользователя</li>
                <li>Анализа использования сайта и улучшения функциональности</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Вы можете отключить cookies в настройках вашего браузера, но это может ограничить функциональность сайта.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary mb-3">6. Передача данных третьим лицам</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Мы не продаем и не передаем ваши персональные данные третьим лицам, за исключением следующих случаев:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Службам доставки — для доставки ваших заказов</li>
                <li>Сервисам email-рассылки (EmailJS) — для отправки уведомлений о заказах</li>
                <li>По требованию правоохранительных органов в случаях, предусмотренных законодательством РФ</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary mb-3">7. Ваши права</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Вы имеете право:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Получить информацию о своих персональных данных, которые мы храним</li>
                <li>Запросить исправление неточных данных</li>
                <li>Запросить удаление ваших персональных данных</li>
                <li>Отозвать согласие на обработку персональных данных</li>
                <li>Ограничить обработку ваших данных</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Для реализации этих прав свяжитесь с нами по контактам, указанным в разделе "Контакты" на нашем сайте.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary mb-3">8. Безопасность детей</h2>
              <p className="text-muted-foreground leading-relaxed">
                Наши услуги не предназначены для лиц младше 18 лет. Мы осознанно не собираем персональные данные детей. 
                Если вы являетесь родителем или опекуном и знаете, что ваш ребенок предоставил нам персональные данные, 
                пожалуйста, свяжитесь с нами.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary mb-3">9. Изменения в Политике</h2>
              <p className="text-muted-foreground leading-relaxed">
                Мы оставляем за собой право вносить изменения в настоящую Политику конфиденциальности. При внесении изменений 
                мы обновим дату "Обновлено" в верхней части документа. Рекомендуем периодически проверять эту страницу на предмет изменений.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary mb-3">10. Контактная информация</h2>
              <p className="text-muted-foreground leading-relaxed">
                Если у вас есть вопросы относительно настоящей Политики конфиденциальности или обработки ваших персональных данных, 
                свяжитесь с нами:
              </p>
              <div className="mt-3 p-4 bg-pink-50/50 rounded-lg border border-pink-200/30">
                <p className="text-muted-foreground">
                  <strong>Email:</strong> support@sweetdelights.ru<br />
                  <strong>Телефон:</strong> +7 (999) 123-45-67
                </p>
              </div>
            </section>

            <section className="border-t pt-6 mt-8">
              <p className="text-sm text-muted-foreground italic">
                Настоящая Политика конфиденциальности является публичным документом и доступна любому пользователю сети Интернет 
                при переходе по гиперссылке "Политика конфиденциальности".
              </p>
            </section>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link href="/">
            <Button variant="outline" size="lg" className="gap-2" data-testid="button-back-home">
              Вернуться на главную
            </Button>
          </Link>
        </div>
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

import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, FileText } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useState, useEffect } from "react";
import ShoppingCart from "@/components/ShoppingCart";
import { useLocation } from "wouter";

export default function TermsPage() {
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
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-br from-indigo-400 via-purple-500 to-indigo-600 shadow-md" 
            style={{
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              boxShadow: '0 3px 0 rgba(99, 102, 241, 0.4), 0 4px 8px rgba(139, 92, 246, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)'
            }}
            data-testid="text-current-page"
          >
            Договор оферты
          </span>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-full bg-gradient-to-br from-pink-100 to-purple-100">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-primary to-purple-600">
              Договор публичной оферты
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Обновлено: {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <Card className="shadow-lg" data-testid="card-terms-content">
          <CardContent className="prose prose-sm max-w-none p-6 md:p-8 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-primary mb-3">1. Общие положения</h2>
              <p className="text-muted-foreground leading-relaxed">
                Настоящий документ является публичной офертой в соответствии со статьей 437 Гражданского кодекса Российской Федерации. 
                Интернет-магазин <strong>Sweet Delights</strong> (далее — Продавец) предлагает физическим и юридическим лицам 
                (далее — Покупатель) приобрести только товары, представленные на сайте, включая сладости.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Оформление заказа означает полное и безоговорочное принятие Покупателем условий настоящего Договора.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary mb-3">2. Предмет договора</h2>
              <p className="text-muted-foreground leading-relaxed">
                Продавец обязуется передать в собственность Покупателю товар, а Покупатель обязуется принять товар и оплатить 
                его в порядке, предусмотренном настоящим Договором.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Ассортимент товаров представлен на сайте. Продавец имеет право в любое время вносить изменения в ассортимент товаров.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary mb-3">3. Оформление заказа</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Для оформления заказа Покупатель должен:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Выбрать товар и добавить его в корзину</li>
                <li>Заполнить форму заказа с указанием контактных данных и адреса доставки</li>
                <li>Выбрать способ доставки и оплаты</li>
                <li>Подтвердить заказ</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                После оформления заказа Покупатель получает уведомление на указанный электронный адрес с подтверждением заказа 
                и его номером.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary mb-3">4. Цены и оплата</h2>
              <p className="text-muted-foreground leading-relaxed">
                Все цены на сайте указаны в рублях РФ и включают НДС (если применимо).
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Продавец оставляет за собой право изменять цены на товары без предварительного уведомления. 
                Цена товара фиксируется в момент оформления заказа.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-3 mb-3">
                <strong>Способы оплаты:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Наличными при получении товара</li>
                <li>Банковской картой онлайн</li>
                <li>Банковской картой при получении</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary mb-3">5. Доставка</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                <strong>Способы доставки:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><strong>СДЭК</strong> — доставка курьером до двери или в пункт выдачи в течение 1-3 рабочих дней. Стоимость рассчитывается индивидуально.</li>
                <li><strong>Почта России</strong> — доставка почтовым отправлением в течение 5-10 рабочих дней. Стоимость: 200₽.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Стоимость доставки рассчитывается индивидуально и зависит от способа доставки, веса и габаритов товара, 
                а также региона доставки.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Продавец не несет ответственности за задержки доставки, вызванные действиями транспортных компаний или форс-мажорными обстоятельствами.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary mb-3">6. Возврат и обмен товара</h2>
              <p className="text-muted-foreground leading-relaxed">
                Покупатель вправе отказаться от товара в любое время до его передачи, а после передачи товара — в течение 7 дней 
                в соответствии с Законом РФ "О защите прав потребителей".
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Возврат товара надлежащего качества возможен при соблюдении следующих условий:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mt-2">
                <li>Товар не был в употреблении</li>
                <li>Сохранены его товарный вид, потребительские свойства</li>
                <li>Сохранена упаковка и пломбы (если были)</li>
                <li>Сохранен чек или иной документ, подтверждающий оплату</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                <strong>Важно:</strong> Продовольственные товары надлежащего качества (шоколад, конфеты, печенье и др.) 
                не подлежат возврату и обмену в соответствии с Постановлением Правительства РФ от 31.12.2020 № 2463.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Возврат товара ненадлежащего качества (брак) возможен в течение гарантийного срока при предъявлении документов, 
                подтверждающих покупку.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary mb-3">7. Гарантии качества</h2>
              <p className="text-muted-foreground leading-relaxed">
                Продавец гарантирует, что все товары являются качественными, соответствуют описанию на сайте и имеют необходимые 
                сертификаты качества.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                При получении товара Покупатель обязан проверить:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mt-2">
                <li>Соответствие товара описанию в заказе</li>
                <li>Комплектность товара</li>
                <li>Целостность упаковки</li>
                <li>Срок годности (для продовольственных товаров)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary mb-3">8. Ответственность сторон</h2>
              <p className="text-muted-foreground leading-relaxed">
                Продавец не несет ответственности за:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mt-2">
                <li>Ущерб, причиненный Покупателю из-за ненадлежащего использования товара</li>
                <li>Недостоверность информации, предоставленной Покупателем при оформлении заказа</li>
                <li>Задержки доставки по вине транспортных компаний</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Покупатель несет ответственность за достоверность предоставленной информации при оформлении заказа.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary mb-3">9. Конфиденциальность</h2>
              <p className="text-muted-foreground leading-relaxed">
                Продавец обязуется не разглашать персональные данные Покупателя третьим лицам, за исключением случаев, 
                предусмотренных законодательством РФ.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Подробную информацию об обработке персональных данных см. в{" "}
                <Link href="/privacy" className="text-primary hover:underline" data-testid="link-privacy">
                  Политике конфиденциальности
                </Link>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary mb-3">10. Порядок разрешения споров</h2>
              <p className="text-muted-foreground leading-relaxed">
                Все споры и разногласия, возникающие при исполнении настоящего Договора, решаются путем переговоров.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                В случае невозможности урегулирования споров путем переговоров, они подлежат разрешению в судебном порядке 
                в соответствии с законодательством Российской Федерации.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary mb-3">11. Заключительные положения</h2>
              <p className="text-muted-foreground leading-relaxed">
                Продавец оставляет за собой право вносить изменения в настоящий Договор в одностороннем порядке. 
                Все изменения вступают в силу с момента их публикации на сайте.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Настоящий Договор действует с момента оформления заказа до полного исполнения обязательств сторонами.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary mb-3">12. Контактная информация</h2>
              <p className="text-muted-foreground leading-relaxed">
                По всем вопросам, связанным с настоящим Договором, обращайтесь:
              </p>
              <div className="mt-3 p-4 bg-pink-50/50 rounded-lg border border-pink-200/30">
                <p className="text-muted-foreground">
                  <strong>Интернет-магазин:</strong> Sweet Delights<br />
                  <strong>Email:</strong> Storesweeet@gmail.com<br />
                  <strong>Телефон:</strong> +7 953 181 41 36<br />
                  <strong>Время работы:</strong> Пн-Пт 11:00-18:00 (МСК)
                </p>
              </div>
            </section>

            <section className="border-t pt-6 mt-8">
              <p className="text-sm text-muted-foreground italic">
                Настоящая оферта является публичным документом. Полный текст договора доступен на нашем сайте в разделе "Договор оферты".
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

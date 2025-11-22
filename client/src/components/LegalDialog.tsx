import { Dialog, DialogPortal, DialogOverlay, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Shield, FileText, X } from "lucide-react";
import { Link } from "wouter";
import * as DialogPrimitive from "@radix-ui/react-dialog";

interface LegalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: "privacy" | "terms";
}

export default function LegalDialog({ isOpen, onClose, type }: LegalDialogProps) {
  const isPrivacy = type === "privacy";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-2xl sm:max-w-3xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%] border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg flex flex-col overflow-hidden"
          data-testid={`dialog-${type}`}
        >
          {/* Header */}
          <div className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-b">
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
              <div className="p-1 sm:p-1.5 md:p-2 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex-shrink-0">
                {isPrivacy ? (
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary" />
                ) : (
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary" />
                )}
              </div>
              <h2 className="text-sm sm:text-base md:text-xl font-serif text-primary leading-tight" data-testid={`title-${type}`}>
                {isPrivacy ? "Политика конфиденциальности" : "Договор публичной оферты"}
              </h2>
            </div>
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="prose prose-xs sm:prose-sm max-w-none space-y-2 sm:space-y-3 md:space-y-4">
              {isPrivacy ? (
                <>
                  <section>
                    <h3 className="text-xs sm:text-sm md:text-lg font-semibold text-primary">1. Общие положения</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                      Настоящая Политика конфиденциальности действует в отношении всей информации, 
                      которую интернет-магазин Sweet Delights может получить о Пользователе во время использования сайта.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-xs sm:text-sm md:text-lg font-semibold text-primary">2. Какие данные мы собираем</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs sm:text-sm ml-2">
                      <li>Имя и фамилия</li>
                      <li>Адрес электронной почты</li>
                      <li>Номер телефона</li>
                      <li>Адрес доставки</li>
                      <li>История заказов</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-xs sm:text-sm md:text-lg font-semibold text-primary">3. Цели сбора данных</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs sm:text-sm ml-2">
                      <li>Обработки и выполнения заказов</li>
                      <li>Доставки товаров</li>
                      <li>Отправки уведомлений о статусе заказа</li>
                      <li>Улучшения качества обслуживания</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-xs sm:text-sm md:text-lg font-semibold text-primary">4. Защита данных</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                      Все данные хранятся на защищенных серверах Firebase с применением современных методов шифрования.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-xs sm:text-sm md:text-lg font-semibold text-primary">5. Ваши права</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                      Вы имеете право на получение, исправление и удаление ваших персональных данных.
                    </p>
                  </section>
                </>
              ) : (
                <>
                  <section>
                    <h3 className="text-xs sm:text-sm md:text-lg font-semibold text-primary">1. Общие положения</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                      Настоящий документ является публичной офертой. Оформление заказа означает полное принятие условий Договора.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-xs sm:text-sm md:text-lg font-semibold text-primary">2. Оформление заказа</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs sm:text-sm ml-2">
                      <li>Выбрать товар и добавить в корзину</li>
                      <li>Заполнить форму с контактными данными</li>
                      <li>Выбрать способ доставки и оплаты</li>
                      <li>Подтвердить заказ</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-xs sm:text-sm md:text-lg font-semibold text-primary">3. Цены и оплата</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                      Цены указаны в рублях РФ. Оплата картой онлайн или электронным кошельком.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-xs sm:text-sm md:text-lg font-semibold text-primary">4. Доставка</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs sm:text-sm ml-2">
                      <li>СДЭК (1-3 дня) - курьером или пункт выдачи</li>
                      <li>Почта России (5-10 дней)</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-xs sm:text-sm md:text-lg font-semibold text-primary">5. Возврат товара</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                      Возврат возможен в течение 7 дней. Продовольственные товары надлежащего качества возврату не подлежат.
                    </p>
                  </section>
                </>
              )}

              <div className="pt-2 sm:pt-3 md:pt-4 border-t">
                <p className="text-xs text-muted-foreground italic">
                  Это краткая версия документа. Полный текст доступен на отдельной странице.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 flex flex-col gap-2 px-4 sm:px-6 py-3 sm:py-4 border-t">
            <Link 
              href={isPrivacy ? "/privacy" : "/terms"} 
              onClick={() => {
                onClose();
                setTimeout(() => window.scrollTo(0, 0), 0);
              }} 
              className="w-full"
            >
              <Button variant="outline" className="gap-2 w-full" size="sm" data-testid={`button-open-full-${type}`}>
                <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                <span className="text-xs md:text-sm">Полная версия</span>
              </Button>
            </Link>
            <Button onClick={onClose} className="w-full" size="sm" data-testid={`button-close-${type}`}>
              <span className="text-xs md:text-sm">Понятно</span>
            </Button>
          </div>

          {/* Close button */}
          <DialogPrimitive.Close className="absolute right-3 top-3 rounded-md opacity-90 hover:opacity-100 transition-all hover-elevate active-elevate-2 bg-muted/50 hover:bg-muted border border-border w-8 h-8 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4 text-foreground" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Shield, FileText } from "lucide-react";
import { Link } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LegalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: "privacy" | "terms";
}

export default function LegalDialog({ isOpen, onClose, type }: LegalDialogProps) {
  const isPrivacy = type === "privacy";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-3xl h-[90vh] max-h-[90vh] p-4 md:p-6 flex flex-col" data-testid={`dialog-${type}`}>
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex-shrink-0">
              {isPrivacy ? (
                <Shield className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              ) : (
                <FileText className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              )}
            </div>
            <DialogTitle className="text-base md:text-xl font-serif text-primary leading-tight" data-testid={`title-${type}`}>
              {isPrivacy ? "Политика конфиденциальности" : "Договор публичной оферты"}
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            {isPrivacy 
              ? "Краткая версия политики конфиденциальности Sweet Delights" 
              : "Краткая версия договора публичной оферты Sweet Delights"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-2 md:pr-4 my-3 md:my-4">
          <div className="prose prose-sm max-w-none space-y-4">
            {isPrivacy ? (
              <>
                <section>
                  <h3 className="text-lg font-semibold text-primary">1. Общие положения</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Настоящая Политика конфиденциальности действует в отношении всей информации, 
                    которую интернет-магазин Sweet Delights может получить о Пользователе во время использования сайта.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-primary">2. Какие данные мы собираем</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm ml-2">
                    <li>Имя и фамилия</li>
                    <li>Адрес электронной почты</li>
                    <li>Номер телефона</li>
                    <li>Адрес доставки</li>
                    <li>История заказов</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-primary">3. Цели сбора данных</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm ml-2">
                    <li>Обработки и выполнения заказов</li>
                    <li>Доставки товаров</li>
                    <li>Отправки уведомлений о статусе заказа</li>
                    <li>Улучшения качества обслуживания</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-primary">4. Защита данных</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Все данные хранятся на защищенных серверах Firebase с применением современных методов шифрования.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-primary">5. Ваши права</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Вы имеете право на получение, исправление и удаление ваших персональных данных.
                  </p>
                </section>
              </>
            ) : (
              <>
                <section>
                  <h3 className="text-lg font-semibold text-primary">1. Общие положения</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Настоящий документ является публичной офертой. Оформление заказа означает полное принятие условий Договора.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-primary">2. Оформление заказа</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm ml-2">
                    <li>Выбрать товар и добавить в корзину</li>
                    <li>Заполнить форму с контактными данными</li>
                    <li>Выбрать способ доставки и оплаты</li>
                    <li>Подтвердить заказ</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-primary">3. Цены и оплата</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Цены указаны в рублях РФ. Оплата наличными при получении или картой онлайн.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-primary">4. Доставка</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm ml-2">
                    <li>СДЭК (1-3 дня) - курьером или пункт выдачи</li>
                    <li>Почта России (5-10 дней)</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-primary">5. Возврат товара</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Возврат возможен в течение 7 дней. Продовольственные товары надлежащего качества возврату не подлежат.
                  </p>
                </section>
              </>
            )}

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground italic">
                Это краткая версия документа. Полный текст доступен на отдельной странице.
              </p>
            </div>
          </div>
        </ScrollArea>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 pt-3 md:pt-4 border-t flex-shrink-0">
          <Link 
            href={isPrivacy ? "/privacy" : "/terms"} 
            onClick={() => {
              onClose();
              setTimeout(() => window.scrollTo(0, 0), 0);
            }} 
            className="w-full sm:w-auto"
          >
            <Button variant="outline" className="gap-2 w-full sm:w-auto" size="sm" data-testid={`button-open-full-${type}`}>
              <ExternalLink className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="text-xs md:text-sm">Полная версия</span>
            </Button>
          </Link>
          <Button onClick={onClose} className="w-full sm:w-auto" size="sm" data-testid={`button-close-${type}`}>
            <span className="text-xs md:text-sm">Понятно</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

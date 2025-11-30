import { useEffect } from "react";

/**
 * POPUP страница для привязки Telegram
 * Открывается в НОВОМ ОКНЕ - имеет чистую браузерную сессию
 * Telegram видит это как новый браузер и показывает свежее состояние
 */
function TelegramAttachPopup() {
  useEffect(() => {
    // Устанавливаем callback в parent окно
    (window as any).onTelegramAttachAuth = (user: any) => {
      console.log('✅ Telegram user из popup получен:', user);
      // Отправляем данные в parent окно через postMessage
      window.opener?.postMessage({
        type: 'TELEGRAM_AUTH_SUCCESS',
        data: user,
      }, '*');
      // Закрываем popup
      window.close();
    };

    // Загружаем Telegram Login Widget
    if (!document.querySelector('script[src*="telegram-widget"]')) {
      const script = document.createElement('script');
      script.src = `https://telegram.org/js/telegram-widget.js?${Date.now()}`;
      script.async = true;
      script.setAttribute('data-telegram-login', 'SweetWeb71_bot');
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-onauth', 'onTelegramAttachAuth(user)');
      script.setAttribute('data-request-access', 'write');
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50/30 via-purple-50/30 to-blue-50/30">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Привязка Telegram аккаунта</h1>
        <p className="text-muted-foreground mb-6">Нажмите кнопку ниже для привязки Telegram</p>
        <div id="telegram-widget" className="flex justify-center" />
      </div>
    </div>
  );
}

export default TelegramAttachPopup;

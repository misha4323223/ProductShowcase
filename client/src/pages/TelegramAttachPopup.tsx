import { useEffect } from "react";

/**
 * POPUP страница для привязки Telegram
 * Открывается в НОВОМ ОКНЕ - имеет чистую браузерную сессию
 * Telegram видит это как новый браузер и показывает свежее состояние
 */
function TelegramAttachPopup() {
  useEffect(() => {
    // Устанавливаем callback ПЕРЕД загрузкой скрипта
    (window as any).onTelegramAttachAuth = (user: any) => {
      console.log('✅ Telegram user из popup получен:', user);
      // Отправляем данные в parent окно через postMessage
      window.opener?.postMessage({
        type: 'TELEGRAM_AUTH_SUCCESS',
        data: user,
      }, '*');
      // Закрываем popup через небольшую задержку
      setTimeout(() => window.close(), 500);
    };

    console.log('✅ onTelegramAttachAuth установлена');

    // Даём время на установку callback, потом загружаем скрипт
    const timer = setTimeout(() => {
      console.log('⏳ Загружаю Telegram Widget скрипт...');
      
      const script = document.createElement('script');
      script.src = `https://telegram.org/js/telegram-widget.js?${Date.now()}`;
      script.async = true;
      script.setAttribute('data-telegram-login', 'SweetWeb71_bot');
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-onauth', 'onTelegramAttachAuth(user)');
      script.setAttribute('data-request-access', 'write');
      
      script.onload = () => console.log('✅ Telegram Widget скрипт загружен');
      script.onerror = () => console.error('❌ Ошибка загрузки Telegram Widget');
      
      document.body.appendChild(script);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50/30 via-purple-50/30 to-blue-50/30">
      <div className="text-center space-y-6">
        <h1 className="text-2xl font-bold">Привязка Telegram аккаунта</h1>
        <p className="text-muted-foreground">Нажмите кнопку ниже для привязки Telegram</p>
        {/* Контейнер где Widget отрендирится */}
        <div className="flex justify-center min-h-12">
          <div id="telegram-widget-container" />
        </div>
      </div>
    </div>
  );
}

export default TelegramAttachPopup;

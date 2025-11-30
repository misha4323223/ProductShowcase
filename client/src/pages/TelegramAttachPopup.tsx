import { useEffect } from "react";

/**
 * POPUP страница для привязки Telegram
 * Открывается в НОВОМ ОКНЕ - имеет чистую браузерную сессию
 * Telegram видит это как новый браузер и показывает свежее состояние
 */
function TelegramAttachPopup() {
  useEffect(() => {
    // Создаем глобальный callback ДО загрузки виджета
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

    // Загружаем Telegram Login Widget - ТОЧНО КАК НА LOGIN PAGE
    const script = document.createElement('script');
    script.src = `https://telegram.org/js/telegram-widget.js?${Date.now()}`;
    script.async = true;
    script.setAttribute('data-telegram-login', 'SweetWeb71_bot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAttachAuth(user)');
    script.setAttribute('data-request-access', 'write');
    
    const container = document.getElementById('telegram-attach-container');
    if (container) {
      console.log('✅ Контейнер найден, добавляю скрипт');
      container.innerHTML = ''; // Очищаем контейнер
      container.appendChild(script);
    } else {
      console.error('❌ Контейнер telegram-attach-container не найден!');
    }

    return () => {
      delete (window as any).onTelegramAttachAuth;
    };
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50/30 via-purple-50/30 to-blue-50/30">
      <div className="text-center space-y-6">
        <h1 className="text-2xl font-bold">Привязка Telegram аккаунта</h1>
        <p className="text-muted-foreground">Выберите другой аккаунт Telegram ниже:</p>
        {/* Контейнер для Telegram Widget - ТОЧ КАК НА LOGIN PAGE */}
        <div id="telegram-attach-container" className="flex justify-center my-2"></div>
      </div>
    </div>
  );
}

export default TelegramAttachPopup;

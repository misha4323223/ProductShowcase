# 🔔 Настройка OneSignal для Push-уведомлений

## Шаг 1: Создайте бесплатный аккаунт OneSignal

1. Перейдите на [https://onesignal.com/](https://onesignal.com/)
2. Нажмите "Get Started Free" (Начать бесплатно)
3. Зарегистрируйтесь (можно через Google/GitHub)

## Шаг 2: Создайте новое приложение

1. После входа нажмите **"New App/Website"**
2. Введите название вашего магазина (например: "Sweet Delights")
3. Выберите платформу: **"Web Push"** (веб push-уведомления)

## Шаг 3: Настройте Web Push

1. **Typical Site** - выберите этот вариант
2. **Site URL**: Введите URL вашего сайта на GitHub Pages
   - Например: `https://yourusername.github.io` или ваш кастомный домен
3. **Auto Resubscribe**: Включите (рекомендуется)
4. **Default Notification Icon**: Можете загрузить логотип или оставить по умолчанию
5. Нажмите **"Save"**

## Шаг 4: Получите App ID

1. После создания приложения, вы увидите **App ID**
2. Скопируйте этот **App ID** (формат: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

## Шаг 5: Обновите код

Откройте файл `client/index.html` и замените:

```javascript
appId: "YOUR_ONESIGNAL_APP_ID",
```

на ваш настоящий App ID:

```javascript
appId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
```

## Шаг 6: Опционально - Safari Web ID (для iOS/Mac)

Если нужна поддержка Safari:
1. В настройках OneSignal перейдите в **"Settings" → "Platforms" → "Apple Safari"**
2. Скопируйте **Safari Web ID**
3. Замените в `client/index.html`:
   ```javascript
   safari_web_id: "web.onesignal.auto.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
   ```

## Шаг 7: Разверните сайт

1. Закоммитьте изменения:
   ```bash
   git add .
   git commit -m "Add OneSignal push notifications"
   git push
   ```

2. Дождитесь деплоя через GitHub Actions

## Шаг 8: Тестирование

1. Откройте ваш сайт в браузере
2. Нажмите кнопку **"Подписаться"** на слайдере
3. Браузер запросит разрешение на отправку уведомлений - разрешите
4. Вы должны увидеть сообщение "Спасибо за подписку! 🎉"

## Шаг 9: Отправка уведомлений об открытии

Когда будете готовы открыть магазин:

1. Войдите в панель OneSignal: [https://app.onesignal.com/](https://app.onesignal.com/)
2. Выберите ваше приложение
3. Нажмите **"Messages" → "New Push"**
4. Создайте уведомление:
   - **Heading**: "🎉 Мы открылись!"
   - **Message**: "Sweet Delights теперь открыт! Заходите за вкусными подарками!"
   - **URL**: URL вашего магазина
5. **Audience**: "All Subscribers" (все подписчики)
6. **Scheduling**: "Send immediately" (отправить сейчас)
7. Нажмите **"Review and Send"**

## Дополнительные возможности

### Автоматические уведомления
- Настройте уведомления о новых товарах
- Уведомления о скидках и акциях
- Напоминания о брошенной корзине

### Сегментация
- Отправляйте уведомления только заинтересованным пользователям
- Фильтруйте по местоположению, времени подписки и т.д.

### Аналитика
- Смотрите сколько людей подписалось
- Отслеживайте процент открытия уведомлений
- Анализируйте клики по уведомлениям

## Поддержка браузеров

✅ **Поддерживаются:**
- Chrome (Windows, Mac, Android)
- Firefox (Windows, Mac, Android)
- Edge (Windows, Mac)
- Safari (Mac, iOS 16.4+)
- Opera
- Samsung Internet

❌ **Не поддерживаются:**
- Internet Explorer

## Лимиты бесплатного плана

- ✅ **Неограниченное** количество подписчиков
- ✅ **Неограниченное** количество уведомлений
- ✅ Поддержка всех платформ (Web, Mobile)
- ✅ Базовая аналитика
- ✅ API доступ

## Полезные ссылки

- [Документация OneSignal](https://documentation.onesignal.com/docs/web-push-quickstart)
- [Панель управления](https://app.onesignal.com/)
- [Тестирование уведомлений](https://documentation.onesignal.com/docs/sending-notifications)

---

## Готово! 🎉

Теперь посетители вашего сайта могут подписаться на уведомления, и вы сможете сообщить им об открытии магазина одним кликом!

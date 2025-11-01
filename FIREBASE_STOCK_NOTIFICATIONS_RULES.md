# Firebase Rules для Stock Notifications

## Обновление правил безопасности Firestore

Чтобы система уведомлений о поступлении товаров работала корректно, необходимо добавить правила безопасности для коллекции `stockNotifications`.

### Шаги по обновлению:

1. Откройте [Firebase Console](https://console.firebase.google.com/)
2. Выберите ваш проект **sweetweb-3543f**
3. Перейдите в раздел **Firestore Database** → **Rules**
4. Добавьте следующие правила для коллекции `stockNotifications`:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // ... существующие правила для других коллекций ...
    
    // Stock Notifications (уведомления о поступлении товаров)
    match /stockNotifications/{notificationId} {
      // Любой пользователь может создать подписку на уведомление
      allow create: if true;
      
      // Только админ может читать все подписки
      allow read: if request.auth != null && request.auth.token.email == 'pimashin2015@gmail.com';
      
      // Только админ может удалять подписки (или система при отправке уведомления)
      allow delete: if request.auth != null && request.auth.token.email == 'pimashin2015@gmail.com';
      
      // Обновление не требуется для этой коллекции
      allow update: if false;
    }
  }
}
```

### Полный пример правил с учетом существующих коллекций:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Проверка админа
    function isAdmin() {
      return request.auth != null && request.auth.token.email == 'pimashin2015@gmail.com';
    }
    
    // Категории: публичное чтение, админ для записи
    match /categories/{categoryId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }
    
    // Товары: публичное чтение, админ для записи
    match /products/{productId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }
    
    // Заказы: пользователь читает свои, админ читает все
    match /orders/{orderId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.userId || isAdmin());
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if isAdmin();
    }
    
    // Отзывы: авторизованные создают, админ удаляет
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow delete: if isAdmin();
      allow update: if false;
    }
    
    // Промокоды: публичное чтение (для валидации), админ управляет
    match /promocodes/{promoId} {
      allow read: if true;
      allow create, delete: if isAdmin();
      allow update: if isAdmin() || 
        (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['currentUses']));
    }
    
    // Корзины пользователей
    match /carts/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Избранное пользователей
    match /wishlists/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Уведомления о поступлении товаров (НОВОЕ)
    match /stockNotifications/{notificationId} {
      allow create: if true;
      allow read, delete: if isAdmin();
      allow update: if false;
    }
  }
}
```

### Важные моменты:

1. **Email админа в нижнем регистре**: Firebase Auth автоматически приводит email к нижнему регистру в токене, поэтому в правилах используется `'pimashin2015@gmail.com'` (строчными буквами).

2. **Публичное создание подписок**: Любой посетитель может создать подписку на уведомление (даже без авторизации), указав свой email.

3. **Безопасность**: Только администратор может просматривать и удалять подписки через админ-панель.

4. **Автоматическое удаление**: После отправки email-уведомления подписка автоматически удаляется из базы данных.

### Проверка работоспособности:

После обновления правил:

1. Перейдите на главную страницу магазина
2. Найдите товар с нулевым остатком (stock = 0)
3. Нажмите кнопку "Уведомить меня"
4. Введите email и подпишитесь
5. Войдите в админ-панель (pimashin2015@gmail.com)
6. Откройте вкладку "Подписки" - вы должны увидеть созданную подписку
7. Пополните остаток товара через кнопки +1, +10, и т.д.
8. Система автоматически отправит email и удалит подписку

### Troubleshooting:

**Ошибка "Missing or insufficient permissions":**
- Убедитесь, что email админа в правилах написан строчными буквами: `'pimashin2015@gmail.com'`
- Проверьте, что вы вошли под правильным аккаунтом
- Попробуйте выйти и войти снова

**Подписка не создаётся:**
- Проверьте консоль браузера на наличие ошибок Firebase
- Убедитесь, что правило `allow create: if true;` присутствует для stockNotifications

**Email не отправляется:**
- Убедитесь, что RESEND_API_KEY настроен в Replit Secrets
- Проверьте логи сервера на наличие ошибок от Resend API
- Проверьте лимиты вашего плана Resend (100 писем/день на бесплатном плане)

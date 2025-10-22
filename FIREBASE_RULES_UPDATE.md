# Обновление правил Firebase для промокодов

## Инструкция

Чтобы система промокодов работала правильно, необходимо обновить правила безопасности Firebase Firestore.

### Шаги:

1. Откройте [Firebase Console](https://console.firebase.google.com/)
2. Выберите проект **sweetweb-3543f**
3. Перейдите в раздел **Firestore Database**
4. Откройте вкладку **Rules** (Правила)
5. Замените текущие правила на следующие:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function - проверка администратора
    function isAdmin() {
      // ВАЖНО: email должен быть в нижнем регистре!
      return request.auth != null && request.auth.token.email == 'pimashin2015@gmail.com';
    }
    
    // Products - чтение для всех, изменение только для админа
    match /products/{productId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }
    
    // Categories - чтение для всех, изменение только для админа
    match /categories/{categoryId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }
    
    // Orders - пользователь видит свои заказы, админ видит все
    match /orders/{orderId} {
      allow read: if request.auth != null && 
                     (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if request.auth != null;
      allow update, delete: if isAdmin();
    }
    
    // Reviews - авторизованные пользователи могут создавать, админ может удалять
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow delete: if isAdmin();
    }
    
    // Carts - пользователь управляет только своей корзиной
    match /carts/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // ============ НОВЫЕ ПРАВИЛА ДЛЯ ПРОМОКОДОВ ============
    
    // Promo Codes - чтение для всех, изменение только для админа
    match /promoCodes/{promoCodeId} {
      // Все могут читать промокоды (для валидации при оформлении заказа)
      allow read: if true;
      
      // Только админ может создавать, обновлять и удалять промокоды
      allow create, update, delete: if isAdmin();
    }
  }
}
```

### Важные замечания:

1. **Email администратора**: В правилах используется email `pimashin2015@gmail.com` в **нижнем регистре**
   - Firebase Authentication автоматически приводит все email к нижнему регистру
   - Правила должны использовать точно такой же формат

2. **Доступ к промокодам**:
   - **Чтение (read)**: Все пользователи могут читать промокоды для валидации
   - **Создание/Обновление/Удаление (create/update/delete)**: Только администратор

3. **Безопасность**: Правила гарантируют, что:
   - Обычные пользователи могут только читать промокоды для валидации
   - Только администратор может создавать, изменять и удалять промокоды
   - Количество использований подсчитывается автоматически из реальных заказов

### Проверка правил:

После сохранения правил в Firebase Console:

1. Зайдите в админ-панель сайта (как `pimashin2015@gmail.com`)
2. Перейдите на вкладку "Промокоды"
3. Создайте тестовый промокод
4. Попробуйте применить его при оформлении заказа
5. Проверьте, что заказ создаётся с информацией о промокоде

**Система подсчёта использований**:
- Промокоды **НЕ хранят** поле `currentUses` в базе данных
- При каждой проверке лимита система автоматически считает реальные заказы с этим промокодом
- Заказы сохраняют полную информацию о промокоде (код, сумма скидки, тип)
- В админ-панели автоматически отображается реальное количество использований
- Это гарантирует точность данных и исключает рассинхронизацию

### Отладка проблем:

Если возникают ошибки "Missing or insufficient permissions":

1. Проверьте, что вы вошли как `pimashin2015@gmail.com` (нижний регистр!)
2. Откройте консоль браузера и проверьте email в токене:
   ```javascript
   // Должно быть выведено при входе в админ-панель
   console.log("Your email:", user.email); 
   ```
3. Убедитесь, что правила сохранены и опубликованы в Firebase Console

---

## Структура данных промокода

Для справки, вот структура документа промокода в Firestore:

```typescript
{
  code: string;              // Код промокода (например, "ЛЕТО2025")
  discountType: 'percentage' | 'fixed';  // Тип скидки
  discountValue: number;     // Размер скидки (процент или сумма)
  minOrderAmount?: number;   // Минимальная сумма заказа (опционально)
  maxUses?: number;          // Максимум использований (опционально)
  active: boolean;           // Активен ли промокод
  startDate?: Timestamp;     // Дата начала действия (опционально)
  endDate?: Timestamp;       // Дата окончания действия (опционально)
  createdAt: Timestamp;      // Дата создания
}
```

**Важно**: Поле `currentUses` больше не хранится в базе данных. Количество использований подсчитывается автоматически из коллекции заказов.

## Структура данных заказа (промокод)

Когда заказ использует промокод, он сохраняется в следующем формате:

```typescript
{
  // ... другие поля заказа ...
  promoCode?: {
    code: string;            // Код промокода (например, "ЛЕТО2025")
    discountAmount: number;  // Примененная сумма скидки
    discountType: 'percentage' | 'fixed';  // Тип скидки
  }
}
```

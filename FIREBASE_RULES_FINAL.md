# 🔥 Финальные правила Firebase для Sweet Delights

## ⚠️ ВАЖНО: Обновите правила перед запуском!

Текущая ошибка в консоли `"permission-denied"` при загрузке избранного происходит из-за отсутствия правил для коллекции `wishlists`.

---

## 📋 Инструкция по обновлению

1. Откройте [Firebase Console](https://console.firebase.google.com/)
2. Выберите проект **sweetweb-3543f**
3. Перейдите в **Firestore Database** → **Rules**
4. **Полностью замените** текущие правила на код ниже
5. Нажмите **"Publish"** (Опубликовать)

---

## ✅ Полные правила безопасности (скопируйте целиком)

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Проверка администратора
    function isAdmin() {
      // ВАЖНО: email в нижнем регистре (Firebase Auth автоматически приводит к lowercase)
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
    
    // Отзывы: публичное чтение, авторизованные создают, админ удаляет
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow delete: if isAdmin();
      allow update: if false;
    }
    
    // Промокоды: публичное чтение (для валидации), админ управляет
    match /promoCodes/{promoId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }
    
    // Корзины пользователей
    match /carts/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // ⭐ ИЗБРАННОЕ пользователей (КРИТИЧНО - БЕЗ ЭТОГО ОШИБКА!)
    match /wishlists/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Уведомления о поступлении товаров
    match /stockNotifications/{notificationId} {
      allow create: if true;  // Любой может подписаться
      allow read, delete: if isAdmin();  // Только админ управляет
      allow update: if false;
    }
  }
}
```

---

## 🎯 Что это исправит

После обновления правил:

✅ **Избранное** - пользователи смогут добавлять/удалять товары в избранное  
✅ **Корзина** - пользователи смогут управлять своей корзиной  
✅ **Промокоды** - будут работать при оформлении заказа  
✅ **Уведомления о наличии** - пользователи смогут подписаться  
✅ **Админ-панель** - полный доступ для pimashin2015@gmail.com  

---

## 🔍 Проверка после обновления

1. Откройте сайт
2. Войдите в аккаунт (любой пользователь)
3. Попробуйте добавить товар в избранное (❤️ иконка)
4. Ошибка `"permission-denied"` должна исчезнуть
5. Проверьте консоль браузера - не должно быть ошибок Firebase

---

## ⚡ Коллекции в базе данных

| Коллекция | Чтение | Создание | Обновление | Удаление |
|-----------|--------|----------|------------|----------|
| **categories** | Все | Админ | Админ | Админ |
| **products** | Все | Админ | Админ | Админ |
| **orders** | Пользователь (свои) / Админ (все) | Авторизованные | Админ | Админ |
| **reviews** | Все | Авторизованные | ❌ | Админ |
| **promoCodes** | Все | Админ | Админ | Админ |
| **carts** | Владелец корзины | Владелец | Владелец | Владелец |
| **wishlists** | Владелец списка | Владелец | Владелец | Владелец |
| **stockNotifications** | Админ | Все (даже гости) | ❌ | Админ |

---

## 🚨 Важные замечания

1. **Email админа**: Используется `pimashin2015@gmail.com` (строчными!)
2. **Безопасность**: Каждый пользователь видит только свои данные (корзина, избранное, заказы)
3. **Публичные данные**: Товары, категории, промокоды, отзывы - доступны всем для чтения
4. **Подписки**: Любой может подписаться на уведомления (даже без регистрации)

---

## 📝 Что делать СЕЙЧАС

1. ✅ Скопируйте правила выше (весь блок кода)
2. ✅ Откройте Firebase Console → Firestore → Rules
3. ✅ Замените ВСЁ содержимое на скопированное
4. ✅ Нажмите "Publish"
5. ✅ Обновите сайт и проверьте - ошибка должна исчезнуть!

---

**После этого ваш сайт полностью готов к работе!** 🎉

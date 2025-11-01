# 📦 Инструкция по деплою Sweet Delights

## Часть 1: Настройка Firebase Cloud Functions (один раз)

### Шаг 1: Установите Firebase CLI

```bash
npm install -g firebase-tools
```

### Шаг 2: Войдите в Firebase

```bash
firebase login
```

### Шаг 3: Установите зависимости для Cloud Functions

```bash
cd functions
npm install
cd ..
```

### Шаг 4: Настройте RESEND_API_KEY в Firebase

```bash
firebase functions:config:set resend.api_key="ВАШ_RESEND_API_KEY"
```

**Где взять RESEND_API_KEY:**
1. Зайдите на https://resend.com
2. Войдите в свой аккаунт
3. Перейдите в раздел API Keys
4. Скопируйте ваш API ключ

### Шаг 5: Деплой Firebase Rules и Cloud Functions

```bash
firebase deploy
```

Это развернет:
- Firestore Security Rules
- Cloud Function для отправки email

**Важно:** Cloud Functions деплоятся на Firebase, а НЕ на GitHub Pages!

---

## Часть 2: Автоматический деплой на GitHub Pages

### Шаг 1: Проверьте файл `.github/workflows/deploy.yml`

Убедитесь, что файл существует и содержит правильную конфигурацию для автоматического деплоя.

### Шаг 2: Настройте Secrets в GitHub

1. Откройте ваш репозиторий на GitHub
2. Перейдите в Settings → Secrets and variables → Actions
3. Добавьте следующие секреты:

| Secret Name | Значение |
|------------|----------|
| `VITE_FIREBASE_API_KEY` | Ваш Firebase API Key |
| `VITE_FIREBASE_PROJECT_ID` | sweetweb-3543f |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Ваш Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Ваш Firebase App ID |

**Где найти эти данные:**
1. Зайдите в Firebase Console
2. Откройте проект sweetweb-3543f
3. Перейдите в Project Settings → General
4. Прокрутите вниз до раздела "Your apps"
5. Скопируйте значения из firebaseConfig

### Шаг 3: Пуш в GitHub = Автоматический деплой

```bash
git add .
git commit -m "Deploy Sweet Delights"
git push origin main
```

**Что происходит автоматически:**
1. GitHub Action запускается
2. Билдится проект (npm run build)
3. Деплоится на GitHub Pages
4. Сайт доступен по адресу: https://misha4323223.github.io/ProductShowcase

---

## 🎯 Как работает система уведомлений

### Для пользователей:
1. Товар закончился → появляется кнопка "Уведомить о поступлении"
2. Пользователь вводит email → подписка сохраняется в Firestore

### Для администратора:
1. Заходите в админку → вкладка "Уведомления о наличии"
2. Видите список подписок
3. Пополняете товар → нажимаете "Отправить уведомления"
4. Cloud Function автоматически отправляет email всем подписчикам через Resend
5. Подписки автоматически удаляются после отправки

---

## 📊 Бесплатные лимиты

| Сервис | Бесплатный лимит |
|--------|------------------|
| **Firebase Cloud Functions** | 125,000 вызовов/месяц |
| **Resend Email** | 100 писем/день (3,000/месяц) |
| **Firebase Firestore** | 50,000 чтений/день |
| **GitHub Pages** | Безлимитно |

---

## ❗ Важные заметки

1. **Cloud Functions деплоятся отдельно** - они НЕ включаются в GitHub Pages
2. **Сначала настройте Firebase**, потом пушьте в GitHub
3. **RESEND_API_KEY нужен только в Firebase** (не в GitHub Secrets)
4. После каждого изменения кода - просто пуште в GitHub, деплой произойдет автоматически

---

## 🔄 Обновление Cloud Function

Если вы изменили код в `functions/index.js`:

```bash
firebase deploy --only functions
```

---

## 🐛 Решение проблем

### Проблема: Email не отправляются

**Решение:**
```bash
# Проверьте конфигурацию
firebase functions:config:get

# Если resend.api_key пустой, установите:
firebase functions:config:set resend.api_key="ВАШ_КЛЮЧ"
firebase deploy --only functions
```

### Проблема: GitHub Actions не работает

**Решение:**
1. Проверьте что все секреты добавлены в Settings → Secrets
2. Проверьте логи в Actions tab на GitHub
3. Убедитесь что GitHub Pages включен в Settings → Pages

### Проблема: "Permission denied" при отправке уведомлений

**Решение:**
1. Убедитесь что вы вошли как pimashin2015@gmail.com
2. Проверьте Firestore Rules в Firebase Console

---

## ✅ Чеклист первого деплоя

- [ ] Установлен Firebase CLI
- [ ] Выполнен `firebase login`
- [ ] Установлены зависимости в `functions/` (`npm install`)
- [ ] Настроен `resend.api_key` через `firebase functions:config:set`
- [ ] Выполнен `firebase deploy`
- [ ] Добавлены все секреты в GitHub
- [ ] Сделан push в GitHub
- [ ] Сайт открывается на https://misha4323223.github.io/ProductShowcase
- [ ] Админка работает (вход через pimashin2015@gmail.com)
- [ ] Тестовое уведомление отправлено успешно

---

**Готово!** 🎉 Ваш магазин работает с автоматическими email-уведомлениями!

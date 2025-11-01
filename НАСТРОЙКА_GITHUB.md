# 🔧 Настройка GitHub для деплоя

## ⚠️ ВАЖНО: Firebase ключи и безопасность

Ваши Firebase ключи **НЕ попадут** в публичный репозиторий автоматически - это правильно для безопасности!

Их нужно добавить вручную в **GitHub Secrets**.

---

## 📋 ЧТО НУЖНО СДЕЛАТЬ В GITHUB (пошагово)

### ШАГ 1: Добавьте Firebase ключи в GitHub Secrets

1. **Откройте настройки репозитория:**
   ```
   https://github.com/misha4323223/ProductShowcase/settings/secrets/actions
   ```

2. **Нажмите кнопку:** `New repository secret`

3. **Добавьте 4 секрета (по одному):**

   **Секрет 1:**
   - Name: `VITE_FIREBASE_API_KEY`
   - Value: `AIzaSyBXfemrtkGlgFl_KnMjjo278sqrnc-FzcQ`
   - Нажмите `Add secret`

   **Секрет 2:**
   - Name: `VITE_FIREBASE_PROJECT_ID`
   - Value: `sweetweb-3543f`
   - Нажмите `Add secret`

   **Секрет 3:**
   - Name: `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - Value: `907618119619`
   - Нажмите `Add secret`

   **Секрет 4:**
   - Name: `VITE_FIREBASE_APP_ID`
   - Value: `1:907618119619:web:a72799c12d2233ff865776`
   - Нажмите `Add secret`

4. **Проверьте:** Должно быть 4 секрета в списке

---

### ШАГ 2: Включите GitHub Pages

1. **Откройте настройки Pages:**
   ```
   https://github.com/misha4323223/ProductShowcase/settings/pages
   ```

2. **В разделе "Source" выберите:** `GitHub Actions`

3. **Сохраните** (если есть кнопка Save)

---

### ШАГ 3: Убедитесь что Actions включены

1. **Откройте:**
   ```
   https://github.com/misha4323223/ProductShowcase/settings/actions
   ```

2. **Проверьте что выбрано:**
   - ✅ "Allow all actions and reusable workflows"

3. **В разделе "Workflow permissions" выберите:**
   - ✅ "Read and write permissions"

---

## ✅ ГОТОВО! Теперь можно деплоить

После настройки всех секретов, сделайте первый деплой:

```bash
git add .
git commit -m "Setup GitHub Actions with Firebase secrets"
git push origin main
```

Через 2-3 минуты ваш сайт будет работать с Firebase!

---

## 🔒 Безопасность

### ✅ Что защищено:
- Firebase ключи хранятся в GitHub Secrets (зашифрованы)
- Ключи не попадают в публичный репозиторий
- Ключи не видны в логах GitHub Actions
- Только вы имеете доступ к секретам

### ⚠️ Важно знать:
- Firebase API ключи для веб-приложений считаются "публичными" (это нормально)
- Они встраиваются в JavaScript код на стороне клиента
- Защита данных обеспечивается через Firebase Security Rules, а не через сокрытие ключей
- Убедитесь что у вас настроены правильные Security Rules в Firebase Console

---

## 🔍 Проверка настройки

1. **Проверьте секреты:**
   https://github.com/misha4323223/ProductShowcase/settings/secrets/actions
   
   Должны видеть 4 секрета (значения скрыты - это нормально)

2. **Проверьте Pages:**
   https://github.com/misha4323223/ProductShowcase/settings/pages
   
   Source = "GitHub Actions"

3. **Сделайте тестовый деплой:**
   ```bash
   git push origin main
   ```

4. **Проверьте процесс:**
   https://github.com/misha4323223/ProductShowcase/actions

---

## ❓ Частые вопросы

**Q: Безопасно ли хранить API ключи в GitHub Secrets?**
- ✅ Да, GitHub Secrets зашифрованы и недоступны публично

**Q: Будут ли видны мои ключи в коде на GitHub Pages?**
- ⚠️ Firebase API ключи для веб встраиваются в JavaScript (это нормально для Firebase)
- Защита обеспечивается через Firebase Security Rules

**Q: Нужно ли обновлять секреты если поменяются ключи?**
- ✅ Да, просто обновите значение секрета в GitHub Secrets

**Q: Можно ли использовать другие секреты?**
- ✅ Да, добавьте их так же через GitHub Secrets

---

## 🎯 Краткая шпаргалка

```
1. Добавить 4 Firebase секрета в GitHub Secrets
2. Включить GitHub Pages (Source = GitHub Actions)
3. git push origin main
4. Готово!
```

**URL для настройки:**
- Secrets: https://github.com/misha4323223/ProductShowcase/settings/secrets/actions
- Pages: https://github.com/misha4323223/ProductShowcase/settings/pages
- Actions: https://github.com/misha4323223/ProductShowcase/settings/actions

# 🚀 Быстрый старт деплоя

## Что нужно сделать

### 1️⃣ Отправьте код на GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2️⃣ Включите GitHub Pages
1. Откройте https://github.com/misha4323223/ProductShowcase/settings/pages
2. В **Source** выберите: **GitHub Actions**
3. Готово! ✨

### 3️⃣ Проверьте деплой
- Откройте https://github.com/misha4323223/ProductShowcase/actions
- Дождитесь завершения workflow (2-3 минуты)
- Ваш сайт: **https://misha4323223.github.io/ProductShowcase**

---

## 📋 Что уже настроено

✅ GitHub Actions workflow (`.github/workflows/deploy.yml`)  
✅ Правильный base path в Vite конфигурации  
✅ Скрипт сборки `build:gh-pages` в package.json  
✅ Файл `.nojekyll` для корректной работы  

## 🔧 Технические детали

**Workflow запускается автоматически при:**
- Push в ветку `main`
- Можно запустить вручную через Actions → Run workflow

**Процесс сборки:**
1. Checkout кода
2. Установка Node.js 20
3. Установка зависимостей (`npm ci`)
4. Сборка проекта (`npm run build:gh-pages -- --base=/ProductShowcase/`)
5. Деплой на GitHub Pages

**Output директория:** `dist/public/`

---

## 📞 Помощь

**Сайт не работает?**
- Проверьте Settings → Pages → Source = "GitHub Actions"
- Посмотрите логи в Actions
- Убедитесь что ветка называется `main`

**Нужно обновить сайт?**
Просто сделайте push в main:
```bash
git add .
git commit -m "Update content"
git push origin main
```

GitHub Actions автоматически пересоберет и задеплоит сайт!

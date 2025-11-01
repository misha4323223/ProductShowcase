# Инструкция по деплою на GitHub Pages

## Что уже настроено ✅

1. **GitHub Actions Workflow** - автоматический деплой при пуше в `main` ветку
2. **Vite конфигурация** - правильный base path для GitHub Pages
3. **`.nojekyll` файл** - для корректной работы маршрутизации

## Как задеплоить сайт

### 1. Отправьте код на GitHub

```bash
git add .
git commit -m "Setup GitHub Pages deployment"
git push origin main
```

### 2. Включите GitHub Pages в настройках репозитория

1. Откройте ваш репозиторий на GitHub: `https://github.com/misha4323223/ProductShowcase`
2. Перейдите в **Settings** (Настройки)
3. В меню слева найдите **Pages**
4. В разделе **Source** выберите:
   - Source: **GitHub Actions**
5. Сохраните настройки

### 3. Проверьте деплой

После пуша в `main` ветку:
1. Перейдите во вкладку **Actions** в вашем репозитории
2. Вы увидите запущенный workflow "Deploy to GitHub Pages"
3. Дождитесь его завершения (обычно 2-3 минуты)
4. Ваш сайт будет доступен по адресу: `https://misha4323223.github.io/ProductShowcase`

## Команды для локального тестирования

Проверить production build локально:
```bash
npm run build:gh-pages -- --base=/ProductShowcase/
```

## Структура деплоя

- **Frontend** собирается в `dist/public/` через Vite
- **GitHub Actions** автоматически загружает `dist/public` на GitHub Pages
- **Base path** `/ProductShowcase/` автоматически добавляется ко всем путям

## Переменная окружения

Workflow автоматически использует параметр `--base=/ProductShowcase/` при сборке, поэтому все ссылки и пути будут работать корректно на GitHub Pages.

## Ручной запуск деплоя

Вы можете вручную запустить деплой:
1. Перейдите в **Actions**
2. Выберите workflow "Deploy to GitHub Pages"
3. Нажмите **Run workflow** → **Run workflow**

## Troubleshooting

Если сайт не работает:
- Проверьте что в Settings → Pages выбран источник "GitHub Actions"
- Проверьте логи workflow в разделе Actions
- Убедитесь что ветка называется `main` (а не `master`)

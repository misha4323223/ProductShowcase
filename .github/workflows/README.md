# GitHub Actions Workflow

Этот workflow автоматически деплоит ваш сайт на GitHub Pages при каждом push в ветку `main`.

## Что происходит автоматически:

1. **Checkout кода** - скачивает последнюю версию из репозитория
2. **Установка Node.js 20** - настраивает окружение
3. **Установка зависимостей** - `npm ci` (быстрая установка)
4. **Сборка проекта** - `npm run build:gh-pages -- --base=/ProductShowcase/`
5. **Деплой на GitHub Pages** - публикация собранных файлов

## Когда запускается:

- ✅ При push в ветку `main`
- ✅ Вручную через интерфейс GitHub Actions (workflow_dispatch)

## Время выполнения:

Обычно 2-3 минуты от push до публикации.

## Как посмотреть логи:

https://github.com/misha4323223/ProductShowcase/actions

## Как запустить вручную:

1. Откройте Actions на GitHub
2. Выберите "Deploy to GitHub Pages"
3. Нажмите "Run workflow" → "Run workflow"

## Переменные окружения:

Workflow не требует настройки секретов или переменных - все работает из коробки!

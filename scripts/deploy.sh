#!/bin/bash

# Скрипт для быстрого деплоя изменений на GitHub Pages
# Использование: bash scripts/deploy.sh "описание изменений"

set -e

echo "🚀 Начинаем деплой на GitHub Pages..."

# Проверяем что есть сообщение коммита
if [ -z "$1" ]; then
  echo "❌ Ошибка: укажите описание изменений"
  echo "Использование: npm run deploy \"описание изменений\""
  exit 1
fi

COMMIT_MSG="$1"

echo "📝 Добавляем все изменения..."
git add .

echo "💾 Создаем коммит: $COMMIT_MSG"
git commit -m "$COMMIT_MSG" || echo "Нет изменений для коммита"

echo "⬆️  Отправляем на GitHub..."
git push origin main

echo ""
echo "✅ Готово! Изменения отправлены на GitHub"
echo "🔄 GitHub Actions автоматически обновит сайт (2-3 минуты)"
echo "📊 Проверить статус: https://github.com/misha4323223/ProductShowcase/actions"
echo "🌐 Ваш сайт: https://misha4323223.github.io/ProductShowcase"
echo ""

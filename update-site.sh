#!/bin/bash

# 🚀 Быстрое обновление сайта на GitHub Pages
# Использование: ./update-site.sh "описание изменений"

set -e

clear
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   🚀 ДЕПЛОЙ НА GITHUB PAGES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Проверяем что есть сообщение коммита
if [ -z "$1" ]; then
  echo "📝 Введите описание изменений:"
  read COMMIT_MSG
  if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="Обновление сайта $(date '+%Y-%m-%d %H:%M')"
  fi
else
  COMMIT_MSG="$1"
fi

echo ""
echo "📝 Сообщение коммита: $COMMIT_MSG"
echo ""

# Показываем измененные файлы
echo "📂 Измененные файлы:"
git status --short
echo ""

# Добавляем все изменения
echo "➕ Добавляем изменения..."
git add .

# Создаем коммит
echo "💾 Создаем коммит..."
if git commit -m "$COMMIT_MSG"; then
  echo "✅ Коммит создан"
else
  echo "ℹ️  Нет новых изменений для коммита"
  exit 0
fi

# Отправляем на GitHub
echo ""
echo "⬆️  Отправляем на GitHub..."
if git push origin main; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "   ✅ УСПЕШНО ОТПРАВЛЕНО!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "🔄 GitHub Actions автоматически обновит сайт (2-3 минуты)"
  echo ""
  echo "📊 Проверить процесс деплоя:"
  echo "   https://github.com/misha4323223/ProductShowcase/actions"
  echo ""
  echo "🌐 Ваш сайт:"
  echo "   https://misha4323223.github.io/ProductShowcase"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
  echo ""
  echo "❌ Ошибка при отправке на GitHub"
  echo "Проверьте подключение и права доступа"
  exit 1
fi

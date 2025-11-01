# Скрипты для Firebase

## Загрузка данных в Firestore

Этот скрипт загружает товары и категории из `client/public/data/products.json` в Firebase Firestore.

### Как использовать:

1. Убедитесь, что все Firebase ключи настроены в Replit Secrets:
   - VITE_FIREBASE_API_KEY
   - VITE_FIREBASE_PROJECT_ID
   - VITE_FIREBASE_APP_ID
   - VITE_FIREBASE_MESSAGING_SENDER_ID

2. Запустите скрипт:
   ```bash
   tsx scripts/upload-data-to-firestore.ts
   ```

3. Дождитесь сообщения "Все данные успешно загружены в Firestore!"

**Важно:** Этот скрипт нужно запустить только один раз после создания Firebase проекта.

После загрузки данных ваш магазин будет работать с реальной базой данных Firebase вместо локального JSON файла.

# Настройка EmailJS для Sweet Delights

Эта инструкция поможет вам настроить автоматическую отправку email-уведомлений клиентам через EmailJS.

## Что будет отправляться

1. **Подтверждение заказа** - клиент получает письмо при оформлении заказа
2. **Уведомление о наличии товара** - клиент получает письмо когда товар снова появился в наличии

## Шаг 1: Регистрация на EmailJS

1. Откройте: https://www.emailjs.com/
2. Нажмите **"Sign Up"** (Регистрация)
3. Выберите **"Sign up with Google"** или зарегистрируйтесь через email
4. Подтвердите email (если регистрируетесь через email)

## Шаг 2: Подключение вашей почты Gmail

### 2.1. Создание сервиса

1. В панели EmailJS нажмите **"Email Services"** в левом меню
2. Нажмите **"Add New Service"**
3. Выберите **"Gmail"**
4. Нажмите **"Connect Account"**
5. Выберите вашу **новую почту магазина** (которую вы создали)
6. Разрешите доступ EmailJS к отправке писем от вашего имени
7. Скопируйте **Service ID** (например: `service_abc123`)
   - Сохраните его - он понадобится позже!

### 2.2. Настройка имени отправителя (опционально)

1. В настройках сервиса найдите **"Service Settings"**
2. В поле **"From Name"** введите: `Sweet Delights`
3. Нажмите **"Save"**

Теперь клиенты будут видеть:
```
От: Sweet Delights <ваша.почта@gmail.com>
```

## Шаг 3: Создание шаблонов писем

### 3.1. Шаблон подтверждения заказа

1. Нажмите **"Email Templates"** в левом меню
2. Нажмите **"Create New Template"**
3. Заполните:

**Template Name:** `Order Confirmation` (Подтверждение заказа)

**Subject:**
```
Заказ №{{order_number}} принят - Sweet Delights
```

**Content (тело письма):**
```
Здравствуйте, {{customer_name}}!

Спасибо за ваш заказ в Sweet Delights! 🍬

📦 Детали заказа:
━━━━━━━━━━━━━━━━━━
Номер заказа: #{{order_number}}
Дата заказа: {{order_date}}

🛍️ Товары:
{{items_list}}

💰 Итого: {{total_amount}}₽

📍 Адрес доставки:
{{shipping_address}}

📞 Телефон: {{phone}}

Мы свяжемся с вами в ближайшее время для подтверждения заказа и уточнения деталей доставки.

С уважением,
Команда Sweet Delights 🍭

━━━━━━━━━━━━━━━━━━
Если у вас есть вопросы, ответьте на это письмо или позвоните нам.
```

4. Нажмите **"Save"**
5. Скопируйте **Template ID** (например: `template_xyz789`)
   - Сохраните его!

### 3.2. Шаблон уведомления о наличии

1. Нажмите **"Create New Template"**
2. Заполните:

**Template Name:** `Stock Notification` (Уведомление о наличии)

**Subject:**
```
{{product_name}} снова в наличии! - Sweet Delights
```

**Content (тело письма):**
```
Отличные новости! 🎉

Товар "{{product_name}}", на который вы подписались, снова появился в наличии!

🔗 Посмотреть товар:
{{product_url}}

Поспешите - количество ограничено! 🏃‍♂️

С уважением,
Команда Sweet Delights 🍬

━━━━━━━━━━━━━━━━━━
Вы получили это письмо, потому что подписались на уведомления о наличии этого товара.
```

3. Нажмите **"Save"**
4. Скопируйте **Template ID** (например: `template_abc456`)
   - Сохраните его!

## Шаг 4: Получение Public Key

1. Нажмите на ваше имя в правом верхнем углу
2. Выберите **"Account"**
3. Найдите **"API Keys"**
4. Скопируйте **Public Key** (например: `Abc123XyZ456`)
   - Сохраните его!

## Шаг 5: Добавление ключей в проект

### Вариант А: Через GitHub Secrets (рекомендуется)

1. Откройте ваш репозиторий на GitHub: https://github.com/misha4323223/ProductShowcase
2. Перейдите в **Settings** → **Secrets and variables** → **Actions**
3. Нажмите **"New repository secret"** три раза и добавьте:

**Секрет 1:**
- Name: `VITE_EMAILJS_PUBLIC_KEY`
- Value: `ваш Public Key`

**Секрет 2:**
- Name: `VITE_EMAILJS_SERVICE_ID`
- Value: `ваш Service ID`

**Секрет 3:**
- Name: `VITE_EMAILJS_ORDER_TEMPLATE_ID`
- Value: `Template ID для подтверждения заказа`

**Секрет 4:**
- Name: `VITE_EMAILJS_STOCK_TEMPLATE_ID`
- Value: `Template ID для уведомлений о наличии`

4. Нажмите **"Add secret"** для каждого

### Вариант Б: Локально (для тестирования)

Создайте файл `.env.local` в корне проекта:

```env
VITE_EMAILJS_PUBLIC_KEY=ваш_public_key
VITE_EMAILJS_SERVICE_ID=ваш_service_id
VITE_EMAILJS_ORDER_TEMPLATE_ID=template_id_заказа
VITE_EMAILJS_STOCK_TEMPLATE_ID=template_id_наличия
```

⚠️ **Важно:** Файл `.env.local` НЕ должен попадать в Git!

## Шаг 6: Обновление GitHub Actions

Откройте файл `.github/workflows/deploy.yml` и добавьте переменные окружения в секцию `env`:

```yaml
env:
  VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
  VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
  VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
  VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
  VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
  VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
  VITE_EMAILJS_PUBLIC_KEY: ${{ secrets.VITE_EMAILJS_PUBLIC_KEY }}
  VITE_EMAILJS_SERVICE_ID: ${{ secrets.VITE_EMAILJS_SERVICE_ID }}
  VITE_EMAILJS_ORDER_TEMPLATE_ID: ${{ secrets.VITE_EMAILJS_ORDER_TEMPLATE_ID }}
  VITE_EMAILJS_STOCK_TEMPLATE_ID: ${{ secrets.VITE_EMAILJS_STOCK_TEMPLATE_ID }}
```

## Шаг 7: Деплой на GitHub Pages

1. Сохраните все изменения
2. Закоммитьте и запушьте на GitHub:
```bash
git add .
git commit -m "Add EmailJS integration"
git push origin main
```

3. GitHub Actions автоматически задеплоит обновленную версию

## Шаг 8: Тестирование

1. Откройте ваш сайт: https://misha4323223.github.io/ProductShowcase
2. Добавьте товары в корзину
3. Оформите тестовый заказ
4. Проверьте email - должно прийти подтверждение!

### Тестирование уведомлений о наличии:

1. Войдите как админ (pimashin2015@gmail.com)
2. Установите количество товара = 0
3. На странице товара подпишитесь на уведомления
4. В админ-панели увеличьте количество товара
5. Нажмите кнопку "Отправить уведомления"
6. Проверьте email!

## Лимиты бесплатного плана

✅ **200 писем/месяц** бесплатно
- Примерно 200 заказов в месяц
- Или 100 заказов + 100 уведомлений о наличии

📊 **Мониторинг использования:**
1. Откройте EmailJS Dashboard
2. Перейдите в **"Usage"**
3. Смотрите сколько писем отправлено

## Если нужно больше писем

Если 200 писем/месяц не хватает:

**Solo план - $15/мес:**
- 1,000 писем/месяц
- Приоритетная поддержка
- https://www.emailjs.com/pricing/

## Проблемы и решения

### ❌ Письма не отправляются

1. Проверьте что все 4 секрета добавлены в GitHub
2. Проверьте что переменные окружения добавлены в `.github/workflows/deploy.yml`
3. Проверьте консоль браузера на ошибки
4. Убедитесь что Service ID и Template ID правильные

### ❌ Письма попадают в спам

1. Откройте Gmail → **Настройки** → **Фильтры**
2. Создайте фильтр для вашего адреса
3. Отметьте "Никогда не отправлять в спам"

Или попросите клиентов добавить ваш email в контакты.

### ❌ "Invalid public key" ошибка

- Public Key должен быть БЕЗ кавычек
- Проверьте что скопировали полностью (без пробелов)

## Дополнительная помощь

- **Документация EmailJS:** https://www.emailjs.com/docs/
- **Поддержка EmailJS:** support@emailjs.com
- **FAQ:** https://www.emailjs.com/docs/faq/

---

✅ **Готово!** Теперь ваши клиенты будут автоматически получать email-уведомления!

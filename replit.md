# Sweet Delights E-commerce Platform

## Overview
Sweet Delights is an e-commerce platform specializing in sweets (chocolates, candies, cookies) and accessories. It offers a modern, visually appealing shopping experience with features like product browsing, cart management, and automated email notifications. The platform is built as a static React TypeScript application deployed on GitHub Pages, utilizing Yandex Cloud for backend services. The project aims to provide a delightful and efficient online shopping experience, targeting the Russian market with localized content and legal compliance.

## User Preferences
Preferred communication style: Simple, everyday language.

## Latest Updates (November 29, 2025)

✅ **ЭТАП 3: Frontend Telegram Mini App Integration - Nov 29, 2025 (COMPLETED)**:
- **Core Libraries**:
  - `client/src/lib/telegram.ts` - Полная библиотека Telegram Mini App (15+ функций):
    - `isTelegramMiniApp()` - проверка запуска в Mini App
    - `initTelegramWebApp()` - инициализация Web App SDK
    - `authenticateWithTelegram(email)` - привязка Telegram ID
    - `sendOrderNotificationToTelegram(orderData)` - отправка уведомлений
    - `showMainButton()`, `hideMainButton()`, `showBackButton()`, `hideBackButton()`
    - `closeMiniApp()` - закрытие Mini App

- **React Hooks**:
  - `client/src/hooks/useTelegramApp.ts` - управление Telegram Mini App:
    - Детектирование наличия Mini App при монтировании
    - Инициализация Web App SDK
    - Возврат данных пользователя из Telegram
    - Состояние: `isInMiniApp`, `telegramUser`, `initData`

- **App.tsx Integration**:
  - Загрузка `telegram-web-app.js` скрипта при монтировании
  - Вызов `useTelegramApp()` для инициализации
  - Автоматическая подготовка приложения для Telegram

- **CheckoutPage Integration**:
  - Автоматическая отправка уведомления о заказе в Telegram после оформления
  - Передача полных данных заказа (товары, адрес, доставка, промокод, бонусы)
  - Обработка ошибок: если пользователь не привязал Telegram → просто пропускается

- **LoginPage UI**:
  - Кнопка "📱 Привязать Telegram" - видна только в Telegram Mini App
  - Обработчик `handleTelegramAuth()` для привязки Telegram ID
  - Валидация email перед отправкой запроса

- **Database**: YDB Users table готова с полями telegramId, telegramFirstName, telegramLastName, telegramUsername, telegramLinkedAt

- **Status**: ✅ Приложение готово к тестированию в боте @SweetWeb71_bot

✅ **ЭТАП 2: Backend для Telegram - Nov 29, 2025 (COMPLETED)**:
- **Функция 1: telegram-auth (ID: d4em719picvakgi4ng2s)**:
  - Проверка подписи от Telegram Web App (HMAC-SHA256)
  - Привязка Telegram ID к аккаунту пользователя
  - Обновление полей: telegramId, telegramFirstName, telegramLastName, telegramUsername, telegramLinkedAt
  - Возвращает подтвержденные данные пользователя
  - Endpoint: POST /api/telegram/auth

- **Функция 2: send-order-to-user-telegram (ID: d4epu4u7dq6u9ni5tfbo)**:
  - Отправка уведомления о заказе в личный Telegram чат пользователя
  - Поиск telegramId пользователя по email из заказа
  - Красивое форматирование сообщения (товары, цена, доставка, адрес)
  - Обработка ошибок: если нет telegramId → пропускает (не ошибка)
  - Endpoint: POST /api/send-order-to-user-telegram

- **YDB Schema Updates**:
  - Новые поля в таблице users:
    - telegramId (String) - ID пользователя в Telegram
    - telegramFirstName (String) - Имя из Telegram
    - telegramLastName (String) - Фамилия из Telegram
    - telegramUsername (String) - Юзернейм (@username)
    - telegramLinkedAt (String) - ISO timestamp привязки

- **API Gateway Routes**: ✅ Созданы в API_GATEWAY_TELEGRAM_ROUTES.yaml
  - POST /api/telegram/auth
  - POST /api/send-order-to-user-telegram

✅ **ЭТАП 1: Telegram Mini App Preparation - Nov 29, 2025 (COMPLETED)**:
- **Telegram Bot Setup**:
  - Bot Created: @SweetWeb71_bot
  - Bot ID: 8527959863
  - Bot Name: SweetWeb
  - Bot Username: SweetWeb71_bot
  - Web App URL: https://sweetdelights.store
  - Web App Status: ✅ Configured
  - Mini App Settings: ✅ Updated
  - BOT_TOKEN: ✅ Saved to secrets

## System Architecture

### Frontend
- **Type**: Static React 18 + TypeScript application deployed on GitHub Pages.
- **Routing**: Wouter for lightweight client-side navigation.
- **State Management**: TanStack React Query for server state, localStorage for theme persistence, local React state for UI.
- **UI/Styling**: Shadcn UI (Radix UI + Tailwind CSS) with a custom design system featuring a warm, playful color palette, Playfair Display and Inter fonts, and responsive design with iOS Safari compatibility.
- **Theme System**: Multi-theme design system with festive seasonal themes (Sakura, New Year, Spring, Autumn). Themes stored in localStorage and applied via CSS variables. Each theme includes:
  - Custom background images managed via admin panel (separate mobile and desktop versions)
  - Desktop backgrounds: `backgrounds/[theme-name]`, mobile: `backgrounds/[theme-name]/mobile`
  - Automatic device detection: mobile backgrounds on ≤768px screens, desktop on larger
  - Background images stored in YDB and Yandex Object Storage
  - Real-time sync with 3-second polling for global synchronization
  - Auto-initialization of 4 default backgrounds on first admin load
- **Key Components**: Includes sticky header, auto-rotating hero slider, animated product cards, side-panel shopping cart, category navigation, feature highlights bar, and a footer with legal links.
- **CDEK Delivery Integration**:
  - `DeliverySelector`: Delivery service selector (CDEK only - nationwide coverage).
  - `CdekPointSelector`: Searchable pickup point selector with city filtering.
  - `DeliveryCalculator`: Real-time delivery cost and time calculation.
  - Integrated into `CheckoutPage` with complete validation ensuring all CDEK data (type, point, tariff, cost) is captured before order submission.
  - Supports two delivery types: PICKUP (to pickup point) and DOOR (courier to door).

### Backend
- **Architecture**: Yandex Cloud Functions + YDB (serverless).
- **Frontend-Backend Communication**: Frontend makes direct calls to Yandex Cloud API Gateway endpoints (configured via `VITE_API_GATEWAY_URL`).
- **All API endpoints**: Defined in Yandex Cloud Functions, not in local code.

### Data Layer
- **Database**: Yandex Database (YDB) for all data persistence.
- **Object Storage**: Yandex Object Storage for product images.

### Build and Deployment
- **Build Process**: Frontend-only build with Vite.
- **Deployment**: Static frontend deployed on GitHub Pages. Backend services run on Yandex Cloud.

### SEO and Performance
- **SEO Component**: Universal `SEO.tsx` component supporting dynamic meta tags, Open Graph, Twitter Cards, and Schema.org structured data.
- **Analytics**: Integrated Yandex.Metrika and Google Analytics 4 with ecommerce tracking.
- **Performance**: Lazy loading, image optimization (WebP), memoization, and code splitting.
- **Compliance**: `robots.txt` and `sitemap.xml` configured for search engines.

### Email Notification System
- **Primary Method**: All user notifications via Yandex Cloud Postbox (AWS SES-compatible).
- **Notifications**: Order confirmations, stock availability, newsletter subscriptions, welcome emails.
- **Architecture**: Browser → API Gateway → Yandex Cloud Function → YDB + Postbox.

### Telegram Mini App Integration (NEW)
- **Bot Status**: @SweetWeb71_bot (ID: 8527959863)
- **Web App URL**: https://sweetdelights.store
- **Architecture**: 
  - Frontend: React Mini App in Telegram iframe
  - Backend: Yandex Cloud Functions for Telegram auth/webhooks
  - Database: YDB with TelegramUsers table
- **Features Planned**:
  - Telegram Web App SDK integration
  - Automatic user auth via Telegram ID
  - Order notifications in Telegram
  - Back button + Main button support

### Legal Compliance
- Dedicated Privacy Policy and Terms of Service pages (in Russian, compliant with Russian consumer laws).
- Modal component (`LegalDialog.tsx`) for quick previews of legal documents.

## External Dependencies

### UI and Styling
- Radix UI, Tailwind CSS, shadcn/ui
- Google Fonts (Playfair Display, Inter)
- Lucide React, React Icons

### State Management and Data Fetching
- TanStack React Query
- React Hook Form
- Zod (validation)

### Database and ORM
- Drizzle ORM, Neon Database (@neondatabase/serverless)
- drizzle-kit, drizzle-zod

### Frontend Libraries
- wouter (routing)
- embla-carousel-react
- date-fns
- class-variance-authority, clsx, tailwind-merge

### Development Tools
- Vite, tsx, esbuild, TypeScript
- Replit Plugins

### Session Management (Planned)
- express-session, connect-pg-simple

### Backend Services
- **Yandex Cloud YDB**: Products, categories, shopping cart, wishlist, orders, reviews, promo codes, stock notifications, newsletter subscriptions.
- **Yandex Object Storage**: Product images.
- **Yandex Authentication**: User authentication via Yandex ID (email/password).
- **Yandex Cloud Postbox**: Email notifications.
- **CDEK API**: Nationwide delivery integration (4 Cloud Functions: calculate, get pickup points, create order, track order).
- **Telegram Bot API**: Mini App integration and notifications.

## Telegram Mini App Integration (ЭТАП 3-4 ЗАВЕРШЕНЫ)

### Yandex Cloud Functions
| Функция | ID | Статус |
|---------|----|----|
| telegram-auth | d4em719picvakgi4ng2s | ✅ Развернута |
| send-order-to-user-telegram | d4epu4u7dq6u9ni5tfbo | ✅ Развернута |
| telegram-bot | d4er16qnr74l1ecu8ks1 | ✅ Развернута |

### Bot Details
- Bot: @SweetWeb71_bot (ID: 8527959863)
- Mini App URL: https://sweetdelights.store/telegram
- Webhook: установлена ✅
- Commands: /start, /shop, /orders

### Frontend Components
- `client/src/lib/telegram.ts` - Telegram utilities
- `client/src/hooks/useTelegramApp.ts` - Mini App hook
- `client/src/pages/TelegramPage.tsx` - Mini App entry point
- `client/src/App.tsx` - route /telegram added

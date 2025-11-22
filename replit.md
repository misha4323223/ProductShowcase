# Sweet Delights E-commerce Platform

## Overview
Sweet Delights is an e-commerce platform specializing in sweets (chocolates, candies, cookies) and accessories. It offers a modern, visually appealing shopping experience with features like product browsing, cart management, and automated email notifications. The platform is built as a static React TypeScript application deployed on GitHub Pages, utilizing Yandex Cloud for backend services. The project aims to provide a delightful and efficient online shopping experience, targeting the Russian market with localized content and legal compliance.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Type**: Static React 18 + TypeScript application (no local server needed).
- **Routing**: Wouter for lightweight client-side navigation.
- **State Management**: TanStack React Query for server state, localStorage for theme persistence, local React state for UI.
- **UI/Styling**: Shadcn UI (Radix UI + Tailwind CSS) with a custom design system featuring a warm, playful color palette, Playfair Display and Inter fonts, and responsive design with iOS Safari compatibility.
- **Theme System**: Multi-theme design system with festive seasonal themes (Sakura, New Year, Spring, Autumn). Themes stored in localStorage and applied via CSS variables. Each theme includes:
  - Custom background images managed via admin panel
  - Background images stored in YDB and Yandex Object Storage (`backgrounds/[theme-name]` folders)
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
- **Architecture**: Yandex Cloud Functions + YDB (no local Express server).
- **Frontend-Backend Communication**: Frontend makes direct calls to Yandex Cloud API Gateway endpoints (configured via `VITE_API_GATEWAY_URL`).
- **All API endpoints**: Defined in Yandex Cloud Functions, not in local code.

### Data Layer
- **Database**: Yandex Database (YDB) for all data persistence.
- **Object Storage**: Yandex Object Storage for product images.

### Build and Deployment
- **Build Process**: Frontend-only build with Vite.
- **Deployment**: Static frontend deployed on Replit or hosted service. Backend services run on Yandex Cloud.

### SEO and Performance
- **SEO Component**: Universal `SEO.tsx` component supporting dynamic meta tags, Open Graph, Twitter Cards, and Schema.org structured data.
- **Analytics**: Integrated Yandex.Metrika and Google Analytics 4 with ecommerce tracking.
- **Performance**: Lazy loading, image optimization (WebP), memoization, and code splitting.
- **Compliance**: `robots.txt` and `sitemap.xml` configured for search engines.

### Email Notification System
- **Primary Method**: All user notifications via Yandex Cloud Postbox (AWS SES-compatible).
- **Notifications**: Order confirmations, stock availability, newsletter subscriptions, welcome emails.
- **Architecture**: Browser → API Gateway → Yandex Cloud Function → YDB + Postbox.

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
- **Firebase Authentication**: User authentication (email/password).
- **Yandex Cloud Postbox**: Email notifications.
- **CDEK API**: Nationwide delivery integration (4 Cloud Functions: calculate, get pickup points, create order, track order).
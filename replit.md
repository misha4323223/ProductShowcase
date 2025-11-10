# Sweet Delights E-commerce Platform

## Overview
Sweet Delights is an e-commerce platform specializing in sweets (chocolates, candies, cookies) and accessories. It offers a modern, visually appealing shopping experience with features like product browsing, cart management, and automated email notifications. The platform is built as a static React TypeScript application deployed on GitHub Pages, utilizing Yandex Cloud for backend services. The project aims to provide a delightful and efficient online shopping experience, targeting the Russian market with localized content and legal compliance.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript.
- **Routing**: Wouter for lightweight client-side navigation.
- **State Management**: TanStack React Query for server state, local React state for UI.
- **UI/Styling**: Shadcn UI (Radix UI + Tailwind CSS) with a custom design system featuring a warm, playful color palette, Playfair Display and Inter fonts, and responsive design with iOS Safari compatibility.
- **Key Components**: Includes sticky header, auto-rotating hero slider, animated product cards, side-panel shopping cart, category navigation, feature highlights bar, and a footer with legal links.
- **CDEK Integration Components**:
  - `DeliverySelector`: Multi-service delivery selection (CDEK, Boxberry, Yandex).
  - `CdekPointSelector`: Searchable pickup point selector with city filtering.
  - `DeliveryCalculator`: Real-time delivery cost and time calculation.
  - Integrated into `CheckoutPage` with complete validation ensuring all CDEK data (type, point, tariff, cost) is captured before order submission.

### Backend
- **Framework**: Express.js with TypeScript for a flexible REST API.
- **API Structure**: Endpoints prefixed with `/api`, using an abstract storage interface (currently in-memory, designed for database migration).
- **Build**: esbuild for production bundling, tsx for development hot-reloading.

### Data Layer
- **ORM**: Drizzle ORM for type-safe SQL queries.
- **Database**: PostgreSQL (Neon Database) for core data, with schema defined in `shared/schema.ts`.
- **Storage Abstraction**: `IStorage` interface for CRUD operations, allowing easy switching between in-memory and database implementations.

### Build and Deployment
- **Build Process**: Frontend built with Vite to `dist/public`, backend with esbuild to `dist/index.js`.
- **Deployment**: Static frontend hosted on GitHub Pages via GitHub Actions. Backend services utilize Yandex Cloud.

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
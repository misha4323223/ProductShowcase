# Sweet Delights E-commerce Platform

## Overview

<<<<<<< HEAD
Sweet Delights is an e-commerce platform specializing in sweets (chocolates, candies, cookies) and accessories. The application features a visually appealing interface with a warm, playful aesthetic inspired by confectionery design. Built as a static React TypeScript application deployed on GitHub Pages with Firebase backend (Firestore, Authentication, Cloud Functions), it provides a modern shopping experience with product browsing, cart management, automated stock notifications, and responsive design.
=======
Sweet Delights is an e-commerce platform specializing in sweets (chocolates, candies, cookies) and accessories. The application features a visually appealing interface with a warm, playful aesthetic inspired by confectionery design. Built as a full-stack TypeScript application using React and Express, it provides a modern shopping experience with product browsing, cart management, and responsive design.
>>>>>>> 370eca2 (Initial commit)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript
- **Rationale**: Provides type safety and component-based architecture for building interactive UI
- **Router**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state, local React state for UI
- **UI Components**: Shadcn UI (Radix UI primitives with Tailwind CSS styling)
- **Styling**: Tailwind CSS with custom design system

**Design System**:
- Color palette optimized for e-commerce with warm, appetizing tones (raspberry pink, caramel, mint green)
- Typography: Playfair Display (headings) + Inter (body text) via Google Fonts
- Custom animations and effects (candy-wrapper, lollipop-swirl, sugar-crystals, etc.)
- Light/dark mode support with HSL color variables
- Responsive breakpoints for mobile-first design
<<<<<<< HEAD
- **iOS Safari Compatibility** (October 2025): Touch event handlers for mobile menu, disabled mouse-move parallax on touch devices, WebKit-specific CSS fixes for tap highlights and sticky positioning

**Key Components**:
- `Header`: Sticky navigation with cart, search, and mobile menu (with iOS touch event support)
- `HeroSlider`: Auto-rotating image carousel for promotions
- `ProductCard`: Animated product display with add-to-cart (parallax disabled on touch devices)
- `ShoppingCart`: Side-panel cart with quantity management
- `CategoryCard`: Visual category navigation
- `BenefitsBar`: Feature highlights (shipping, returns, etc.)
- `Footer`: Contact info, newsletter signup, social links, legal document links (modal + full pages)
- `LegalDialog`: Modal component for quick preview of legal documents (Privacy/Terms)
=======

**Key Components**:
- `Header`: Sticky navigation with cart, search, and mobile menu
- `HeroSlider`: Auto-rotating image carousel for promotions
- `ProductCard`: Animated product display with add-to-cart
- `ShoppingCart`: Side-panel cart with quantity management
- `CategoryCard`: Visual category navigation
- `BenefitsBar`: Feature highlights (shipping, returns, etc.)
- `Footer`: Contact info, newsletter signup, social links
>>>>>>> 370eca2 (Initial commit)

### Backend Architecture

**Framework**: Express.js with TypeScript
- **Rationale**: Lightweight, flexible HTTP server for REST API
- **Build Tool**: esbuild for production bundling
- **Development**: tsx for hot-reloading during development

**API Structure**:
- Routes registered in `server/routes.ts`
- All API endpoints prefixed with `/api`
- Storage interface abstraction in `server/storage.ts`
- Currently implements in-memory storage (MemStorage class)
- Interface designed for easy migration to database implementation

**Development Setup**:
- Vite dev server for frontend with HMR
- Express middleware for API routes
- Custom logging for API requests with response capture
- Error handling middleware with status code mapping

### Data Layer

**ORM**: Drizzle ORM
- **Rationale**: Type-safe SQL query builder with excellent TypeScript integration
- **Database**: PostgreSQL (via @neondatabase/serverless)
- **Schema Location**: `shared/schema.ts`
- **Migrations**: Generated in `/migrations` directory

**Current Schema**:
- `users` table: id (UUID), username (unique), password
- Zod validation schemas for type-safe inserts
- Schema designed for extension with products, orders, cart tables

**Storage Abstraction**:
- `IStorage` interface defines CRUD operations
- `MemStorage` provides in-memory implementation
- Ready for database storage implementation
- User management (getUser, getUserByUsername, createUser)

### Build and Deployment

**Build Process**:
- Frontend: Vite builds React app to `dist/public`
- Backend: esbuild bundles server to `dist/index.js`
- TypeScript compilation check via `tsc --noEmit`

**Scripts**:
- `dev`: Development mode with tsx hot-reloading
- `build`: Production build (Vite + esbuild)
- `start`: Production server
- `db:push`: Push schema changes to database

**Module System**: ES Modules (type: "module" in package.json)

### Path Aliases

Configured in both TypeScript and Vite:
- `@/`: Maps to `client/src/`
- `@shared/`: Maps to `shared/`
- `@assets/`: Maps to `attached_assets/`

## External Dependencies

### UI and Styling
- **Radix UI**: Unstyled, accessible component primitives (dialogs, dropdowns, tooltips, etc.)
- **Tailwind CSS**: Utility-first CSS framework with PostCSS
- **shadcn/ui**: Pre-built component library built on Radix + Tailwind
- **Google Fonts**: Playfair Display and Inter typefaces
- **Lucide React**: Icon library
- **React Icons**: Additional icons (social media)

### State Management and Data Fetching
- **TanStack React Query**: Server state management and caching
- **React Hook Form**: Form state management
- **Zod**: Runtime type validation and schema definition

### Database and ORM
- **Drizzle ORM**: Type-safe SQL queries and migrations
- **Neon Database**: Serverless PostgreSQL (@neondatabase/serverless)
- **drizzle-kit**: Migration generation and schema management
- **drizzle-zod**: Zod schema generation from Drizzle schemas

### Frontend Libraries
- **wouter**: Lightweight routing (alternative to React Router)
- **embla-carousel-react**: Carousel/slider component
- **date-fns**: Date manipulation and formatting
- **class-variance-authority**: Variant-based component styling
- **clsx + tailwind-merge**: Conditional CSS class merging

### Development Tools
- **Vite**: Frontend build tool and dev server
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production
- **TypeScript**: Type checking and compilation
- **Replit Plugins**: Dev tooling for Replit environment

### Session Management
- **express-session**: Session middleware (ready for implementation)
- **connect-pg-simple**: PostgreSQL session store (ready for implementation)

<<<<<<< HEAD
### Database Migration Status (October 2025)

**✅ Migrated to Yandex Cloud YDB:**
- Products and categories (yandex-products.ts)
- Shopping cart (yandex-cart.ts)
- Wishlist/favorites (yandex-wishlist.ts)
- Orders (yandex-orders.ts)
- Reviews (yandex-reviews.ts)
- Promo codes (yandex-promocodes.ts)
- Stock notifications (yandex-stock-notifications.ts)
- Push subscriptions (yandex-push-subscriptions.ts)

**⚠️ Still using Firebase:**
- Authentication (Firebase Auth with email/password)
- Admin email: pimashin2015@gmail.com (lowercase enforced by AuthContext)
- Email normalization: All emails converted to lowercase on sign-in/sign-up

**Legacy Firebase Services:**
- Old service files (firebase-*.ts) kept for reference but no longer used
- Types still in firebase-types.ts for compatibility

**Promo Code System** (October 2025):
- Full CRUD interface in admin panel (5th tab)
- Support for percentage and fixed amount discounts
- Optional features: min order amount, usage limits, start/end dates, active/inactive toggle
- Real-time validation during checkout with discount calculation
- Automatic usage tracking (currentUses incremented on order creation)
- Orders store promo code info: code, discount amount, original subtotal
- Service layer: `client/src/services/yandex-promocodes.ts`
- Types: `client/src/types/firebase-types.ts` (PromoCode interface)

**Common Issues**:
- "Missing or insufficient permissions" error: Verify admin email case matches exactly (lowercase)
- Firebase Auth always lowercases emails in tokens, ensure rules match
- Promo code rules update needed: See FIREBASE_RULES_UPDATE.md for instructions

**Email Notification System** (October 2025):
- Automated email notifications via EmailJS (client-side email service)
- Order confirmations sent to customers after checkout
- Stock availability notifications when out-of-stock items return
- Service layer: `client/src/services/emailjs.ts`, `client/src/services/yandex-stock-notifications.ts`
- Free tier: 200 emails/month (sufficient for ~200 orders or mixed usage)
- **Current Status**: Code integrated, EmailJS account created, awaiting template/key configuration
- Setup instructions: See `EMAILJS_SETUP.md` for full guide, `EMAILJS_CHECKLIST.md` for quick steps
- Templates: Order confirmation + stock notification (need to be configured in EmailJS dashboard)
- Environment variables needed: VITE_EMAILJS_PUBLIC_KEY, VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_ORDER_TEMPLATE_ID, VITE_EMAILJS_STOCK_TEMPLATE_ID
- Types: `client/src/types/firebase-types.ts` (StockNotification interface)

**Legal Compliance** (October 2025):
- Privacy Policy page (`/privacy`) - Политика конфиденциальности (152-ФЗ compliance)
- Terms of Service page (`/terms`) - Договор публичной оферты
- Compromise UX: Full pages accessible via direct links + modal dialogs from footer
- Modal component: `LegalDialog.tsx` for quick preview with "Open full version" button
- Footer updated with legal document links and business requisites placeholder
- Content in Russian, compliant with Russian consumer protection laws
- Business requisites section (placeholder for ИП/ООО details after registration)

### Deployment Architecture

**Static Hosting**: GitHub Pages (https://misha4323223.github.io/ProductShowcase)
- Automatic deployment via GitHub Actions on push to main branch
- Build process: `npm run build` → deploys to `dist/` directory
- Environment variables configured as GitHub Secrets

**Backend Services**: 
- **Yandex Cloud YDB**: Main database for products, orders, reviews, promo codes, stock notifications, wishlists, carts, push subscriptions
  - Document API mode (DynamoDB-compatible)
  - Serverless deployment in ru-central1 region
  - Service files: `client/src/services/yandex-*.ts`
- **Yandex Object Storage**: Image storage for product photos
  - S3-compatible API
  - Public read access for product images
- **Firebase Authentication**: Email/password auth with admin controls
  - Admin email: pimashin2015@gmail.com
  - Authentication state management via Firebase Auth SDK

**Email Service**: EmailJS
- Client-side email service integrated with user's Gmail account
- Sends order confirmations and stock availability notifications
- Free tier: 200 emails/month
- No server-side code required - works directly from GitHub Pages
- Configuration: See EMAILJS_SETUP.md for setup instructions

**Push Notifications**: OneSignal (October 2025)
- Web push notifications for browser alerts
- App ID: db150a33-35e8-4669-94eb-27f4be9b07b2
- REST API Key: Stored in ONESIGNAL_REST_API_KEY secret
- **Frontend Integration**:
  - Subscribe button in HeroSlider component
  - Service worker: client/public/OneSignalSDKWorker.js
  - Initialization in client/index.html with SDK v16
- **Backend Integration**:
  - API endpoint: POST /api/send-push-notification
  - Admin-only access (Firebase Auth + isAdmin check)
  - Sends notifications to all OneSignal subscribers
  - Located in server/routes.ts
- **Admin Panel**:
  - Push notification form in AdminPage (Notifications tab)
  - Fields: title, message, URL (optional)
  - PushNotificationForm component with zod validation
- **Current Status**: Fully integrated and functional
- **CRITICAL**: Site URL in OneSignal must be https://sweetdelights.store (not GitHub Pages URL)
- Setup instructions: See ONESIGNAL_SETUP.md for configuration
- Troubleshooting: See ONESIGNAL_TROUBLESHOOTING.md for diagnostics
- **Note**: OneSignal push notifications DO NOT collect emails - they subscribe browser to receive notifications

### Notes
- Image assets stored in `attached_assets/generated_images/`
- Application designed for Russian language market (content in Russian)
- Firebase project ID: sweetweb-3543f
- GitHub repository: misha4323223/ProductShowcase
- Deployment instructions: See `DEPLOY_INSTRUCTIONS.md`
=======
### Notes
- Product data currently mocked in `client/src/lib/products.ts`
- Image assets stored in `attached_assets/generated_images/`
- Database connection requires `DATABASE_URL` environment variable
- Application designed for Russian language market (content in Russian)
>>>>>>> 370eca2 (Initial commit)

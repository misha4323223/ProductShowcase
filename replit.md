# Sweet Delights E-commerce Platform

## Overview

Sweet Delights is an e-commerce platform specializing in sweets (chocolates, candies, cookies) and accessories. The application features a visually appealing interface with a warm, playful aesthetic inspired by confectionery design. Built as a static React TypeScript application deployed on GitHub Pages with Yandex Cloud backend services, it provides a modern shopping experience with product browsing, cart management, automated email notifications, and responsive design.

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
- **iOS Safari Compatibility**: Touch event handlers for mobile menu, disabled mouse-move parallax on touch devices, WebKit-specific CSS fixes for tap highlights and sticky positioning

**Key Components**:
- `Header`: Sticky navigation with cart, search, and mobile menu (with iOS touch event support)
- `HeroSlider`: Auto-rotating image carousel for promotions with email subscription dialog
- `ProductCard`: Animated product display with add-to-cart (parallax disabled on touch devices)
- `ShoppingCart`: Side-panel cart with quantity management
- `CategoryCard`: Visual category navigation
- `BenefitsBar`: Feature highlights (shipping, returns, etc.)
- `Footer`: Contact info, newsletter signup (email-based), social links, legal document links (modal + full pages)
- `LegalDialog`: Modal component for quick preview of legal documents (Privacy/Terms)

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

### Database Migration Status (November 2025)

**✅ Migrated to Yandex Cloud YDB:**
- Products and categories (yandex-products.ts)
- Shopping cart (yandex-cart.ts)
- Wishlist/favorites (yandex-wishlist.ts)
- Orders (yandex-orders.ts)
- Reviews (yandex-reviews.ts)
- Promo codes (yandex-promocodes.ts)
- Stock notifications (yandex-stock-notifications.ts)
- Newsletter subscriptions (yandex-newsletter.ts)

**⚠️ Still using Firebase:**
- Authentication (Firebase Auth with email/password)
- Admin email: pimashin2015@gmail.com (lowercase enforced by AuthContext)
- Email normalization: All emails converted to lowercase on sign-in/sign-up

**Legacy Firebase Services:**
- Old service files (firebase-*.ts) kept for reference but no longer used
- Types still in firebase-types.ts for compatibility

**Promo Code System**:
- Full CRUD interface in admin panel
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

**Email Notification System** (November 2025):
- **PRIMARY NOTIFICATION METHOD**: All user notifications via Yandex Cloud Postbox (AWS SES-compatible email service)
- Order confirmations sent to customers after checkout
- Stock availability notifications when out-of-stock items return
- Newsletter subscriptions for updates and promotions
- Welcome emails sent automatically upon newsletter subscription
- Admin panel includes bulk email functionality for newsletter campaigns
- Service layer: `client/src/services/postbox-client.ts`, `client/src/services/yandex-newsletter.ts`
- Cloud Functions: 
  - `send-email` (index.js) - serves as proxy to Postbox API
  - `subscribe-newsletter` (d4eib9soupsav59r8ctj) - handles newsletter subscriptions with YDB integration
- Architecture: Browser → API Gateway → Cloud Function → YDB + Postbox
- Newsletter subscription flow: Users subscribe via Footer/HeroSlider → API Gateway `/subscribe-newsletter` → Cloud Function saves to YDB + sends welcome email
- Templates: Order confirmation, stock notification, newsletter, and welcome email (all HTML-based)
- Environment variable needed: VITE_API_GATEWAY_URL (points to API Gateway base URL)
- Types: `client/src/types/firebase-types.ts` (StockNotification, NewsletterSubscription interfaces)
- Security: Database credentials NOT exposed to browser - all DB operations via Cloud Functions
- **Note**: OneSignal push notifications have been completely removed - all notifications now use email-based system

**Legal Compliance**:
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
- **Yandex Cloud YDB**: Main database for products, orders, reviews, promo codes, stock notifications, wishlists, carts, newsletter subscriptions
  - Document API mode (DynamoDB-compatible)
  - Serverless deployment in ru-central1 region
  - Service files: `client/src/services/yandex-*.ts`
- **Yandex Object Storage**: Image storage for product photos
  - S3-compatible API
  - Public read access for product images
- **Firebase Authentication**: Email/password auth with admin controls
  - Admin email: pimashin2015@gmail.com
  - Authentication state management via Firebase Auth SDK

**Email Service**: Yandex Cloud Postbox
- AWS SES-compatible email service via Yandex Cloud
- Sends order confirmations, stock notifications, and newsletters
- Architecture: Static site → API Gateway → Cloud Function → Postbox API
- Cloud Function serves as secure proxy (credentials not exposed to client)
- Newsletter system with YDB storage for subscriber management
- Admin panel integration for bulk email sending and subscriber management
- Configuration: See YANDEX_POSTBOX_SETUP.md for setup instructions

### Notes
- Image assets stored in `attached_assets/generated_images/`
- Application designed for Russian language market (content in Russian)
- Firebase project ID: sweetweb-3543f
- GitHub repository: misha4323223/ProductShowcase
- Deployment instructions: See `DEPLOY_INSTRUCTIONS.md`

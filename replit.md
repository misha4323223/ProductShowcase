# Sweet Delights E-commerce Platform

## Overview
Sweet Delights is an e-commerce platform specializing in sweets (chocolates, candies, cookies) and accessories. It offers a modern, visually appealing shopping experience with features like product browsing, cart management, and automated email notifications. The platform is built as a static React TypeScript application deployed on GitHub Pages, utilizing Yandex Cloud for backend services. The project aims to provide a delightful and efficient online shopping experience, targeting the Russian market with localized content and legal compliance.

## User Preferences
Preferred communication style: Simple, everyday language.

## Latest Updates (November 23, 2025)

✅ **iOS Safari Background Fix - Nov 23, 2025 (FINAL SOLUTION)**:
- **Problem**: Background images "stuck at top" on iOS Safari, not scrolling with content. Android worked fine.
- **Root Cause**: 
  - iOS detection failed (showed "Android/Mobile" in logs even on iPhone)
  - Safari on iOS doesn't handle `background-attachment: fixed` properly on `<html>` element
  - Applying `cover` to flex containers (#root) caused zooming/scaling issues on iOS
- **Solution Implemented** (Platform-Specific Approach):
  - **iOS (iPhone/iPad)**:
    - Robust 4-method detection: `navigator.userAgentData`, userAgent regex, MacIntel+touch, ontouchstart fallback
    - Background applied via `#root::before` pseudo-element with:
      - `position: fixed` - stays in viewport
      - `background-size: cover` - fills screen completely
      - `background-attachment: scroll` - scrolls with content
      - `z-index: -1` - behind all content
    - CSS custom property `--ios-bg-image` set dynamically
    - Class `ios-background` added to #root element
  - **Android/Desktop**:
    - Background applied to `<html>` element with:
      - `background-size: cover`
      - `background-attachment: fixed` - parallax effect
      - `background-position: center center`
    - Works perfectly as before, no changes needed
- **Result**: Background images now work flawlessly on BOTH iOS and Android with separate optimized code paths
- **Files Modified**:
  - `client/src/index.css`: Added `#root.ios-background::before` CSS rules
  - `client/src/contexts/ThemeContext.tsx`: Enhanced iOS detection + platform-specific background application logic
- **Technical Notes**:
  - Mobile breakpoint: 1024px (matches CSS media queries)
  - iOS Safari requires different rendering strategy than Android Chrome
  - Never use `background-attachment: fixed` on iOS - it causes rendering bugs
  - ::before pseudo-element with fixed positioning is the most reliable solution for iOS

✅ **Mobile Background Support Added - Nov 23, 2025**:
- **Feature**: Separate mobile and desktop background images for each theme
- **Implementation**:
  - Added `mobileImage` and `mobileWebpImage` fields to BackgroundSetting interface
  - Admin panel now allows uploading separate mobile backgrounds (portrait 9:16 recommended)
  - ThemeContext automatically selects mobile (≤1024px) or desktop backgrounds
  - Storage: Desktop backgrounds in `backgrounds/[theme-name]`, mobile in `backgrounds/[theme-name]/mobile`
  - Fallback: Desktop version used if mobile not uploaded
- **Files Modified**:
  - `shared/schema.ts`: Updated BackgroundSetting interface
  - `client/src/pages/AdminPage.tsx`: Added mobile background upload UI with validation
  - `client/src/contexts/ThemeContext.tsx`: Device detection and background selection logic
  - `client/src/services/site-settings-client.ts`: Enhanced logging for debugging

✅ **Theme Flicker Issue Fixed - Nov 22, 2025 (Final)**:
- **Root Cause**: Theme + background being applied repeatedly every 3 seconds (polling re-applied same values)
- **Solution Implemented**:
  - **Pre-loading in index.html**: Theme + background fetch and CSS application BEFORE React mounts (eliminates flicker)
  - **ThemeContext optimization**: Initializes with pre-loaded theme (no refetch on mount), polling starts AFTER init
  - **Removed background polling**: Backgrounds load once on mount, apply only when theme changes (not every 3 sec)
  - **Smart state updates**: Only setState if value actually changed (prevents unnecessary re-renders)
- **Result**: Theme + background visible instantly with ZERO flicker on page load and navigation
- **Files Modified**:
  - `client/index.html`: Added async pre-load script that fetches current_theme + background_settings before React mounts
  - `client/src/main.tsx`: Added Promise.race to wait for pre-load completion before React render
  - `client/src/contexts/ThemeContext.tsx`: Removed polling on initial load, sync starts after ThemeProvider mount, background load only once

✅ **Theme System Redesigned - Nov 22, 2025**:
- **Preferred Theme System**: Users now have a "preferred seasonal theme" that persists in YDB
- **Theme Toggle Logic**: Changed from cycling (light→dark→sakura) to simple binary toggle (preferred ↔ dark)
- **Admin Panel**: Added UI section to select default preferred theme (4 buttons: Sakura, New Year, Spring, Autumn)
- **Real-time Sync**: Theme synced every 3 seconds via polling (only updates if changed)
- **API Functions**: 
  - `getPreferredTheme()`: Fetches user's preferred theme (defaults to 'sakura')
  - `setPreferredTheme(theme)`: Saves preferred theme to YDB and applies it immediately
- **Files Modified**: 
  - `client/src/contexts/ThemeContext.tsx`: Added preferredTheme state and optimized polling
  - `client/src/components/ThemeToggle.tsx`: Simplified to binary toggle with emoji indicators
  - `client/src/pages/AdminPage.tsx`: Added theme selector UI (🎨 section)
  - `client/src/services/site-settings-client.ts`: Added new API functions

## System Architecture

### Frontend
- **Type**: Static React 18 + TypeScript application (no local server needed).
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
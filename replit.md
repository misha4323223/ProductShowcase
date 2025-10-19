# Sweet Delights E-commerce Platform

## Overview

Sweet Delights is an e-commerce platform specializing in sweets (chocolates, candies, cookies) and accessories. The application features a visually appealing interface with a warm, playful aesthetic inspired by confectionery design. Built as a full-stack TypeScript application using React and Express, it provides a modern shopping experience with product browsing, cart management, and responsive design.

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

**Key Components**:
- `Header`: Sticky navigation with cart, search, and mobile menu
- `HeroSlider`: Auto-rotating image carousel for promotions
- `ProductCard`: Animated product display with add-to-cart
- `ShoppingCart`: Side-panel cart with quantity management
- `CategoryCard`: Visual category navigation
- `BenefitsBar`: Feature highlights (shipping, returns, etc.)
- `Footer`: Contact info, newsletter signup, social links

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

### Notes
- Product data currently mocked in `client/src/lib/products.ts`
- Image assets stored in `attached_assets/generated_images/`
- Database connection requires `DATABASE_URL` environment variable
- Application designed for Russian language market (content in Russian)
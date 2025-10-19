# Design Guidelines: Sweet Treats & Accessories E-commerce

## Design Approach

**Selected Approach:** Reference-Based (E-commerce Leaders)
- Primary Inspiration: 34play.me structure + Shopify's product presentation + Etsy's warm aesthetic
- **Rationale:** E-commerce for sweets and accessories requires visual appeal, emotional engagement, and trust-building through polished presentation
- **Key Principles:** Appetizing visuals, clean organization, delightful micro-interactions, trustworthy presentation

## Color Palette

### Light Mode
- **Primary Background:** 0 0% 99% (warm white)
- **Secondary Background:** 30 40% 97% (cream)
- **Card Backgrounds:** 0 0% 100% (pure white)
- **Primary Brand:** 340 75% 55% (raspberry pink - for sweets)
- **Secondary Brand:** 25 85% 65% (warm caramel - for accessories)
- **Accent:** 150 40% 50% (mint green - for CTAs)
- **Text Primary:** 0 0% 15%
- **Text Secondary:** 0 0% 45%
- **Borders:** 30 15% 90%

### Dark Mode
- **Primary Background:** 0 0% 8%
- **Secondary Background:** 340 10% 12%
- **Card Backgrounds:** 0 0% 11%
- **Primary Brand:** 340 70% 60%
- **Secondary Brand:** 25 75% 60%
- **Accent:** 150 35% 55%
- **Text Primary:** 0 0% 95%
- **Text Secondary:** 0 0% 65%
- **Borders:** 0 0% 20%

## Typography

**Font System:** Google Fonts via CDN
- **Headings:** 'Playfair Display' - elegant serif for sophistication (sweets deserve elegance)
  - H1: 3.5rem (56px), font-weight: 700
  - H2: 2.5rem (40px), font-weight: 600
  - H3: 1.75rem (28px), font-weight: 600
  - H4: 1.25rem (20px), font-weight: 600

- **Body & UI:** 'Inter' - clean sans-serif for readability
  - Body: 1rem (16px), font-weight: 400
  - Small: 0.875rem (14px)
  - Buttons: 1rem, font-weight: 500, letter-spacing: 0.5px
  - Product Prices: 1.25rem, font-weight: 600

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 8, 12, 16, 20
- Tight spacing: p-2, gap-2 (within small components)
- Standard spacing: p-4, gap-4 (cards, buttons)
- Section spacing: py-12 to py-20 (vertical rhythm)
- Container padding: px-4 md:px-8
- Max container width: max-w-7xl

**Grid System:**
- Product Grid: grid-cols-2 md:grid-cols-3 lg:grid-cols-4
- Category Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Mobile-first approach with responsive breakpoints

## Component Library

### Hero Slider Section
- Full-width carousel with 3-5 promotional slides
- Height: 70vh on desktop, 50vh on mobile
- Auto-play with 5s intervals, pause on hover
- Navigation: Dots at bottom, arrow buttons on sides
- Overlay gradient for text readability: from bottom (rgba(0,0,0,0.3))
- Each slide: Large headline (H1), subheading, CTA button

### Benefits Bar
- 4-column grid on desktop, 2-column on tablet, 1-column on mobile
- Icons from Heroicons (truck, shield-check, credit-card, arrow-path)
- Icon size: w-8 h-8, colored with accent color
- Text: Bold title (14px) + light description (12px)
- Background: Secondary background color
- Padding: py-8

### Category Cards
- 3-column grid layout (stacked on mobile)
- Each card: Image (aspect-ratio: 4/3), overlay with category name
- Hover effect: scale(1.05), shadow increase
- Image brightness reduction on hover (brightness-75)
- Category name: H3, positioned bottom-left with padding
- Rounded corners: rounded-xl

### Product Cards
- 4-column grid (responsive)
- Structure: Product image (square 1:1), name, price, "Add to Cart" button
- Image: Rounded-lg, shadow-sm, hover: shadow-md
- Price: Primary brand color, bold
- Sale badge: Absolute position top-right, accent background
- Button: Full width, rounded-lg, primary brand color

### Shopping Cart (Slide-over)
- Fixed right sidebar, w-96, full height
- Dark overlay backdrop (backdrop-blur-sm)
- Cart items: Image thumbnail (w-20), name, quantity controls, price
- Sticky footer: Total + Checkout button
- Empty state: Centered icon + text

### Header Navigation
- Sticky top, backdrop-blur-md, border-b
- Logo left, navigation center, cart/search icons right
- Navigation links: Hover underline animation
- Mobile: Hamburger menu, slide-in drawer

### Footer
- 3-column layout: About/Links, Contact, Social Media
- Background: Secondary background
- Newsletter signup form included
- Copyright and payment icons at bottom
- Padding: py-12

## Images

**Hero Slider Images:**
- 3-5 high-quality lifestyle images showcasing sweets arrangements and accessories
- Examples: Colorful macarons display, chocolate gift boxes, styled accessories on pastel backgrounds
- Dimensions: 1920x1080 minimum
- Each with promotional text overlay space

**Category Images:**
- Candies & Chocolates: Colorful assortment
- Cookies & Pastries: Rustic bakery setting
- Gift Boxes: Elegant packaging
- Accessories: Lifestyle shots (bags, jewelry, etc.)
- Seasonal/Sale: Themed promotional imagery

**Product Images:**
- Square format (800x800px minimum)
- Clean white or soft colored backgrounds
- Multiple angles where applicable
- Consistent lighting and style

## Animations

Use sparingly for polish:
- Card hover: Subtle lift (translateY(-4px))
- Button hover: Slight scale (scale(1.02))
- Cart slide-in: Smooth transition (300ms ease)
- Product image fade-in on scroll (if needed)
- NO complex scroll-triggered animations

## Accessibility

- Maintain WCAG AA contrast ratios
- Focus states: 2px ring with accent color
- Skip to main content link
- Alt text for all images
- Keyboard navigation for cart and menus
- Dark mode toggle in header
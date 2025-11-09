// Firebase Firestore types
export interface Product {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  category: string;
  image: string;
  description: string;
  featured?: boolean;
  popularity?: number;
  stock?: number;
  createdAt?: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
}

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  userEmail?: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  total: number;
  subtotal?: number;
  discount?: number;
  promoCode?: {
    code: string;
    discountAmount: number;
    discountType: 'percentage' | 'fixed';
  };
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  createdAt: Date;
  hiddenByUser?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  phone?: string;
  addresses?: string[];
  createdAt: Date;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface WishlistItem {
  productId: string;
  addedAt: Date;
}

export interface PromoCode {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxUses?: number;
  startDate?: Date;
  endDate?: Date;
  active: boolean;
  createdAt: Date;
}

export interface StockNotification {
  id: string;
  productId: string;
  productName: string;
  email: string;
  createdAt: Date;
  notified?: boolean;
}

export interface NewsletterSubscription {
  id: string;
  email: string;
  createdAt: Date;
  active: boolean;
}

// ========== WHEEL (РУЛЕТКА) TYPES ==========

export type PrizeType = 
  | 'discount_10'      // Скидка 10% на выбор
  | 'discount_20'      // Случайный товар -20%
  | 'points'           // +200 баллов
  | 'delivery'         // Бесплатная доставка
  | 'free_item'        // Самый дешевый бесплатно
  | 'jackpot';         // Весь вишлист -40%

export interface WheelPrize {
  id: string;
  userId: string;
  prizeType: PrizeType;
  productId?: string;        // для discount_20 и free_item
  productName?: string;       // название товара для отображения
  productImage?: string;      // фото товара
  promoCode: string;          // уникальный промокод
  discountValue?: number;     // для скидок (10, 20, 40)
  pointsAmount?: number;      // для баллов (200)
  expiresAt: Date;           // срок действия приза
  used: boolean;              // использован ли приз
  usedAt?: Date;             // когда использован
  createdAt: Date;           // когда получен
}

export interface WheelHistory {
  id: string;
  userId: string;
  prizeType: PrizeType;
  prizeValue: string;         // "Скидка 10%", "+200 баллов" и т.д.
  prizeDetails?: {
    productName?: string;
    discountAmount?: number;
    savedAmount?: number;
  };
  createdAt: Date;
}

export interface WheelStats {
  totalSpinsEarned: number;   // всего заработано спинов
  totalWheelSpins: number;    // всего прокручено
  bestPrize?: string;         // лучший выигрыш
  totalSaved: number;         // общая экономия в рублях
}

// Расширяем UserProfile для рулетки
export interface UserProfileWithWheel extends UserProfile {
  spins?: number;              // текущие доступные спины
  totalSpinsEarned?: number;   // всего заработано
  totalWheelSpins?: number;    // всего прокручено
  loyaltyPoints?: number;      // бонусные баллы
}

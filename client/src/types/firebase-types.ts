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

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
  createdAt?: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
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
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  createdAt: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  phone?: string;
  addresses?: string[];
  createdAt: Date;
}

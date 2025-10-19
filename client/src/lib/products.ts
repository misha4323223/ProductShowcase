<<<<<<< HEAD
=======
// Todo: remove mock functionality - this is temporary data for the prototype
>>>>>>> 370eca2 (Initial commit)
export interface Product {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  category: string;
  image: string;
  description: string;
}

<<<<<<< HEAD
export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface ProductData {
  categories: Category[];
  products: Product[];
}

export async function loadProducts(): Promise<ProductData> {
  try {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const response = await fetch(`${baseUrl}data/products.json`);
    if (!response.ok) {
      throw new Error('Failed to load products');
    }
    const data: ProductData = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading products:', error);
    return {
      categories: [],
      products: []
    };
  }
}
=======
export const categories = [
  { id: 'chocolates', name: 'Шоколад', slug: 'chocolates' },
  { id: 'candies', name: 'Конфеты', slug: 'candies' },
  { id: 'cookies', name: 'Печенье', slug: 'cookies' },
  { id: 'accessories', name: 'Аксессуары', slug: 'accessories' },
  { id: 'sale', name: 'SALE', slug: 'sale' },
];

// Todo: remove mock functionality - products will come from JSON file
export const products: Product[] = [
  {
    id: '1',
    name: 'Бельгийский шоколад ассорти',
    price: 1200,
    category: 'chocolates',
    image: '',
    description: 'Изысканный бельгийский шоколад ручной работы. Ассорти из темного, молочного и белого шоколада.',
  },
  {
    id: '2',
    name: 'Французские макаронс',
    price: 850,
    salePrice: 650,
    category: 'cookies',
    image: '',
    description: 'Нежные французские миндальные пирожные с различными вкусами.',
  },
  {
    id: '3',
    name: 'Жевательные мармеладки',
    price: 450,
    category: 'candies',
    image: '',
    description: 'Яркие фруктовые мармеладки без искусственных красителей.',
  },
  {
    id: '4',
    name: 'Стильная сумка-кроссбоди',
    price: 2500,
    salePrice: 1999,
    category: 'accessories',
    image: '',
    description: 'Элегантная пастельно-розовая сумка из эко-кожи.',
  },
  {
    id: '5',
    name: 'Трюфели премиум',
    price: 1500,
    category: 'chocolates',
    image: '',
    description: 'Роскошные шоколадные трюфели с начинками.',
  },
  {
    id: '6',
    name: 'Печенье с шоколадной крошкой',
    price: 380,
    category: 'cookies',
    image: '',
    description: 'Домашнее печенье с щедрым количеством шоколада.',
  },
  {
    id: '7',
    name: 'Леденцы ручной работы',
    price: 320,
    salePrice: 250,
    category: 'candies',
    image: '',
    description: 'Красочные леденцы с натуральными вкусами.',
  },
  {
    id: '8',
    name: 'Набор украшений',
    price: 1800,
    category: 'accessories',
    image: '',
    description: 'Комплект: серьги и браслет в нежных тонах.',
  },
];
>>>>>>> 370eca2 (Initial commit)

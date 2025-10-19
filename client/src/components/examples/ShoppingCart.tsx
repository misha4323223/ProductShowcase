import ShoppingCart from '../ShoppingCart';
import { useState } from 'react';

export default function ShoppingCartExample() {
  const [items, setItems] = useState([
    { id: '1', name: 'Бельгийский шоколад ассорти', price: 1200, quantity: 2, image: '' },
    { id: '2', name: 'Французские макаронс', price: 850, quantity: 1, image: '' },
  ]);

  return (
    <ShoppingCart
      isOpen={true}
      onClose={() => console.log('Close cart')}
      items={items}
      onUpdateQuantity={(id, quantity) => {
        setItems(items.map(item => item.id === id ? { ...item, quantity } : item));
        console.log('Update quantity:', id, quantity);
      }}
      onRemoveItem={(id) => {
        setItems(items.filter(item => item.id !== id));
        console.log('Remove item:', id);
      }}
      onCheckout={() => console.log('Checkout')}
    />
  );
}

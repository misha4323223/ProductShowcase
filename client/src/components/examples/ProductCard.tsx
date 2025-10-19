import ProductCard from '../ProductCard';

export default function ProductCardExample() {
  return (
    <div className="w-full max-w-sm">
      <ProductCard 
        id="1"
        name="Бельгийский шоколад ассорти"
        price={1200}
        salePrice={999}
        image=""
        onAddToCart={(id) => console.log('Add to cart:', id)}
        onClick={(id) => console.log('Product clicked:', id)}
      />
    </div>
  );
}

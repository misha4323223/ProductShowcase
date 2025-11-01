import CategoryCard from '../CategoryCard';
import chocolateImage from '@assets/generated_images/Artisanal_chocolate_category_image_35f087de.png';

export default function CategoryCardExample() {
  return (
    <div className="w-full max-w-sm">
      <CategoryCard 
        name="Шоколад" 
        image={chocolateImage}
        onClick={() => console.log('Category clicked')}
      />
    </div>
  );
}

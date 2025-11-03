import HeroSlider from '../HeroSlider';
import heroImage1 from '@assets/generated_images/Colorful_macarons_hero_image_11795c3a.png';
import heroImage1WebP from '@assets/generated_images/Colorful_macarons_hero_image_11795c3a.webp';
import heroImage2 from '@assets/generated_images/Chocolate_gift_box_image_b558d06a.png';
import heroImage2WebP from '@assets/generated_images/Chocolate_gift_box_image_b558d06a.webp';
import heroImage3 from '@assets/generated_images/Candy_store_display_image_21d1d54f.png';
import heroImage3WebP from '@assets/generated_images/Candy_store_display_image_21d1d54f.webp';

export default function HeroSliderExample() {
  const slides = [
    {
      id: 1,
      image: heroImage1,
      webpImage: heroImage1WebP,
      title: 'Французские Макаронс',
      subtitle: 'Изысканные пирожные ручной работы',
    },
    {
      id: 2,
      image: heroImage2,
      webpImage: heroImage2WebP,
      title: 'Премиум Шоколад',
      subtitle: 'Бельгийское качество в каждом кусочке',
    },
    {
      id: 3,
      image: heroImage3,
      webpImage: heroImage3WebP,
      title: 'Яркие Сладости',
      subtitle: 'Радуга вкусов для всей семьи',
    },
  ];

  return <HeroSlider slides={slides} />;
}

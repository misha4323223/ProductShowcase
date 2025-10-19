import HeroSlider from '../HeroSlider';
import heroImage1 from '@assets/generated_images/Colorful_macarons_hero_image_11795c3a.png';
import heroImage2 from '@assets/generated_images/Chocolate_gift_box_image_b558d06a.png';
import heroImage3 from '@assets/generated_images/Candy_store_display_image_21d1d54f.png';

export default function HeroSliderExample() {
  const slides = [
    {
      id: 1,
      image: heroImage1,
      title: 'Французские Макаронс',
      subtitle: 'Изысканные пирожные ручной работы',
      buttonText: 'Заказать сейчас',
    },
    {
      id: 2,
      image: heroImage2,
      title: 'Премиум Шоколад',
      subtitle: 'Бельгийское качество в каждом кусочке',
      buttonText: 'Смотреть каталог',
    },
    {
      id: 3,
      image: heroImage3,
      title: 'Яркие Сладости',
      subtitle: 'Радуга вкусов для всей семьи',
      buttonText: 'Выбрать подарок',
    },
  ];

  return <HeroSlider slides={slides} />;
}

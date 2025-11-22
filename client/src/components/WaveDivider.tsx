import { useTheme } from "@/contexts/ThemeContext";

export function WaveDivider() {
  const { theme } = useTheme();

  // Определяю цвет волны для каждой темы - красиво гармонирует с темой
  const getWaveColor = () => {
    switch (theme) {
      case 'new-year':
        return '#C41E3A'; // Насыщенный новогодний красный
      case 'spring':
        return '#90EE90'; // Светло-зелёный для весны
      case 'autumn':
        return '#CD853F'; // Коричнево-оранжевый для осени
      case 'sakura':
      default:
        return '#FFB6D9'; // Розовый для сакуры
    }
  };

  const waveColor = getWaveColor();

  return (
    <div className="w-full overflow-hidden -mt-0.5">
      <svg
        viewBox="0 0 1200 80"
        preserveAspectRatio="none"
        className="w-full h-auto"
        style={{ display: 'block', minHeight: '80px' }}
      >
        {/* Одна красивая волна - сверху ровно, снизу волнистая */}
        <path
          d="M 0,0 L 1200,0 L 1200,35 Q 1050,55 900,40 T 600,40 T 300,40 T 0,35 L 0,0 Z"
          fill={waveColor}
        />
      </svg>
    </div>
  );
}

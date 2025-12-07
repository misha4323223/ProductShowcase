import { useTheme } from "@/contexts/ThemeContext";

export function WaveDivider() {
  const { theme } = useTheme();

  // Определяю цвет волны для каждой темы - красиво гармонирует с темой
  const getWaveGradient = () => {
    switch (theme) {
      case 'dark':
        return { id: 'darkWaveGradient', stops: [{ offset: '0%', color: '#ec4899' }, { offset: '100%', color: '#a855f7' }] }; // Розовый -> Фиолетовый для тёмной темы
      case 'new-year':
        return { id: 'newyearWaveGradient', stops: [{ offset: '0%', color: '#C41E3A' }] };
      case 'spring':
        return { id: 'springWaveGradient', stops: [{ offset: '0%', color: '#90EE90' }] };
      case 'autumn':
        return { id: 'autumnWaveGradient', stops: [{ offset: '0%', color: '#CD853F' }] };
      case 'light':
        return { id: 'lightWaveGradient', stops: [{ offset: '0%', color: '#f3f4f6' }] };
      case 'sakura':
      default:
        return { id: 'sakuraWaveGradient', stops: [{ offset: '0%', color: '#FFB6D9' }] };
    }
  };

  const gradientConfig = getWaveGradient();

  return (
    <div className="w-full overflow-hidden -mt-0.5">
      <svg
        viewBox="0 0 1200 80"
        preserveAspectRatio="none"
        className="w-full h-auto"
        style={{ display: 'block', minHeight: '80px' }}
      >
        <defs>
          <linearGradient id={gradientConfig.id} x1="0%" y1="0%" x2="100%" y2="0%">
            {gradientConfig.stops.map((stop, index) => (
              <stop key={index} offset={stop.offset} stopColor={stop.color} />
            ))}
          </linearGradient>
          {theme === 'new-year' && (
            <filter id="blurFilter">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
            </filter>
          )}
        </defs>
        {/* Одна красивая волна - сверху ровно, снизу волнистая */}
        <path
          d="M 0,0 L 1200,0 L 1200,35 Q 1050,55 900,40 T 600,40 T 300,40 T 0,35 L 0,0 Z"
          fill={`url(#${gradientConfig.id})`}
          opacity={theme === 'new-year' ? '0.7' : '1'}
          filter={theme === 'new-year' ? 'url(#blurFilter)' : undefined}
        />
      </svg>
    </div>
  );
}

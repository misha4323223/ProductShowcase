import { useTheme } from "@/contexts/ThemeContext";

export function WaveDivider() {
  const { theme } = useTheme();

  // Определяю цвета волны для каждой темы
  const getWaveColor = () => {
    switch (theme) {
      case 'new-year':
        return 'hsl(var(--background))'; // Красный-золотой фон -> тёмная волна
      case 'spring':
        return 'hsl(var(--background))'; // Зелёный фон -> волна адаптируется
      case 'autumn':
        return 'hsl(var(--background))'; // Оранжево-коричневый -> волна адаптируется
      case 'sakura':
      default:
        return 'hsl(var(--background))'; // Розовый фон -> волна адаптируется
    }
  };

  return (
    <div className="w-full h-12 sm:h-16 md:h-20 overflow-hidden relative -mb-1">
      <svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className="w-full h-full"
        style={{ display: 'block' }}
      >
        {/* Волнистое дно для плавного перехода */}
        <path
          d="M0,40 Q300,0 600,40 T1200,40 L1200,120 L0,120 Z"
          fill={getWaveColor()}
          opacity="1"
        />
        {/* Вторая волна для глубины */}
        <path
          d="M0,50 Q300,20 600,50 T1200,50 L1200,120 L0,120 Z"
          fill={getWaveColor()}
          opacity="0.7"
          style={{
            animation: 'wave-shift 8s ease-in-out infinite',
          }}
        />
      </svg>

      <style>{`
        @keyframes wave-shift {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(20px);
          }
        }
      `}</style>
    </div>
  );
}

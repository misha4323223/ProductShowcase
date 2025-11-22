import { useTheme } from "@/contexts/ThemeContext";

export function WaveDivider() {
  const { theme } = useTheme();

  // Определяю цвет фона для каждой темы
  const getBackgroundColor = () => {
    switch (theme) {
      case 'new-year':
        return 'hsl(var(--background))';
      case 'spring':
        return 'hsl(var(--background))';
      case 'autumn':
        return 'hsl(var(--background))';
      case 'sakura':
      default:
        return 'hsl(var(--background))';
    }
  };

  const bgColor = getBackgroundColor();

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
          fill={bgColor}
        />
      </svg>
    </div>
  );
}

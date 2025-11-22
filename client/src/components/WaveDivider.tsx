import { useTheme } from "@/contexts/ThemeContext";

export function WaveDivider() {
  const { theme } = useTheme();

  // Определяю цвета для каждой темы
  const getOverlayGradient = () => {
    switch (theme) {
      case 'new-year':
        return 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.05) 100%)';
      case 'spring':
        return 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.03) 100%)';
      case 'autumn':
        return 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.04) 100%)';
      case 'sakura':
      default:
        return 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.03) 100%)';
    }
  };

  return (
    <div 
      className="w-full h-3 pointer-events-none"
      style={{
        background: getOverlayGradient(),
        boxShadow: 'inset 0 -2px 8px rgba(0,0,0,0.08)',
      }}
    />
  );
}

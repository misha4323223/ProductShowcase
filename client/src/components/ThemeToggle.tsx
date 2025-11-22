import { Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, setTheme, preferredTheme } = useTheme();

  const themeEmoji: Record<string, string> = {
    'sakura': '🌸',
    'new-year': '🎄',
    'spring': '🌼',
    'autumn': '🍂',
    'dark': '🌙'
  };

  const isDarkMode = theme === 'dark';
  const displayEmoji = themeEmoji[isDarkMode ? 'dark' : preferredTheme];

  const handleToggle = async () => {
    if (isDarkMode) {
      // Switch back to preferred theme
      setTheme(preferredTheme);
    } else {
      // Switch to dark theme
      setTheme('dark');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-500 to-purple-600 hover:scale-110 transition-all shadow-lg hover:shadow-xl jelly-wobble"
        style={{
          boxShadow: '0 4px 0 rgba(147, 51, 234, 0.4), 0 6px 12px rgba(236, 72, 153, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)'
        }}
        data-testid="button-theme-toggle"
        title={`Текущая тема: ${isDarkMode ? 'Тёмная' : preferredTheme}`}
      >
        <span className="text-lg drop-shadow-lg">
          {displayEmoji}
        </span>
      </button>
    </div>
  );
}

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: 'light' as const, icon: Sun, emoji: '☀️', label: 'Светлая' },
    { id: 'dark' as const, icon: Moon, emoji: '🌙', label: 'Темная' },
    { id: 'sakura' as const, emoji: '🌸', label: 'Сакура' }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => {
          const currentIndex = themes.findIndex(t => t.id === theme);
          const nextIndex = (currentIndex + 1) % themes.length;
          setTheme(themes[nextIndex].id);
        }}
        className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-500 to-purple-600 hover:scale-110 transition-all shadow-lg hover:shadow-xl jelly-wobble"
        style={{
          boxShadow: '0 4px 0 rgba(147, 51, 234, 0.4), 0 6px 12px rgba(236, 72, 153, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)'
        }}
        data-testid="button-theme-toggle"
        title={`Текущая тема: ${themes.find(t => t.id === theme)?.label}`}
      >
        <span className="text-lg drop-shadow-lg">
          {theme === 'light' && '☀️'}
          {theme === 'dark' && '🌙'}
          {theme === 'sakura' && '🌸'}
        </span>
      </button>
    </div>
  );
}

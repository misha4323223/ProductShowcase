import { MessageCircle, X } from 'lucide-react';
import { useChatbot } from '@/contexts/ChatbotContext';
import { useTheme } from '@/contexts/ThemeContext';
import ChatbotWindow from './ChatbotWindow';

export default function ChatbotWidget() {
  const { isOpen, toggleChatbot } = useChatbot();
  const { theme } = useTheme();

  // Цвета для каждой темы
  const themeColors: Record<string, { gradient: string; shadow: string; hoverGradient?: string }> = {
    sakura: {
      gradient: 'from-pink-300 via-rose-400 to-red-500',
      shadow: 'shadow-rose-400/60',
      hoverGradient: 'from-pink-400 via-rose-500 to-red-600'
    },
    'new-year': {
      gradient: 'from-blue-300 via-cyan-400 to-blue-600',
      shadow: 'shadow-blue-400/60',
      hoverGradient: 'from-blue-400 via-cyan-500 to-blue-700'
    },
    spring: {
      gradient: 'from-green-300 via-emerald-400 to-green-600',
      shadow: 'shadow-green-400/60',
      hoverGradient: 'from-green-400 via-emerald-500 to-green-700'
    },
    autumn: {
      gradient: 'from-orange-300 via-amber-400 to-orange-600',
      shadow: 'shadow-orange-400/60',
      hoverGradient: 'from-orange-400 via-amber-500 to-orange-700'
    }
  };

  const colors = themeColors[theme] || themeColors['sakura'];

  return (
    <>
      {/* Плавающая кнопка в стиле Candy */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={toggleChatbot}
          className={`relative w-16 h-16 transition-all duration-300 flex items-center justify-center group ${
            isOpen
              ? 'scale-95'
              : 'hover:scale-110 hover:-translate-y-1'
          }`}
          data-testid="button-chatbot-toggle"
          aria-label={isOpen ? 'Закрыть чат' : 'Открыть чат'}
        >
          {/* Основная конфета */}
          <div
            style={{
              background: isOpen
                ? `linear-gradient(135deg, #dc2626, #be123c)`
                : `linear-gradient(135deg, var(--chatbot-${theme}-gradient-start, #ec4899), var(--chatbot-${theme}-gradient-mid, #f97316), var(--chatbot-${theme}-gradient-end, #ef4444))`,
              boxShadow: isOpen ? '0 20px 25px -5px rgba(220, 38, 38, 0.5)' : undefined,
            }}
            className={`absolute inset-0 rounded-[30px] shadow-2xl transition-all duration-300 ${
              !isOpen && colors.shadow
            }`}
          >
            {/* Применяем CSS переменные для градиентов через style */}
            <div
              style={{
                '--chatbot-sakura-gradient-start': '#fbbbca',
                '--chatbot-sakura-gradient-mid': '#f472b6',
                '--chatbot-sakura-gradient-end': '#ef4444',
                '--chatbot-new-year-gradient-start': '#bfdbfe',
                '--chatbot-new-year-gradient-mid': '#67e8f9',
                '--chatbot-new-year-gradient-end': '#1e40af',
                '--chatbot-spring-gradient-start': '#86efac',
                '--chatbot-spring-gradient-mid': '#6ee7b7',
                '--chatbot-spring-gradient-end': '#166534',
                '--chatbot-autumn-gradient-start': '#fed7aa',
                '--chatbot-autumn-gradient-mid': '#fbbf24',
                '--chatbot-autumn-gradient-end': '#d97706',
              } as React.CSSProperties}
            />
          </div>

          {/* Блик (для эффекта конфеты) */}
          {!isOpen && (
            <div className="absolute top-2 left-3 w-5 h-5 rounded-full bg-white/40 blur-sm group-hover:bg-white/60 transition-all" />
          )}

          {/* Иконка */}
          <div className="relative z-10 text-white flex items-center justify-center">
            {isOpen ? (
              <X className="w-7 h-7 drop-shadow-lg" />
            ) : (
              <MessageCircle className="w-7 h-7 drop-shadow-lg" />
            )}
          </div>

          {/* Мини-пульс вокруг кнопки */}
          {!isOpen && (
            <div className="absolute inset-0 rounded-[30px] border-2 border-white/20 animate-pulse group-hover:border-white/40" />
          )}

          {/* Метка "Помощник" */}
          {!isOpen && (
            <div
              style={{
                background: theme === 'sakura'
                  ? 'linear-gradient(135deg, #ec4899, #ef4444)'
                  : theme === 'new-year'
                  ? 'linear-gradient(135deg, #0ea5e9, #1e40af)'
                  : theme === 'spring'
                  ? 'linear-gradient(135deg, #22c55e, #166534)'
                  : 'linear-gradient(135deg, #f97316, #d97706)',
              }}
              className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-white px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            >
              Помощник
            </div>
          )}
        </button>
      </div>

      {/* Окно чата */}
      {isOpen && <ChatbotWindow />}
    </>
  );
}

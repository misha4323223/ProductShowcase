import { MessageCircle, X } from 'lucide-react';
import { useChatbot } from '@/contexts/ChatbotContext';
import { useTheme } from '@/contexts/ThemeContext';
import ChatbotWindow from './ChatbotWindow';

export default function ChatbotWidget() {
  const { isOpen, toggleChatbot } = useChatbot();
  const { theme, isDarkMode } = useTheme();

  // Цвета для каждой темы (светлая и тёмная)
  const themeColors: Record<string, Record<string, { start: string; mid: string; end: string; labelStart: string; labelEnd: string }>> = {
    light: {
      sakura: {
        start: '#fbbbca',
        mid: '#f472b6',
        end: '#ef4444',
        labelStart: '#ec4899',
        labelEnd: '#ef4444'
      },
      'new-year': {
        start: '#bfdbfe',
        mid: '#67e8f9',
        end: '#1e40af',
        labelStart: '#0ea5e9',
        labelEnd: '#1e40af'
      },
      spring: {
        start: '#86efac',
        mid: '#6ee7b7',
        end: '#166534',
        labelStart: '#22c55e',
        labelEnd: '#166534'
      },
      autumn: {
        start: '#fed7aa',
        mid: '#fbbf24',
        end: '#d97706',
        labelStart: '#f97316',
        labelEnd: '#d97706'
      }
    },
    dark: {
      sakura: {
        start: '#9f1239',
        mid: '#be123c',
        end: '#7c2d12',
        labelStart: '#be123c',
        labelEnd: '#7c2d12'
      },
      'new-year': {
        start: '#1e3a8a',
        mid: '#1e40af',
        end: '#0c4a6e',
        labelStart: '#1e40af',
        labelEnd: '#0c4a6e'
      },
      spring: {
        start: '#15803d',
        mid: '#166534',
        end: '#14532d',
        labelStart: '#16a34a',
        labelEnd: '#15803d'
      },
      autumn: {
        start: '#92400e',
        mid: '#b45309',
        end: '#7c2d12',
        labelStart: '#b45309',
        labelEnd: '#7c2d12'
      }
    }
  };

  const colorMode = isDarkMode ? 'dark' : 'light';
  const colors = themeColors[colorMode][theme] || themeColors[colorMode]['sakura'];

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
                : `linear-gradient(135deg, ${colors.start}, ${colors.mid}, ${colors.end})`,
              boxShadow: isOpen
                ? '0 20px 25px -5px rgba(220, 38, 38, 0.5)'
                : isDarkMode
                ? '0 20px 25px -5px rgba(0, 0, 0, 0.7)'
                : undefined,
            }}
            className="absolute inset-0 rounded-[30px] shadow-2xl transition-all duration-300"
          />

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
                background: `linear-gradient(135deg, ${colors.labelStart}, ${colors.labelEnd})`,
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

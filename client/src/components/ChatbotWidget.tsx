import { MessageCircle, X } from 'lucide-react';
import { useChatbot } from '@/contexts/ChatbotContext';
import ChatbotWindow from './ChatbotWindow';

export default function ChatbotWidget() {
  const { isOpen, toggleChatbot } = useChatbot();

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
          {/* Основная конфета (зад) */}
          <div className={`absolute inset-0 rounded-[30px] shadow-2xl transition-all duration-300 ${
            isOpen
              ? 'bg-gradient-to-br from-red-400 to-pink-600 shadow-red-400/50'
              : 'bg-gradient-to-br from-yellow-300 via-orange-400 to-pink-500 shadow-orange-400/60 group-hover:shadow-3xl'
          }`} />

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
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-pink-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
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

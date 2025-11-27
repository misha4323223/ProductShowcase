import { MessageCircle, X, Sparkles } from 'lucide-react';
import { useChatbot } from '@/contexts/ChatbotContext';
import ChatbotWindow from './ChatbotWindow';

export default function ChatbotWidget() {
  const { isOpen, toggleChatbot } = useChatbot();

  return (
    <>
      {/* Плавающая кнопка */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={toggleChatbot}
          className={`relative w-14 h-14 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center group ${
            isOpen
              ? 'bg-gradient-to-br from-pink-500 to-red-500 shadow-pink-500/50'
              : 'bg-gradient-to-br from-amber-400 via-orange-400 to-pink-500 hover:shadow-lg hover:scale-110'
          }`}
          data-testid="button-chatbot-toggle"
          aria-label={isOpen ? 'Закрыть чат' : 'Открыть чат'}
        >
          {/* Светящееся кольцо (только когда закрыто) */}
          {!isOpen && (
            <div className="absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-r from-amber-300 via-orange-300 to-pink-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
          )}

          {/* Иконка */}
          <div className="relative z-10 text-white">
            {isOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <div className="flex items-center gap-1">
                <Sparkles className="w-5 h-5" />
                <MessageCircle className="w-5 h-5 -ml-1" />
              </div>
            )}
          </div>

          {/* Анимация пульса (только когда закрыто) */}
          {!isOpen && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-pink-500 opacity-75 -z-10 animate-pulse" />
          )}
        </button>
      </div>

      {/* Окно чата */}
      {isOpen && <ChatbotWindow />}
    </>
  );
}

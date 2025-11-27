import { MessageCircle, X } from 'lucide-react';
import { useChatbot } from '@/contexts/ChatbotContext';
import { Button } from '@/components/ui/button';
import ChatbotWindow from './ChatbotWindow';

export default function ChatbotWidget() {
  const { isOpen, toggleChatbot } = useChatbot();

  return (
    <>
      {/* Плавающая кнопка */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={toggleChatbot}
          size="icon"
          className="rounded-full shadow-lg hover:shadow-xl transition-shadow"
          data-testid="button-chatbot-toggle"
          aria-label={isOpen ? 'Закрыть чат' : 'Открыть чат'}
        >
          {isOpen ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        </Button>
      </div>

      {/* Окно чата */}
      {isOpen && <ChatbotWindow />}
    </>
  );
}

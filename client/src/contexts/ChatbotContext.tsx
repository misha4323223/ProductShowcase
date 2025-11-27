import { createContext, useContext, useState, ReactNode } from 'react';

export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  text: string;
  timestamp: Date;
  products?: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
  }>;
}

interface ChatbotContextType {
  isOpen: boolean;
  messages: ChatMessage[];
  openChatbot: () => void;
  closeChatbot: () => void;
  toggleChatbot: () => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      text: 'Привет! 👋 Я помощник Sweet Delights. Чем я могу тебе помочь? Например, расскажи о чём ты думаешь: "Для романтики", "На день рождения", "Что посоветуешь" или "Дешевые сладости"',
      timestamp: new Date(),
    },
  ]);

  const openChatbot = () => setIsOpen(true);
  const closeChatbot = () => setIsOpen(false);
  const toggleChatbot = () => setIsOpen(!isOpen);

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const clearMessages = () => {
    setMessages([
      {
        id: '1',
        type: 'bot',
        text: 'Привет! 👋 Я помощник Sweet Delights. Чем я могу тебе помочь?',
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <ChatbotContext.Provider value={{ isOpen, messages, openChatbot, closeChatbot, toggleChatbot, addMessage, clearMessages }}>
      {children}
    </ChatbotContext.Provider>
  );
}

export function useChatbot() {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbot must be used within ChatbotProvider');
  }
  return context;
}

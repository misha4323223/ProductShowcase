import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useChatbot } from '@/contexts/ChatbotContext';
import { useProducts } from '@/hooks/use-products';
import { generateBotResponse } from '@/lib/chatbot-responses';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ChatbotWindow() {
  const { messages, addMessage } = useChatbot();
  const { products } = useProducts();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Добавляем сообщение пользователя
    addMessage({
      type: 'user',
      text: input,
    });

    setIsLoading(true);
    const userMessage = input;
    setInput('');

    // Имитируем задержку (потом можно заменить на настоящий AI)
    setTimeout(() => {
      if (products.length > 0) {
        const response = generateBotResponse(userMessage, products);
        addMessage({
          type: 'bot',
          text: response.text,
          products: response.products,
        });
      } else {
        addMessage({
          type: 'bot',
          text: 'Извини, сейчас товары не загружены. Попробуй позже!',
        });
      }
      setIsLoading(false);
    }, 800);
  };

  const handleAddToCart = (productId: string, productName: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.salePrice || product.price,
        image: product.image || '',
        quantity: 1,
      });
      toast({
        title: 'Добавлено в корзину',
        description: `${productName} добавлен`,
      });
    }
  };

  return (
    <div
      className="fixed bottom-20 right-6 w-80 h-96 bg-white dark:bg-slate-950 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col z-40 animate-in fade-in slide-in-from-bottom-2 duration-300"
      data-testid="chatbot-window"
    >
      {/* Заголовок */}
      <div className="bg-gradient-to-r from-primary to-pink-500 text-white p-4 rounded-t-lg">
        <h3 className="font-semibold text-sm">Sweet Delights Помощник</h3>
        <p className="text-xs opacity-90">Помогу найти идеальную сладость</p>
      </div>

      {/* Сообщения */}
      <ScrollArea className="flex-1 p-4 space-y-3">
        {messages.map(message => (
          <div key={message.id}>
            {/* Сообщение */}
            <div
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-3`}
              data-testid={`message-${message.type}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                  message.type === 'user'
                    ? 'bg-primary text-white rounded-br-none'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none'
                }`}
              >
                {message.text}
              </div>
            </div>

            {/* Товары (если есть) */}
            {message.products && message.products.length > 0 && (
              <div className="mb-4 space-y-2">
                {message.products.map(product => (
                  <div
                    key={product.id}
                    className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg text-xs border border-gray-200 dark:border-gray-700"
                    data-testid={`product-card-${product.id}`}
                  >
                    <p className="font-semibold text-gray-900 dark:text-white">{product.name}</p>
                    <p className="text-gray-600 dark:text-gray-300">{product.price}₽</p>
                    <Button
                      size="sm"
                      className="w-full mt-1 h-7 text-xs"
                      onClick={() => handleAddToCart(product.id, product.name)}
                      data-testid={`button-add-to-cart-${product.id}`}
                    >
                      Добавить в корзину
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={scrollRef} />
      </ScrollArea>

      {/* Поле ввода */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-3 flex gap-2">
        <Input
          placeholder="Напиши сообщение..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => {
            if (e.key === 'Enter' && !isLoading) {
              handleSendMessage();
            }
          }}
          disabled={isLoading}
          className="text-sm"
          data-testid="input-chatbot-message"
        />
        <Button
          size="icon"
          onClick={handleSendMessage}
          disabled={isLoading || !input.trim()}
          className="h-9 w-9"
          data-testid="button-send-message"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

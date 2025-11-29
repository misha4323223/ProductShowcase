import { useState, useRef, useEffect } from 'react';
import { Send, X, Heart, Sparkles, Cake } from 'lucide-react';
import { useLocation } from 'wouter';
import { useChatbot } from '@/contexts/ChatbotContext';
import { useProducts } from '@/hooks/use-products';
import { generateBotResponse } from '@/lib/chatbot-responses';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { getProfile, isBirthdayToday } from '@/services/profile-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ChatbotWindow() {
  const { messages, addMessage, toggleChatbot } = useChatbot();
  const { products } = useProducts();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { theme, isDarkMode } = useTheme();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userGreeted, setUserGreeted] = useState(false);
  const [userName, setUserName] = useState('');
  const [isBirthday, setIsBirthday] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Загружаем профиль и проверяем день рождения только один раз за сессию
  useEffect(() => {
    if (user && !userGreeted) {
      const greetingKey = `chatbot_greeted_${user.email}`;
      const alreadyGreeted = sessionStorage.getItem(greetingKey);
      
      if (!alreadyGreeted) {
        loadUserProfile();
      } else {
        setUserGreeted(true);
      }
    }
  }, [user, userGreeted]);

  const loadUserProfile = async () => {
    try {
      const profile = await getProfile(user?.email || '');
      if (profile.firstName) {
        setUserName(profile.firstName);
      }
      if (isBirthdayToday(profile.birthDate)) {
        setIsBirthday(true);
      }
      
      // Отправляем приветствие с днём рождения, если это день рождения
      if (isBirthdayToday(profile.birthDate)) {
        const greeting = profile.firstName
          ? `С днём рождения, ${profile.firstName}! 🎊 Дарим Вам скидку 15%! Может быть, вы хотели бы выбрать что-нибудь вкусное?`
          : `С днём рождения! 🎊 Дарим Вам скидку 15%! Может быть, вы хотели бы выбрать что-нибудь вкусное?`;
        addMessage({ type: 'bot', text: greeting });
      } else if (profile.firstName) {
        const greeting = `Привет, ${profile.firstName}! Чем я могу тебе помочь?`;
        addMessage({ type: 'bot', text: greeting });
      }
      
      // Сохраняем в sessionStorage, что приветствие уже было отправлено
      const greetingKey = `chatbot_greeted_${user?.email}`;
      sessionStorage.setItem(greetingKey, 'true');
      setUserGreeted(true);
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
      setUserGreeted(true);
    }
  };

  // Цвета кнопок для каждой темы
  const buttonColors: Record<string, { bg: string; hover: string; cardBg: string; cardBorder: string }> = {
    sakura: {
      bg: isDarkMode ? '#be123c' : '#ec4899',
      hover: isDarkMode ? '#9f1239' : '#db2777',
      cardBg: isDarkMode ? 'from-pink-900/40 to-pink-800/40' : 'from-pink-50 to-pink-100',
      cardBorder: isDarkMode ? 'border-pink-900' : 'border-pink-200'
    },
    'new-year': {
      bg: isDarkMode ? '#1e40af' : '#0ea5e9',
      hover: isDarkMode ? '#1e3a8a' : '#0284c7',
      cardBg: isDarkMode ? 'from-blue-900/40 to-blue-800/40' : 'from-blue-50 to-blue-100',
      cardBorder: isDarkMode ? 'border-blue-900' : 'border-blue-200'
    },
    spring: {
      bg: isDarkMode ? '#16a34a' : '#22c55e',
      hover: isDarkMode ? '#15803d' : '#16a34a',
      cardBg: isDarkMode ? 'from-green-900/40 to-green-800/40' : 'from-green-50 to-green-100',
      cardBorder: isDarkMode ? 'border-green-900' : 'border-green-200'
    },
    autumn: {
      bg: isDarkMode ? '#b45309' : '#f97316',
      hover: isDarkMode ? '#92400e' : '#ea580c',
      cardBg: isDarkMode ? 'from-orange-900/40 to-orange-800/40' : 'from-orange-50 to-orange-100',
      cardBorder: isDarkMode ? 'border-orange-900' : 'border-orange-200'
    }
  };

  const currentColors = buttonColors[theme] || buttonColors['sakura'];

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
          showWheelButton: response.showWheelButton,
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

  const handleToggleWishlist = async (productId: string, productName: string) => {
    if (!user) {
      toast({
        title: 'Нужна авторизация',
        description: 'Пожалуйста, войдите в аккаунт',
      });
      return;
    }

    try {
      await toggleWishlist(productId);
      const inWishlist = isInWishlist(productId);
      toast({
        title: inWishlist ? 'Удалено из избранного' : 'Добавлено в избранное',
        description: productName,
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить избранное',
      });
    }
  };

  return (
    <div
      className="fixed bottom-4 right-2 w-[calc(100vw-1rem)] h-[75vh] md:w-96 md:h-[600px] md:right-6 bg-white dark:bg-slate-950 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col z-40 animate-in fade-in slide-in-from-bottom-2 duration-300"
      data-testid="chatbot-window"
    >
      {/* Заголовок */}
      <div className={`${isBirthday ? 'bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400' : 'bg-gradient-to-r from-primary to-pink-500'} text-white p-4 rounded-t-lg flex items-start justify-between`}>
        <div className="flex items-center gap-2">
          {isBirthday && <Cake className="w-5 h-5" />}
          <div>
            <h3 className="font-semibold text-sm">Sweet Delights Помощник</h3>
            <p className="text-xs opacity-90">{isBirthday ? 'С днём рождения!' : 'Помогу найти идеальную сладость'}</p>
          </div>
        </div>
        <button
          onClick={toggleChatbot}
          className="text-white hover:bg-white/20 p-1 rounded transition-colors"
          data-testid="button-close-chatbot"
          aria-label="Закрыть чат"
        >
          <X className="w-5 h-5" />
        </button>
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
                className={`max-w-xs px-3 py-2 rounded-lg text-sm whitespace-pre-wrap break-words ${
                  message.type === 'user'
                    ? 'bg-primary text-white rounded-br-none'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none'
                }`}
              >
                {message.text}
              </div>
            </div>

            {/* Кнопка рулетки */}
            {message.showWheelButton && (
              <div className="mb-4 pr-2">
                <button
                  onClick={() => {
                    localStorage.setItem('openWheelModal', 'true');
                    window.dispatchEvent(new Event('wheelModalOpen'));
                    toggleChatbot();
                    setLocation('/');
                  }}
                  className="w-full text-white font-semibold py-3 text-sm rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  style={{
                    backgroundColor: currentColors.bg,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = currentColors.hover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = currentColors.bg)}
                  data-testid="button-go-to-wheel"
                >
                  <Sparkles className="w-5 h-5" />
                  Крутить рулетку! 🎡
                </button>
              </div>
            )}

            {/* Товары (если есть) */}
            {message.products && message.products.length > 0 && (
              <div className="mb-4 space-y-3 pr-2">
                {message.products.map(product => (
                  <div
                    key={product.id}
                    className={`bg-gradient-to-br ${currentColors.cardBg} p-3 rounded-xl border-2 ${currentColors.cardBorder} shadow-md hover:shadow-lg transition-shadow cursor-pointer`}
                    onClick={() => setLocation(`/product/${product.id}`)}
                    data-testid={`product-card-${product.id}`}
                  >
                    {/* Картинка товара */}
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-24 object-cover rounded-lg mb-2"
                      />
                    )}
                    
                    {/* Название и цена */}
                    <p className="font-bold text-gray-900 dark:text-white text-sm mb-1">{product.name}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">{product.price}₽</p>
                    
                    {/* Кнопки */}
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product.id, product.name);
                        }}
                        className="flex-1 text-white font-semibold py-2 text-sm rounded-lg transition-colors duration-200"
                        style={{
                          backgroundColor: currentColors.bg,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = currentColors.hover)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = currentColors.bg)}
                        data-testid={`button-add-to-cart-${product.id}`}
                      >
                        ➕ Корзина
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleWishlist(product.id, product.name);
                        }}
                        className="px-3 text-white font-semibold py-2 text-sm rounded-lg transition-colors duration-200 flex items-center gap-1"
                        style={{
                          backgroundColor: currentColors.bg,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = currentColors.hover)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = currentColors.bg)}
                        data-testid={`button-toggle-wishlist-${product.id}`}
                      >
                        <Heart
                          className="w-4 h-4"
                          fill={isInWishlist(product.id) ? 'currentColor' : 'none'}
                        />
                      </button>
                    </div>
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

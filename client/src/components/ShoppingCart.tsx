import { X, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
}

export default function ShoppingCart({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: ShoppingCartProps) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
        data-testid="overlay-cart"
      />
      <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-background shadow-xl z-50 flex flex-col animate-in slide-in-from-right">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold" data-testid="text-cart-title">
            Корзина ({items.length})
          </h2>
          <Button size="icon" variant="ghost" onClick={onClose} data-testid="button-close-cart">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <X className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground" data-testid="text-empty-cart">
              Корзина пуста
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4" data-testid={`cart-item-${item.id}`}>
                    <div className="w-20 h-20 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm line-clamp-2 mb-2" data-testid={`text-cart-item-name-${item.id}`}>
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          data-testid={`button-decrease-${item.id}`}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm w-8 text-center" data-testid={`text-quantity-${item.id}`}>
                          {item.quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          data-testid={`button-increase-${item.id}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-primary" data-testid={`text-cart-item-price-${item.id}`}>
                          {item.price * item.quantity}₽
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive"
                          onClick={() => onRemoveItem(item.id)}
                          data-testid={`button-remove-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t p-4 space-y-4">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Итого:</span>
                <span className="text-primary" data-testid="text-cart-total">
                  {total}₽
                </span>
              </div>
              <Button 
                className="w-full" 
                size="lg" 
                onClick={onCheckout}
                data-testid="button-checkout"
              >
                Оформить заказ
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

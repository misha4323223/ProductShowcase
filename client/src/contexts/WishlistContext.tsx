import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { addToWishlist, removeFromWishlist, getWishlist } from "@/services/yandex-wishlist";
import type { WishlistItem } from "@/types/firebase-types";

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  wishlistCount: number;
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    if (user) {
      loadWishlist();
    } else {
      setWishlistItems([]);
    }
  }, [user]);

  const loadWishlist = async () => {
    if (!user) return;
    
    try {
      const items = await getWishlist(user.uid);
      setWishlistItems(items);
    } catch (error) {
      console.error("Ошибка загрузки избранного:", error);
    }
  };

  const handleAddToWishlist = async (productId: string) => {
    if (!user) {
      console.log("Пользователь не авторизован");
      return;
    }

    try {
      await addToWishlist(user.uid, productId);
      await loadWishlist();
    } catch (error) {
      console.error("Ошибка добавления в избранное:", error);
      throw error;
    }
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    if (!user) return;

    try {
      await removeFromWishlist(user.uid, productId);
      await loadWishlist();
    } catch (error) {
      console.error("Ошибка удаления из избранного:", error);
      throw error;
    }
  };

  const handleToggleWishlist = async (productId: string) => {
    const inWishlist = wishlistItems.some(item => item.productId === productId);
    
    if (inWishlist) {
      await handleRemoveFromWishlist(productId);
    } else {
      await handleAddToWishlist(productId);
    }
  };

  const checkIsInWishlist = (productId: string): boolean => {
    return wishlistItems.some(item => item.productId === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistCount: wishlistItems.length,
        isInWishlist: checkIsInWishlist,
        addToWishlist: handleAddToWishlist,
        removeFromWishlist: handleRemoveFromWishlist,
        toggleWishlist: handleToggleWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
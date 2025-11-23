import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { 
  getWheelStatus, 
  spinWheel, 
  getWheelHistory,
  type WheelStatusResponse,
  type SpinWheelResponse 
} from "@/services/api-client";
import type { WheelPrize, WheelHistory, WheelStats } from "@/types/firebase-types";

interface WheelContextType {
  spins: number;
  totalSpinsEarned: number;
  totalWheelSpins: number;
  loyaltyPoints: number;
  activePrizes: WheelPrize[];
  history: WheelHistory[];
  stats: WheelStats | null;
  isLoading: boolean;
  error: string | null;
  spin: () => Promise<WheelPrize | null>;
  refreshStatus: () => Promise<void>;
}

const WheelContext = createContext<WheelContextType | undefined>(undefined);

export function WheelProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [spins, setSpins] = useState(0);
  const [totalSpinsEarned, setTotalSpinsEarned] = useState(0);
  const [totalWheelSpins, setTotalWheelSpins] = useState(0);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [activePrizes, setActivePrizes] = useState<WheelPrize[]>([]);
  const [history, setHistory] = useState<WheelHistory[]>([]);
  const [stats, setStats] = useState<WheelStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка статуса рулетки при авторизации
  useEffect(() => {
    if (user) {
      loadWheelStatus();
      loadWheelHistory();
    } else {
      // Сброс данных при выходе
      setSpins(0);
      setTotalSpinsEarned(0);
      setTotalWheelSpins(0);
      setLoyaltyPoints(0);
      setActivePrizes([]);
      setHistory([]);
      setStats(null);
    }
  }, [user]);

  const loadWheelStatus = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('🎰 Загрузка статуса рулетки для:', user.email, 'userId:', user.userId);
      const status: WheelStatusResponse = await getWheelStatus(user.userId);
      
      console.log('🎰 Получен статус рулетки:', status);
      console.log('🎯 Доступные спины:', status.spins);
      console.log('📊 Всего заработано:', status.totalSpinsEarned);
      
      setSpins(status.spins || 0);
      setTotalSpinsEarned(status.totalSpinsEarned || 0);
      setTotalWheelSpins(status.totalWheelSpins || 0);
      setLoyaltyPoints(status.loyaltyPoints || 0);
      // Убедимся, что activePrizes - массив
      setActivePrizes(Array.isArray(status.activePrizes) ? status.activePrizes : []);
      setStats(status.stats || null);
    } catch (err: any) {
      console.error("❌ Ошибка загрузки статуса рулетки:", err);
      setError(err.message || "Не удалось загрузить данные рулетки");
      // Устанавливаем безопасные значения по умолчанию
      setActivePrizes([]);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWheelHistory = async () => {
    if (!user) return;

    try {
      const historyData = await getWheelHistory(user.userId);
      // Убедимся, что history - массив
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (err: any) {
      console.error("Ошибка загрузки истории:", err);
      setHistory([]);
    }
  };

  const spin = async (): Promise<WheelPrize | null> => {
    if (!user) {
      setError("Необходимо войти в систему");
      return null;
    }

    if (spins < 1) {
      setError("Недостаточно спинов");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response: SpinWheelResponse = await spinWheel(user.userId);
      
      if (response.success && response.prize) {
        // Обновляем локальное состояние немедленно для быстрой обратной связи
        setSpins(prev => prev - 1);
        setTotalWheelSpins(prev => prev + 1);
        
        // Добавляем приз к активным (если он не баллы)
        if (response.prize.prizeType !== 'points') {
          setActivePrizes(prev => [response.prize, ...prev]);
        }
        
        // Если это баллы, обновляем баланс
        if (response.prize.prizeType === 'points' && response.prize.pointsAmount) {
          setLoyaltyPoints(prev => prev + response.prize.pointsAmount!);
        }
        
        // Обновляем полное состояние с сервера для синхронизации
        // Делаем это в фоне, чтобы не блокировать UI
        refreshStatus().catch(err => {
          console.error("Ошибка обновления статуса после выигрыша:", err);
        });
        
        return response.prize;
      }
      
      setError("Не удалось получить приз");
      return null;
    } catch (err: any) {
      console.error("Ошибка вращения рулетки:", err);
      setError(err.message || "Ошибка при вращении рулетки");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStatus = async () => {
    await loadWheelStatus();
    await loadWheelHistory();
  };

  return (
    <WheelContext.Provider
      value={{
        spins,
        totalSpinsEarned,
        totalWheelSpins,
        loyaltyPoints,
        activePrizes,
        history,
        stats,
        isLoading,
        error,
        spin,
        refreshStatus,
      }}
    >
      {children}
    </WheelContext.Provider>
  );
}

export function useWheel() {
  const context = useContext(WheelContext);
  if (context === undefined) {
    throw new Error("useWheel must be used within a WheelProvider");
  }
  return context;
}

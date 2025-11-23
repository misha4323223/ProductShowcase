import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";

export default function AutumnRain() {
  const { theme } = useTheme();
  const [raindrops, setRaindrops] = useState<Array<{ id: number; left: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    // Генерируем капли дождя только для осенней темы
    if (theme === 'autumn') {
      const drops = Array.from({ length: 80 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 2 + Math.random() * 1.5,
      }));
      setRaindrops(drops);
      console.log('🍂 Дождик активирован! Капель:', drops.length);
    } else {
      setRaindrops([]);
    }
  }, [theme]);

  if (theme !== 'autumn') return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-visible autumn-rain-container">
      {raindrops.map((drop) => (
        <div
          key={drop.id}
          className="autumn-raindrop"
          style={{
            left: `${drop.left}%`,
            animationDelay: `${drop.delay}s`,
            animationDuration: `${drop.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

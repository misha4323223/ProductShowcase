import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";

interface Sunflare {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  intensity: number;
  swingAmount: number;
}

export default function SunflareParticles() {
  const { theme } = useTheme();
  const [sunflares, setSunflares] = useState<Sunflare[]>([]);

  useEffect(() => {
    if (theme === 'spring') {
      const newSunflares = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 8,
        duration: 20 + Math.random() * 15,
        size: 15 + Math.random() * 35,
        intensity: 0.4 + Math.random() * 0.6,
        swingAmount: 30 + Math.random() * 80,
      }));
      setSunflares(newSunflares);
      console.log('☀️ Солнечные зайчики активированы! Зайчиков:', newSunflares.length);
    } else {
      setSunflares([]);
    }
  }, [theme]);

  if (theme !== 'spring') return null;

  return (
    <div className="sunflare-container">
      {sunflares.map((flare) => (
        <div
          key={flare.id}
          className="sunflare"
          style={{
            left: `${flare.left}%`,
            animationDelay: `${flare.delay}s`,
            animationDuration: `${flare.duration}s`,
            '--flare-swing': `${flare.swingAmount}px`,
            '--flare-size': `${flare.size}px`,
            '--flare-intensity': flare.intensity,
          } as React.CSSProperties & { 
            '--flare-swing': string;
            '--flare-size': string;
            '--flare-intensity': number;
          }}
        />
      ))}
    </div>
  );
}

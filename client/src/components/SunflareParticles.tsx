import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";

interface Sunflare {
  id: number;
  top: number;
  left: number;
  delay: number;
  duration: number;
  width: number;
  height: number;
}

export default function SunflareParticles() {
  const { theme } = useTheme();
  const [sunflares, setSunflares] = useState<Sunflare[]>([]);

  useEffect(() => {
    if (theme === 'spring') {
      const newSunflares = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        top: Math.random() * 80,
        left: Math.random() * 90,
        delay: Math.random() * 12,
        duration: 4 + Math.random() * 3,
        width: 8 + Math.random() * 20,
        height: 50 + Math.random() * 80,
      }));
      setSunflares(newSunflares);
      console.log('☀️ Солнечные зайчики активированы!');
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
            top: `${flare.top}%`,
            left: `${flare.left}%`,
            animationDelay: `${flare.delay}s`,
            animationDuration: `${flare.duration}s`,
          }}
        >
          <svg
            viewBox="0 0 20 100"
            style={{
              width: `${flare.width}px`,
              height: `${flare.height}px`,
              filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.9))',
            }}
          >
            <defs>
              <linearGradient id={`sunflare-${flare.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
                <stop offset="50%" stopColor="rgba(255, 255, 255, 0.95)" />
                <stop offset="100%" stopColor="rgba(255, 255, 200, 0)" />
              </linearGradient>
            </defs>
            <ellipse
              cx="10"
              cy="50"
              rx="3"
              ry="40"
              fill={`url(#sunflare-${flare.id})`}
              opacity="0.8"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}

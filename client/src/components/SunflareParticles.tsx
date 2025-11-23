import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";

interface Sunflare {
  id: number;
  left: number;
  delay: number;
  duration: number;
  width: number;
  height: number;
  swingAmount: number;
}

export default function SunflareParticles() {
  const { theme } = useTheme();
  const [sunflares, setSunflares] = useState<Sunflare[]>([]);

  useEffect(() => {
    if (theme === 'spring') {
      const newSunflares = Array.from({ length: 35 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 10,
        duration: 22 + Math.random() * 18,
        width: 8 + Math.random() * 25,
        height: 60 + Math.random() * 100,
        swingAmount: 40 + Math.random() * 100,
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
            left: `${flare.left}%`,
            animationDelay: `${flare.delay}s`,
            animationDuration: `${flare.duration}s`,
            '--flare-swing': `${flare.swingAmount}px`,
          } as React.CSSProperties & { '--flare-swing': string }
          }
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

import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";

interface Petal {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  swingAmount: number;
}

const PETAL_COLORS = [
  '#ec4899',
  '#f472b6',
  '#fbcfe8',
  '#fda4af',
  '#f97316',
  '#fbbf24',
];

export default function SpringPetals() {
  const { theme } = useTheme();
  const [petals, setPetals] = useState<Petal[]>([]);

  useEffect(() => {
    if (theme === 'spring') {
      const newPetals = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 6,
        duration: 18 + Math.random() * 12,
        size: 12 + Math.random() * 20,
        color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
        swingAmount: 40 + Math.random() * 60,
      }));
      setPetals(newPetals);
      console.log('🌸 Весенние лепестки активированы! Лепестков:', newPetals.length);
    } else {
      setPetals([]);
    }
  }, [theme]);

  if (theme !== 'spring') return null;

  return (
    <div className="spring-petals-container">
      {petals.map((petal) => (
        <div
          key={petal.id}
          className="spring-petal"
          style={{
            left: `${petal.left}%`,
            animationDelay: `${petal.delay}s`,
            animationDuration: `${petal.duration}s`,
            '--petal-swing': `${petal.swingAmount}px`,
          } as React.CSSProperties & { '--petal-swing': string }}
        >
          <svg
            width={petal.size}
            height={petal.size}
            viewBox="0 0 100 100"
            style={{
              fill: petal.color,
              filter: `drop-shadow(0 2px 3px rgba(0,0,0,0.15))`,
            }}
          >
            <ellipse cx="50" cy="50" rx="40" ry="25" />
          </svg>
        </div>
      ))}
    </div>
  );
}

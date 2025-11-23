import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";

interface Leaf {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  swingAmount: number;
}

const LEAF_COLORS = [
  '#d97706', // amber-600
  '#dc2626', // red-600
  '#f59e0b', // amber-500
  '#ea580c', // orange-600
  '#991b1b', // red-900
  '#b45309', // amber-700
];

export default function AutumnRain() {
  const { theme } = useTheme();
  const [leaves, setLeaves] = useState<Leaf[]>([]);

  useEffect(() => {
    if (theme === 'autumn') {
      const newLeaves = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 6,
        duration: 12 + Math.random() * 8,
        size: 18 + Math.random() * 28,
        color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
        swingAmount: 40 + Math.random() * 60,
      }));
      setLeaves(newLeaves);
      console.log('🍂 Осенние листья активированы! Листьев:', newLeaves.length);
    } else {
      setLeaves([]);
    }
  }, [theme]);

  if (theme !== 'autumn') return null;

  return (
    <div className="autumn-rain-container">
      {leaves.map((leaf) => (
        <div
          key={leaf.id}
          className="autumn-leaf"
          style={{
            left: `${leaf.left}%`,
            animationDelay: `${leaf.delay}s`,
            animationDuration: `${leaf.duration}s`,
            '--leaf-swing': `${leaf.swingAmount}px`,
          } as React.CSSProperties & { '--leaf-swing': string }}
        >
          <svg
            width={leaf.size}
            height={leaf.size}
            viewBox="0 0 100 100"
            style={{
              fill: leaf.color,
              filter: `drop-shadow(0 2px 3px rgba(0,0,0,0.2))`,
            }}
          >
            <path d="M50,10 Q30,30 25,50 Q20,70 35,85 Q50,95 50,95 Q50,95 65,85 Q80,70 75,50 Q70,30 50,10 M50,35 Q40,40 38,50 Q40,58 50,60 Q60,58 62,50 Q60,40 50,35" />
          </svg>
        </div>
      ))}
    </div>
  );
}

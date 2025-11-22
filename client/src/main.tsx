import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Типизация для window
declare global {
  interface Window {
    __themeReady?: Promise<void>;
    __initialTheme?: string;
  }
}

// Ожидаем загрузки темы перед монтированием React
async function mountApp() {
  try {
    // Ждем пока Promise из index.html разрешится (максимум 3 секунды)
    if (window.__themeReady) {
      await Promise.race([
        window.__themeReady,
        new Promise(resolve => setTimeout(resolve, 3000))
      ]);
    }
  } catch (err) {
    console.error('Error waiting for theme:', err);
  }
  
  // Монтируем React
  createRoot(document.getElementById("root")!).render(<App />);
}

mountApp();

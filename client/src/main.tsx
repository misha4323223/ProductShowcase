import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Типизация для window
declare global {
  interface Window {
    __themeLoading?: boolean;
    __initialTheme?: string;
  }
}

// Ожидаем загрузки темы перед монтированием React
async function mountApp() {
  // Ждем пока тема загружена (максимум 2 секунды)
  if (window.__themeLoading) {
    await new Promise(resolve => {
      const timeoutId = setTimeout(() => {
        console.warn('Theme loading timeout (2s), mounting app with loaded theme');
        resolve(null);
      }, 2000);
      
      window.addEventListener('themeReady', () => {
        clearTimeout(timeoutId);
        console.log('Theme loaded successfully:', window.__initialTheme);
        resolve(null);
      }, { once: true });
    });
  }
  
  // Монтируем React
  createRoot(document.getElementById("root")!).render(<App />);
}

mountApp();

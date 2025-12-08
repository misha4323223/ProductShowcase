import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

declare global {
  interface Window {
    __themeReady?: Promise<void>;
    __initialTheme?: string;
  }
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.log('[PWA] Service Worker registration failed:', error);
        });
    });
  }
}

async function mountApp() {
  try {
    if (window.__themeReady) {
      await Promise.race([
        window.__themeReady,
        new Promise(resolve => setTimeout(resolve, 3000))
      ]);
    }
  } catch (err) {
    console.error('Error waiting for theme:', err);
  }
  
  registerServiceWorker();
  
  createRoot(document.getElementById("root")!).render(<App />);
}

mountApp();

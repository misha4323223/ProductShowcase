import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getBrandingSettings, setBrandingSettings, type BrandingSettings } from '@/services/site-settings-client';

interface SiteSettingsContextType {
  siteName: string;
  logoUrl: string;
  accentColor: string;
  shopNameRu: string;
  shopNameEn: string;
  isLoading: boolean;
  updateBranding: (settings: Partial<BrandingSettings>) => Promise<void>;
  refreshBranding: () => Promise<void>;
}

const defaultContext: SiteSettingsContextType = {
  siteName: 'Sweet Delights',
  logoUrl: '',
  accentColor: '#f472b6',
  shopNameRu: 'Сладкие Наслаждения',
  shopNameEn: 'Sweet Delights',
  isLoading: true,
  updateBranding: async () => {},
  refreshBranding: async () => {},
};

const SiteSettingsContext = createContext<SiteSettingsContextType>(defaultContext);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<BrandingSettings>({
    siteName: 'Sweet Delights',
    logoUrl: '',
    accentColor: '#f472b6',
    shopNameRu: 'Сладкие Наслаждения',
    shopNameEn: 'Sweet Delights',
  });
  const [isLoading, setIsLoading] = useState(true);

  const applyAccentColor = (color: string) => {
    if (!color) return;
    
    const hexToHSL = (hex: string): { h: number; s: number; l: number } | null => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return null;
      
      let r = parseInt(result[1], 16) / 255;
      let g = parseInt(result[2], 16) / 255;
      let b = parseInt(result[3], 16) / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0;
      const l = (max + min) / 2;
      
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }
      
      return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    };
    
    const hsl = hexToHSL(color);
    if (hsl) {
      document.documentElement.style.setProperty('--accent', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      const fgL = hsl.l > 50 ? 10 : 98;
      document.documentElement.style.setProperty('--accent-foreground', `${hsl.h} ${Math.max(hsl.s - 10, 0)}% ${fgL}%`);
    }
  };

  const loadBranding = async () => {
    setIsLoading(true);
    try {
      const settings = await getBrandingSettings();
      setBranding(settings);
      if (settings.accentColor) {
        applyAccentColor(settings.accentColor);
      }
    } catch (error) {
      console.error('Error loading branding settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBranding();
  }, []);

  const updateBranding = async (settings: Partial<BrandingSettings>) => {
    try {
      await setBrandingSettings(settings);
      // Перезагружаем данные с сервера для синхронизации
      await loadBranding();
    } catch (error) {
      console.error('Error updating branding:', error);
      throw error;
    }
  };

  const refreshBranding = async () => {
    await loadBranding();
  };

  return (
    <SiteSettingsContext.Provider
      value={{
        siteName: branding.siteName,
        logoUrl: branding.logoUrl,
        accentColor: branding.accentColor,
        shopNameRu: branding.shopNameRu,
        shopNameEn: branding.shopNameEn,
        isLoading,
        updateBranding,
        refreshBranding,
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
}

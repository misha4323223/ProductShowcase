const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || 'https://d5dimdj7itkijbl4s0g4.y5sm01em.apigw.yandexcloud.net';

export interface SiteSetting {
  settingKey: string;
  settingValue: string;
}

export async function getCurrentTheme(): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/site-settings?key=current_theme`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch theme from server, using default');
      return 'sakura';
    }

    const data: SiteSetting = await response.json();
    return data.settingValue || 'sakura';
  } catch (error) {
    console.error('Error fetching current theme:', error);
    return 'sakura';
  }
}

export async function setCurrentTheme(theme: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/site-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        settingKey: 'current_theme',
        settingValue: theme
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to set theme');
    }

    const result = await response.json();
    console.log('Theme saved to server:', result);
  } catch (error: any) {
    console.error('Error setting theme:', error);
    throw error;
  }
}

export async function getSiteSetting(key: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/site-settings?key=${encodeURIComponent(key)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data: SiteSetting = await response.json();
    return data.settingValue || null;
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return null;
  }
}

export async function setSiteSetting(key: string, value: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/site-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        settingKey: key,
        settingValue: value
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to set setting');
    }
  } catch (error: any) {
    console.error(`Error setting ${key}:`, error);
    throw error;
  }
}

export interface HeroSlide {
  id: number;
  image: string;
  webpImage: string;
  title: string;
  subtitle: string;
}

export async function getHeroSlides(theme?: string): Promise<HeroSlide[]> {
  try {
    const key = theme ? `hero_slides_${theme}` : 'hero_slides';
    const response = await fetch(`${API_BASE_URL}/site-settings?key=${encodeURIComponent(key)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch hero slides from server');
      return [];
    }

    const data: SiteSetting = await response.json();
    if (!data.settingValue) return [];
    
    return JSON.parse(data.settingValue) as HeroSlide[];
  } catch (error) {
    console.error('Error fetching hero slides:', error);
    return [];
  }
}

export async function setHeroSlides(slides: HeroSlide[], theme?: string): Promise<void> {
  try {
    const key = theme ? `hero_slides_${theme}` : 'hero_slides';
    const response = await fetch(`${API_BASE_URL}/site-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        settingKey: key,
        settingValue: JSON.stringify(slides)
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save hero slides');
    }

    console.log(`Hero slides for theme "${theme || 'default'}" saved to server`);
  } catch (error: any) {
    console.error('Error setting hero slides:', error);
    throw error;
  }
}

export interface BackgroundSetting {
  image: string;
  webpImage: string;
  title: string;
}

export interface BackgroundSettings {
  sakura: BackgroundSetting;
  newyear: BackgroundSetting;
  spring: BackgroundSetting;
  autumn: BackgroundSetting;
}

export async function getBackgroundSettings(): Promise<BackgroundSettings> {
  try {
    const response = await fetch(`${API_BASE_URL}/site-settings?key=background_settings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch background settings from server');
      return {} as BackgroundSettings;
    }

    const data: SiteSetting = await response.json();
    if (!data.settingValue) return {} as BackgroundSettings;
    
    return JSON.parse(data.settingValue) as BackgroundSettings;
  } catch (error) {
    console.error('Error fetching background settings:', error);
    return {} as BackgroundSettings;
  }
}

export async function setBackgroundSettings(settings: BackgroundSettings): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/site-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        settingKey: 'background_settings',
        settingValue: JSON.stringify(settings)
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save background settings');
    }

    console.log('Background settings saved to server');
  } catch (error: any) {
    console.error('Error setting background settings:', error);
    throw error;
  }
}

export async function getPreferredTheme(): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/site-settings?key=preferred_theme`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch preferred theme from server, using default');
      return 'sakura';
    }

    const data: SiteSetting = await response.json();
    return data.settingValue || 'sakura';
  } catch (error) {
    console.error('Error fetching preferred theme:', error);
    return 'sakura';
  }
}

export async function setPreferredTheme(theme: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/site-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        settingKey: 'preferred_theme',
        settingValue: theme
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to set preferred theme');
    }

    console.log('Preferred theme saved to server:', theme);
  } catch (error: any) {
    console.error('Error setting preferred theme:', error);
    throw error;
  }
}

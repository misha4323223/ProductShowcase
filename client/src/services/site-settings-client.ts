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

export async function getHeroSlides(): Promise<HeroSlide[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/site-settings?key=hero_slides`, {
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

export async function setHeroSlides(slides: HeroSlide[]): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/site-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        settingKey: 'hero_slides',
        settingValue: JSON.stringify(slides)
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save hero slides');
    }

    console.log('Hero slides saved to server');
  } catch (error: any) {
    console.error('Error setting hero slides:', error);
    throw error;
  }
}

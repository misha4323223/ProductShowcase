const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || '';

export interface UserProfile {
  email: string;
  userId: string;
  firstName: string;
  lastName: string;
  patronymic: string;
  birthDate: string;
  phone: string;
  role: string;
  [key: string]: any;
}

export interface UpdateProfileData {
  email: string;
  firstName?: string;
  lastName?: string;
  patronymic?: string;
  birthDate?: string;
  phone?: string;
  [key: string]: any;
}

export async function getProfile(email: string): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/profile/get`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка получения профиля');
  }

  const data = await response.json();
  return data.profile;
}

export async function updateProfile(profileData: UpdateProfileData): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/profile/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка обновления профиля');
  }

  const data = await response.json();
  return data.profile;
}

export function isBirthdayToday(birthDate: string): boolean {
  if (!birthDate) {
    console.log('❌ Дата рождения пуста');
    return false;
  }
  try {
    const today = new Date();
    const birth = new Date(birthDate);
    
    console.log('📅 Проверка дня рождения:');
    console.log('  Сегодня:', today.toLocaleDateString('ru-RU'), `(${today.getDate()}.${today.getMonth() + 1})`);
    console.log('  День рождения:', birth.toLocaleDateString('ru-RU'), `(${birth.getDate()}.${birth.getMonth() + 1})`);
    console.log('  Строка из БД:', birthDate);
    
    const isBday = today.getDate() === birth.getDate() && today.getMonth() === birth.getMonth();
    console.log('  Результат:', isBday ? '✅ ДЕНЬ РОЖДЕНИЯ!' : '❌ Не совпадает');
    
    return isBday;
  } catch (e) {
    console.error('❌ Ошибка при парсинге даты:', e);
    return false;
  }
}

export async function markBirthdayGiftSent(email: string): Promise<void> {
  const year = new Date().getFullYear();
  await updateProfile({
    email,
    [`birthdayGiftSent${year}`]: true,
  });
}

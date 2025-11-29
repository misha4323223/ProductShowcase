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
  if (!birthDate) return false;
  try {
    const today = new Date();
    const birth = new Date(birthDate);
    return today.getDate() === birth.getDate() && today.getMonth() === birth.getMonth();
  } catch {
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

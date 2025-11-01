export interface UploadImageResult {
  url: string;
  filename: string;
}

export async function uploadImageToImgBB(file: File): Promise<UploadImageResult> {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
  
  if (!apiKey) {
    throw new Error('ImgBB API ключ не настроен. Обратитесь к администратору.');
  }

  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Ошибка загрузки изображения на ImgBB');
  }

  const data = await response.json();

  return {
    url: data.data.url,
    filename: file.name,
  };
}

export function validateImageFile(file: File): string | null {
  const maxSize = 32 * 1024 * 1024;
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];

  if (!allowedTypes.includes(file.type)) {
    return 'Разрешены только изображения: JPG, PNG, GIF, WebP, BMP';
  }

  if (file.size > maxSize) {
    return 'Размер изображения не должен превышать 32MB';
  }

  return null;
}

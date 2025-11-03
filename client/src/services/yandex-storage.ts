import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const STORAGE_BUCKET = import.meta.env.VITE_STORAGE_BUCKET || 'sweetdelights-images';
const STORAGE_REGION = import.meta.env.VITE_STORAGE_REGION || 'ru-central1';

const s3Client = new S3Client({
  region: STORAGE_REGION,
  endpoint: 'https://storage.yandexcloud.net',
  credentials: {
    accessKeyId: import.meta.env.VITE_YDB_ACCESS_KEY_ID || '',
    secretAccessKey: import.meta.env.VITE_YDB_SECRET_KEY || '',
  },
});

export async function uploadImageToYandexStorage(
  file: File,
  folder: string = 'products'
): Promise<string> {
  try {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    const response = await fetch('https://d5dimdj7itkijbl4s0g4.y5sm01em.apigw.yandexcloud.net/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName,
        fileData: base64Data,
        fileType: file.type,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload image: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Изображение загружено:', data.url);
    return data.url;
  } catch (error: any) {
    console.error('Error uploading to Yandex Storage:', error);
    throw new Error(`Не удалось загрузить изображение: ${error.message || 'Неизвестная ошибка'}`);
  }
}

export async function deleteImageFromYandexStorage(imageUrl: string): Promise<void> {
  try {
    const fileName = imageUrl.split(`${STORAGE_BUCKET}/`)[1];
    
    if (!fileName) {
      throw new Error('Invalid image URL');
    }
    
    await s3Client.send(new DeleteObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: fileName,
    }));
  } catch (error) {
    console.error('Error deleting from Yandex Storage:', error);
    throw new Error('Не удалось удалить изображение');
  }
}

export function getImageUrl(fileName: string): string {
  return `https://storage.yandexcloud.net/${STORAGE_BUCKET}/${fileName}`;
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

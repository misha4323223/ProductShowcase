import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand
} from "@aws-sdk/client-s3";

const STORAGE_BUCKET = import.meta.env.VITE_STORAGE_BUCKET || 'sweetdelights-images';
const STORAGE_REGION = import.meta.env.VITE_STORAGE_REGION || 'ru-central1';

// Инициализация S3 клиента для прямой загрузки в Yandex Object Storage
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
    console.log("Начало загрузки файла напрямую в Yandex Object Storage:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      folder
    });

    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${folder}/${timestamp}-${randomStr}.${fileExtension}`;

    // Читаем файл как ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Загружаем напрямую в S3
    const command = new PutObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read',
    });

    await s3Client.send(command);

    const imageUrl = `https://storage.yandexcloud.net/${STORAGE_BUCKET}/${fileName}`;
    
    console.log("Изображение успешно загружено:", imageUrl);

    return imageUrl;
  } catch (error: any) {
    console.error('Error uploading to Yandex Storage:', error);
    throw new Error(`Не удалось загрузить изображение: ${error.message || 'Неизвестная ошибка'}`);
  }
}

export async function deleteImageFromYandexStorage(imageUrl: string): Promise<void> {
  try {
    // Извлекаем ключ из URL
    const key = imageUrl.split(`${STORAGE_BUCKET}/`)[1];
    
    if (!key) {
      throw new Error('Invalid image URL');
    }

    const command = new DeleteObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: key,
    });

    await s3Client.send(command);
    console.log('Изображение успешно удалено:', imageUrl);
  } catch (error: any) {
    console.error('Error deleting from Yandex Storage:', error);
    throw new Error(`Не удалось удалить изображение: ${error.message || 'Неизвестная ошибка'}`);
  }
}

export function getImageUrl(fileName: string): string {
  // Re-define STORAGE_BUCKET here as it's no longer globally accessible from the S3 client setup.
  // const STORAGE_BUCKET = import.meta.env.VITE_STORAGE_BUCKET || 'sweetdelights-images';
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
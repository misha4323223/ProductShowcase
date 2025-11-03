import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand
} from "@aws-sdk/client-s3";
import imageCompression from 'browser-image-compression';

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

/**
 * Оптимизирует изображение перед загрузкой
 * - Сжимает размер файла
 * - Конвертирует в WebP формат для лучшей производительности
 */
async function optimizeImage(file: File): Promise<File> {
  const originalSize = (file.size / 1024 / 1024).toFixed(2);
  console.log(`🖼️ Начало оптимизации изображения: ${file.name} (${originalSize} MB)`);

  try {
    // Настройки оптимизации
    const options = {
      maxSizeMB: 1, // Максимальный размер 1 MB
      maxWidthOrHeight: 1920, // Максимальная ширина/высота
      useWebWorker: true, // Использовать Web Worker для производительности
      fileType: 'image/webp', // Конвертируем в WebP
      initialQuality: 0.85, // Качество 85%
    };

    const compressedFile = await imageCompression(file, options);
    
    const optimizedSize = (compressedFile.size / 1024 / 1024).toFixed(2);
    const savings = ((1 - compressedFile.size / file.size) * 100).toFixed(1);
    
    console.log(`✅ Оптимизация завершена:`);
    console.log(`   Было: ${originalSize} MB → Стало: ${optimizedSize} MB`);
    console.log(`   Экономия: ${savings}%`);
    
    return compressedFile;
  } catch (error: any) {
    console.warn('⚠️ Ошибка оптимизации, загружаем оригинал:', error.message);
    return file; // Если оптимизация не удалась, загружаем оригинал
  }
}

export async function uploadImageToYandexStorage(
  file: File,
  folder: string = 'products'
): Promise<string> {
  try {
    console.log("🚀 Начало загрузки файла в Yandex Object Storage:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      folder
    });

    // ОПТИМИЗАЦИЯ: Сжимаем и конвертируем в WebP
    const optimizedFile = await optimizeImage(file);

    // Генерируем уникальное имя файла с расширением .webp
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const fileName = `${folder}/${timestamp}-${randomStr}.webp`;

    // Читаем оптимизированный файл как ArrayBuffer
    const arrayBuffer = await optimizedFile.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Загружаем оптимизированное изображение в S3
    const command = new PutObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: fileName,
      Body: buffer,
      ContentType: 'image/webp', // Всегда WebP
      ACL: 'public-read',
    });

    await s3Client.send(command);

    const imageUrl = `https://storage.yandexcloud.net/${STORAGE_BUCKET}/${fileName}`;
    
    console.log("✅ Изображение успешно загружено:", imageUrl);

    return imageUrl;
  } catch (error: any) {
    console.error('❌ Ошибка загрузки в Yandex Storage:', error);
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
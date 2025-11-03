import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand
} from "@aws-sdk/client-s3";

const STORAGE_BUCKET = import.meta.env.VITE_STORAGE_BUCKET || 'sweetdelights-images';
const STORAGE_REGION = import.meta.env.VITE_STORAGE_REGION || 'ru-central1';

// Removed S3 client initialization as uploads will go through a Cloud Function.
// const s3Client = new S3Client({
//  region: STORAGE_REGION,
//  endpoint: 'https://storage.yandexcloud.net',
//  credentials: {
//    accessKeyId: import.meta.env.VITE_YDB_ACCESS_KEY_ID || '',
//    secretAccessKey: import.meta.env.VITE_YDB_SECRET_KEY || '',
//  },
//});

const UPLOAD_IMAGE_FUNCTION_URL = import.meta.env.VITE_UPLOAD_IMAGE_FUNCTION_URL || '';

export async function uploadImageToYandexStorage(
  file: File,
  folder: string = 'products'
): Promise<string> {
  try {
    console.log("Начало загрузки файла через Cloud Function:", {
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

    // Читаем файл как base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    console.log("Отправка в Cloud Function:", { fileName, base64Length: base64.length });

    // Отправляем через Cloud Function
    const response = await fetch(UPLOAD_IMAGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName,
        fileData: base64,
        fileType: file.type
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log("Результат загрузки:", result);

    if (!result.url) {
      throw new Error('No URL returned from upload function');
    }

    return result.url;
  } catch (error: any) {
    console.error('Error uploading to Yandex Storage:', error);
    throw new Error(`Не удалось загрузить изображение: ${error.message || 'Неизвестная ошибка'}`);
  }
}

export async function deleteImageFromYandexStorage(imageUrl: string): Promise<void> {
  console.log('Delete image not yet implemented via Cloud Function:', imageUrl);
  // TODO: Implement delete via Cloud Function if needed
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
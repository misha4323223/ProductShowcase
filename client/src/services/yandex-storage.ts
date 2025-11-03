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
    console.log('Начало загрузки файла в Yandex Storage:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      bucket: STORAGE_BUCKET,
      region: STORAGE_REGION,
      hasAccessKey: !!import.meta.env.VITE_YDB_ACCESS_KEY_ID,
      hasSecretKey: !!import.meta.env.VITE_YDB_SECRET_KEY,
    });

    const fileExtension = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    console.log('Отправка в S3:', { fileName, bufferSize: buffer.length });
    
    const command = new PutObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    });
    
    const result = await s3Client.send(command);
    console.log('Результат загрузки S3:', result);
    
    const imageUrl = `https://storage.yandexcloud.net/${STORAGE_BUCKET}/${fileName}`;
    console.log('URL изображения:', imageUrl);
    
    return imageUrl;
  } catch (error: any) {
    console.error('Error uploading to Yandex Storage:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.Code,
      statusCode: error.$metadata?.httpStatusCode,
      requestId: error.$metadata?.requestId,
      stack: error.stack
    });
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

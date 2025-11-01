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
    const buffer = new Uint8Array(arrayBuffer);
    
    await s3Client.send(new PutObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read',
    }));
    
    const imageUrl = `https://storage.yandexcloud.net/${STORAGE_BUCKET}/${fileName}`;
    
    return imageUrl;
  } catch (error) {
    console.error('Error uploading to Yandex Storage:', error);
    throw new Error('Не удалось загрузить изображение');
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

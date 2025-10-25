const GITHUB_API = 'https://api.github.com';
const GITHUB_OWNER = 'misha4323223';
const GITHUB_REPO = 'ProductShowcase';
const GITHUB_BRANCH = 'main';
const IMAGES_PATH = 'product-images';

export interface UploadImageResult {
  url: string;
  filename: string;
}

export async function uploadImageToGitHub(file: File): Promise<UploadImageResult> {
  const token = import.meta.env.VITE_GITHUB_TOKEN;
  
  if (!token) {
    throw new Error('GitHub токен не настроен. Обратитесь к администратору.');
  }

  const timestamp = Date.now();
  const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `${timestamp}_${sanitizedFilename}`;
  const filePath = `${IMAGES_PATH}/${filename}`;

  const reader = new FileReader();
  const base64Content = await new Promise<string>((resolve, reject) => {
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const url = `${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Upload product image: ${filename}`,
      content: base64Content,
      branch: GITHUB_BRANCH,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Ошибка загрузки изображения на GitHub');
  }

  const data = await response.json();
  const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${filePath}`;

  return {
    url: rawUrl,
    filename,
  };
}

export function validateImageFile(file: File): string | null {
  const maxSize = 5 * 1024 * 1024;
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return 'Разрешены только изображения: JPG, PNG, GIF, WebP';
  }

  if (file.size > maxSize) {
    return 'Размер изображения не должен превышать 5MB';
  }

  return null;
}

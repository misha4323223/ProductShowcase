import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inputPath = join(__dirname, '../attached_assets/generated_images/Candy_delivery_happiness_scene_fb271190.png');
const outputPath = join(__dirname, '../attached_assets/generated_images/Candy_delivery_happiness_scene_fb271190.webp');

async function optimizeImage() {
  try {
    if (!existsSync(inputPath)) {
      console.error('❌ Файл не найден:', inputPath);
      process.exit(1);
    }

    console.log('🔍 Анализ исходного изображения...');
    const metadata = await sharp(inputPath).metadata();
    console.log(`📐 Исходные размеры: ${metadata.width}x${metadata.height}`);

    console.log('\n🔄 Конвертация в WebP...');
    
    await sharp(inputPath)
      .resize(1920, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({
        quality: 85,
        effort: 6,
      })
      .toFile(outputPath);

    const fs = await import('fs');
    const originalSize = fs.statSync(inputPath).size;
    const newSize = fs.statSync(outputPath).size;
    const savings = ((1 - newSize / originalSize) * 100).toFixed(1);
    
    console.log('\n✅ Оптимизация завершена!');
    console.log(`📊 Размер файла:`);
    console.log(`   Исходный: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Новый: ${(newSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Экономия: ${savings}% 🎉`);
    console.log(`💾 Файл: ${outputPath}`);

  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

optimizeImage();

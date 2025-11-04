import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inputPath = join(__dirname, '../attached_assets/generated_images/Candy_characters_big_gift_box_7a7377e6.png');
const outputPath = join(__dirname, '../attached_assets/generated_images/Candy_characters_big_gift_box_7a7377e6.webp');

async function optimizeImage() {
  try {
    if (!existsSync(inputPath)) {
      console.error('❌ Файл не найден:', inputPath);
      process.exit(1);
    }

    console.log('🔍 Анализ исходного изображения...');
    const metadata = await sharp(inputPath).metadata();
    console.log(`📐 Исходные размеры: ${metadata.width}x${metadata.height}`);
    console.log(`📦 Исходный формат: ${metadata.format}`);

    console.log('\n🔄 Конвертация и оптимизация...');
    
    // Оптимизируем для веба: максимальная ширина 1920px для десктопа
    // Изображение автоматически масштабируется с сохранением пропорций
    await sharp(inputPath)
      .resize(1920, null, {
        fit: 'inside',
        withoutEnlargement: true, // Не увеличивать, если меньше
      })
      .webp({
        quality: 85, // Хорошее качество с оптимизацией
        effort: 6,   // Больше усилий для лучшего сжатия
      })
      .toFile(outputPath);

    const originalStats = await sharp(inputPath).stats();
    const newMetadata = await sharp(outputPath).metadata();
    
    console.log('\n✅ Оптимизация завершена!');
    console.log(`📐 Новые размеры: ${newMetadata.width}x${newMetadata.height}`);
    console.log(`📦 Новый формат: WebP`);
    console.log(`💾 Файл сохранён: ${outputPath}`);
    
    // Получаем размеры файлов для сравнения
    const fs = await import('fs');
    const originalSize = fs.statSync(inputPath).size;
    const newSize = fs.statSync(outputPath).size;
    const savings = ((1 - newSize / originalSize) * 100).toFixed(1);
    
    console.log(`\n📊 Размер файла:`);
    console.log(`   Исходный: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Новый: ${(newSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Экономия: ${savings}% 🎉`);

  } catch (error) {
    console.error('❌ Ошибка при оптимизации:', error);
    process.exit(1);
  }
}

optimizeImage();

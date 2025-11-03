import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagesDir = path.join(__dirname, '..', 'attached_assets', 'generated_images');

async function optimizeImages() {
  try {
    const files = fs.readdirSync(imagesDir);
    const pngFiles = files.filter(file => file.endsWith('.png'));

    console.log(`🖼️  Found ${pngFiles.length} PNG images to optimize\n`);

    let totalOriginalSize = 0;
    let totalWebPSize = 0;

    for (const file of pngFiles) {
      const inputPath = path.join(imagesDir, file);
      const outputPath = path.join(imagesDir, file.replace('.png', '.webp'));

      const originalStats = fs.statSync(inputPath);
      totalOriginalSize += originalStats.size;

      await sharp(inputPath)
        .webp({ quality: 85 })
        .toFile(outputPath);

      const webpStats = fs.statSync(outputPath);
      totalWebPSize += webpStats.size;

      const savings = ((1 - webpStats.size / originalStats.size) * 100).toFixed(1);
      const originalKB = (originalStats.size / 1024).toFixed(1);
      const webpKB = (webpStats.size / 1024).toFixed(1);

      console.log(`✅ ${file}`);
      console.log(`   Original: ${originalKB} KB → WebP: ${webpKB} KB (${savings}% smaller)\n`);
    }

    const totalSavings = ((1 - totalWebPSize / totalOriginalSize) * 100).toFixed(1);
    const totalOriginalMB = (totalOriginalSize / 1024 / 1024).toFixed(2);
    const totalWebPMB = (totalWebPSize / 1024 / 1024).toFixed(2);

    console.log('═══════════════════════════════════════════════════');
    console.log(`🎉 Optimization Complete!`);
    console.log(`   Total Original Size: ${totalOriginalMB} MB`);
    console.log(`   Total WebP Size: ${totalWebPMB} MB`);
    console.log(`   Total Savings: ${totalSavings}%`);
    console.log('═══════════════════════════════════════════════════');
  } catch (error) {
    console.error('❌ Error optimizing images:', error);
    process.exit(1);
  }
}

optimizeImages();

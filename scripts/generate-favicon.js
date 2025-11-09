import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sourceImage = join(__dirname, '../attached_assets/generated_images/Multiple_candies_composition_icon_83408a96.png');
const outputDir = join(__dirname, '../client/public');

async function generateFavicons() {
  console.log('Generating favicons...');

  // 16x16
  await sharp(sourceImage)
    .resize(16, 16)
    .toFile(join(outputDir, 'favicon-16x16.png'));
  console.log('✓ favicon-16x16.png');

  // 32x32
  await sharp(sourceImage)
    .resize(32, 32)
    .toFile(join(outputDir, 'favicon-32x32.png'));
  console.log('✓ favicon-32x32.png');

  // Apple touch icon 180x180
  await sharp(sourceImage)
    .resize(180, 180)
    .toFile(join(outputDir, 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png');

  // Android chrome 192x192
  await sharp(sourceImage)
    .resize(192, 192)
    .toFile(join(outputDir, 'android-chrome-192x192.png'));
  console.log('✓ android-chrome-192x192.png');

  // Android chrome 512x512
  await sharp(sourceImage)
    .resize(512, 512)
    .toFile(join(outputDir, 'android-chrome-512x512.png'));
  console.log('✓ android-chrome-512x512.png');

  // Create favicon.ico (32x32)
  await sharp(sourceImage)
    .resize(32, 32)
    .toFile(join(outputDir, 'favicon.ico'));
  console.log('✓ favicon.ico');

  console.log('\n✅ All favicons generated successfully!');
}

generateFavicons().catch(console.error);

#!/usr/bin/env node

/**
 * Генератор sitemap.xml для Sweet Delights
 * 
 * Создает статический sitemap.xml на основе:
 * - Статических страниц (главная, FAQ, политика и т.д.)
 * - Динамических данных из API (категории и товары)
 * 
 * Использование:
 * node scripts/generate-sitemap.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = 'https://sweetdelights.store';

// Статические страницы
const staticPages = [
  { url: '/', changefreq: 'daily', priority: '1.0' },
  { url: '/faq', changefreq: 'monthly', priority: '0.6' },
  { url: '/privacy', changefreq: 'monthly', priority: '0.4' },
  { url: '/terms', changefreq: 'monthly', priority: '0.4' },
];

/**
 * Генерирует URL элемент для sitemap
 */
function generateUrlElement(url, changefreq = 'weekly', priority = '0.8', lastmod = null) {
  const lastmodDate = lastmod || new Date().toISOString().split('T')[0];
  
  return `  <url>
    <loc>${SITE_URL}${url}</loc>
    <lastmod>${lastmodDate}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

/**
 * Фетчит категории с API
 */
async function fetchCategories() {
  try {
    // Для статического генератора используем заглушку
    // В production нужно будет получать данные из API или базы данных
    console.log('⚠️  Используются заглушки категорий. Подключите API для актуальных данных.');
    
    return [
      { slug: 'chocolate', name: 'Шоколад', updatedAt: '2025-01-01' },
      { slug: 'candies', name: 'Конфеты', updatedAt: '2025-01-01' },
      { slug: 'cookies', name: 'Печенье', updatedAt: '2025-01-01' },
      { slug: 'accessories', name: 'Аксессуары', updatedAt: '2025-01-01' },
    ];
  } catch (error) {
    console.error('Ошибка при загрузке категорий:', error);
    return [];
  }
}

/**
 * Фетчит товары с API
 */
async function fetchProducts() {
  try {
    // Для статического генератора используем заглушку
    console.log('⚠️  Используются заглушки товаров. Подключите API для актуальных данных.');
    
    return [];
  } catch (error) {
    console.error('Ошибка при загрузке товаров:', error);
    return [];
  }
}

/**
 * Генерирует полный sitemap.xml
 */
async function generateSitemap() {
  console.log('🚀 Генерация sitemap.xml...\n');

  const categories = await fetchCategories();
  const products = await fetchProducts();

  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Добавляем статические страницы
  console.log('📄 Добавление статических страниц...');
  staticPages.forEach(page => {
    sitemap += generateUrlElement(page.url, page.changefreq, page.priority) + '\n';
  });

  // Добавляем категории
  console.log(`📁 Добавление ${categories.length} категорий...`);
  categories.forEach(category => {
    sitemap += generateUrlElement(
      `/category/${category.slug}`,
      'weekly',
      '0.9',
      category.updatedAt
    ) + '\n';
  });

  // Добавляем товары
  console.log(`🛍️  Добавление ${products.length} товаров...`);
  products.forEach(product => {
    sitemap += generateUrlElement(
      `/product/${product.id}`,
      'weekly',
      '0.8',
      product.updatedAt
    ) + '\n';
  });

  sitemap += '</urlset>';

  // Записываем sitemap в файл
  const sitemapPath = path.join(__dirname, '..', 'client', 'public', 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemap, 'utf8');

  console.log(`\n✅ Sitemap успешно сгенерирован: ${sitemapPath}`);
  console.log(`📊 Всего URL: ${staticPages.length + categories.length + products.length}`);
  console.log(`   - Статические страницы: ${staticPages.length}`);
  console.log(`   - Категории: ${categories.length}`);
  console.log(`   - Товары: ${products.length}\n`);
}

// Запускаем генерацию
generateSitemap().catch(error => {
  console.error('❌ Ошибка при генерации sitemap:', error);
  process.exit(1);
});

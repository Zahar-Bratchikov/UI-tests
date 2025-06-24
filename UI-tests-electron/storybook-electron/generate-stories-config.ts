// Node.js-скрипт для автогенерации stories.config.json из файлов stories
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const STORIES_DIR = path.resolve(__dirname, 'src/stories');
const OUT_PATH = path.resolve(__dirname, 'stories.config.json');

function getStoriesFromFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  // Ищем title
  const titleMatch = content.match(/title:\s*['"]([^'"]+)['"]/);
  const title = titleMatch ? titleMatch[1] : path.basename(filePath);
  // Ищем экспорты story
  const exportMatches = [...content.matchAll(/export const (\w+)/g)];
  return exportMatches.map(([, variant]) => ({ title, variant }));
}

function getAllStories() {
  const files = fs.readdirSync(STORIES_DIR).filter(f => f.endsWith('.stories.tsx'));
  const result: Array<{ url: string; name: string }> = [];
  for (const file of files) {
    const abs = path.join(STORIES_DIR, file);
    const stories = getStoriesFromFile(abs);
    for (const { title, variant } of stories) {
      result.push({
        url: `${BASE_URL}?story=${encodeURIComponent(title)}&variant=${encodeURIComponent(variant)}`,
        name: `${title.replace(/\//g, '-')}-${variant}`
      });
    }
  }
  return result;
}

const config = getAllStories();
fs.writeFileSync(OUT_PATH, JSON.stringify(config, null, 2));
console.log('stories.config.json updated:', config);

// playwright-visual-regression.ts
// Скрипт для headless-снятия и сравнения скриншотов stories через Playwright
import { _electron as electron, ElectronApplication, Page } from 'playwright';
import fs from 'fs';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const BASE_URL = 'http://localhost:3000'; // или путь к вашему Electron build
const SCREENSHOTS_DIR = './visual-snapshots';
const DIFFS_DIR = './visual-diffs';

// Автоматически генерируем список stories/моков из конфигурационного файла
const storiesConfigPath = './stories.config.json';
interface StoryConfig {
  url: string;
  name: string;
}
function getStoriesList(): StoryConfig[] {
  if (fs.existsSync(storiesConfigPath)) {
    return JSON.parse(fs.readFileSync(storiesConfigPath, 'utf-8'));
  }
  // fallback: пример stories
  return [
    { url: `${BASE_URL}?story=UI/Button&variant=Default`, name: 'Button-Default' },
    { url: `${BASE_URL}?story=UI/Button&variant=WithAction`, name: 'Button-WithAction' },
  ];
}

const configPath = './test-app.config.json';
function getElectronAppPath(): string {
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8')).electronAppPath || '';
  }
  return '';
}

async function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
}

async function takeScreenshot(page: Page, name: string) {
  await ensureDir(SCREENSHOTS_DIR);
  const path = `${SCREENSHOTS_DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: false });
  return path;
}

async function compareScreenshots(baselinePath: string, currentPath: string, diffPath: string) {
  const img1 = PNG.sync.read(fs.readFileSync(baselinePath));
  const img2 = PNG.sync.read(fs.readFileSync(currentPath));
  const { width, height } = img1;
  const diff = new PNG({ width, height });
  const numDiff = pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0.1 });
  fs.writeFileSync(diffPath, PNG.sync.write(diff));
  return numDiff;
}

async function run() {
  await ensureDir(DIFFS_DIR);
  const electronAppPath = getElectronAppPath();
  if (!electronAppPath) throw new Error('Не указан путь к тестируемому Electron-приложению в test-app.config.json');
  const electronApp: ElectronApplication = await electron.launch({ args: [electronAppPath] });
  const page: Page = await electronApp.firstWindow();

  const stories = getStoriesList();

  for (const { url, name } of stories) {
    await page.goto(url);
    await page.waitForTimeout(500); // дождаться рендера
    const currentPath = await takeScreenshot(page, `${name}-current`);
    const baselinePath = `${SCREENSHOTS_DIR}/${name}-baseline.png`;
    if (fs.existsSync(baselinePath)) {
      const diffPath = `${DIFFS_DIR}/${name}-diff.png`;
      const numDiff = await compareScreenshots(baselinePath, currentPath, diffPath);
      console.log(`${name}: ${numDiff} pixels differ. Diff saved to ${diffPath}`);
    } else {
      fs.copyFileSync(currentPath, baselinePath);
      console.log(`${name}: Baseline created.`);
    }
  }
  await electronApp.close();
}

run();

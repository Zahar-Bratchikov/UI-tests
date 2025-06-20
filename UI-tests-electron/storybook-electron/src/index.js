const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // In production, you might want to load the bundled React app:
  // mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Открытие отдельного окна для story с props
ipcMain.handle('open-story-window', async (event, { story, props }) => {
  const win = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  // Передаем story и props через query params
  const url = `file://${path.join(__dirname, 'index.html')}?story=${encodeURIComponent(story)}&props=${encodeURIComponent(JSON.stringify(props))}`;
  await win.loadURL(url);
  win.webContents.openDevTools();
});

// Сохранение/обновление stories в src/stories/custom
ipcMain.handle('save-story-file', async (event, { story, variant, code }) => {
  const fs = require('fs');
  const path = require('node:path');
  const dir = path.join(__dirname, 'stories', 'custom');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  // Имя файла по компоненту
  const fileName = `${story}.stories.tsx`;
  const filePath = path.join(dir, fileName);
  // Если файл уже есть — дописываем/обновляем экспорт, иначе создаём новый
  let content = '';
  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, 'utf-8');
    // Удалить старый экспорт с таким именем
    const exportRegex = new RegExp(`export const ${variant} = [^;]+;?`, 'g');
    content = content.replace(exportRegex, '');
    content += `\n${code}\n`;
  } else {
    content = `// Generated by StoryConstructor\nexport default { title: '${story}' };\n${code}\n`;
  }
  fs.writeFileSync(filePath, content);
  return { ok: true, filePath };
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let service;
let win;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  win.loadFile('index.html');

  // Запуск скрытого C++ сервиса
  const servicePath = path.join(__dirname, 'cpp-service');
  service = spawn(servicePath, [], {
    stdio: ['ignore', 'pipe', 'ignore'],
    detached: true,
    windowsHide: true,
  });

  service.stdout.on('data', (data) => {
    // READY
    win.webContents.send('cpp-message', data.toString().trim());
  });

  app.on('before-quit', () => {
    if (service) service.kill();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

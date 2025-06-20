// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
// No changes needed for preload.js at this stage

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openStoryWindow: (data) => ipcRenderer.invoke('open-story-window', data),
  saveStoryFile: (data) => ipcRenderer.invoke('save-story-file', data),
});

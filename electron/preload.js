const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: (opts) => ipcRenderer.invoke('launcher:open-file-dialog', opts),
  run: (exePath, args) => ipcRenderer.invoke('launcher:run', exePath, args),
});

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load from local build if present, otherwise load dev server
  const indexPath = path.join(__dirname, '..', 'build', 'index.html');
  if (fs.existsSync(indexPath)) {
    win.loadFile(indexPath);
  } else {
    const devUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000';
    win.loadURL(devUrl);
  }

  // Open external links in default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  return win;
}

app.whenReady().then(() => {
  const win = createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // Basic IPC: open file dialog
  ipcMain.handle('launcher:open-file-dialog', async (event, opts) => {
    const result = await dialog.showOpenDialog(win, opts || {});
    return result;
  });

  // Basic IPC: run an executable (caller must pass trusted path and args)
  ipcMain.handle('launcher:run', async (event, exePath, args = []) => {
    try {
      const child = spawn(exePath, args, { detached: true, stdio: 'ignore' });
      child.unref();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

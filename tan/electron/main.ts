import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BrowserWindow, app } from 'electron';
import { REACT_DEVELOPER_TOOLS, installExtension } from 'electron-devtools-installer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = !!process.env.VITE_DEV_SERVER_URL;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Kausal Paths',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  });

  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL!);
    installDevExtensions();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  process.on('message', (msg) => {
    if (msg === 'electron-vite&type=hot-reload') {
      console.log('Hot reload');
      for (const win of BrowserWindow.getAllWindows()) {
        // Hot reload preload scripts
        win.webContents.reload();
      }
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

function installDevExtensions() {
  if (process.env.NODE_ENV === 'development') {
    installExtension(REACT_DEVELOPER_TOOLS)
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((err) => console.log('An error occurred: ', err));
  }
}

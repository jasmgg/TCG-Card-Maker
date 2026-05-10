const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#12121e',
    title: 'TCG Card Maker',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ============================================================
// FILE DIALOGS
// ============================================================
ipcMain.handle('dialog:openExcel', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Import Excel / CSV',
    filters: [
      { name: 'Spreadsheets', extensions: ['xlsx', 'xls', 'csv'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });
  if (result.canceled || !result.filePaths.length) return null;
  const filePath = result.filePaths[0];
  try {
    const XLSX = require('xlsx');
    const wb = XLSX.readFile(filePath);
    if (!wb.SheetNames.length) return { error: 'No sheets found in file.' };
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
    if (!json.length) return { error: 'No data rows found in the first sheet.' };
    return { data: json, name: path.basename(filePath) };
  } catch (e) {
    return { error: 'Failed to read file: ' + e.message };
  }
});

ipcMain.handle('dialog:openImages', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Card Images',
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile', 'multiSelections'],
  });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths.map((fp) => ({ path: fp, name: path.basename(fp) }));
});

ipcMain.handle('dialog:openImageFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Image Folder',
    properties: ['openDirectory'],
  });
  if (result.canceled || !result.filePaths.length) return null;
  const dir = result.filePaths[0];
  const exts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'];
  const files = [];
  function scan(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) scan(full);
      else if (exts.includes(path.extname(entry.name).toLowerCase())) {
        files.push({ path: full, name: entry.name, relative: path.relative(dir, full) });
      }
    }
  }
  scan(dir);
  return files;
});

ipcMain.handle('file:readImage', async (_, filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.bmp': 'image/bmp',
    };
    const mime = mimeMap[ext] || 'image/png';
    return `data:${mime};base64,${buffer.toString('base64')}`;
  } catch (e) {
    return null;
  }
});

// ============================================================
// PROJECT SAVE / LOAD
// ============================================================
ipcMain.handle('project:save', async (_, projectData) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Project',
    defaultPath: 'my-card-project.tcg',
    filters: [{ name: 'TCG Card Maker Project', extensions: ['tcg'] }],
  });
  if (result.canceled) return false;
  try {
    fs.writeFileSync(result.filePath, JSON.stringify(projectData, null, 2), 'utf-8');
    return result.filePath;
  } catch (e) {
    return false;
  }
});

ipcMain.handle('project:load', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open Project',
    filters: [
      { name: 'TCG Card Maker Project', extensions: ['tcg'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });
  if (result.canceled || !result.filePaths.length) return null;
  try {
    const data = fs.readFileSync(result.filePaths[0], 'utf-8');
    return { data: JSON.parse(data), path: result.filePaths[0] };
  } catch (e) {
    return null;
  }
});

ipcMain.handle('project:quickSave', async (_, { filePath, projectData }) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(projectData, null, 2), 'utf-8');
    return true;
  } catch (e) {
    return false;
  }
});

// ============================================================
// ELEMENT LIBRARY (persisted in user data)
// ============================================================
function getLibraryPath() {
  return path.join(app.getPath('userData'), 'element-library.json');
}

ipcMain.handle('library:load', async () => {
  try {
    const data = fs.readFileSync(getLibraryPath(), 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
});

ipcMain.handle('library:save', async (_, library) => {
  try {
    fs.writeFileSync(getLibraryPath(), JSON.stringify(library, null, 2), 'utf-8');
    return true;
  } catch (e) {
    return false;
  }
});

// ============================================================
// BATCH EXPORT
// ============================================================
ipcMain.handle('export:selectFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Export Folder',
    properties: ['openDirectory', 'createDirectory'],
  });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths[0];
});

ipcMain.handle('export:saveImage', async (_, { folder, filename, dataUrl }) => {
  try {
    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');
    const filePath = path.join(folder, filename);
    fs.writeFileSync(filePath, buffer);
    return true;
  } catch (e) {
    return false;
  }
});

ipcMain.handle('export:openFolder', async (_, folder) => {
  shell.openPath(folder);
});

// ============================================================
// NATIVE CARD CAPTURE
// Uses Electron's capturePage for pixel-perfect rendering,
// avoiding html2canvas text rendering differences.
// rect: { x, y, width, height } in logical (CSS) pixels
// scale: number (e.g. 2 for 2x)
// ============================================================
ipcMain.handle('capture:card', async (_, { x, y, width, height, scale }) => {
  try {
    const rect = {
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height),
    };
    const image = await mainWindow.webContents.capturePage(rect);
    // Resize to the requested output scale if needed
    const targetW = Math.round(width * scale);
    const targetH = Math.round(height * scale);
    const resized = image.resize({ width: targetW, height: targetH, quality: 'best' });
    return 'data:image/png;base64,' + resized.toPNG().toString('base64');
  } catch (e) {
    console.error('[capture:card]', e);
    return null;
  }
});

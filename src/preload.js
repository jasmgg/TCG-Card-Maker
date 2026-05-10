const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // File dialogs
  openExcel: () => ipcRenderer.invoke('dialog:openExcel'),
  openImages: () => ipcRenderer.invoke('dialog:openImages'),
  openImageFolder: () => ipcRenderer.invoke('dialog:openImageFolder'),
  readImage: (filePath) => ipcRenderer.invoke('file:readImage', filePath),

  // Project
  saveProject: (data) => ipcRenderer.invoke('project:save', data),
  loadProject: () => ipcRenderer.invoke('project:load'),
  quickSave: (filePath, data) =>
    ipcRenderer.invoke('project:quickSave', { filePath, projectData: data }),

  // Element library
  loadLibrary: () => ipcRenderer.invoke('library:load'),
  saveLibrary: (library) => ipcRenderer.invoke('library:save', library),

  // Export
  selectExportFolder: () => ipcRenderer.invoke('export:selectFolder'),
  saveImage: (folder, filename, dataUrl) =>
    ipcRenderer.invoke('export:saveImage', { folder, filename, dataUrl }),
  openFolder: (folder) => ipcRenderer.invoke('export:openFolder', folder),

  // Native card capture (pixel-perfect, replaces html2canvas)
  captureCard: (rect, scale) => ipcRenderer.invoke('capture:card', { ...rect, scale }),
});

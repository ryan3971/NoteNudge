const { contextBridge, ipcRenderer} = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
  handleCaptureSelection: (left, top, width, height) => ipcRenderer.send('capture-selection', left, top, width, height),
});
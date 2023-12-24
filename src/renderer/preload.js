const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
  handleOpenSettings: () => ipcRenderer.send('open-settings')
});
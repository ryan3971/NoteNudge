const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
  handleCloseApplication: () => ipcRenderer.send('close-application')
})
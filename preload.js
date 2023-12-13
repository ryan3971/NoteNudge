const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
  handleCloseApplication: () => ipcRenderer.send('close-application'),
  handleSubmitEntry: (entry) => ipcRenderer.send('submit-entry', entry),
  handleOpenSettings: () => ipcRenderer.send('open-settings')
});
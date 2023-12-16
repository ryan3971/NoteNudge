const { contextBridge, ipcRenderer} = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
  handleStartSelection: () => ipcRenderer.send('start-selection'),
});
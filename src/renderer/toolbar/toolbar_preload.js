const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
  setButton: (button_click) => ipcRenderer.send('button-click', button_click),
  handleAnimationStart: () => ipcRenderer.send('animation-start'),
})
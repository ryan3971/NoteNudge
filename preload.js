const { contextBridge, ipcRenderer} = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
  handleStartSelection: (quill) => ipcRenderer.send('send-quill', quill),
});

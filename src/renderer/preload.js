const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
  handleCloseApplication: () => ipcRenderer.send('close-application'),        // Function to handle closing the application
  handleSubmitEntry: (entry) => ipcRenderer.send('submit-entry', entry),      // Function to handle submitting an entry
  handleOpenSettings: () => ipcRenderer.send('open-settings')                 // Function to handle opening the settings window
});
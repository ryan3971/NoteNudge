const { contextBridge, ipcRenderer} = require('electron/renderer')

contextBridge.exposeInMainWorld("electronAPI", {
    handleSaveEntry: (entry) => ipcRenderer.send("save-entry", entry),
    handleStartSelection: () => ipcRenderer.send("start-selection"),
    handleCroppedImage: (callback) => ipcRenderer.on("image-captured", (_event, image) => callback(image)),
    handleCloseApplication: () => ipcRenderer.send("close-application"), // Function to handle closing the application
    handleOpenSettings: () => ipcRenderer.send('open-settings')
});
const { contextBridge, ipcRenderer} = require('electron/renderer')

contextBridge.exposeInMainWorld("electronAPI", {
    handleCropImage: () => ipcRenderer.send("crop-image"),
    handleCroppedImage: (callback) => ipcRenderer.on("image-captured", (_event, image) => callback(image)),
    handleSubmitEntry: (entry) => ipcRenderer.send("submit-entry", entry),
    handleOpenSettings: () => ipcRenderer.send("open-settings"),
    handleSkipEntry: () => ipcRenderer.send("skip-entry"),          
    handleSnoozeEntry: () => ipcRenderer.send("snooze-entry"), 
    handleCloseApplication: () => ipcRenderer.send("close-application"), // Function to handle closing the application
});
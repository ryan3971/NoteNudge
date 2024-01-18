const { contextBridge, ipcRenderer} = require('electron/renderer')

contextBridge.exposeInMainWorld("electronAPI", {
	handleCropImage: () => ipcRenderer.send("crop-image"),
	handleCroppedImage: (callback) => ipcRenderer.on("image-captured", (_event, image) => callback(image)),

	// handleSubmitEntry: (entry) => ipcRenderer.send("submit-entry", entry),
	handleSubmitEntry: (entry) => ipcRenderer.send("submit-entry", entry),
	handleSubmitEntryStatus: (callback) => ipcRenderer.on("entry-status", (_event, status) => callback(status)),
	handleEntrySubmitted: () => ipcRenderer.send("entry-submitted"),

	handleOpenSettings: () => ipcRenderer.send("open-settings"),
	handleSkipEntry: () => ipcRenderer.send("skip-entry"),
	handleSnoozeEntry: () => ipcRenderer.send("snooze-entry"),
	handleOpenDocument: () => ipcRenderer.send("open-document"),
	handleCloseApplication: () => ipcRenderer.send("close-application"), // Function to handle closing the application
});
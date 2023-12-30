const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld("electronAPI", {
    handleTaskbarButton: (taskbar_event) => ipcRenderer.send("taskbar-event", taskbar_event),
    handleAnimationStart: () => ipcRenderer.send("animation-start"),
});
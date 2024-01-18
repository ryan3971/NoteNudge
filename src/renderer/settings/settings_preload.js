const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
    onLoadSettings: () => ipcRenderer.invoke('load-settings'),
    handleApplySettings: (reminderTime, snoozeTime, startTime, endTime) => ipcRenderer.send('apply-settings', reminderTime, snoozeTime, startTime, endTime),
    openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
    handleOpenAdvancedSettings: () => ipcRenderer.send('open-advanced-settings'),
    handleCloseApplication: () => ipcRenderer.send('close-settings'),
});

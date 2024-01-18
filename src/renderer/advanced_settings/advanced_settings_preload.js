const { contextBridge, ipcRenderer } = require("electron/renderer");

contextBridge.exposeInMainWorld("electronAPI", {
    onLoadAdvancedSettings: () => ipcRenderer.invoke("load-advanced-settings"),
	handleApplyAdvancedSettings: (days_settings) => ipcRenderer.send("apply-advanced-settings", days_settings),
});

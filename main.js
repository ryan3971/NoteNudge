const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path')
const { spawn } = require('child_process');

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    titleBarStyle: 'hidden',
    titleBarOverlay: true,
    alwaysOnTop: true,
    // webPreferences: {
    //   nodeIntegration: true,
    //   enableRemoteModule: true,
    // },
  })

  ipcMain.on('save-entry', (event, title) => {
    const webContents = event.sender
    const win = BrowserWindow.fromWebContents(webContents)
    win.setTitle(title)
  })

  win.loadFile('index.html')
}

app.whenReady().then(createWindow)

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
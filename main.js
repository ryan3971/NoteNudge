const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path')

function createWindow () {
  const win = new BrowserWindow({
    width: 100,
    height: 100,
  //  titleBarStyle: 'hidden',
  //  titleBarOverlay: false,
  //  alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
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

// Listen for button-clicked events from renderer process
ipcMain.on('button-click', (event, button_click) => {
  console.log(`Button ${button_click} clicked in the main process!`);
  // Handle Button 1 event here
});
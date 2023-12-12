const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('node:path')

let mainWindow 

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 100,
    height: 100,
    titleBarStyle: 'visible',
  //  titleBarOverlay: false,
  //  alwaysOnTop: true,
    webPreferences: {
       preload: path.join(__dirname, 'preload.js')
     }
  })

  mainWindow.loadFile('index.html')
}
// Function to set the timer to reopen the application
function setReopenTimer() {
  
  // Set the timer for 30 minutes (30 minutes * 60 seconds * 1000 milliseconds)
  const reopenDelay = 3000//30 * 60 * 1000;

  // Create the timer
  reopenTimer = setTimeout(() => {
    createWindow();
  }, reopenDelay);
}

// Called when the application is ready to start. Anything nested here will be able to run when the application is ready to start.
app.on('ready', () => {
  console.log(`ready`);
  createWindow();

  // called when the window is closing
  app.on('before-quit', (event) => {
    console.log(`before-quit`);
    // Override the default behavior of closing the window
    event.preventDefault()
    setReopenTimer()
  });
});

// Listen for button-clicked events from renderer process - close-application
ipcMain.on('close-application', (event) => {
  console.log(`close-application`);
  console.log(`Button clicked in the main process!`);

  // Handle closing the application here
  mainWindow.close();
  setReopenTimer();
});
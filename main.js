const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('node:path')

let mainWindow 
let tray = null

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

function createTray() {
  const trayIcon = path.join(__dirname, 'public/images/icon.png');
  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open',
      click: () => {
        if (!mainWindow) {
          createWindow();
        }
        mainWindow.show();
      },
    },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.exit(); // All windows will be closed immediately without asking the user, and the before-quit and will-quit events will not be emitted
      },
    },
  ]);

  tray.setToolTip('My Electron App');
  tray.setContextMenu(contextMenu);

  // Show the window when the tray icon is clicked
  // tray.on('click', () => {
  //   if (!mainWindow) {
  //     createMainWindow();
  //   }
  //   mainWindow.show();
  // });
}



// Function to set the timer to reopen the application
function setReopenTimer() {
  
  // Set the timer for 30 minutes (30 minutes * 60 seconds * 1000 milliseconds)
  const reopenDelay = 3000//30 * 60 * 1000;

  // Create the timer
  reopenTimer = setTimeout(() => {
    if (!mainWindow) {
      createWindow();
    }
  }, reopenDelay);
}

// Called when the application is ready to start. Anything nested here will be able to run when the application is ready to start.
app.on('ready', () => {
  console.log(`ready`);
  createWindow();
  createTray()
 
  // called when the window is closing
  app.on('before-quit', (event) => {
    console.log(`before-quit`);
    event.preventDefault()

    // set mainWindow to null so that the application doesn't try to reopen it
    mainWindow = null;

    // Override the default behavior of closing the window
    setReopenTimer()
  });
});

// Listen for button-clicked events from renderer process - close-application
ipcMain.on('close-application', (event) => {
  console.log(`close-application`);
  console.log(`Button clicked in the main process!`);

  // Handle closing the application here
  mainWindow.close(); // Try to close the window. This has the same effect as a user manually clicking the close button of the window
});
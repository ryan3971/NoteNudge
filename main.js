const { app, 
        BrowserWindow, 
        Tray, 
        Menu, 
        ipcMain, 
        screen,
      } = require('electron/main');
      
const path = require('node:path')
const settings = require('electron-settings');



let mainWindow
let settingsWindow

let toggleSwitch
let shutdownButton
let timeInput

// Function to create the main window
function createMainWindow () {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 200,
    webPreferences: {
       preload: path.join(__dirname, 'preload.js'),
     }
  })

  mainWindow.loadFile('index.html')

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function createSettingsWindow() {
  settingsWindow = new BrowserWindow({
    width: 400,
    height: 300,
    webPreferences: {
      nodeIntegration: true
    }
  });

  settingsWindow.loadFile('settings-window.html');

  settingsWindow.on('closed', function () {
    settingsWindow = null;
  });
}

// Called when the application is ready to start. Anything nested here will be able to run when the application is ready to start.
app.whenReady().then(() => {
  console.log(`ready`);
  createMainWindow();

  // called when the window is closing
  app.on('before-quit', (event) => {
    console.log(`before-quit`);
    // Save your settings before quitting
    settings.set('toggleSwitch', document.getElementById('toggleSwitch').checked);
    settings.set('shutdownButton', document.getElementById('shutdownButton').checked);
    settings.set('timeInput', document.getElementById('timeInput').value);
    // Add logic to save days and time ranges
  });
});

// Listen for button-clicked events from renderer process - close-application
ipcMain.on('close-application', (event) => {
  console.log(`close-application`);
  console.log(`Button clicked in the main process!`);

  // Handle closing the application here
  mainWindow.close(); // Try to close the window. This has the same effect as a user manually clicking the close button of the window
  mainWindow = null; // Set mainWindow to null so that the application doesn't try to reopen it
  setReopenTimer(reminder_delay)
});

ipcMain.on('open-settings', (event) => {
  console.log(`open-settings`);
  mainWindow.close(); // Try to close the window. This has the same effect as a user manually clicking the close button of the window
  mainWindow = null; // Set mainWindow to null so that the application doesn't try to reopen it
  createSettingsWindow();
});



settingsWindow.webContents.on('did-finish-load', () => {
  // Retrieve your settings when the app starts
  toggleSwitch = settings.get('toggleSwitch') || false;
  shutdownButton = settings.get('shutdownButton') || false;
  timeInput = settings.get('timeInput') || '';

  settingsWindow.webContents.send('load-settings', { toggleSwitch, 
                                                     shutdownButton, 
                                                     timeInput });
});
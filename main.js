const { app, 
        BrowserWindow, 
        Tray, 
        Menu, 
        ipcMain, 
        screen,
      } = require('electron/main');
      
const path = require('node:path')

const {spawn} = require('child_process');


let mainWindow 
let toolbarWindow
let tray = null

// Additional offset from the bottom-right corner of the screen for the toolbar window
const offset_x = 100
const offset_y = 100

// Set the timer for 30 minutes (30 minutes * 60 seconds * 1000 milliseconds)
const reminder_delay = 3000//30 * 60 * 1000;
const snooze_delay = 1000

// Function to create the main window
function createMainWindow () {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 200,
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
    show: false,
    skipTaskbar: true,
    webPreferences: {
       preload: path.join(__dirname, 'preload.js'),
     }
  })

  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screen_width, height: screen_height } = primaryDisplay.workAreaSize
  const [window_width, window_height ] = mainWindow.getSize()

  // Calculate the position for the bottom-right corner
  const x = screen_width - window_width - offset_x;   // Adjust this value based on your window width
  const y = screen_height - window_height - offset_y; // Adjust this value based on your window height
  // Set the window position
  mainWindow.setPosition(x, y);

  mainWindow.loadFile('index.html')
}

// Function to create the toolbar window
function createToolbarWindow () {
  toolbarWindow = new BrowserWindow({
    width: 100,
    height: 100,
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
    alwaysOnTop: true,
    show: false,
    skipTaskbar: true,
    webPreferences: {
       preload: path.join(__dirname, 'toolbar/toolbar_preload.js'),
       nodeIntegration: true
     }
  });

  // Note: electron cannot be called until the app is ready
  // Position the window in the bottom-right corner of the screen
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screen_width, height: screen_height } = primaryDisplay.workAreaSize
  const [toolbar_width, toolbar_height ] = toolbarWindow.getSize()

  // Calculate the position for the bottom-right corner
  const x = screen_width - toolbar_width - offset_x;   // Adjust this value based on your window width
  const y = screen_height - toolbar_height - offset_y; // Adjust this value based on your window height
  console.log(`x: ${x}, y: ${y}`);
  // Set the window position
  toolbarWindow.setPosition(x, y);

  toolbarWindow.loadFile('toolbar/toolbar-window.html')

  toolbarWindow.once('ready-to-show', () => {
    toolbarWindow.show()
  })
}

function createSettingsWindow() {
  secondWindow = new BrowserWindow({
    width: 400,
    height: 300,
    webPreferences: {
      nodeIntegration: true
    }
  });

  secondWindow.loadFile('settings-window.html');

  secondWindow.on('closed', function () {
    secondWindow = null;
  });
}

// Function to create the traybar window
function createTray() {
  const trayIcon = path.join(__dirname, 'public/images/icon.png');
  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open',
      click: () => {
        if (!mainWindow) {
          createMainWindow();
          //animateMainWindow();
          mainWindow.once('ready-to-show', () => {
            mainWindow.show()
          })
        }
        //mainWindow.show();
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
function setReopenTimer(reopenDelay) {
  
  // Create the timer
  reopenTimer = setTimeout(() => {
    if (!toolbarWindow) {
      createToolbarWindow();
    }
  }, reopenDelay);
}

// function animateMainWindow() {
//   let width = 0;
//   let height = 0;

//   mainWindow.show();

//   const interval = setInterval(() => {
//     width += 10;
//     height += 5;

//     mainWindow.setSize(width, height);

//     if (width >= 400) {
//       clearInterval(interval);
//     }
//   }, 10);
// }

// Called when the application is ready to start. Anything nested here will be able to run when the application is ready to start.
app.whenReady().then(() => {
  console.log(`ready`);
  createToolbarWindow();
  createMainWindow();
  createTray()

  // called when the window is closing
  app.on('before-quit', (event) => {
    console.log(`before-quit`);
    event.preventDefault()
  });
});

// Listen for button-clicked events from renderer process
ipcMain.on('button-click', (event, button_click) => {
  console.log(`Button ${button_click} clicked in the main process!`);
  
  // Handle Button 1 event here
  if (button_click === 1) {
    console.log(`button-1`);
    
    // Close the toolbar window and open the main window
    toolbarWindow.close();
    toolbarWindow = null;
    //createMainWindow();
    //animateMainWindow();
    mainWindow.show();

  // Snooze the reminder
  }else if (button_click === 2) {
    console.log(`button-2`);
    toolbarWindow.close();
    toolbarWindow = null;
    setReopenTimer(reminder_delay)

  // Handle Button 1 event here
  }else if (button_click === 3) {
    console.log(`button-3`);
    toolbarWindow.close();
    toolbarWindow = null;
    setReopenTimer(snooze_delay)
  
  // Handle Button 1 event here
  }else if (button_click === 4) {
    console.log(`button-4`);
    toolbarWindow.close();
    toolbarWindow = null;
    app.isQuitting = true;
    app.exit();
  }
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

// Listen for button-clicked events from renderer process - close-application
ipcMain.on('submit-entry', (event, entry) => {
  console.log(`submit-entry`);

  // Use spawn to run the Python script
  const pythonProcess = spawn('python', ["word_doc.py", entry]);

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python script output: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python script error: ${data}`);
  });
});

ipcMain.on('open-settings', (event) => {
  console.log(`open-settings`);
  createSettingsWindow();
});
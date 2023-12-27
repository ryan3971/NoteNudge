const { app, BrowserWindow, Tray, Menu, ipcMain, screen } = require("electron/main");

const path = require("node:path");

const { spawn } = require("child_process");

let mainWindow;
let toolbarWindow;

let tray = null;

// Additional offset from the bottom-right corner of the screen for the toolbar window
const offset_x = 100;
const offset_y = 100;

// Set the timer for 30 minutes (30 minutes * 60 seconds * 1000 milliseconds)
const reminder_delay = 3000; //30 * 60 * 1000;
const snooze_delay = 1000;

// Constaant Variables
const BUTTON_MAINWINDOW = 1;
const BUTTON_SKIP = 2;
const BUTTON_SNOOZE = 3;
const BUTTON_SHUTDOWN = 4;

// Function to create the main window
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 400,
        height: 200,
        titleBarStyle: "hidden",
        titleBarOverlay: false,
        show: false,
        skipTaskbar: true,
        webPreferences: {
            preload: path.join(__dirname, "renderer/preload.js"),
        },
    });

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screen_width, height: screen_height } = primaryDisplay.workAreaSize;
    const [window_width, window_height] = mainWindow.getSize();

    // Calculate the position for the bottom-right corner
    const x = screen_width - window_width - offset_x; // Adjust this value based on your window width
    const y = screen_height - window_height - offset_y; // Adjust this value based on your window height
    // Set the window position
    mainWindow.setPosition(x, y);

    mainWindow.loadFile(path.join(__dirname, "renderer/index.html"));

    // Shows the window once everything within is loaded (stops it from showing individual elements one by one)
    mainWindow.once("ready-to-show", () => {
        mainWindow.show();
    });

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}

// Function to create the toolbar window
function createToolbarWindow() {
    toolbarWindow = new BrowserWindow({
        width: 100,
        height: 100,
        titleBarStyle: "hidden",
        titleBarOverlay: false,
        alwaysOnTop: true,
        show: false,
        skipTaskbar: true,
        webPreferences: {
            preload: path.join(__dirname, "renderer/toolbar/toolbar_preload.js"),
            nodeIntegration: true,
        },
    });

    // Note: electron cannot be called until the app is ready
    // Position the window in the bottom-right corner of the screen
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screen_width, height: screen_height } = primaryDisplay.workAreaSize;
    const [toolbar_width, toolbar_height] = toolbarWindow.getSize();

    // Calculate the position for the bottom-right corner
    const x = screen_width - toolbar_width - offset_x; // Adjust this value based on your window width
    const y = screen_height - toolbar_height - offset_y; // Adjust this value based on your window height
    // Set the window position
    toolbarWindow.setPosition(x, y);

    toolbarWindow.loadFile(path.join(__dirname, "renderer/toolbar/toolbar-window.html"));

    // Shows the window once everything within is loaded (stops it from showing individual elements one by one)
    toolbarWindow.once("ready-to-show", () => {
        toolbarWindow.show();
    });

    toolbarWindow.on("closed", () => {
        toolbarWindow = null;
    });
}

// Function to create the traybar window
function createTray() {
    const trayIcon = path.join(__dirname, "assets/images/icon.png");
    tray = new Tray(trayIcon);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: "Open",
            click: () => {
                console.log(`Tray Open clicked!`);
                // don't do anything if the main window is already open
                if (mainWindow.isVisible()) { return; }

                // close the toolbar if it is open
                if (toolbarWindow) {
                    toolbarWindow.close();
                } else {
                    // shutdown the reopen timer and open the main window
                    clearTimeout(reopenTimer);                  // Clear the timer
                }
                mainWindow.show();

            },
        },
        {
            label: "Quit",
            click: () => {
                console.log(`Tray Quit clicked!`);
                //  app.isQuitting = true;
                app.exit(); // All windows will be closed immediately without asking the user, and the before-quit and will-quit events will not be emitted
            },
        },
    ]);
    tray.setToolTip("My Electron App");
    tray.setContextMenu(contextMenu);
}

// Function to set the timer to reopen the application
function setReopenTimer(reopenDelay) {
    // Create the timer
    reopenTimer = setTimeout(() => {
        createToolbarWindow();
    }, reopenDelay);
}

// Called when the application is ready to start. Anything nested here will be able to run when the application is ready to start.
app.whenReady().then(() => {
    console.log(`ready`);
    createToolbarWindow();
    createMainWindow();
    createTray();

    // called when the window is closing
    app.on("before-quit", (event) => {
        console.log(`before-quit`);
        event.preventDefault();
    });
});

// Listen for button-clicked events from renderer process
ipcMain.on("button-click", (event, button_click) => {
    console.log(`Button ${button_click} clicked in the main process!`);

    // Handle Button 1 event here
    if (button_click === BUTTON_MAINWINDOW) {
        console.log(`button-1-mainWindow`);

        // Close the toolbar window and open the main window
        toolbarWindow.close();
        mainWindow.show();

        // Skip the reminder
    } else if (button_click === BUTTON_SKIP) {
        console.log(`button-2-skip`);
        toolbarWindow.close();
        setReopenTimer(reminder_delay);

        // Snooze the reminder
    } else if (button_click === BUTTON_SNOOZE) {
        console.log(`button-3-snooze`);
        toolbarWindow.close();
        setReopenTimer(snooze_delay);

        // Shutdown application
    } else if (button_click === BUTTON_SHUTDOWN) {
        console.log(`button-4-shutdown`);
        toolbarWindow.close();
        //app.isQuitting = true;
        app.exit();
    }
});

// Listen for button-clicked events from renderer process - close-application
ipcMain.on("close-application", (event) => {
    console.log(`close-application`);

    // Handle closing the application here
    mainWindow.close(); // Try to close the window. This has the same effect as a user manually clicking the close button of the window
    setReopenTimer(reminder_delay);
});

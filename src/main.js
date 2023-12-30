/**
 * Settings are set synchronously, meaning that the settings are set before the function returns. (something to double check)
 *
 */

const { app, BrowserWindow, Tray, Menu, ipcMain, screen } = require("electron/main");

const path = require("node:path");

const { spawn } = require("child_process");

const screenshot = require("screenshot-desktop");
const sharp = require("sharp");

const DatauriParser = require("datauri/parser");

const settings = require("electron-settings");

let mainWindow;
let toolbarWindow;
let croppingWindow;
let settingsWindow;

let trayBar = null;

// Additional offset from the bottom-right corner of the screen for the toolbar window
const window_offset_x = 75;
const window_offset_y = 50;

// Set the timer for 30 minutes (30 minutes * 60 seconds * 1000 milliseconds)
const reminder_delay = 3000; //30 * 60 * 1000;
const snooze_delay = 1000;

// Constaant Variables
const BUTTON_MAIN_WINDOW = 1;
const BUTTON_SKIP = 2;
const BUTTON_SNOOZE = 3;
const BUTTON_CLOSE = 4;

let setting_reminder_time;
let setting_snooze_tim;
let setting_start_time;
let setting_end_time;
let setting_folder_path;

/*--------Window Creation Functions--------*/

// Function to create the main window
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 400,
        titleBarStyle: "hidden",
        titleBarOverlay: false,
        frame: false,
        resizable: false,
        show: false,
        skipTaskbar: true,
        webPreferences: {
            preload: path.join(__dirname, "renderer/preload.js"),
            nodeIntegration: true,
            contextIsolation: true,
        },
    });

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screen_width, height: screen_height } = primaryDisplay.workAreaSize;
    const [window_width, window_height] = mainWindow.getSize();

    // Calculate the position for the bottom-right corner
    const x = screen_width - window_width - window_offset_x; // Adjust this value based on your window width
    const y = screen_height - window_height - window_offset_y; // Adjust this value based on your window height
    // Set the window position
    mainWindow.setPosition(x, y);

    mainWindow.loadFile(path.join(__dirname, "renderer/index.html"));

    // Shows the window once everything within is loaded (stops it from showing individual elements one by one)
    // mainWindow.once("ready-to-show", () => {
    //     mainWindow.show();
    // });

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}

// Function to create the toolbar window
function createToolbarWindow() {
    toolbarWindow = new BrowserWindow({
        width: 150,
        height: 150,
        frame: false,
        titleBarStyle: "hidden",
        titleBarOverlay: false,
        alwaysOnTop: true,
        show: false,
        opacity: 0,
        skipTaskbar: true,
        //        transparent: true,
        resizable: false,
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
    const x = screen_width - toolbar_width - window_offset_x; // Adjust this value based on your window width
    const y = screen_height - toolbar_height - window_offset_y; // Adjust this value based on your window height
    // Set the window position
    toolbarWindow.setPosition(x, y);

    toolbarWindow.loadFile(path.join(__dirname, "renderer/toolbar/toolbar-window.html"));

    // Shows the window once everything within is loaded (stops it from showing individual elements one by one)
    toolbarWindow.once("ready-to-show", () => {
        toolbarWindow.show();
        fadeInWindow(toolbarWindow);
    });

    toolbarWindow.on("closed", () => {
        //    fadeOutWindow(toolbarWindow);
        //    toolbarWindow = null;
    });
}

function createCroppingWindow() {
    croppingWindow = new BrowserWindow({
        width: screen.getPrimaryDisplay().bounds.width,
        height: screen.getPrimaryDisplay().bounds.height,
        x: 0,
        y: 0,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, "renderer/selection/selectionPreload.js"),
        },
    });

    croppingWindow.setIgnoreMouseEvents(false); // Set to true to ignore mouse events when the window is clicked

    croppingWindow.on("closed", function () {
        croppingWindow = null;
    });

    croppingWindow.loadFile(path.join(__dirname, "renderer/selection/selectionWindow.html"));
}

function createSettingsWindow() {
    settingsWindow = new BrowserWindow({
        width: 350,
        height: 450,
        frame: false,
        titleBarStyle: "hiddenInset",
        parent: mainWindow,
        modal: true, // Have it so nothing else can be selected until the settings window is closed
        center: true,
        show: false,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, "renderer/settings/settings_preload.js"),
        },
    });

    settingsWindow.loadFile(path.join(__dirname, "renderer/settings/settings-window.html"));
//    settingsWindow.setResizable(false);

    settingsWindow.webContents.on("did-finish-load", () => {
        console.log(`did-finish-load`);
    });

    // settingsWindow.on("closed", function () {
    //     settingsWindow = null;
    // });
}

// Function to create the traybar window
function createTrayBar() {
    const trayIcon = path.join(__dirname, "assets/images/icon.png");
    trayBar = new Tray(trayIcon);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: "Open",
            click: () => {
                console.log(`Tray Open clicked!`);
                // don't do anything if the main window is already open
                if (mainWindow.isVisible()) {
                    return;
                }

                // close the toolbar if it is open
                if (toolbarWindow) {
                    toolbarWindow.close();
                } else {
                    // shutdown the reopen timer and open the main window
                    clearTimeout(reopenTimer); // Clear the timer
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
    trayBar.setToolTip("My Electron App");
    trayBar.setContextMenu(contextMenu);
}

// Function to set the timer to reopen the application
function setReopenTimer(reopenDelay) {
    // Create the timer
    reopenTimer = setTimeout(() => {
        createToolbarWindow();
    }, reopenDelay);
}

/*--------Animation Functions--------*/

function fadeInWindow(window) {
    let opacity = 0;
    const interval = setInterval(() => {
        if (opacity < 1) {
            opacity += 0.05; // Adjust the increment to control the fade-in speed
            window.setOpacity(opacity);
        } else {
            clearInterval(interval);
        }
    }, 50); // Adjust the interval to control the fade-in smoothness
}

function fadeOutWindow(window) {
    let opacity = 1;
    const interval = setInterval(() => {
        if (opacity > 0) {
            opacity -= 0.05; // Adjust the increment to control the fade-in speed
            window.setOpacity(opacity);
        } else {
            clearInterval(interval);
            window = null;
        }
    }, 50); // Adjust the interval to control the fade-in smoothness
}

/*--------Settings Functions--------*/

// Function to initialize settings
function initializeSettings() {
    setting_reminder_time = settings.getSync("reminder_time_setting");
    setting_snooze_tim = settings.getSync("snooze_time_setting");
    setting_start_time = settings.getSync("start_time_setting");
    setting_end_time = settings.getSync("end_time_setting");
    setting_folder_path = settings.getSync("folder_path_setting");
}

// Called when the application is ready to start. Anything nested here will be able to run when the application is ready to start.
// This is only going to run on start up of application - double check what should go here
app.whenReady().then(() => {
    console.log(`ready`);
    createToolbarWindow();
    createMainWindow();

    ipcMain.handle("open-folder-dialog", handleFolderOpen);         // Handle folder open dialog
    ipcMain.handle("load-settings", handleLoadSettings);            // Handle loading settings

    createTrayBar();
    createCroppingWindow();
    initializeSettings();
    createSettingsWindow();

    // called when the window is closing
    app.on("before-quit", (event) => {
        console.log(`before-quit`);
        event.preventDefault();
    });
});

/*--------Taskbar Event Listeners--------*/
// Listen for button-clicked events from renderer process
ipcMain.on("taskbar-event", (event, taskbar_event) => {
    console.log(`taskbar-event`);

    // Handle Button 1 event here
    if (taskbar_event === BUTTON_MAIN_WINDOW) {
        console.log(`BUTTON_MAIN_WINDOW`);

        // Close the toolbar window and open the main window
        toolbarWindow.close();
        mainWindow.show();

        // Skip the reminder
    } else if (taskbar_event === BUTTON_SKIP) {
        console.log(`BUTTON_SKIP`);
        toolbarWindow.close();
        setReopenTimer(reminder_delay);

        // Snooze the reminder
    } else if (taskbar_event === BUTTON_SNOOZE) {
        console.log(`BUTTON_SNOOZE`);
        toolbarWindow.close();
        setReopenTimer(snooze_delay);

        // Shutdown application
    } else if (taskbar_event === BUTTON_CLOSE) {
        console.log(`BUTTON_CLOSE`);
        toolbarWindow.close();
        app.exit();
    }
});

/*--------Cropping Event Listeners--------*/

ipcMain.on("crop-image", async (event) => {
    console.log(`crop-image`);
    mainWindow.hide();
    croppingWindow.show();
});

ipcMain.on("capture-selection", async (event, left, top, width, height) => {
    console.log(`capture-selection`);
    croppingWindow.hide();
    try {
        // Capture the screenshot
        screenshot().then(async (img) => {
            // get the dimensions of the screen and the image, then calculate the crop dimensions
            // Not sure how good of a solution this is - double check (and take rect border into account)
            const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().bounds;
            const { width: imgWidth, height: imgHeight } = await sharp(img).metadata();

            scaledLeft = Math.round((left / screenWidth) * imgWidth);
            scaledTop = Math.round((top / screenHeight) * imgHeight);
            scaledWidth = Math.round((width / screenWidth) * imgWidth);
            scaledHeight = Math.round((height / screenHeight) * imgHeight);

            // Crop the image and convert to png format (png format is necessary for the saving to docx)
            const croppedImgBuffer = await sharp(img)
                .png()
                .extract({
                    left: scaledLeft,
                    top: scaledTop,
                    width: scaledWidth,
                    height: scaledHeight,
                })
                .toBuffer();

            const parser = new DatauriParser();
            const dataUrl = parser.format(".png", croppedImgBuffer).content;

            mainWindow.webContents.send("image-captured", dataUrl);

            // Hide the selection window and show the main window
            croppingWindow.hide();
            mainWindow.show();
            console.log(`Screenshot saved`);
        });
    } catch (err) {
        console.error("Error capturing screenshot:", err);
    }
});


/*--------Entry Submission Event Listeners--------*/

ipcMain.on("submit-entry", async (event, content) => {
    console.log(`submit-entry`);

    const save_folder_path = path.join(setting_folder_path, "Daily Log.docx"); // Replace with settings value

    const pythonProcess = spawn("python", [path.join(__dirname, "assets/scripts/", "word_doc.py")], {
        stdio: ["pipe", "pipe", "pipe"],
    });

    jsonString = JSON.stringify({ content: content });

    // Send JSON data to Python script through stdin
    pythonProcess.stdin.write(jsonString);
    pythonProcess.stdin.write("\n"); // Needed to separate the JSON data from the file path
    pythonProcess.stdin.write(save_folder_path);
    pythonProcess.stdin.end();

    pythonProcess.stdout.on("data", (data) => {
        console.log(`Python script output: ${data}`);
    });

    pythonProcess.stderr.on("data", (data) => {
        console.error(`Python script error: ${data}`);
    });

    // Handle exit event
    pythonProcess.on("exit", (code) => {
        console.log(`Python script exited with code ${code}`);
    });
});

/*--------Settings Event Listeners--------*/

// Entry point for settings
ipcMain.on("open-settings", (event) => {
    console.log(`open-settings`);
    settingsWindow.show();
});

// Function to handle loading settings
async function handleLoadSettings() {
    console.log(`load-settings`);
    return [setting_reminder_time, setting_snooze_tim, setting_start_time, setting_end_time, setting_folder_path];
}

// Function to handle opening folder dialog (async)
async function handleFolderOpen() {
    // Open file system dialog
    const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ["openDirectory"] });
    const selectedFolder = filePaths[0];
    if (!canceled) {
        console.log("Selected Folder:", selectedFolder);
        // Save folder path
        settings.set("folder_path_setting", selectedFolder);
        setting_folder_path = selectedFolder;
        // Send selected folder path to main window
        return selectedFolder;
    }
}

// Function to update the settings
ipcMain.on("apply-settings", (event, reminderTime, snoozeTime, startTime, endTime) => {
    console.log(`apply-settings`);
    // Save settings values
    settings.setSync("reminder_time_setting", reminderTime);
    settings.setSync("snooze_time_setting", snoozeTime);
    settings.setSync("start_time_setting", startTime);
    settings.setSync("end_time_setting", endTime);

    // Update settings values
    setting_reminder_time = reminderTime;
    setting_snooze_tim = snoozeTime;
    setting_start_time = startTime;
    setting_end_time = endTime;
});

// Exit point for settings
ipcMain.on("close-settings", (event) => {
    console.log(`close-settings`);
    settingsWindow.hide();
});

/*--------General Main Window Event Listeners--------*/

ipcMain.on("skip-entry", (event) => {
    console.log(`skip-entry`);
    // Logic for skipping entry
});

ipcMain.on("snooze-entry", (event) => {
    console.log(`snooze-entry`);
    // Logic for snoozing entry
});

/*--------General Application Event Listeners--------*/

// Listen for button-clicked events from renderer process - close-application
ipcMain.on("close-application", (event) => {
    console.log(`close-application`);

    // Handle closing the application here
    mainWindow.close(); // Try to close the window. This has the same effect as a user manually clicking the close button of the window
    setReopenTimer(reminder_delay);
});


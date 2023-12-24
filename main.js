/**
 * Settings are set synchronously, meaning that the settings are set before the function returns. (something to double check)
 * 
 */

const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
} = require("electron/main");

const path = require("node:path");
const settings = require("electron-settings");

let mainWindow;
let settingsWindow;

let reminder_time_setting;
let snooze_time_setting;
let start_time_setting;
let end_time_setting;
let folder_path_setting;

// Function to create the main window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 200,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile("index.html");

  mainWindow.on("closed", function () {
    mainWindow = null;
  });
}

function createSettingsWindow() {
  settingsWindow = new BrowserWindow({
    width: 400,
    height: 800,
    frame: false,
    titleBarStyle: "hiddenInset",
    parent: mainWindow,
    modal: true,      // Have it so nothing else can be selected until the settings window is closed
    webPreferences: {
      preload: path.join(__dirname, "settings/settings_preload.js"),
    },
  });

  settingsWindow.loadFile("settings/settings-window.html");

  settingsWindow.webContents.on("did-finish-load", () => {
    console.log(`did-finish-load`);
  });

  settingsWindow.on("closed", function () {
    settingsWindow = null;
  });
}

// Function to initialize settings
function initializeSettings() {
  reminder_time_setting = settings.getSync("reminder_time_setting");
  snooze_time_setting = settings.getSync("snooze_time_setting");
  start_time_setting = settings.getSync("start_time_setting");
  end_time_setting = settings.getSync("end_time_setting");
  folder_path_setting = settings.getSync("folder_path_setting");
}

// Called when the application is ready to start. Anything nested here will be able to run when the application is ready to start.
app.whenReady().then(() => {
  console.log(`ready`);
  ipcMain.handle('open-folder-dialog', handleFolderOpen)  // Handle folder open dialog
  ipcMain.handle('load-settings', handleLoadSettings)   // Handle loading settings
  initializeSettings();
  createMainWindow();
});

ipcMain.on("open-settings", (event) => {
  console.log(`open-settings`);
  createSettingsWindow();
});

ipcMain.on("close-settings", (event) => {
  console.log(`close-settings`);
  settingsWindow.close();
});

// Function to handle loading settings
async function handleLoadSettings() {
  console.log(`load-settings`);
  console.log(`reminder_time_setting: ${reminder_time_setting}`);
  return [
    reminder_time_setting,
    snooze_time_setting,
    start_time_setting,
    end_time_setting,
    folder_path_setting,
  ];
}

// Function to handle opening folder dialog (async)
async function handleFolderOpen() {
  // Open file system dialog
  const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ["openDirectory"] })
  const selectedFolder = filePaths[0];
  if (!canceled) {
    console.log("Selected Folder:", selectedFolder);
    // Save folder path
    settings.set("folder_path_setting", selectedFolder);
    folder_path_setting = selectedFolder;
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
    reminder_time_setting = reminderTime;
    snooze_time_setting = snoozeTime;
    start_time_setting = startTime;
    end_time_setting = endTime;

    console.log(`reminder_time_setting: ${reminder_time_setting}`);

  }
);

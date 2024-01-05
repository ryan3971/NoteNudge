/**
 * Settings are set synchronously, meaning that the settings are set before the function returns. (something to double check)
 *
 */

const { app, BrowserWindow, Tray, Menu, ipcMain, dialog, screen, nativeImage } = require("electron/main");
if (require("electron-squirrel-startup")) app.quit(); // Required by electron-forge
Menu.setApplicationMenu(null);	// Remove the default menu bar - will speed up the application on startup

// require("v8-compile-cache");

const path = require("node:path");
const { spawn } = require("child_process");
const screenshot = require("screenshot-desktop");
const DatauriParser = require("datauri/parser");
const settings = require("electron-settings");

let mainWindow;
let toolbarWindow;
let croppingWindow;
let settingsWindow;
let trayBar = null;

// Set the timer for 30 minutes (30 minutes * 60 seconds * 1000 milliseconds)
// const reminder_delay = 3000; //30 * 60 * 1000;
// const snooze_delay = 1000;

let interval;

// Constant Variables
const BUTTON_MAIN_WINDOW = 1;
const BUTTON_SKIP = 2;
const BUTTON_SNOOZE = 3;
const BUTTON_CLOSE = 4;

// Entry Submission Variables
const ENTRY_SUBMISSION_SUCCESS = 1;
const ENTRY_SUBMISSION_FAILURE_FILE_OPEN = 2;
const ENTRY_SUBMISSION_FAILURE_UNKNOWN = 3;

let setting_reminder_time;
let setting_snooze_time;
let setting_start_time;
let setting_end_time;
let setting_folder_path;

/*--------Window Creation Functions--------*/

// Function to create the main window
function createMainWindow() {
	mainWindow = new BrowserWindow({
		width: 900,
		height: 400,
		titleBarStyle: "hidden", // Results in a hidden title bar and a full size content window
		frame: false, // Creates a frameless window
		resizable: false,
		show: false,
		//	skipTaskbar: true, // Don't show the window in the taskbar
		webPreferences: {
			preload: path.join(__dirname, "renderer/preload.js"),
		},
	});

	// Set the window position
	const [x, y] = setWindowPosition(mainWindow);
	mainWindow.setPosition(x, y);

	mainWindow.loadFile(path.join(__dirname, "renderer/index.html"));

	mainWindow.on("closed", () => {
		mainWindow = null;
	});
}

// Function to create the toolbar window
function createToolbarWindow() {
	toolbarWindow = new BrowserWindow({
		width: 150,
		height: 150,
		frame: false, // Creates a frameless window
		titleBarStyle: "hidden", // Results in a hidden title bar and a full size content window
		alwaysOnTop: true, // Make the window stay on top of all other windows
		show: false, // Don't show the window when it is created
		opacity: 0, // Set the opacity to 0 so that the window is not visible when it is created
		skipTaskbar: true, // Don't show the window in the taskbar
		resizable: false, // Don't allow the window to be resized
		transparent: true, // Make the window transparent
		webPreferences: {
			preload: path.join(__dirname, "renderer/toolbar/toolbar_preload.js"),
		},
	});

	// Set the window position
	const [x, y] = setWindowPosition(toolbarWindow);
	toolbarWindow.setPosition(x, y);

	toolbarWindow.loadFile(path.join(__dirname, "renderer/toolbar/toolbar-window.html"));

	// Shows the window once everything within is loaded (stops it from showing individual elements one by one)
	toolbarWindow.once("ready-to-show", () => {
		toolbarWindow.show();
		fadeInWindow(toolbarWindow);
	});

	// toolbarWindow.on("closed", () => {
	// 	//    fadeOutWindow(toolbarWindow);
	// 	//toolbarWindow = null;
	// });
}

function createCroppingWindow() {
	croppingWindow = new BrowserWindow({
		width: screen.getPrimaryDisplay().bounds.width,
		height: screen.getPrimaryDisplay().bounds.height,
		x: 0,
		y: 0,
		frame: false, // Creates a frameless window
		transparent: true, // Make the window transparent
		alwaysOnTop: true, // Make the window stay on top of all other windows
		show: false, // Don't show the window when it is created
		webPreferences: {
			preload: path.join(__dirname, "renderer/crop/crop_preload.js"),
		},
	});

	croppingWindow.setIgnoreMouseEvents(false); // Set to true to ignore mouse events when the window is clicked

	croppingWindow.loadFile(path.join(__dirname, "renderer/crop/crop-window.html"));

	croppingWindow.on("closed", function () {
		croppingWindow = null;
	});
}

function createSettingsWindow() {
	settingsWindow = new BrowserWindow({
		width: 380,
		height: 450,
		frame: false, // Creates a frameless window
		titleBarStyle: "hidden", // Results in a hidden title bar and a full size content window
		parent: mainWindow, // Makes the settings window a child of the main window
		modal: true, // Have it so nothing else can be selected until the settings window is closed
		center: true, // Center the window
		show: false, // Don't show the window when it is created
		resizable: false, // Don't allow the window to be resized
		webPreferences: {
			preload: path.join(__dirname, "renderer/settings/settings_preload.js"),
		},
	});

	settingsWindow.loadFile(path.join(__dirname, "renderer/settings/settings-window.html"));

	settingsWindow.on("closed", function () {
		settingsWindow = null;
	});
}

// Function to create the traybar window
function createTrayBar() {
	const trayIcon = path.join(__dirname, "assets/icons/icon.png");
	trayBar = new Tray(trayIcon);

	const contextMenu = Menu.buildFromTemplate([
		{
			label: "Open",
			click: () => {
				console.log(`Tray Open clicked!`);

				// Cancel the reopen timer, create & open the main window, initialize other windows, and destroy the tray bar
				clearTimeout(reopenTimer); // Clear the timer

				createMainWindow();

				mainWindow.once("ready-to-show", () => {
					console.log(`main - ready-to-show`);
					mainWindow.show();

					createSettingsWindow();
					createCroppingWindow();

					trayBar.destroy();
				});
			},
		},
		{
			label: "Quit",
			click: () => {
				console.log(`Tray Quit clicked!`);
				// Close the application
				app.exit(); // All windows will be closed immediately without asking the user, and the before-quit and will-quit events will not be emitted
			},
		},
	]);
	trayBar.setToolTip("My Electron App");
	trayBar.setContextMenu(contextMenu);
}

// Position the window in the bottom-right corner of the screen
function setWindowPosition(window) {
	// Additional offset from the bottom-right corner of the screen for the toolbar window
	const window_offset_x = 75;
	const window_offset_y = 50;

	const primaryDisplay = screen.getPrimaryDisplay();
	const { width: screen_width, height: screen_height } = primaryDisplay.workAreaSize;
	const [window_width, window_height] = window.getSize();

	// Calculate the position for the bottom-right corner
	const x = screen_width - window_width - window_offset_x; // Adjust this value based on your window width
	const y = screen_height - window_height - window_offset_y; // Adjust this value based on your window height

	return [x, y];
}

// Function to get the next reopen time (in minutes) based on the current time, start time, end time, and the reopen delay
function getNextReopenTime(reopenDelay) {
	const minutes_in_day = 24 * 60;

	reopenDelay = parseInt(reopenDelay);

	// Get the current time in minutes
	const current_time = new Date();
	const current_hour = current_time.getHours();
	const current_minute = current_time.getMinutes();
	const current_time_in_minutes = current_hour * 60 + current_minute;

	end_time = setting_end_time.split(":");
	end_hour = parseInt(end_time[0]);
	end_minute = parseInt(end_time[1]);
	const end_time_in_minutes = end_hour * 60 + end_minute;

	start_time = setting_start_time.split(":");
	start_hour = parseInt(start_time[0]);
	start_minute = parseInt(start_time[1]);
	const start_time_in_minutes = start_hour * 60 + start_minute;

	const reopen_time_in_minutes = current_time_in_minutes + reopenDelay;

	// Inside working hours
	if (current_time_in_minutes < end_time_in_minutes && current_time_in_minutes >= start_time_in_minutes) {
		// if the reopen time is greater than the end time
		if (reopen_time_in_minutes >= end_time_in_minutes) {
			reopenDelay = end_time_in_minutes - current_time_in_minutes;
			return reopenDelay;
		} else {
			return reopenDelay;
		}
	}
	// Outside working hours

	// We are in the same day
	else if (current_time_in_minutes >= end_time_in_minutes) {
		reopenDelay = minutes_in_day - (current_time_in_minutes - start_time_in_minutes);
		return reopenDelay;

		// We are next day before start time
	} else if (current_time_in_minutes < start_time_in_minutes) {
		reopenDelay = start_time_in_minutes - current_time_in_minutes;
		return reopenDelay;
	} else {
		// Default - just return the reopen delay
		return reopenDelay;
	}
}

// Function to set the timer to reopen the application
function setReopenTimer(reopenDelay) {
	// Get the next reopen time
	reopenDelay = getNextReopenTime(reopenDelay);
	// convert to milliseconds
	reopenDelay = reopenDelay * 60 * 1000;

	// Create the timer
	reopenTimer = setTimeout(() => {
		initializeToolbar();
	}, reopenDelay);
}

/*--------Initializer Functions--------*/

function initializeApplication() {
	// Initialize settings
	initializeSettings();

	// Check if this is the first time the application is being run by looking at the settings values
	if (setting_reminder_time == undefined) {
		// handle main window creation
		createMainWindow();
		createSettingsWindow();
		createCroppingWindow();

		mainWindow.once("ready-to-show", () => {
			console.log(`main - ready-to-show`);
			mainWindow.show();
			// open settings window so the user is forced to set the settings before using the application
			handleSettingsWindow(true);
		});
	} else {
		initializeToolbar();
	}
}

function initializeToolbar() {
	createMainWindow();

	// Load the toolbar window once the main window is ready to show (if the user clicks the toolbar button before the main window is ready to show, it will cause an error)
	mainWindow.once("ready-to-show", () => {
		console.log(`main - ready-to-show`);
		createToolbarWindow();
	});

	if (trayBar) trayBar.destroy();
}

function initializeMainWindow() {
	// Fade out the toolbar window (closing is handled in the fadeOutWindow function)
	fadeOutWindow(toolbarWindow);

	mainWindow.show();

	createSettingsWindow();
	createCroppingWindow();
}

/*--------Close Functions--------*/

function closeFromToolbarWindow(reopenDelay) {
	fadeOutWindow(toolbarWindow);

	mainWindow.close();

	createTrayBar();

	setReopenTimer(reopenDelay);
}

function closeFromMainWindow(reopenDelay) {
	// Fade out the main window (closing is handled in the fadeOutWindow function)
	fadeOutWindow(mainWindow);

	settingsWindow.close();
	croppingWindow.close();

	createTrayBar();

	setReopenTimer(reopenDelay);
}

/*--------Show/hide Functions--------*/
function handleCroppingWindow(showCroppingWindow) {
	if (showCroppingWindow) {
		mainWindow.hide();
		croppingWindow.show();
	} else {
		croppingWindow.hide();
		mainWindow.show();
	}
}

function handleSettingsWindow(showSettingsWindow) {
	if (showSettingsWindow) {
		settingsWindow.show();
	} else {
		settingsWindow.hide();
	}
}

/*--------Animation Functions--------*/

function fadeInWindow(window) {
	let opacity = 0;
	interval = setInterval(() => {
		if (opacity < 1 && window.isDestroyed() == false) {
			opacity += 0.05; // Adjust the increment to control the fade-in speed
			window.setOpacity(opacity);
		} else {
			clearInterval(interval);
		}
	}, 50); // Adjust the interval to control the fade-in smoothness
}

function fadeOutWindow(window) {
	let opacity = 1;
	interval = setInterval(() => {
		if (opacity > 0) {
			opacity -= 0.2; // Adjust the increment to control the fade-in speed
			window.setOpacity(opacity);
		} else {
			clearInterval(interval);
			window.close();
		}
	}, 50); // Adjust the interval to control the fade-in smoothness
}

/*--------Settings Functions--------*/

// Function to initialize settings
function initializeSettings() {
	// Load settings values
	setting_reminder_time = settings.getSync("reminder_time_setting");
	setting_snooze_time = settings.getSync("snooze_time_setting");
	setting_start_time = settings.getSync("start_time_setting");
	setting_end_time = settings.getSync("end_time_setting");
	setting_folder_path = settings.getSync("folder_path_setting");
	//	setting_test = settings.getSync("test_setting");

}

// Called when the application is ready to start. Anything nested here will be able to run when the application is ready to start.
// This is only going to run on start up of application - double check what should go here
app.whenReady().then(() => {
	console.log(`ready`);

	initializeApplication();

	// called when any window is closing - override the default behavior of closing the application
	app.on("before-quit", (event) => {
		console.log(`before-quit`);
		event.preventDefault();
	});
});

/*--------Taskbar Event Listeners--------*/
// Listen for button-clicked events from renderer process
ipcMain.on("taskbar-event", (event, taskbar_event) => {
	console.log(`taskbar-event`);

	// Open the main window
	if (taskbar_event === BUTTON_MAIN_WINDOW) {
		console.log(`BUTTON_MAIN_WINDOW`);
		initializeMainWindow();

		// Skip the reminder
	} else if (taskbar_event === BUTTON_SKIP) {
		console.log(`BUTTON_SKIP`);
		closeFromToolbarWindow(setting_reminder_time);

		// Snooze the reminder
	} else if (taskbar_event === BUTTON_SNOOZE) {
		console.log(`BUTTON_SNOOZE`);
		closeFromToolbarWindow(setting_snooze_time);

		// Shutdown application
	} else if (taskbar_event === BUTTON_CLOSE) {
		console.log(`BUTTON_CLOSE`);
		app.exit();
	}
});

/*--------Cropping Event Listeners--------*/

ipcMain.on("crop-image", async (event) => {
	console.log(`crop-image`);
	handleCroppingWindow((showCroppingWindow = true));
});

ipcMain.on("capture-selection", async (event, left, top, width, height) => {
	console.log(`capture-selection`);
	croppingWindow.hide();

	try {
		// Capture the screenshot
		screenshot().then(async (img) => {
			const image = nativeImage.createFromBuffer(img);

			// Get the dimensions of the image
			const imgWidth = image.getSize().width;
			const imgHeight = image.getSize().height;

			// Get the dimensions of the screen
			const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().bounds;

			// Calculate the scale factor (these should be the same but just in case they aren't we will calculate both)
			scaleWidth = parseFloat(imgWidth / screenWidth);
			scaleHeight = parseFloat(imgHeight / screenHeight);

			// Scale the selection dimensions
			left = Math.round(left * scaleWidth);
			top = Math.round(top * scaleHeight);
			width = Math.round(width * scaleWidth);
			height = Math.round(height * scaleHeight);

			// Crop the image
			var croppedImg = image.crop({ x: left, y: top, width: width, height: height });

			// Resize the image to the scale factor (If only the height or the width are specified then the current aspect ratio will be preserved in the resized image)
			croppedImg = croppedImg.resize({ width: Math.round(width / scaleWidth), quality: "best" });

			// Convert to png format (png format is necessary for the saving to docx)
			croppedImg = croppedImg.toPNG();

			// Convert the image buffer to a data url - this is necessary to send the image to the renderer process
			const parser = new DatauriParser();
			const dataUrl = parser.format(".png", croppedImg).content;

			mainWindow.webContents.send("image-captured", dataUrl);

			// Hide the selection window and show the main window
			handleCroppingWindow((showCroppingWindow = false));

			console.log(`Screenshot saved`);
		});
	} catch (err) {
		console.error("Error capturing screenshot:", err);
	}
});

/*--------Entry Submission Event Listeners--------*/

ipcMain.on("submit-entry", async (event, content) => {
	console.log(`submit-entry`);
	console.log(`content: ${content}`);
	const save_folder_path = path.join(setting_folder_path, "Daily Log.docx"); // Replace with settings value
	console.log(`save_folder_path: ${save_folder_path}`);

	// Create a child process to run the python script
	// const pythonProcess = spawn("python", [path.join(__dirname, "assets/scripts/", "word_doc.py")], {
	// 	stdio: ["pipe", "pipe", "pipe"],
	// });

	// path_script = path.join(__dirname, "assets/scripts/dist/word_doc/word_doc.exe");
	path_script = path.join(process.resourcesPath, "dist/word_doc/word_doc.exe");

	const pythonProcess = await spawn(path_script, {
		stdio: ["pipe", "pipe", "pipe"],
	});

	// Convert the content to JSON
	jsonString = JSON.stringify({ content: content });

	// Send JSON data to Python script through stdin
	pythonProcess.stdin.write(jsonString);
	pythonProcess.stdin.write("\n"); // Needed to separate the JSON data from the file path
	pythonProcess.stdin.write(save_folder_path);
	pythonProcess.stdin.end();

	// Handle stdout (output) and stderr (error) events from the python script
	pythonProcess.stdout.on("data", (data) => {
		console.log(`Python script output: ${data}`);
	});

	pythonProcess.stderr.on("data", (data) => {
		console.error(`Python script error: ${data}`);

		// Handle error here - specifically, if the file is open
		if (data.includes("Permission denied")) {
			console.error("File is open");
			mainWindow.webContents.send("entry-status", ENTRY_SUBMISSION_FAILURE_FILE_OPEN);
		} else {
			console.error("Unknown error");
			mainWindow.webContents.send("entry-status", ENTRY_SUBMISSION_FAILURE_UNKNOWN);
		}
	});

	// Handle exit event from the python script
	pythonProcess.on("exit", (code) => {
		console.log(`Python script exited with code ${code}`);
		if (code == 0) {
			console.log(`Entry submitted!`);
			mainWindow.webContents.send("entry-status", ENTRY_SUBMISSION_SUCCESS);
		}
	});
});

/*--------Settings Event Listeners--------*/

// Entry point for settings
ipcMain.on("open-settings", (event) => {
	console.log(`open-settings`);
	handleSettingsWindow((showSettingsWindow = true));
});

// Function to handle loading settings
ipcMain.handle("load-settings", async (event) => {
	console.log(`load-settings`);
	return [setting_reminder_time, setting_snooze_time, setting_start_time, setting_end_time, setting_folder_path];
});

// Function to handle opening folder dialog (async)
ipcMain.handle("open-folder-dialog", async (event) => {
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
});

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
	setting_snooze_time = snoozeTime;
	setting_start_time = startTime;
	setting_end_time = endTime;
});

// Exit point for settings
ipcMain.on("close-settings", (event) => {
	console.log(`close-settings`);
	handleSettingsWindow((showSettingsWindow = false));
});

/*--------General Main Window Event Listeners--------*/

ipcMain.on("skip-entry", (event) => {
	console.log(`skip-entry`);
	closeFromMainWindow(setting_reminder_time);
});

ipcMain.on("snooze-entry", (event) => {
	console.log(`snooze-entry`);
	closeFromMainWindow(setting_snooze_time);
});

ipcMain.on("entry-submitted", (event) => {
	console.log(`entry-submitted`);
	closeFromMainWindow(setting_reminder_time);
});

/*--------General Application Event Listeners--------*/

// Listen for button-clicked events from renderer process - close-application
ipcMain.on("close-application", (event) => {
	console.log(`close-application`);
	app.exit();
});

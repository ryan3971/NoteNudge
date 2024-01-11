/**
 * Settings are set synchronously, meaning that the settings are set before the function returns. (something to double check)
 *
 */

const { app, BrowserWindow, Tray, Menu, ipcMain, dialog, screen, nativeImage } = require("electron/main");
if (require("electron-squirrel-startup")) app.quit(); // Required by electron-forge
Menu.setApplicationMenu(null); // Remove the default menu bar - will speed up the application on startup

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
let setting_days;

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
			webContents: true, // Allows the webContents to be accessed from the renderer process (so I can use the developer console)
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
		focus: false, // Don't focus the window when it is created (can disrupt users work if it focuses while they are typing)
		webPreferences: {
			preload: path.join(__dirname, "renderer/toolbar/toolbar_preload.js"),
		},
	});

	// Set the window position
	const [x, y] = setWindowPosition(toolbarWindow);
	toolbarWindow.setPosition(x, y);
	toolbarWindow.setIgnoreMouseEvents(true); // Don't allow the window to be clicked on (until after it is in view)

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

function createAdvancedSettingsWindow() {
	advancedSettingsWindow = new BrowserWindow({
		width: 420,
		height: 350,
		frame: false, // Creates a frameless window
		titleBarStyle: "hidden", // Results in a hidden title bar and a full size content window
		// parent: settingsWindow, // Makes the settings window a child of the main window
		modal: true, // Have it so nothing else can be selected until the settings window is closed
		center: true, // Center the window
		show: false, // Don't show the window when it is created
		resizable: false, // Don't allow the window to be resized
		webPreferences: {
			preload: path.join(__dirname, "renderer/advanced_settings/advanced_settings_preload.js"),
			webContents: true, // Allows the webContents to be accessed from the renderer process (so I can use the developer console)
		},
	});

	advancedSettingsWindow.loadFile(path.join(__dirname, "renderer/advanced_settings/advanced-settings-window.html"));

	advancedSettingsWindow.on("closed", function () {
		advancedSettingsWindow = null;
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
			label: "Open Document",
			click: () => {
				console.log(`Open Document clicked!`);
				// Open the word document
				openDocument();
			},
		},

		{
			label: "Snooze for Day",
			click: () => {
				console.log(`Tray Day Snooze clicked!`);
				clearTimeout(reopenTimer); // Clear the timer
				// Call setReopenTimer with the snooze for day status
			},
		},
		// {
		// 	label: "Temporary Run Time",
		// 	click: () => {
		// 		console.log(`Temporary Runtime clicked!`);

		// 		// Open a window to set these temporary settings values

		// 		// Set the reopen timer with the temporary settings status

		// 		// closeFromToolbarWindow(setting_snooze_time);
		// 	},
		// },
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

function getTimes() {
	var current_start_time;
	var current_end_time;
	var next_start_time;
	
	// Get the current day of the week, get the settings_days variable, and get the current day's settings
	var current_time = new Date();
	var current_day = current_time.getDay();
	// We store the days such that Monday is 0 and SUnday is 6, but the Date object returns Sunday as 0 and Saturday as 6, so we need to adjust the current day
	// A little silly but storing the days this way makes more sense from a working persons perspective
	if (current_day == 0) current_day = 6;
	else current_day = current_day - 1;


	const current_day_settings = setting_days[current_day];
	const next_day_settings = setting_days[(current_day + 1) % 7];

	// Check if there are any custom settings for the current day - if there aren't, use the default times
	if (current_day_settings['checkbox'] == true) {
		current_start_time = current_day_settings.startTime.split(":");
		current_end_time = current_day_settings.endTime.split(":");
	}
	else	{
		current_start_time = setting_start_time.split(":");
		current_end_time = setting_end_time.split(":");
	}

	// Also check if there are any custom settings for the next day - if there aren't, use the default times
	if (next_day_settings["checkbox"] == true) {
		next_start_time = next_day_settings.startTime.split(":");
	} else {
		next_start_time = setting_start_time.split(":");
	}
	current_start_time = parseInt(current_start_time[0]) * 60 + parseInt(current_start_time[1]);
	current_end_time = parseInt(current_end_time[0]) * 60 + parseInt(current_end_time[1]);
	next_start_time = parseInt(next_start_time[0]) * 60 + parseInt(next_start_time[1]);
	current_time = current_time.getHours() * 60 + current_time.getMinutes();

	return {
		current_time: current_time,
		current_start_time: current_start_time,
		current_end_time: current_end_time,
		next_start_time: next_start_time,
	};
}

REOPEN_STATUS_REMINDER = 1;
REOPEN_STATUS_SNOOZE = 2;
REOPEN_STATUS_SNOOZE_FOR_DAY = 3;
REOPEN_STATUS_OUTSIDE_HOURS = 4;

// Function to get the next reopen time (in minutes) based on the current time, start time, end time, and the reopen delay
function getNextReopenTime(reopen_status) {
	const minutes_in_day = 24 * 60;
	var reopenDelay;
	times = getTimes();

	// Check if the status is snooze for day. If it is, calculate the time from now until the start of the next day plus the settings reminder time
	if (reopen_status == REOPEN_STATUS_SNOOZE_FOR_DAY) {
		reopenDelay = parseInt(setting_reminder_time);
		reopenDelay = minutes_in_day - times.current_time + times.next_start_time + reopenDelay;
		return reopenDelay;
	}
	// Check if the status is snooze. If it is, just delay the reopen by the snooze time
	else if (reopen_status == REOPEN_STATUS_SNOOZE) {
		reopenDelay = parseInt(setting_snooze_time);
		return reopenDelay;
	}
	// Check if the status is reminder
	else if (reopen_status == REOPEN_STATUS_REMINDER) {
		// if the reopen time is greater than the end time, set it to open at the end time
		if (times.current_time + reopenDelay >= times.current_end_time) {
			reopenDelay = times.current_end_time - times.current_time;
			return reopenDelay;
		}
		// Otherwise, just return the reopen delay time
		else {
			reopenDelay = parseInt(setting_reminder_time);
			return reopenDelay;
		}
	}
	// Check if the status is outside working hours
	else if (reopen_status == REOPEN_STATUS_OUTSIDE_HOURS) {
		reopenDelay = parseInt(setting_reminder_time);
		// We are in the same day - open after the start time by the reminder time
		if (times.current_time >= times.current_end_time) {
			reopenDelay = minutes_in_day - times.current_time + times.next_start_time + reopenDelay;
			return reopenDelay;
		}
		// We are next day before start time - open after the start time by the reminder time (DOUBLE CHECK THIS)
		else if (times.current_time < times.current_start_time) {
			reopenDelay = times.current_start_time + reopenDelay - times.current_time;
			return reopenDelay;
		}
	}
}
// Get the current time, end time for the current day, and start time for the current day in minutes (DOUBLE CHECK THIS)
function insideWorkHours() {
	times = getTimes();

	if (times.current_time <= times.current_end_time && times.current_time >= times.current_start_time) {
		return true;
	} else {
		return false;
	}
}

function getMainWindowColor() {
	times = getTimes();

	// If we are after the end time, return purple
	if (times.current_time >= times.current_end_time - 60) {
		return "#3f51b5";
	}
	// If we are before the start time, return orange
	else if (times.current_time < times.current_start_time + 60) {
		return "#ff9800";
	}
}

// Function to set the timer to reopen the application
function setReopenTimer(reopen_status) {
	// Get the next reopen time
	var reopenDelay = getNextReopenTime(reopen_status);
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
	if (!insideWorkHours()) {
		setReopenTimer(REOPEN_STATUS_OUTSIDE_HOURS);
		createTrayBar();
		return;
	}

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
	// fadeOutWindow(toolbarWindow);

	// if (checkIsLastEntry()) {
	// 	// Send message to renderer process to change the background color of the main window
	// 	mainWindow.webContents.send("last-entry", true);
	// }

	toolbarWindow.close();
	mainWindow.show();

	createSettingsWindow();
	createCroppingWindow();
}

/*--------Close Functions--------*/

function closeFromToolbarWindow(reopen_status) {
	// fadeOutWindow(toolbarWindow);
	toolbarWindow.close;
	mainWindow.close();

	createTrayBar();

	setReopenTimer(reopen_status);
}

function closeFromMainWindow(reopen_status) {
	// Fade out the main window (closing is handled in the fadeOutWindow function)
	// fadeOutWindow(mainWindow);
	mainWindow.close();
	settingsWindow.close();
	croppingWindow.close();

	createTrayBar();

	if (!insideWorkHours()) {
		setReopenTimer(REOPEN_STATUS_OUTSIDE_HOURS);
	} else {
		setReopenTimer(reopen_status);
	}
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
		// Load the advanced settings window just in case
		createAdvancedSettingsWindow();
	} else {
		settingsWindow.hide();
		advancedSettingsWindow.close();
	}
}

function handleAdvancedSettingsWindow(showAdvancedSettingsWindow) {
	if (showAdvancedSettingsWindow) {
		advancedSettingsWindow.show();
	} else {
		advancedSettingsWindow.hide();
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
			// set the window to be clickable
			window.setIgnoreMouseEvents(false);
		}
	}, 50); // Adjust the interval to control the fade-in smoothness
}

// function fadeOutWindow(window) {
// 	let opacity = 1;
// 	interval = setInterval(() => {
// 		if (opacity > 0) {
// 			opacity -= 0.2; // Adjust the increment to control the fade-in speed
// 			window.setOpacity(opacity);
// 		} else {
// 			clearInterval(interval);
// 			window.close();
// 		}
// 	}, 50); // Adjust the interval to control the fade-in smoothness
// }

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
	setting_days = settings.getSync("days_settings");
}

/*--------Opening Document--------*/
function openDocument() {
	const save_folder_path = path.join(setting_folder_path, "Daily Log.docx"); // Replace with settings value
	spawn("explorer", [save_folder_path]);
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
		closeFromToolbarWindow(REOPEN_STATUS_REMINDER);

		// Snooze the reminder
	} else if (taskbar_event === BUTTON_SNOOZE) {
		console.log(`BUTTON_SNOOZE`);
		closeFromToolbarWindow(REOPEN_STATUS_SNOOZE);

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
	console.log(`content: ${content}`);
	//path_script = path.join(__dirname, "assets/scripts/dist/word_doc/word_doc.exe");
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

// Entry point for advanced settings
ipcMain.on("open-advanced-settings", (event) => {
	console.log(`open-advanced-settings`);
	handleAdvancedSettingsWindow((showAdvancedSettingsWindow = true));
});

// Function to handle loading advanced settings
ipcMain.handle("load-advanced-settings", async (event) => {
	console.log(`load-advanced-settings`);
	console.log(setting_days);
	// advancedSettingsWindow.webContents.openDevTools();

	return setting_days;
});

// Function to update the advanced settings
ipcMain.on("apply-advanced-settings", (event, days_settings) => {
	console.log(`apply-advanced-settings`);
	// Save settings values
	settings.setSync("days_settings", days_settings);

	// Update settings values
	setting_days = days_settings;
	console.log("setting_days: ", setting_days);
	// Close the advanced settings window
	handleAdvancedSettingsWindow((showAdvancedSettingsWindow = false));
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
	closeFromMainWindow(REOPEN_STATUS_SNOOZE);
});

ipcMain.on("entry-submitted", (event) => {
	console.log(`entry-submitted`);
	closeFromMainWindow(REOPEN_STATUS_REMINDER);
});

ipcMain.on("open-document", (event) => {
	console.log(`open-document`);
	// Open the word document
	openDocument();
});

/*--------General Application Event Listeners--------*/

// Listen for button-clicked events from renderer process - close-application
ipcMain.on("close-application", (event) => {
	console.log(`close-application`);
	app.exit();
});

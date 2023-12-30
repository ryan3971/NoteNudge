// chaneg from require to import

const { app, BrowserWindow, ipcMain, screen } = require("electron/main");


const path = require("node:path");
const { spawn } = require("child_process");

const screenshot = require("screenshot-desktop");
const sharp = require("sharp");

const DatauriParser = require("datauri/parser");


// Additional offset from the bottom-right corner of the screen for the toolbar window
const offset_x = 75;
const offset_y = 50;

let mainWindow;
let selectionWindow;

let DOCUMENT_PATH;

// Function to create the main window
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 400,
        frame: false,
        resizable: false,
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
    const x = screen_width - window_width - offset_x; // Adjust this value based on your window width
    const y = screen_height - window_height - offset_y; // Adjust this value based on your window height
    // Set the window position
    mainWindow.setPosition(x, y);

    mainWindow.loadFile(path.join(__dirname, "renderer/index.html"));

    // Shows the window once everything within is loaded (stops it from showing individual elements one by one)
    mainWindow.once("ready-to-show", () => {
        mainWindow.show();
    });
    mainWindow.on("closed", function () {
        mainWindow = null;
    });
}

function createSelectionWindow() {
    selectionWindow = new BrowserWindow({
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

    selectionWindow.setIgnoreMouseEvents(false); // Set to true to ignore mouse events when the window is clicked

    selectionWindow.on("closed", function () {
        selectionWindow = null;
    });

    selectionWindow.loadFile(path.join(__dirname, "renderer/selection/selectionWindow.html"));
}

// Called when the application is ready to start. Anything nested here will be able to run when the application is ready to start.
app.whenReady().then(() => {
    console.log(`ready`);
    createMainWindow();
    createSelectionWindow();

    DOCUMENT_PATH = path.join(__dirname, "assets/scripts", "Daily Log.docx"); // Replace with settings value
});

ipcMain.on("save-entry", async (event, content) => {
    console.log(`save-entry`);

    const pythonProcess = spawn("python", [path.join(__dirname, "assets/scripts/", "word_doc.py")], {
        stdio: ["pipe", "pipe", "pipe"],
    });

    jsonString = JSON.stringify({ content: content });

    // Send JSON data to Python script through stdin
    pythonProcess.stdin.write(jsonString);
    pythonProcess.stdin.write("\n"); // Needed to separate the JSON data from the file path
    pythonProcess.stdin.write(DOCUMENT_PATH);
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

ipcMain.on("start-selection", async (event) => {
    console.log(`start-selection`);
    mainWindow.hide();
    selectionWindow.show();
});

ipcMain.on("capture-selection", async (event, left, top, width, height) => {
    console.log(`capture-selection`);
    selectionWindow.hide();
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
            selectionWindow.hide();
            mainWindow.show();
            console.log(`Screenshot saved`);
        });
    } catch (err) {
        console.error("Error capturing screenshot:", err);
    }
});

const { app, BrowserWindow, ipcMain, screen } = require("electron/main");

const path = require("node:path");
const { spawn } = require("child_process");

const screenshot = require("screenshot-desktop");
const sharp = require("sharp");

const DatauriParser = require("datauri/parser");

let mainWindow;
let selectionWindow;

let DOCUMENT_PATH;

// Function to create the main window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
    },
  });

  mainWindow.loadFile("index.html");

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
      preload: path.join(__dirname, "selection/selectionPreload.js"),
    },
  });

  selectionWindow.setIgnoreMouseEvents(false);

  selectionWindow.on("closed", function () {
    selectionWindow = null;
  });

  // selectionWindow.webContents.on("did-finish-load", () => {
  //   selectionWindow.show();
  // });

  // selectionWindow.on("show", () => {
  //   setTimeout(() => {
  //     selectionWindow.focus();
  //   }, 200);
  // });

  selectionWindow.loadFile("selection/selectionWindow.html");
}

// Called when the application is ready to start. Anything nested here will be able to run when the application is ready to start.
app.whenReady().then(() => {
  console.log(`ready`);
  createMainWindow();
  createSelectionWindow();
  DOCUMENT_PATH = path.join(__dirname, "scripts", "Daily Log.docx");
  console.log(`DOCUMENT_PATH: ${DOCUMENT_PATH}`);
});

ipcMain.on("save-entry", (event, content) => {
  console.log(`save-entry`);

  // print the length of the content
  console.log(content.length);

  const pythonProcess = spawn("python", ["scripts/word_doc.py"], {
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

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", function () {
  if (mainWindow === null) createMainWindow();
});

ipcMain.on("start-selection", async (event) => {
  console.log(`start-selection`);
  mainWindow.hide();
  selectionWindow.show();
});

ipcMain.on("capture-selection", async (event, left, top, width, height) => {
  console.log(`capture-selection`);
  selectionWindow.hide();
  console.log(left, top, width, height);
  try {
    // Capture the screenshot
    screenshot().then(async (img) => {
      // get the dimensions of the screen and the image, then calculate the crop dimensions
      // Not sure how could of a solution this is - double check (and take rect border into account)
      const { width: screenWidth, height: screenHeight } =
        screen.getPrimaryDisplay().bounds;
      const { width: imgWidth, height: imgHeight } = await sharp(
        img
      ).metadata();

      scaledLeft = Math.round((left / screenWidth) * imgWidth);
      scaledTop = Math.round((top / screenHeight) * imgHeight);
      scaledWidth = Math.round((width / screenWidth) * imgWidth);
      scaledHeight = Math.round((height / screenHeight) * imgHeight);

      // Crop the image and convert to png format
      const croppedImgBuffer = await sharp(img)
        .png()
        .extract({
          left: scaledLeft,
          top: scaledTop,
          width: scaledWidth,
          height: scaledHeight,
        })
        .toBuffer();

      console.log(`croppedImgBuffer: ${croppedImgBuffer.toString("base64")}`);
      const parser = new DatauriParser();
      const dataUrl = parser.format(".png", croppedImgBuffer).content;
      console.log(`dataUrl: ${dataUrl}`);

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

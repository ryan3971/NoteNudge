const { app, BrowserWindow, ipcMain, screen } = require("electron/main");

const path = require("node:path");
//const quillToWord = require("quill-to-word");
//const quill = require('quill');
const { spawn } = require('child_process');

const fs = require("fs");
let mainWindow;
let DOCUMENT_PATH

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
// Called when the application is ready to start. Anything nested here will be able to run when the application is ready to start.
app.whenReady().then(() => {
  console.log(`ready`);
  createMainWindow();
  DOCUMENT_PATH = path.join(__dirname, "scripts", "Daily Log.docx")
  console.log(`DOCUMENT_PATH: ${DOCUMENT_PATH}`);
});

ipcMain.on('send-quill', (event, content) => {
    console.log(`send-quill`);
    // arguments are the python script, the content, and the path to save the file
    const pythonProcess = spawn('python', ['scripts/word_doc.py', JSON.stringify({ content: content }), DOCUMENT_PATH])

    pythonProcess.stdout.on("data", (data) => {
      console.log(`Python script output: ${data}`);
    });
  
    pythonProcess.stderr.on("data", (data) => {
      console.error(`Python script error: ${data}`);
    });

    // const quillDelta = quill.getContents();
    // const doc = quillToWord.generateWord(quillDelta);
    // saveAs(doc, 'word-export.docx');
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", function () {
  if (mainWindow === null) createMainWindow();
});

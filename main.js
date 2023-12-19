const { app, BrowserWindow, ipcMain, screen } = require("electron/main");

const path = require("node:path");
//const quillToWord = require("quill-to-word");
//const quill = require('quill');
const htmlToDocx = require('html-to-docx');
const { spawn } = require('child_process');

const fs = require("fs");
let mainWindow;

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

});

ipcMain.on('send-quill', (event, content) => {
    console.log(`send-quill`);
    const pythonProcess = spawn('python', ['test.py', JSON.stringify({ content: content })])

    pythonProcess.stdout.on('data', (data) => {
        console.log(`Python stdout: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
        // You can send a message back to the renderer process if needed
        event.sender.send('save-docx-result', { success: code === 0 });
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

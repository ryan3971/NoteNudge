const { app, 
        BrowserWindow, 
        ipcMain, 
        screen,
      } = require('electron/main');
      
const path = require('node:path')

const screenshot = require('screenshot-desktop');
const sharp = require('sharp');

const fs = require('fs');

let mainWindow 
let selectionWindow

// Function to create the main window
function createMainWindow () {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 200,
    webPreferences: {
       preload: path.join(__dirname, 'preload.js'),
     }
  })

  mainWindow.loadFile('index.html')

  mainWindow.on('closed', function () {
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
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'selectionPreload.js'),
    },
  });

  selectionWindow.setIgnoreMouseEvents(false);

  selectionWindow.on('closed', function () {
    selectionWindow = null;
  });

  selectionWindow.webContents.on('did-finish-load', () => {
    selectionWindow.show();
  });

  selectionWindow.on('show', () => {
    setTimeout(() => {
      selectionWindow.focus();
    }, 200);
  });

  selectionWindow.loadFile('selectionWindow.html');
}

// Called when the application is ready to start. Anything nested here will be able to run when the application is ready to start.
app.whenReady().then(() => {
  console.log(`ready`);
  createMainWindow();
});
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createMainWindow();
});

ipcMain.on('start-selection',  async (event) => {
  console.log(`start-selection`);
  mainWindow.hide();
  createSelectionWindow();
});

ipcMain.on('capture-selection',  async (event, left, top, width, height) => {
  console.log(`capture-selection`);
  selectionWindow.hide();
 console.log(left, top, width, height);
 try {
    // Capture the screenshot
    screenshot().then(async (img) => {

      // get the dimensions of the screen and the image, then calculate the crop dimensions
      // Not sure how could of a solution this is - double check (and take rect border into account)
      const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().bounds;
      const { width: imgWidth, height: imgHeight } = await sharp(img).metadata();

      scaledLeft = (left / screenWidth) * imgWidth;
      scaledTop = (top / screenHeight) * imgHeight;
      scaledWidth = (width / screenWidth) * imgWidth;
      scaledHeight = (height / screenHeight) * imgHeight;

      // Crop the image
      const metadata = await sharp(img).metadata();
      console.log(metadata);
      const croppedImgBuffer = await sharp(img)
        .extract({ left: scaledLeft, top: scaledTop, width: scaledWidth, height: scaledHeight })
        .toBuffer();

      // Save the screenshot to a file
      fs.writeFileSync(".\\image.png", croppedImgBuffer);

      console.log(`Screenshot saved`);
      createThumbnail('image.png');

    });
  } catch(err) {
    console.error('Error capturing screenshot:', err);
  }
});

function createThumbnail(imagePath) {
  sharp(imagePath)
    .resize(100, 75) // Adjust the dimensions as needed
    .toBuffer()
    .then((thumbnailBuffer) => {
      const thumbnailDataURL = `data:image/png;base64,${thumbnailBuffer.toString('base64')}`;
      displayThumbnail(thumbnailDataURL);
    })
    .catch((err) => {
      console.error('Error creating thumbnail:', err);
    });
}

function displayThumbnail(dataURL) {
  thumbnailContainer.innerHTML = `<img src="${dataURL}" alt="Thumbnail">`;
}
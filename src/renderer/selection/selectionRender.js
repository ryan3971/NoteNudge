let isMouseDown = false;
let startX = 0;
let startY = 0;

const selectionRect = document.getElementById('selectionRect');
let startCoordinates = { x: 0, y: 0 };
let endCoordinates = { x: 0, y: 0 };

document.addEventListener('mousedown', (event) => {
    console.log(`mousedown`);
    selectionRect.style.display = 'block';      // Show the selection rectangle
    isMouseDown = true;
    startCoordinates.x = event.screenX;
    startCoordinates.y = event.screenY;
});

document.addEventListener('mousemove', (event) => {
    console.log(`mousemove`);
    if (!isMouseDown) return;

    console.log(`mousemove on mouseDown`);
    endCoordinates.x = event.screenX
    endCoordinates.y = event.screenY
    updateSelectionRect();
});

document.addEventListener('mouseup', () => {
    console.log(`mouseup`);
    if (!isMouseDown) return;               // For scenarios when the mousedown was not captured
    selectionRect.style.display = 'none';   // Hide the selection rectangle
    isMouseDown = false;
    // retrieve the coordinates of the selection rectangle and send them to the main process
    // Take into account the rectangles thickness
    const rect = selectionRect.getBoundingClientRect();
    const { x, y, width, height } = calculateCropDimensions();

    console.log(rect.left, rect.top, rect.width, rect.height);
    window.electronAPI.handleCaptureSelection(x, y, width, height);
});

function calculateCropDimensions() {
    const x = Math.min(startCoordinates.x, endCoordinates.x);
    const y = Math.min(startCoordinates.y, endCoordinates.y);
    const width = Math.abs(endCoordinates.x - startCoordinates.x);
    const height = Math.abs(endCoordinates.y - startCoordinates.y);
  
    return { x, y, width, height };
}
function updateSelectionRect() {
    const width = endCoordinates.x - startCoordinates.x;
    const height = endCoordinates.y - startCoordinates.y;
    
    if (width > 0 && height > 0) {
        drawRectangle(startCoordinates.x, startCoordinates.y, width, height);
    } else if (width < 0 && height < 0) {
        drawRectangle(endCoordinates.x, endCoordinates.y, Math.abs(width), Math.abs(height));
    } else if (width < 0) {
        drawRectangle(endCoordinates.x, startCoordinates.y, Math.abs(width), height);
    } else if (height < 0) {
        drawRectangle(startCoordinates.x, endCoordinates.y, width, Math.abs(height));
    }
}

function drawRectangle(x, y, width, height) {
    selectionRect.style.left = `${x}px`;
    selectionRect.style.top = `${y}px`;
    selectionRect.style.width = `${width}px`;
    selectionRect.style.height = `${height}px`;
}
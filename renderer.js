// // renderer.js
const selection_button = document.getElementById('startSelectionButton');
const thumbnail = document.getElementById('thumbnailImage');

selection_button.addEventListener('click', async () => {
  console.log(`clicked`);
  window.electronAPI.handleStartSelection();
});



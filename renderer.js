// // renderer.js
const settingsButton = document.getElementById('open_settings')

// Create a listener for the open-settings event
settingsButton.addEventListener('click', () => {
  window.electronAPI.handleOpenSettings();
});

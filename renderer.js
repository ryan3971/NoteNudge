// // renderer.js
const button = document.getElementById('btn_close');

button.addEventListener('click', () => {
  console.log(`Button clicked!`);

  // Handle closing the application here
  window.electronAPI.handleCloseApplication('close-application')
});

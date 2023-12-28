// renderer.js
const buttons = document.querySelectorAll('button');

buttons.forEach((button, index) => {
  button.addEventListener('click', () => {
    // Handle button click event based on index
    console.log(`Button ${index + 1} clicked!`);

    // Send a message to the main process if needed
    window.electronAPI.setButton(index + 1)
  });
});

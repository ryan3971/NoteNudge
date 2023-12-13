// // renderer.js
const close_button = document.getElementById('btn_close');

const entryInput = document.getElementById('entry_input')
const submitEntryButton = document.getElementById('submit_entry_button')
const settingsButton = document.getElementById('open_settings')

// Create a listener for the close-application event
close_button.addEventListener('click', () => {
  console.log(`Button clicked!`);

  // Handle closing the application here
  window.electronAPI.handleCloseApplication('close-application')
});

// Create a listener for the submit-entry event
submitEntryButton.addEventListener('click', () => {
  const entry = entryInput.value;
  window.electronAPI.handleSubmitEntry(entry);
});

// Create a listener for the open-settings event
settingsButton.addEventListener('click', () => {
  window.electronAPI.handleOpenSettings();
});
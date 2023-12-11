const setButton = document.getElementById('btn')
const titleInput = document.getElementById('title')
setButton.addEventListener('click', () => {
  const title = titleInput.value
  console.log('Button clicked!');
  window.electronAPI.setTitle(title)
})

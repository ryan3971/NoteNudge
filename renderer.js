// // renderer.js
const selection_button = document.getElementById('startSelectionButton');

var quill

selection_button.addEventListener('click', async () => {
  console.log(`clicked`);

  const quillContent = quill.root.innerHTML;

  window.electronAPI.handleStartSelection(quillContent);

});

console.log('Quill');
quill = new Quill('#editor-container', {
  modules: {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      ['image', 'code-block']
    ]
  },
  placeholder: 'Compose an epic...',
  theme: 'snow'  // or 'bubble'
});



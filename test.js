const QuillToWord = require('quill-to-word');

// Assuming you have a Quill editor instance named 'quill'
const quillContent = quill.root.innerHTML;

// Create a new instance of QuillToWord
const quillToWord = new QuillToWord();

// Convert Quill content to Word document
const wordDocument = quillToWord.convert(quillContent);

// Save the Word document or perform any other operations
console.log(wordDocument);

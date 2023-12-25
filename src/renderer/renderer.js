// // renderer.js
const save_entry_button = document.getElementById("saveEntry");

var quill;

var toolbarOptions = [
  ["bold", "italic", "underline"], // toggled buttons
  ["blockquote", "code-block"],

  [{ header: 1 }, { header: 2 }], // custom button values
  [{ list: "ordered" }, { list: "bullet" }],
  [{ script: "sub" }, { script: "super" }], // superscript/subscript
  [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
  [{ direction: "rtl" }], // text direction

  [{ size: ["small", false, "large", "huge"] }], // custom dropdown
  [{ header: [1, 2, 3, 4, 5, 6, false] }],

  [{ color: [] }, { background: [] }], // dropdown with defaults from theme
  [{ font: [] }],
  [{ align: [] }],

  ["clean"], // remove formatting button

  ["crop-image"],
];

save_entry_button.addEventListener("click", async () => {
  console.log(`clicked`);
  const quillContent = quill.root.innerHTML;
  console.log(quillContent);
  window.electronAPI.handleSaveEntry(quillContent);
});

console.log("Quill");
var quill = new Quill("#editor-container", {
  modules: {
    toolbar: toolbarOptions,
    imageResize: {},
  },
  theme: "snow",
});

var cropImage = document.querySelector(".ql-crop-image");
cropImage.addEventListener("click", function () {
  console.log("crop image");
  window.electronAPI.handleStartSelection();
});

window.electronAPI.handleCroppedImage((image) => {
  console.log("Render received image");

  quill.focus();
  var length = quill.getLength();
  quill.insertEmbed(length, "image", image);
});

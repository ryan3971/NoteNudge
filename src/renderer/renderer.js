// // renderer.js
const save_entry_button = document.getElementById("button-1");
var quill;
Quill.register("modules/blotFormatter", QuillBlotFormatter.default);
//Quill.register("modules/imageDrop", ImageDrop);

var doc;
var quill_index = 0;


var quill = new Quill("#editor", {
    modules: {
        toolbar: "#toolbar",
        blotFormatter: {},
        //     imageDrop: true,
    },
    placeholder: "Compose an epic...",
    theme: "snow",
});

// Add bullet list as default
quill.formatLine(0, "list", "bullet");


save_entry_button.addEventListener("click", async () => {
    console.log(`clicked`);
    const quillContent = quill.root.innerHTML;
    window.electronAPI.handleSaveEntry(quillContent);
});

var cropImage = document.querySelector("#capture-image-button");
cropImage.addEventListener("click", function () {
    console.log("crop image");

    // Save quill state to restore after cropping
    if (quill.getSelection() == null) {
        quill_index = 0;
    } else {
        quill_index = quill.getSelection().index;
    }

    window.electronAPI.handleStartSelection();
});

window.electronAPI.handleCroppedImage((image) => {
    console.log("Render received image");

    quill.focus();

    // Insert image at cursor position or at the end of the document (if cursor was not in the document)
    if (quill_index) {
        quill.insertEmbed(quill_index, "image", image);
        quill.setSelection(quill_index + 1);
    } else {
        var length = quill.getLength();
        quill.insertEmbed(length, "image", image);
        quill.setSelection(length + 1);
    }
});

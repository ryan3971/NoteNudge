// // renderer.js
const submit_entry_button = document.getElementById("button-submit-entry");
const settings_button = document.getElementById("button-settings");
const skip_button = document.getElementById("button-skip");
const snooze_button = document.getElementById("button-snooze");
const close_button = document.getElementById("button-close");

const crop_image = document.getElementById("crop-image-button");

const loader_element = document.getElementById("loaderID");
const done_element = document.getElementById("doneID");

const ENTRY_SUBMISSION_SUCCESS = 1;
const ENTRY_SUBMISSION_FAILURE_FILE_OPEN = 2;
const ENTRY_SUBMISSION_FAILURE_UNKNOWN = 3;

Quill.register("modules/blotFormatter", QuillBlotFormatter.default);
//Quill.register("modules/imageDrop", ImageDrop);

var quill;

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

/*------------------------------------------------------------*/

crop_image.addEventListener("click", function () {
	console.log("crop image");

	// Save quill state to restore after cropping
	if (quill.getSelection() == null) {
		quill_index = 0;
	} else {
		quill_index = quill.getSelection().index;
	}

	window.electronAPI.handleCropImage();
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

submit_entry_button.addEventListener("click", async () => {
	console.log(`clicked`);

	// Display loading spinner
	done_element.style.display = "none";
	loader_element.style.display = "inline-block";

	const quillContent = quill.root.innerHTML;

	// Handle submitting the entry here
	window.electronAPI.handleSubmitEntry(quillContent);
});

window.electronAPI.handleSubmitEntryStatus((entryStatus) => {
	// Handle the submit status
	if (entryStatus == ENTRY_SUBMISSION_SUCCESS) {
		console.log(`Entry submitted successfully!`);
	} else if (entryStatus == ENTRY_SUBMISSION_FAILURE_FILE_OPEN) {
		console.log(`Entry submission failed: file open!`);
		//	alert("Entry submission failed: file open!");
	} else if (entryStatus == ENTRY_SUBMISSION_FAILURE_UNKNOWN) {
		console.log(`Entry submission failed: unknown!`);
		//	alert("Entry submission failed: unknown!");
	}

    done_element.style.color = "#028A0F";
	done_element.style.display = "inline-block";
	loader_element.style.display = "none";
});

// Create a listener for the open-settings event
settings_button.addEventListener("click", () => {
	console.log(`Settings button clicked!`);
	window.electronAPI.handleOpenSettings();
});

skip_button.addEventListener("click", () => {
	console.log(`skip_button`);
	window.electronAPI.handleSkipEntry();
});

snooze_button.addEventListener("click", () => {
	console.log(`snooze_button`);
	window.electronAPI.handleSnoozeEntry();
});

// Create a listener for the close-application event
close_button.addEventListener("click", () => {
	console.log(`Button clicked!`);

	// Handle closing the application here
	window.electronAPI.handleCloseApplication();
});

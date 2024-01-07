// // renderer.js
const submit_entry_button = document.getElementById("button-submit-entry");
const document_button = document.getElementById("button-doc");
const settings_button = document.getElementById("button-settings");
const skip_button = document.getElementById("button-skip");
const snooze_button = document.getElementById("button-snooze")
const close_button = document.getElementById("button-close");
const crop_image = document.getElementById("crop-image-button");

// const loader_element = document.getElementById("loaderID");
// const done_element = document.getElementById("doneID");

const entry_loader_element = document.getElementById("entry_loader");
const entry_done_element = document.getElementById("entry_done");

const editor_element = document.getElementById("editor");


var alert_dialog_id = "#alert_dialog";

const alert_error_title = "Error";
const alert_warning_title = "Warning";

const alert_entry_file_open_text = "Entry submission failed: file open!";
const alert_entry_unknown_text = "Entry submission failed: unknown!";

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
	entry_loader_element.style.display = "inline-block";

	// Get the quill content
	const quillContent = quill.root.innerHTML;

	// Send the quill content to the main process
	window.electronAPI.handleSubmitEntry(quillContent);
});

window.electronAPI.handleSubmitEntryStatus((entryStatus) => {
	
	// Hide the loading spinner
	entry_loader_element.style.display = "none";

	// Handle the submit status
	if (entryStatus == ENTRY_SUBMISSION_SUCCESS) {
		console.log(`Entry submitted successfully!`);

		// Display done icon
		entry_done_element.style.display = "inline-block";

		// send a message to the main process to close the window
		window.electronAPI.handleEntrySubmitted();

	} else {
		if (entryStatus == ENTRY_SUBMISSION_FAILURE_FILE_OPEN) {
			console.log(`Entry submission failed: file open!`);
			createAlertDialog(alert_error_title, alert_entry_file_open_text);
		} else if (entryStatus == ENTRY_SUBMISSION_FAILURE_UNKNOWN) {
			console.log(`Entry submission failed: unknown!`);
			createAlertDialog(alert_error_title, alert_entry_unknown_text);
		}
	}
});

// Create a listener for the close-application event
document_button.addEventListener("click", () => {
	console.log(`Open Document Button clicked!`);

	// Handle closing the application here
	window.electronAPI.handleOpenDocument();
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
	console.log(`Close Application Button clicked!`);

	// Handle closing the application here
	window.electronAPI.handleCloseApplication();
});

function createAlertDialog(alert_title, alert_content) {
	$(alert_dialog_id).dialog("option", "title", alert_title);
	$(alert_dialog_id).html(alert_content);
	$(alert_dialog_id).dialog("open");
	$(alert_dialog_id).dialog("widget").focus(); // required to fix bug where dialog button color is not changed until dialog is focused
}

$(function () {
	// Dialog initialization
	$(alert_dialog_id).dialog({
		autoOpen: false, // Dialog won't open on page load
		resizable: false, // Make it not resizable
		modal: true, // Make it a modal dialog
		buttons: {
			Ok: function () {
				$(this).dialog("close");
			},
		},
		dialogClass: "no-close", // Custom class for additional styling
	});
});

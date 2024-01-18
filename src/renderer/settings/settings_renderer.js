var alert_dialog_id = "#alert-dialog";

const alert_error_title = "Error";
const alert_warning_title = "Warning";

const alert_reminder_time_text = "Reminder time must be greater than 0";
const alert_snooze_time_text = "Snooze time must be greater than 0";
const alert_snooze_greater_text = "Snooze time cannot be greater than reminder time";

const alert_start_time_text = "Start time must be greater than 0";
const alert_end_time_text = "End time must be greater than 0";

const alert_end_time_greater_text = "End time must be greater than start time";

// Function to load setting values
document.addEventListener("DOMContentLoaded", async () => {
	// Load settings values
	const [reminderTime, snoozeTime, startTime, endTime, folderPath] = await window.electronAPI.onLoadSettings();

	reminderMinute = reminderTime % 60;
	reminderHour = (reminderTime - reminderMinute) / 60;

	snoozeMinute = snoozeTime % 60;
	snoozeHour = (snoozeTime - snoozeMinute) / 60;

	console.log("Reminder Time:", reminderTime);
	console.log("Reminder Hour:", reminderHour);
	console.log("Reminder Minute:", reminderMinute);

	// Load settings values
	document.getElementById("reminderHour").value = reminderHour;
	document.getElementById("reminderMinute").value = reminderMinute;
	document.getElementById("snoozeHour").value = snoozeHour;
	document.getElementById("snoozeMinute").value = snoozeMinute;
	document.getElementById("startTime").value = startTime;
	document.getElementById("endTime").value = endTime;
	document.getElementById("folderPath").value = folderPath;
});

// Get each of the setting values, validate them, and save them
function applySettings() {
	reminderHour = document.getElementById("reminderHour").value || 0;
	reminderMinute = document.getElementById("reminderMinute").value || 0;
	snoozeHour = document.getElementById("snoozeHour").value || 0;
	snoozeMinute = document.getElementById("snoozeMinute").value || 0;
	startTime = document.getElementById("startTime").value || 0;
	endTime = document.getElementById("endTime").value || 0;

	console.log("Reminder Hour:", reminderHour);
	console.log("Reminder Minute:", reminderMinute);

	reminderTime = parseInt(reminderHour) * 60 + parseInt(reminderMinute);
	snoozeTime = parseInt(snoozeHour) * 60 + parseInt(snoozeMinute);

	if (!validateReminderTime(reminderTime)) return false;
	if (!validateSnoozeTime(snoozeTime, reminderTime)) return false;
	if (!validateStartEndTime(startTime, endTime)) return false;

	window.electronAPI.handleApplySettings(reminderTime, snoozeTime, startTime, endTime);

	console.log("Settings Saved");
	return true;
}

// Function to handle validating reminder time
function validateReminderTime(reminderTime) {
	console.log("Reminder Time:", reminderTime);

	// Check if reminder time is greater than 0
	if (reminderTime <= 0) {
		createAlertDialog(alert_warning_title, alert_reminder_time_text);
		return false;
	}

	return true;
}

// Function to handle validating snooze time
function validateSnoozeTime(snoozeTime, reminderTime) {
	console.log("Snooze Time:", snoozeTime);

	// Check if snooze time is greater than 0
	if (snoozeTime <= 0) {
		createAlertDialog(alert_warning_title, alert_snooze_time_text);
		return false;
	}

	// Check if snooze time is greater than reminder time
	if (snoozeTime > reminderTime) {
		createAlertDialog(alert_warning_title, alert_snooze_greater_text);
		return false;
	}
	return true;
}

// Function to handle validating start and end time
function validateStartEndTime(startTime, endTime) {
	console.log("Start Time:", startTime);
	console.log("End Time:", endTime);

	// Check if start time is greater than 0
	if (startTime <= 0) {
		createAlertDialog(alert_warning_title, alert_start_time_text);
		return false;
	}

	// Check if end time is greater than 0
	if (endTime <= 0) {
		createAlertDialog(alert_warning_title, alert_end_time_text);
		return false;
	}

	// Check if end time is greater than start time
	if (endTime <= startTime) {
		createAlertDialog(alert_warning_title, alert_end_time_greater_text);
		return false;
	}

	return true;
}

// Function to handle opening folder dialog
async function openFolderDialog() {
	console.log("Open Folder Dialog");
	const folderPath = await window.electronAPI.openFolderDialog();
	console.log("Selected Folder:", folderPath);
	document.getElementById("folderPath").value = folderPath;
}

function openAdvancedSettings() {
	console.log("Open Advanced Settings Window");
	window.electronAPI.handleOpenAdvancedSettings();
}

function closeSettings() {
	console.log("Close Settings Window");
	if (!applySettings()) return;
	window.electronAPI.handleCloseApplication();
}

function createAlertDialog(alert_title, alert_content) {
	$(alert_dialog_id).dialog("option", "title", alert_title);
	$(alert_dialog_id).html(alert_content);
	$(alert_dialog_id).dialog("open");
	$(alert_dialog_id).dialog("widget").focus();		// required to fix bug where dialog button color is not changed until dialog is focused
}

$(function () {
	// Dialog initialization
	$(alert_dialog_id).dialog({
		autoOpen: fale, // Dialog won't open on page load
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

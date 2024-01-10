const alert_dialog_id = "#alert-dialog";
const alert_warning_title = "Warning";

const alert_start_time_text = "Start time must be greater than 0";
const alert_end_time_text = "End time must be greater than 0";

const alert_end_time_greater_text = "End time must be greater than start time";

// Function to load advanced settings values
document.addEventListener("DOMContentLoaded", async () => {
	// Load advanced settings values
	const days_settings = await window.electronAPI.onLoadAdvancedSettings();
	console.log(days_settings);

	// Check if days_settings is undefined - return if it is
	// if (days_settings == undefined) {
	//     return;
	// }
	// Iterate through each day
	for (let i = 0; i < days_settings.length; i++) {
		const day_settings = days_settings[i]; // Get values from the day

		const dayId = day_settings.day;
		const checkbox = day_settings.checkbox;
		const startTime = day_settings.startTime;
		const endTime = day_settings.endTime;

		// Log or process the values as needed
		console.log(`Day: ${dayId}, Checkbox: ${checkbox}, Start Time: ${startTime}, End Time: ${endTime}`);

        // Get the day container
        const dayContainer = document.querySelector(`.day-container[id="${dayId}"]`);

        // Set the values in the day container
        dayContainer.querySelector(".checkbox").checked = checkbox;
        dayContainer.querySelectorAll(".time-input")[0].value = startTime;
        dayContainer.querySelectorAll(".time-input")[1].value = endTime;
	}
});

function closeAdvancedSettings() {
	// Select all day containers
	const dayContainers = document.querySelectorAll(".day-container");

	// Create a list of days
	let days_settings = [];

	// Iterate through each container using a for loop

	for (let i = 0; i < dayContainers.length; i++) {
		const container = dayContainers[i];

		// Get values from the container
		const dayId = container.id;
		const checkbox = container.querySelector(".checkbox").checked;
		const startTime = container.querySelectorAll(".time-input")[0].value || 0;
		const endTime = container.querySelectorAll(".time-input")[1].value || 0;

		if (checkbox) {
			if (!validateStartEndTime(startTime, endTime)) return false;
        }
        // Log or process the values as needed
        console.log(`Day: ${dayId}, Checkbox: ${checkbox}, Start Time: ${startTime}, End Time: ${endTime}`);

        // Add the day to the list of days
        days_settings.push({
            day: dayId,
            checkbox: checkbox,
            startTime: startTime,
            endTime: endTime,
        });
	}

	// Send the days to the main process
	window.electronAPI.handleApplyAdvancedSettings(days_settings);
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

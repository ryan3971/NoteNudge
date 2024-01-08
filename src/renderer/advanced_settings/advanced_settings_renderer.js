// Function to load advanced settings values
document.addEventListener("DOMContentLoaded", async () => {
    // Load advanced settings values
    const days_settings = await window.electronAPI.onLoadAdvancedSettings();

    // Iterate through each day
    days_settings.forEach((day_settings) => {
        // Get values from the day
        const day = day_settings.day;
        const checkbox = day_settings.checkbox;
        const startTime = day_settings.startTime;
        const endTime = day_settings.endTime;

        // Log or process the values as needed
        console.log(`Day: ${day}, Checkbox: ${checkbox}, Start Time: ${startTime}, End Time: ${endTime}`);

        // Get the day container
        const dayContainer = document.querySelector(`.day-container[data-day="${day}"]`);

        // Set the values in the day container
        dayContainer.querySelector(".checkbox").checked = checkbox;
        dayContainer.querySelector(".time-input:nth-of-type(1)").value = startTime;
        dayContainer.querySelector(".time-input:nth-of-type(2)").value = endTime;
    });
});

function closeAdvancedSettings() {
	// Select all day containers
	const dayContainers = document.querySelectorAll(".day-container");

	// Create a list of days
	let days_settings = [];

	// Iterate through each container
	dayContainers.forEach((container) => {
		// Get values from the container
		const checkboxValue = container.querySelector(".checkbox").checked;
		const dayTextValue = container.querySelector(".day-text").textContent;
        try {
            const startTimeValue = container.querySelector(".time-input:nth-of-type(1)").value;
            const endTimeValue = container.querySelector(".time-input:nth-of-type(2)").value;
        } catch (error) {
            const startTimeValue = "00:00";
            const endTimeValue = "00:00";
        }
		// Log or process the values as needed
		console.log(`Day: ${dayTextValue}, Checkbox: ${checkboxValue}, Start Time: ${startTimeValue}, End Time: ${endTimeValue}`);

        // Add the day to the list of days
		days_settings.push({
			day: dayTextValue,
			checkbox: checkboxValue,
			startTime: startTimeValue,
			endTime: endTimeValue,
		});
	});

    // Send the days to the main process
    window.electronAPI.handleApplyAdvancedSettings(days_settings);
}

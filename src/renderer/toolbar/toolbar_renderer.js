// renderer.js
// Constant Variables
const BUTTON_MAIN_WINDOW = 1;
const BUTTON_SKIP = 2;
const BUTTON_SNOOZE = 3;
const BUTTON_CLOSE = 4;

const settings_button = document.getElementById("button-main");
const skip_button = document.getElementById("button-skip");
const snooze_button = document.getElementById("button-snooze");
const close_button = document.getElementById("button-close");

settings_button.addEventListener("click", () => {
    console.log(`settings_button`);
    window.electronAPI.handleTaskbarButton(BUTTON_MAIN_WINDOW);
});

skip_button.addEventListener("click", () => {
    console.log(`skip_button`);
    window.electronAPI.handleTaskbarButton(BUTTON_SKIP);
});

snooze_button.addEventListener("click", () => {
    console.log(`snooze_button`);
    window.electronAPI.handleTaskbarButton(BUTTON_SNOOZE);
});

close_button.addEventListener("click", () => {
    console.log(`close_button`);
    window.electronAPI.handleTaskbarButton(BUTTON_CLOSE);
});
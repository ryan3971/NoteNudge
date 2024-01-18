
# NoteNudge
## What Is it?
An Electron JS application that utilizes HTML, CSS, and JavaScript, NoteNudge is a simple none-intrusive app that gently nudges you to log what you've been doing throughout the word day, keeping you organized and always ready to showcase your accomplishments.

## General Idea
The main idea of  behind this application is to periodically give the user the option to submit an entry. When the user first opens the application, it immediatly opens the settings for the user to fill in. Once finished, the application is ready to use. Details on the different windows, buttons, and options can be found below.

## Why Make It?

I like to log what I do throughout the workday to keep track of what I’ve accomplished, where my time was spent, and especially for when I need to provide updates on what I’ve done for the previous week (I can just refer to my notes rather than trying to remember what I’ve done). 

The **problem** is, when I’m really wrapped up in a project, I either forget or choose not to record what I’ve been doing. I end up putting down a quick, non descriptive entry at the end of the day. 
It doesn't need to be any specific that's written down; it can be what I'm working on, what I need to do, a quick code or image snippet, or any other relevant (or random) thoughts. The main point is it's easier to write something down as it is occurring then after when you've forgotten, and this application aims to help with that.

Other note taking tools exist but they tend to be overly complicated and have a steep learning curve. This was meant to be quick & easy to start & learn.


## Application Breakdown

### Settings
<img src="https://github.com/ryan3971/note_reminder/assets/30581189/6fd79e9d-1742-4e8c-a03a-47fe802fb1c5" width="400">

This area is for user defined inputs. The following breaks down the setting options:

**Reminder Time (hour:min):** This is the time between entries. After you submit an entry, or click the **Skip** button, the application is hidden until this amount of time elapses. There are some scenarios where this is not the case (see below).

**Snooze Time (hour:min):** Similar to the Reminder Time but this should be a smaller value used to only temporarily delay submitting an entry.

**Start Time:** The application will resume running after this time in the day.

**End Time:** The application will stop running after this time for the remainder of the day.

**Select Folder:** The user can select the location where the generated Word Document that containing the entries is stored.

If the user attempts to close the setting with invalid inputs, an alert will be generated reporting the issue. The user cannot close the settings until these issues are resolved.

### Toolbar

<img src="https://github.com/ryan3971/note_reminder/assets/30581189/5c215cd6-7af4-4ec8-9c85-9355fb2f45ab" width="150">

The toolbar is one of two ways to access the Main Window where the user can submit an entry. It is made up of four buttons:

1) **Add Entry:** Closes the Toolbar window and opens the main window.
 
2) **Skip:** Closes the Toolbar for the duration of *Reminder Time*  (set in the *Settings*)

3) **Snooze:** Closes the Toolbar for the duration *Snooze Time*  (set in the *Settings*)

4) **Shut Down:** Completely shuts down the application

### Main Window

<img src="https://github.com/ryan3971/note_reminder/assets/30581189/5441fa32-445d-4bd9-a132-a1821bc52605" width="700">

The Main Window holds the editor & associated formatting options, along with a side panel with a series of buttons.

1) **Editor**: This is the area where the user can write or paste whatever they want. 

2) **Editor Toolbar:** This toolbar contains several well know formatting options for the text within the editor.

3) **Crop:** Capture a selected region of the screen to save as an image in the editor

4) **Submit Entry:** Exports the text in the Editor to the Word Document

5) **Open Document:** Opens the Word Document

6) **Settings:** Opens the Settings

7) **Skip Entry:** Closes the Main Window for the duration *Reminder Time*  (set in the *Settings*), where the Toolbar will then be shown

8) **Snooze:** Closes the Main Window for the duration *Snooze Time*  (set in the *Settings*), where the Toolbar will then be shown

9) **Shut Down:** Completely shuts down the application

### Cropping
Clicking the cropping button will hide the main window. The user can then click and drag across the section of the screen they want to capture. That section will then be displayed within the editor.

![crop-gif](https://github.com/ryan3971/note_reminder/assets/30581189/a80a7e3a-d21d-461f-8d67-c182637ddd6f)

### Traybar

<img src="https://github.com/ryan3971/note_reminder/assets/30581189/b0a83d7a-43b5-4593-b721-3b8c1b5aec5b" width="150">

An area where the application will always be accessible. The Traybar has four options:

**Open:** Opens the Main Window

**Open Document:** Opens the Word Document

**Snooze for Day:** Hides the application for the remainder of the day (it will resume running the next day)

**Quit:** Completely shuts down the application

### Advanced Settings

<img src="https://github.com/ryan3971/note_reminder/assets/30581189/2cb9d619-6a11-4aca-ab46-295e44bf30a6" width="400">


This window is accessible through the **Settings**  and is used to provide finer control over when the application runs. For each day of the week, the following options are available:

**Enable/disable:** Checking this for a given day will have the application run on that day. Leaving it unchecked will mean the application will not run that day

**Start Time/ End Time:** Identical to the options in the *Settings*, these times are used to fine tune when the application will run for the selected day. With the day checked but these times left blank, the application will use the default values provided in the *Settings*


### Using the Application

To use the application, download the executable here: [NoteNudge Executable](https://drive.google.com/uc?export=download&id=1hmO-U10X9lPUMdoci9weH3lpn_WsYhbM) (Windows only)




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
This area is for user defined inputs. The following breaks down the setting options:

**Reminder Time (hour:min):** This is the time between entries. After you submit an entry, or click the **Skip** button, the application is hidden until this amount of time elapses. There are some scenarios where this is not the case (see below).

**Snooze Time (hour:min):** Similar to the Reminder Time but this should be a smaller value used to only temporarily delay submitting an entry.

**Start Time:** The application will resume running after this time in the day.

**End Time:** The application will stop running after this time for the remainder of the day.

**Select Folder:** The user can select the location where the generated Word Document that containing the entries is stored.

If the user attempts to close the setting with invalid inputs, an alert will be generated reporting the issue. The user cannot close the settings until these issues are resolved.

### Toolbar
The toolbar is one of two ways to access the Main Window where the user can submit an entry. It is made up of four buttons:

 1. *Add Entry* - this closes the Toolbar window and opens the main window
 2. *Skip* - this 

### Main Window
The Main Window holds the editor & associated formatting options, along with a side panel with a series of buttons.

**Editor**: This is the area where the user can write or paste whatever they want. 

**Editor Toolbar:** This toolbar contains several well know formatting options for the text within the editor.

Submit Entry:

Open Document:

Settings:

Skip Entry:

Snooze:

Shut Down:

### Cropping
Clicking the cropping button will hide the main window. The user can then click and drag across the section of the screen they want to capture. That section will then be displayed within the editor.

[insert video of cropping in action]

### Settings


### Advanced Settings


### Traybar


### Traying the Application

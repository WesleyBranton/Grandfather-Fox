# Grandfather Fox [<img align="right" src=".github/fxaddon.png">](https://addons.mozilla.org/firefox/addon/grandfather-fox/)
When you're browsing on Firefox, it's easy to lose track of time. The Grandfather Fox add-on turns your browser into a classic grandfather clock that will chime each hour. It promotes time awareness, while also giving your home office a bit of class.

The add-on currently features a variety of audio packs, including:
* Traditional grandfather clock
* Cuckoo clock
* Single beep
* Multiple progressive beeps
* Clock tower

## Development
This repository contains all of the required source code files to make changes to this extension. The "master" branch contains the source code for the latest stable release. If you want to test that version, you can view the release section to download the XPI file or visit the add-on listing on Mozilla.

If you want to make changes to this extension, you are welcome to do so. All files for the extension are located in the "firefox" folder. The source code of upcoming versions (if any) will be located in another branch.

To develop and test the extension, you need to open the "about:debugging" page in Firefox and select "Load Temporary Add-on". Then you can select any file within the "firefox" folder of this repository.

Further documentation about developing Firefox extensions can be found [here](https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension).

## Release Notes
### Version 1.4
* **[NEW]** Added "Fix Timing" button to the add-on options
* **[FIXED]** Removed unnecessary developer code

### Version 1.3.1
* **[FIXED]** Chime is no longer 1 hour behind

### Version 1.3
* **[NEW]** Changed to the more stable and reliable Javascript Alarm API
* **[FIXED]** Repaired issues with add-on not working after a period of time

### Version 1.2.1
* **[FIXED]** Removed unnecessary developer testing code

### Version 1.2
* **[FIXED]** Default settings not loading on first install
* **[FIXED]** Timing system not firing when computer is put in sleep mode
* **[FIXED]** Improved timing system reliability

### Version 1.1
* **[NEW]** Added audio sample button to the add-on options

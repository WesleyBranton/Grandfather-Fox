/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */


/**
 * Save settings to Storage API
 */
function saveOptions() {
    browser.storage.local.set({
        'chime': chimeNoise.value
    });
    
    chimeVolume = volumeSlider.value / 100;
    audio.volume = chimeVolume;
    browser.storage.local.set({
        'volume': chimeVolume
    });

    browser.storage.local.set({
        timezone: document.settings.timezone.value
    });
}

/**
 * Load settings from Storage API
 */
async function restoreOptions() {
    var setting = await browser.storage.local.get('chime');
    chimeNoise.value = setting.chime;
    
    setting = await browser.storage.local.get('volume');
    chimeVolume = setting.volume;
    volumeSlider.value = chimeVolume * 100;

    setting = await browser.storage.local.get('timezone');
    document.settings.timezone.value = (setting.timezone) ? setting.timezone : 'auto';

    updateVolumeOutput();
    toggleCustomAudio();
    toggleCustomWarning();
    showCurrentTime(true);

    if (chimeNoise.value == 'custom') {
        updateCustomAudioList();
    } else {
        port.postMessage({
            command: 'clear'
        });
    }
}

/**
 * Update volume output percentage label
 */
function updateVolumeOutput() {
    volumeOutput.textContent = volumeSlider.value + '%';
}

/**
 * Toggle custom audio section based on user settings
 */
function toggleCustomAudio() {
    const customChimeSection = document.getElementById('custom-chime-section');

    if (chimeNoise.value == 'custom') {
        customChimeSection.classList.remove('hide');
    } else {
        customChimeSection.classList.add('hide');
    }
}

/**
 * Handle button press for each custom audio
 *     Removes chime if there's already audio set
 *     Opens file selection dialog if there's no audio set
 * @param {Event} event
 */
function triggerChimeUpdate(event) {
    selectedHour = parseInt(event.target.id.split('-')[1]);

    if (hoursWithChime[selectedHour]) { // Chime exists
        removeChime();
    } else { // No chime currently added
        const input = document.getElementsByName('customChime')[0];
        input.click();
    }
}

/**
 * Update buttons for custom audio hour
 * @param {number} hour
 * @param {boolean} hasAudio
 */
function updateCustomChimeUI(hour, hasAudio) {
    const button = document.getElementById('custom-' + hour);
    button.textContent = (hasAudio) ? browser.i18n.getMessage('customRemove') : browser.i18n.getMessage('customAdd');
    button.classList.remove((hasAudio) ? 'default' : 'secondary');
    button.classList.add((hasAudio) ? 'secondary' : 'default');

    hoursWithChime[hour] = hasAudio;
    selectedHour = null;
    toggleCustomWarning();
}

/**
 * Remove an existing custom audio
 */
function removeChime() {
    toggleDialog(true);

    if (isAudioPlaying() && parseInt(document.settings.selectedNoise.value) == selectedHour) {
        audio.pause();
        isAudioPlaying();
    }

    onSuccess = (message) => {
        updateCustomChimeUI(selectedHour, false);
    };

    onFailed = (message) => {
        selectedHour = null;
        alert(browser.i18n.getMessage('errorCannotRemove') + ':\n' + message.error);
    };

    port.postMessage({
        command: 'remove',
        filename: 'chime_' + selectedHour
    });
}

/**
 * Add custom audio
 */
function addChime() {
    const input = document.getElementsByName('customChime')[0];
    if (input.files.length != 1) {
        return;
    }

    toggleDialog(true);

    onSuccess = (message) => {
        if (selectedHour != null) {
            updateCustomChimeUI(selectedHour, true);
        }
    
        document.getElementsByName('customChime')[0].value = null;
    };

    onFailed = (message) => {
        document.getElementsByName('customChime')[0].value = null;
        selectedHour = null;
        alert(browser.i18n.getMessage('errorCannotAdd') + ':\n' + message.error);
    };

    port.postMessage({
        command: 'save',
        filename: 'chime_' + selectedHour,
        file: input.files[0]
    });
}

/**
 * Play preset audio sample
 */
 function playAudio() {
    const isPlaying = isAudioPlaying();

    audio.pause();
    isAudioPlaying();

    if (isPlaying) {
        return;
    }

    if (chimeNoise.value == 'custom') {
        previewChime();
    } else {
        audio.pause();
        audio = new Audio(`../audio/${chimeNoise.value}/${document.settings.selectedNoise.value}.ogg`);
        audio.addEventListener('ended', isAudioPlaying);
        audio.volume = chimeVolume;
        audio.play();
        isAudioPlaying();
    }
}

/**
 * Check if audio is playing and update the UI accordingly
 * @returns isPlaying
 */
function isAudioPlaying() {
    if (audio.paused) {
        previewButton.classList.remove('playing');
        previewButton.textContent = browser.i18n.getMessage('chimePreviewButton');
    } else {
        previewButton.classList.add('playing');
        previewButton.textContent = browser.i18n.getMessage('chimePreviewStopButton');
    }

    previewHour.disabled = !audio.paused;

    return !audio.paused;
}

/**
 * Toggle preview for a custom chime
 * @param {Event} event
 */
function previewChime() {
    toggleDialog(true);

    if (isAudioPlaying()) {
        toggleDialog(false);
        return;
    }

    onSuccess = (message) => {
        audio = new Audio(URL.createObjectURL(message.file));
        audio.addEventListener('ended', isAudioPlaying);
        audio.volume = chimeVolume;
        audio.play();
        isAudioPlaying();
    };

    onFailed = (message) => {
        alert(browser.i18n.getMessage('errorCannotPlay') + ':\n' + message.error);
    };

    port.postMessage({
        command: 'load',
        filename: 'chime_' + document.settings.selectedNoise.value
    });
}

/**
 * Bulk update the custom audio section
 */
function updateCustomAudioList() {
    onSuccess = (message) => {
        for (let file of message.list) {
            const hour = parseInt(file.split('_')[1]);
            updateCustomChimeUI(hour, true);
        }
        toggleCustomWarning();
    };

    onFailed = (message) => {
        alert(browser.i18n.getMessage('errorCannotLoad') + ':\n' + message.error);
    };

    port.postMessage({
        command: 'list'
    });
}

/**
 * Remove handlers for queued process
 */
function resetActionHandlers() {
    onSuccess = () => {};
    onFailed = () => {};
}

/**
 * Handle incoming messages from background script
 * @param {Object} message
 */
function processMessage(message) {
    if (message.status == 'success') {
        onSuccess(message);
        toggleDialog(false);
    } else {
        onFailed(message);
        toggleDialog(false);
    }

    resetActionHandlers();
}

/**
 * Toggle loading dialog
 * @param {boolean} show
 */
function toggleDialog(show) {
    const dialog = document.getElementById('dialog-overlay');

    if (show) {
        dialog.classList.remove('hide');
    } else {
        dialog.classList.add('hide');
    }

}

/**
 * Show warning for custom chimes if an hour is missing
 */
function toggleCustomWarning() {
    let show = false;

    for (let hour of hoursWithChime) {
        if (hour === false) {
            show = true;
        }
    }

    const warning = document.getElementById('chimes-not-set');
    if (show) {
        warning.classList.remove('hide');
    } else {
        warning.classList.add('hide');
    }
}

// Place holder functions
function onSuccess(message) {}
function onFailed(message) {}

const port = browser.runtime.connect({name: Date.now() + ''});
port.onMessage.addListener(processMessage);

var chimeNoise = document.getElementById('chimeNoise');
var volumeOutput = document.getElementById('volumeOutput');
var volumeSlider = document.getElementById('chimeVolume');
var previewButton = document.getElementById('sample');
var previewHour = document.getElementById('sample-selection');
var audio = new Audio();
var chimeVolume = 1;
let selectedHour = null;
let hoursWithChime = [0, false, false, false, false, false, false, false, false, false, false, false, false];

document.title = browser.i18n.getMessage('optionsTitle', browser.i18n.getMessage('extensionName'));
i18nParse();
restoreOptions();

previewButton.addEventListener('click', playAudio);
volumeSlider.addEventListener('input', updateVolumeOutput);
document.settings.addEventListener('change', saveOptions);
document.getElementsByName('customChime')[0].addEventListener('change', addChime);
chimeNoise.addEventListener('change', toggleCustomAudio);

for (let i = 1; i <= 12; i++) {
    document.getElementById('custom-' + i).addEventListener('click', triggerChimeUpdate);
}
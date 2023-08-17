/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Initialize page
 */
function init() {
    setViewMode();
    document.title = browser.i18n.getMessage('optionsTitle', browser.i18n.getMessage('extensionName'));
    i18nParse();
    restoreOptions();
}

/**
 * Set browser options to tab or builtin mode
 */
function setViewMode() {
    const mode = new URL(document.location.href).searchParams.get('view');
    if (mode != 'builtin') {
        document.body.classList.add('browser-style-page');
        document.settings.classList.add('browser-style-container');
    }
}

/**
 * Save settings to Storage API
 */
function saveOptions() {
    browser.storage.local.set({
        chime: document.settings.chime.value,
        volume: document.settings.volume.value / 100,
        timezone: document.settings.timezone.value
    });
    togglePreviewButton();
}

/**
 * Load settings from Storage API
 */
async function restoreOptions() {
    let settings = await browser.storage.local.get(['chime', 'volume', 'timezone']);
    settings = fillDefaultSettings(settings);
    document.settings.chime.value = settings.chime;
    document.settings.volume.value = settings.volume * 100;
    document.settings.timezone.value = settings.timezone;

    updateVolumeOutput();
    toggleCustomAudio();
    showCurrentTime(true);

    if (settings.chime == 'custom') {
        updateCustomAudioList();
    } else {
        ChimeManager.getInstance().clear();
    }
}

/**
 * Update volume output percentage label
 */
function updateVolumeOutput() {
    if (audio != null) {
        audio.volume = document.settings.volume.value / 100;
    }
    volumeOutput.textContent = document.settings.volume.value + '%';
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
async function triggerChimeUpdate(event) {
    const hour = parseInt(event.target.id.split('-')[1]);
    const exists = await ChimeManager.getInstance().has(hour);

    if (exists) { // Chime exists
        removeChime(hour);
    } else { // No chime currently added
        document.settings.customChime.dataset.hour = hour;
        document.settings.customChime.click();
    }
}

/**
 * Update buttons for custom audio hour
 * @param {number} hour
 */
async function updateCustomChimeUI(hour) {
    const hasAudio = await ChimeManager.getInstance().has(hour);

    const editButton = document.getElementById('custom-' + hour);
    editButton.title = (hasAudio) ? browser.i18n.getMessage('customRemove') : browser.i18n.getMessage('customAdd');
    editButton.classList.remove((hasAudio) ? 'default' : 'secondary');
    editButton.classList.add((hasAudio) ? 'secondary' : 'default');

    const downloadButton = document.getElementById(`custom-${hour}-download`);
    downloadButton.disabled = !hasAudio;

    await toggleCustomWarning();
}

/**
 * Remove an existing custom audio
 * @param {Number} hour
 */
async function removeChime(hour) {
    toggleDialog(true);

    if (isAudioPlaying() && parseInt(document.settings.hour.value) == hour) {
        stopAudio();
    }

    try {
        await ChimeManager.getInstance().delete(hour);
        await updateCustomChimeUI(hour);
    } catch (error) {
        alert(browser.i18n.getMessage('errorCannotRemove') + ':\n' + error);
    } finally {
        togglePreviewButton();
        toggleDialog(false);
    }
}

/**
 * Add custom audio
 */
function addChime() {
    if (document.settings.customChime.files.length != 1) {
        return;
    }

    toggleDialog(true);
    const hour = parseInt(document.settings.customChime.dataset.hour);
    const validationResult = validateChime(document.settings.customChime.files[0]);

    if (validationResult != null) {
        alert(browser.i18n.getMessage('errorCannotAdd') + ':\n' + validationResult);
        toggleDialog(false);
        return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            await ChimeManager.getInstance().set(hour, document.settings.customChime.files[0].name, event.target.result);
            updateCustomChimeUI(hour);
            document.getElementsByName('customChime')[0].value = null;
        } catch (error) {
            document.getElementsByName('customChime')[0].value = null;
            alert(browser.i18n.getMessage('errorCannotAdd') + ':\n' + error);
        } finally {
            togglePreviewButton();
            toggleDialog(false);
        }
    };
    reader.readAsDataURL(document.settings.customChime.files[0]);
}

/**
 * Validate file before uploading
 * @param {File} file
 * @returns Validation message
 */
function validateChime(file) {
    const validTypes = ['audio/mpeg', 'audio/ogg', 'video/ogg', 'audio/wav'];
    let isValidType = false;

    for (const type of validTypes) {
        if (file.type == type) {
            isValidType = true;
            break;
        }
    }

    if (!isValidType) {
        return 'Unsupported file type (Must be MP3, OGG, or WAV)';
    }

    if (file.size > 5000000) {
        return 'File size exceeds limit (Maximum 5MB)';
    }

    return null;
}

/**
 * Play preset audio sample
 */
 function playAudio() {
    const isPlaying = isAudioPlaying();

    stopAudio();

    if (isPlaying) {
        return;
    }

    if (document.settings.chime.value == 'custom') {
        previewChime();
    } else {
        stopAudio();
        audio = new Audio(`../audio/${document.settings.chime.value}/${document.settings.hour.value}.ogg`);
        audio.addEventListener('ended', isAudioPlaying);
        audio.volume = document.settings.volume.value / 100;
        audio.play();
        isAudioPlaying();
    }
}

/**
 * Stop audio sample
 */
function stopAudio() {
    if (audio != null) {
        audio.pause();
        isAudioPlaying();
    }
}

/**
 * Check if audio is playing and update the UI accordingly
 * @returns isPlaying
 */
function isAudioPlaying() {
    const paused = audio == null || audio.paused;

    if (paused) {
        previewButton.classList.remove('playing');
        previewButton.textContent = browser.i18n.getMessage('chimePreviewButton');
    } else {
        previewButton.classList.add('playing');
        previewButton.textContent = browser.i18n.getMessage('chimePreviewStopButton');
    }

    document.settings.hour.disabled = !paused;

    return !paused;
}

/**
 * Toggle preview for a custom chime
 */
async function previewChime() {
    toggleDialog(true);

    if (isAudioPlaying()) {
        toggleDialog(false);
        return;
    }

    try {
        const chime = await ChimeManager.getInstance().get(parseInt(document.settings.hour.value));
        if (chime != null) {
            audio = new Audio(chime.data);
            audio.addEventListener('ended', isAudioPlaying);
            audio.volume = document.settings.volume.value / 100;
            audio.play();
            isAudioPlaying();
        } else {
            throw 'Audio not found';
        }
    } catch (error) {
        alert(browser.i18n.getMessage('errorCannotPlay') + ':\n' + error);
    } finally {
        toggleDialog(false);
    }
}

/**
 * Handle custom chime download event
 * @param {Event} event
 */
async function triggerChimeDownload(event) {
    const hour = parseInt(event.currentTarget.id.split('-')[1]);
    const granted = await browser.permissions.request({
        permissions: ['downloads']
    });
    if (granted) {
        downloadChime(hour);
    } else {
        console.error('Missing permissions to manage downloads');
        alert('Missing permissions');
    }
}

/**
 * Download a custom chime
 * @param {Number} hour
 */
async function downloadChime(hour) {
    const chime = await ChimeManager.getInstance().get(hour);
    if (chime != null) {
        // Convert data URL to blob
        const bytes = atob(chime.data.split(',')[1]);
        const mime = chime.data.split(',')[0].split(':')[1].split(';')[0];
        const buffer = new ArrayBuffer(bytes.length);
        const byteArray = new Uint8Array(buffer);
        for (let i = 0; i < bytes.length; i++) {
            byteArray[i] = bytes.charCodeAt(i);
        }
        const file = new Blob([buffer], {type: mime});

        browser.downloads.download({
            filename: chime.name,
            url: URL.createObjectURL(file),
            saveAs: true
        });
    }
}

/**
 * Bulk update the custom audio section
 */
async function updateCustomAudioList() {
    try {
        const chimes = await ChimeManager.getInstance().list(false);
        for (const hour of chimes) {
            await updateCustomChimeUI(hour);
        }
        await toggleCustomWarning();
        await togglePreviewButton();
    } catch (error) {
        alert(browser.i18n.getMessage('errorCannotLoad') + ':\n' + error);
    }
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
async function toggleCustomWarning() {
    const chimes = await ChimeManager.getInstance().list(false);
    const show = chimes.size != 12;
    const warning = document.getElementById('chimes-not-set');

    if (show) {
        warning.classList.remove('hide');
    } else {
        warning.classList.add('hide');
    }
}

/**
 * Disable/Enable preview button only if the selected hour has a chime set
 */
async function togglePreviewButton() {
    if (document.settings.chime.value != 'custom') {
        previewButton.disabled = false;
        return;
    }

    const selectedHour = parseInt(document.settings.hour.value);
    previewButton.disabled = !await ChimeManager.getInstance().has(selectedHour);
}

/**
 * Open feedback window
 */
function openFeedback() {
    browser.runtime.sendMessage({
        command: 'feedback',
        target: 'background'
    });
}

/**
 * Track if an async task is in progress
 * @param {boolean} complete
 */
function asyncTask(complete) {
    toggleDialog(!complete);
}

const volumeOutput = document.getElementById('volumeOutput');
const previewButton = document.getElementById('sample');
let audio = null;

init();

previewButton.addEventListener('click', playAudio);
document.settings.volume.addEventListener('input', updateVolumeOutput);
document.settings.addEventListener('change', saveOptions);
document.settings.customChime.addEventListener('change', addChime);
document.settings.chime.addEventListener('change', toggleCustomAudio);
document.getElementById('feedbacklink').addEventListener('click', openFeedback);

for (let i = 1; i <= 12; i++) {
    document.getElementById('custom-' + i).addEventListener('click', triggerChimeUpdate);
    document.getElementById(`custom-${i}-download`).addEventListener('click', triggerChimeDownload);
}
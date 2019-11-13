/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// Save chime option
function saveChime() {
    browser.storage.local.set({
        'chime': chimeNoise.value
    });
}

// Save volume option
function saveVolume() {
    volumeSave.className = "hide";
    chimeVolume = volumeSlider.value / 100;
    audio.volume = chimeVolume;
    browser.storage.local.set({
        'volume': chimeVolume
    });
}

// Load options from storage
async function restoreOptions() {
    var setting = await browser.storage.local.get('chime');
    chimeNoise.value = setting.chime;
    
    setting = await browser.storage.local.get('volume');
    chimeVolume = setting.volume;
    volumeSlider.value = chimeVolume * 100;
    updateVolumeOutput();
}

// Play audio sample
function playAudio() {
    audio.pause();
    var audioType = chimeNoise.value;
    audio = new Audio('../audio/' + audioType + '/3.ogg');
    audio.volume = chimeVolume;
    audio.play();
}

// Reload the alarm
function reload() {
    chrome.runtime.sendMessage('reload');
}

// Update volume output number
function updateVolumeOutput() {
    volumeOutput.textContent = volumeSlider.value + '%';
    
    if (volumeSlider.value / 100 != chimeVolume) {
        volumeSave.className = "";
    } else {
        volumeSave.className = "hide";
    }
}

var chimeNoise = document.getElementById('chimeNoise');
var volumeOutput = document.getElementById('volumeOutput');
var volumeSlider = document.getElementById('chimeVolume');
var volumeSave = document.getElementById('volumeSave');
var audio = new Audio();
var chimeVolume = 1;
restoreOptions();
document.getElementById('sample').addEventListener('click', playAudio);
document.getElementById('reload').addEventListener('click', reload);
volumeSlider.addEventListener('input', updateVolumeOutput);
chimeNoise.addEventListener('change', saveChime);
volumeSave.addEventListener('click', saveVolume);
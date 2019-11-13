/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// Save options
function saveOptions() {
    var setting = document.getElementById('chimeNoise').value;
    browser.storage.local.set({'chime': setting});
}

// Load options from storage
function restoreOptions() {
    browser.storage.local.get('chime', (res) => {
        var setting = document.getElementById('chimeNoise');
        setting.value = res.chime;
    });
}

// Play audio sample
function playAudio() {
    audio.pause();
    var audioType = document.getElementById('chimeNoise').value;
    audio = new Audio('../audio/' + audioType + '/3.ogg');
    audio.play();
}

// Reload the alarm
function reload() {
    chrome.runtime.sendMessage('reload');
}

restoreOptions();
document.getElementsByTagName('form')[0].addEventListener('change', saveOptions);
document.getElementById('sample').addEventListener('click',playAudio);
document.getElementById('reload').addEventListener('click',reload);var audio = new Audio();

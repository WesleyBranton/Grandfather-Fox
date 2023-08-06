/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Handle incoming runtime messages
 * @param {Object} message
 */
function handleMessages(message) {
    if (typeof message.target == 'string' && message.target != 'offscreen') {
        return;
    }

    switch (message.command.toUpperCase()) {
        case 'PLAY':
            playAudio(message.parameters.url, message.parameters.volume);
            break;
    }
}

/**
 * Play audio file
 * @param {String} url
 * @param {Number} volume
 */
function playAudio(url, volume) {
    const audio = new Audio(url);
    audio.addEventListener('ended', handleAudioEnded);
    audio.addEventListener('pause', handleAudioEnded);
    audio.volume = volume;
    audio.play();
}

/**
 * Handle audio ended or paused
 */
function handleAudioEnded() {
    browser.runtime.sendMessage({
        command: 'stop',
        target: 'background'
    });
}

browser = chrome;
browser.runtime.onMessage.addListener(handleMessages);
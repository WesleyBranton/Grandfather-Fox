/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Plays chime
 * @param {String} url
 * @param {Number} volume
 * @async
 */
async function playChime(url, volume) {
    await stopChime();
    audio = new Audio(url);
    audio.addEventListener('ended', handleAudioEnded);
    audio.addEventListener('pause', handleAudioEnded);
    audio.addEventListener('play', handleAudioStarted);
    audio.volume = volume;
    audio.play();
}

/**
 * Stops chime
 * @async
 */
async function stopChime() {
    if (audio != null) {
        audio.pause();
        audio = null;
    }
    handleAudioEnded();
}

let audio =  null;
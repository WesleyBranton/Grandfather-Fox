/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Creates offscreen document for audio playback
 * @async
 */
async function openOffscreenDocument() {
    await closeOffscreenDocument();
    await browser.offscreen.createDocument({
        reasons: [browser.offscreen.Reason.AUDIO_PLAYBACK],
        justification: 'Audio playback',
        url: browser.runtime.getURL(OFFSCREEN_DOCUMENT)
    });
}

/**
 * Closes offscreen document
 * @async
 */
async function closeOffscreenDocument() {
    if (await hasOffscreenDocument()) {
        await browser.offscreen.closeDocument();
    }
}

/**
 * Checks if an offscreen document exists
 * @returns Has Document
 * @async
 */
async function hasOffscreenDocument() {
    const allClients = await clients.matchAll();
    const offscreenUrl = browser.runtime.getURL(OFFSCREEN_DOCUMENT);

    for (const client of allClients) {
        if (client.url === offscreenUrl) {
            return true;
        }
    }

    return false;
}

/**
 * Plays chime
 * @param {String} url
 * @param {Number} volume
 * @async
 */
async function playChime(url, volume) {
    await openOffscreenDocument();
    await browser.runtime.sendMessage({
        command: 'play',
        target: 'offscreen',
        parameters: {
            url: url,
            volume: volume
        }
    });
    handleAudioStarted();
}

/**
 * Stops chime
 * @async
 */
async function stopChime() {
    try {
        await closeOffscreenDocument();
    } catch (error) {
        // TO NOTHING
    }
    handleAudioEnded();
}
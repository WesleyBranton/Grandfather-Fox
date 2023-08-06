/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Initialize service worker
 */
function init() {
    setUninstallPage();
    createAlarm();
}

/**
 * Creates next chime alarm
 */
function createAlarm() {
    browser.storage.local.get(['timezone'], (settings) => {
        settings = fillDefaultSettings(settings);

        browser.alarms.create(ALARM_NAME, {
            when: getNextTime(settings.timezone).getTime(),
            periodInMinutes: 60
        });
    });
}

/**
 * Check if alarm is alive and recreate, if necessary
 */
function checkAlarm() {
    browser.alarms.get(ALARM_NAME, (alarm) => {
        const currentTime = new Date().getTime();
        if (typeof alarm == 'undefined'
                || alarm.scheduledTime < currentTime
                || (alarm.scheduledTime - currentTime) > 3600000) {
            createAlarm();
        }
    });
}

/**
 * Load and play the chime audio
 * @async
 */
async function triggerChime(alarm) {
    const timeDifference = Math.abs(alarm.scheduledTime - Date.now());
    if (timeDifference > 10000) { // 10 seconds
        createAlarm();
        return;
    }

    let settings = await browser.storage.local.get(['chime', 'volume', 'timezone']);
    settings = fillDefaultSettings(settings);
    const hour = getChimeHour(settings.timezone);
    let url = null;

    if (settings.chime == 'custom') {
        url = await ChimeManager.getInstance().get(hour);
    } else {
        url = browser.runtime.getURL(`audio/${settings.chime}/${hour}.ogg`);
    }

    if (typeof url != 'string') {
        console.warn('Could not load chime %s for hour %d', settings.chime, hour);
        return;
    }

    await playChime(url, settings.volume);
}

/**
 * Get current timezone-specific time
 * @param {Date} date
 * @param {String} timezone
 * @returns Time
 */
function getCurrentTime(date, timezone) {
    if (timezone != 'auto') {
        return date.toLocaleTimeString("en-US", {
            timeZone: timezone
        });
    }

    return date.toLocaleTimeString("en-US");
}

/**
 * Gets hour to play
 * @param {String} timezone
 * @returns Hour
 */
function getChimeHour(timezone) {
    let time = new Date();
    time.setMinutes(time.getMinutes() + 5); // Make sure time is current hour
    time = getCurrentTime(time, timezone);

    const hour = parseInt(time.split(':')[0]) % 12;
    return (hour == 0) ? 12 : hour;
}

/**
 * Gets the next time the chime should play
 * @param {String} timezone
 * @returns Date
 */
function getNextTime(timezone) {
    const date = new Date();
    const time = getCurrentTime(date, timezone).split(':');
    const currentMinute = parseInt(time[1]);
    const currentSecond = parseInt(time[2].split(' ')[0]);
    const offsetSeconds = 60 - currentSecond;
    const offsetMinutes = 60 - (currentMinute + 1);

    date.setMilliseconds(0);
    date.setSeconds(date.getSeconds() + offsetSeconds);
    date.setMinutes(date.getMinutes() + offsetMinutes);

    return date;
}

/**
 * Handles audio playing
 */
function handleAudioStarted() {
    browser.browserAction.setTitle({title: browser.i18n.getMessage('browserActionActiveLabel')});
    browser.browserAction.setBadgeText({text: '\u25B6'});
}

/**
 * Handles audio stopped
 */
function handleAudioEnded() {
    browser.browserAction.setTitle({title: browser.i18n.getMessage('extensionName')});
    browser.browserAction.setBadgeText({text: ''});
}

/**
 * Handles changes to Storage API
 * @param {Object} changes
 */
function handleStorageChange(changes) {
    for (const item of Object.keys(changes)) {
        if (changes[item].oldValue == changes[item].newValue) {
            continue;
        }

        switch (item) {
            case 'timezone':
                createAlarm();
                break;
        }
    }
}

/**
 * Handle incoming runtime messages
 * @param {Object} message
 */
function handleMessage(message) {
    if (typeof message.target == 'string' && message.target != 'background') {
        return;
    }

    switch (message.command.toUpperCase()) {
        case 'STOP':
            stopChime();
            break;
    }
}

/**
 * Handles installation or update
 * @param {Object} details
 */
function handleInstalled(details) {
    if (details.reason == 'update') {
        const previousVersion = parseFloat(details.previousVersion);
        if (previousVersion < 2) {
            browser.tabs.create({
                url: `${webBase}/update/v2_0`
            });
        }
        if (previousVersion < 3) {
            migrateToStorageApi();
        }
    }
}

/**
 * Moves custom audio from IndexedDB to Storage API
 */
async function migrateToStorageApi() {
    let settings = await browser.storage.local.get(['chime']);
    settings = fillDefaultSettings(settings);

    if (settings.chime == 'custom') {
        const database = await IDBFiles.getFileStorage({name: 'chimes'});
        const files = await database.list();
        const data = {
            customChimes: []
        };

        for (const f of files) {
            try {
                const hour = parseInt(f.split('_')[1]);
                const audio = await database.get(f);
                const audioUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        resolve(event.target.result);
                    };
                    reader.readAsDataURL(audio);
                });
                data[`customChime${hour}`] = audioUrl;
                data.customChimes.push(hour);
            } catch (error) {
                console.warn('Failed to migrate %s:', f, error);
            }
        }

        await browser.storage.local.set(data);
    }

    indexedDB.deleteDatabase('IDBFilesStorage-DB-chimes');
}

/**
 * Set up uninstall page
 */
function setUninstallPage() {
    getSystemDetails((details) => {
        browser.runtime.setUninstallURL(`${webBase}/uninstall/?browser=${details.browser}&os=${details.os}&version=${details.version}`);
    });
}

/**
 * Send system details to callback
 * @param {Function} callback
 */
function getSystemDetails(callback) {
    browser.runtime.getPlatformInfo((platform) => {
        callback({
            browser: getBrowserName().toLowerCase(),
            version: browser.runtime.getManifest().version,
            os: platform.os
        });
    });
}

const ALARM_NAME = 'grandfather-fox';
const OFFSCREEN_DOCUMENT = 'offscreen/offscreen.html';
const webBase = 'https://addons.wesleybranton.com/addon/grandfather-fox';

if (typeof browser != 'object') { // Chrome
    importScripts('crossbrowser.js', 'shared/storageUtils.js', 'audioPlayer.js');
    browser.browserAction = browser.action;
}

browser.runtime.onInstalled.addListener(handleInstalled);
browser.alarms.onAlarm.addListener(triggerChime);
browser.storage.onChanged.addListener(handleStorageChange);
browser.tabs.onUpdated.addListener(checkAlarm);
browser.runtime.onMessage.addListener(handleMessage);
browser.browserAction.onClicked.addListener(stopChime);
browser.browserAction.setBadgeBackgroundColor({color: '#3C3'});
browser.browserAction.setBadgeTextColor({color: 'white'});

init();

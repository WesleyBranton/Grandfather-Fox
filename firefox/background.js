/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// Get chime from settings on startup
async function firstLoad() {
    var setting = await browser.storage.local.get('chime');
    if (setting.chime) {
        chimeName = setting.chime;
    } else {
        chimeName = 'default';
        browser.storage.local.set({
            chime: 'default'
        });
    }
    
    setting = await browser.storage.local.get('volume');
    if (setting.volume) {
        chimeVolume = setting.volume;
    } else {
        chimeVolume = 1;
        browser.storage.local.set({
            'volume': 1
        });
    }
    
    load();
}

// Create alarm
function load() {
    var d = new Date();
    var year = d.getFullYear();
    var month = d.getMonth();
    var day = d.getDate();
    var hour = d.getHours() + 1;
    
    d = new Date(year, month, day, hour);
    
    browser.alarms.create('grandfather-fox', {
        when: d.getTime(),
        periodInMinutes: 60
    });
}

// Check alarm is still valid
async function alarmCheck() {
    var alarm = await browser.alarms.get('grandfather-fox');
    var alarmTime = alarm.scheduledTime;
    var currentTime = new Date().getTime();
    
    if (alarmTime < currentTime || (alarmTime - currentTime) > 3600000) {
        listenMessage('reload');
    }
}

// Play chime
function hourTrigger(alarmInfo) {
    var d = new Date(alarmInfo.scheduledTime);
    var hour = d.getHours();
    
    if (hour > 12) {
        hour = hour - 12;
    } else if (hour == 0) {
        hour = 12;
    }
    
    audio = new Audio('audio/' + chimeName + '/' + hour + '.ogg');
    audio.addEventListener('ended', audioEnded);
    audio.addEventListener('pause', audioEnded);
    audio.addEventListener('play', audioStarted);
    audio.volume = chimeVolume;
    audio.play();
}

// Audio is playing
function audioStarted() {
    browser.browserAction.setTitle({title: 'Click to stop Grandfather Fox chime...'});
    browser.browserAction.setBadgeText({text: '\u25B6'});
}

// Audio has finished
function audioEnded() {
    browser.browserAction.setTitle({title: 'Grandfather Fox'});
    browser.browserAction.setBadgeText({text: ''});
}

// Stop audio
function stopAudio() {
    if (audio) {
        audio.pause();
    }
}

// Listen for messages from other pages
function listenMessage(msg) {
    if (msg == 'reload') {
        var clearAlarms = browser.alarms.clearAll();
        clearAlarms.then(load);
    }
}

// Update chime preference
function storageChange(changes) {
    if (changes.chime) {
        chimeName = changes.chime.newValue;
    }
    
    if (changes.volume) {
        chimeVolume = changes.volume.newValue;
        if (audio) {
            audio.volume = chimeVolume;
        }
    }
}

var chimeName, chimeVolume, audio;
firstLoad();
browser.alarms.onAlarm.addListener(hourTrigger);
chrome.runtime.onMessage.addListener(listenMessage);
browser.storage.onChanged.addListener(storageChange);
browser.webNavigation.onCompleted.addListener(alarmCheck);
browser.browserAction.onClicked.addListener(stopAudio);
browser.browserAction.setBadgeBackgroundColor({color: '#3C3'});
browser.browserAction.setBadgeTextColor({color: 'white'});
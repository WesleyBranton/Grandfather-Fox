/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

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

function hourTrigger(alarmInfo) {
	var d = new Date(alarmInfo.scheduledTime);
	var hour = d.getHours();
	if (hour > 12) {
		hour = hour - 12;
	} else if (hour == 0) {
		hour = 12;
	}
	var audio = new Audio('audio/' + chimeName + '/' + hour + '.ogg');
	audio.play();
}

function handleInstalled(details) {
	if (details.reason == 'install') {
		browser.storage.local.set({
			chime: 'default'
		});
	}
}

function listenMessage(msg) {
	if (msg == 'reload') {
		var clearAlarms = browser.alarms.clearAll();
		clearAlarms.then(load);
	}
}

async function alarmCheck() {
	var alarm = await browser.alarms.get('grandfather-fox');
	var alarmTime = alarm.scheduledTime;
	var currentTime = new Date().getTime();
	
	if (alarmTime < currentTime) {
		listenMessage('reload');
	}
}

function storageChange(changes) {
	if (changes.chime) {
		chimeName = changes.chime.newValue;
	}
}

async function firstLoad() {
	var setting = await browser.storage.local.get('chime');
	chimeName = setting.chime;
	load();
}

var chimeName;
firstLoad();
browser.runtime.onInstalled.addListener(handleInstalled);
browser.alarms.onAlarm.addListener(hourTrigger);
chrome.runtime.onMessage.addListener(listenMessage);
browser.storage.onChanged.addListener(storageChange);
browser.webNavigation.onCompleted.addListener(alarmCheck);
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

function load() {
	var d = new Date();
	var year = d.getFullYear();
	var month = d.getMonth();
	month += 1;
	var date = d.getDate();
	var hour = d.getHours();
	var dateString = year + '-' + month + '-' + date + 'T' + hour + ':00:00';
	var d = Date.parse(dateString);
	d += 3600000;
	browser.alarms.create({when:d,periodInMinutes:60});
}

function hourTrigger() {
	browser.storage.local.get('chime', (res) => {
		var chimeName = res.chime;
		var d = new Date();
		var hour = d.getHours();
		if (hour > 12) {
			hour = hour - 12;
		} else if (hour == 0) {
			hour = 12;
		}
		var audio = new Audio('audio/' + chimeName + '/' + hour + '.ogg');
		audio.play();
	});
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

browser.runtime.onInstalled.addListener(handleInstalled);
browser.alarms.onAlarm.addListener(hourTrigger);
chrome.runtime.onMessage.addListener(listenMessage);
load();
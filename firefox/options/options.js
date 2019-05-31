/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

function saveOptions() {
	var setting = document.getElementById('chimeNoise').value;
	browser.storage.local.set({'chime': setting});
}

function restoreOptions() {
	browser.storage.local.get('chime', (res) => {
		var setting = document.getElementById('chimeNoise');
		setting.value = res.chime;
	});
}

function playAudio() {
	var sound = document.getElementById('tower');
	sound.pause();
	sound.currentTime = 0;
	sound = document.getElementById('cuckoo');
	sound.pause();
	sound.currentTime = 0;
	sound = document.getElementById('default');
	sound.pause();
	sound.currentTime = 0;
	sound = document.getElementById('multibeep');
	sound.pause();
	sound.currentTime = 0;
	sound = document.getElementById('singlebeep');
	sound.pause();
	sound.currentTime = 0;
	
	var audioType = document.getElementById('chimeNoise').value;
	var x = document.getElementById(audioType);
    x.play();
}

function reload() {
	chrome.runtime.sendMessage('reload');
}

restoreOptions();
document.getElementsByTagName("form")[0].addEventListener("change", saveOptions);
document.getElementById('sample').addEventListener('click',playAudio);
document.getElementById('reload').addEventListener('click',reload);
/**
 *  Plays audio files in WebWorks and browsers supporting HTML5 Audio.
 */
var html5SoundChannels = [];

function playSound(file, loops, volume, pan) {
    var browser = navigator.userAgent;

    /// Are we running in a PlayBook browser?
    if (browser.indexOf("PlayBook") > -1) {

        // Are we running in WebWorks?
        if (typeof blackberry != 'undefined') {
            blackberry.custom.audio.playFile(file, loops, volume, pan);
        } else if (typeof Audio != 'undefined') {
            playSoundHTML5(file, loops, volume);
        }
    } else if (typeof Audio != 'undefined') {
        playSoundHTML5(file, loops, volume);
    }
}

function playSoundHTML5(file, loops, volume) {
    if  (!html5SoundChannels[file]) {
        var audio = new Audio(file);
        if (loops)
            audio.loop = "true";
        audio.volume = volume;
        audio.preload = "auto";
        html5SoundChannels[file] = audio;
        html5SoundChannels[file].play();
    } else {
        html5SoundChannels[file].play();
    }
}

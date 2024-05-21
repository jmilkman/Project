!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):(e=e||self).ConfettiGenerator=t()}(this,function(){"use strict";return function(e){var a={target:"confetti-holder",max:80,size:1,animate:!0,respawn:!0,props:["circle","square","triangle","line"],colors:[[165,104,246],[230,61,135],[0,199,228],[253,214,126]],clock:25,interval:null,rotate:!1,start_from_edge:!1,width:window.innerWidth,height:window.innerHeight};if(e&&(e.target&&(a.target=e.target),e.max&&(a.max=e.max),e.size&&(a.size=e.size),null!=e.animate&&(a.animate=e.animate),null!=e.respawn&&(a.respawn=e.respawn),e.props&&(a.props=e.props),e.colors&&(a.colors=e.colors),e.clock&&(a.clock=e.clock),null!=e.start_from_edge&&(a.start_from_edge=e.start_from_edge),e.width&&(a.width=e.width),e.height&&(a.height=e.height),null!=e.rotate&&(a.rotate=e.rotate)),"object"!=typeof a.target&&"string"!=typeof a.target)throw new TypeError("The target parameter should be a node or string");if("object"==typeof a.target&&(null===a.target||!a.target instanceof HTMLCanvasElement)||"string"==typeof a.target&&(null===document.getElementById(a.target)||!document.getElementById(a.target)instanceof HTMLCanvasElement))throw new ReferenceError("The target element does not exist or is not a canvas element");var t="object"==typeof a.target?a.target:document.getElementById(a.target),o=t.getContext("2d"),r=[];function n(e,t){e=e||1;var r=Math.random()*e;return t?Math.floor(r):r}var i=a.props.reduce(function(e,t){return e+(t.weight||1)},0);function s(){var e=a.props[function(){for(var e=Math.random()*i,t=0;t<a.props.length;++t){var r=a.props[t].weight||1;if(e<r)return t;e-=r}}()];return{prop:e.type?e.type:e,x:n(a.width),y:a.start_from_edge?a.clock<0?parseFloat(a.height)+10:-10:n(a.height),src:e.src,radius:n(4)+1,size:e.size,rotate:a.rotate,line:Math.floor(n(65)-30),angles:[n(10,!0)+2,n(10,!0)+2,n(10,!0)+2,n(10,!0)+2],color:a.colors[n(a.colors.length,!0)],rotation:n(360,!0)*Math.PI/180,speed:n(a.clock/7)+a.clock/30}}function l(e){if(e)switch(o.fillStyle=o.strokeStyle="rgba("+e.color+", "+(3<e.radius?.8:.4)+")",o.beginPath(),e.prop){case"circle":o.moveTo(e.x,e.y),o.arc(e.x,e.y,e.radius*a.size,0,2*Math.PI,!0),o.fill();break;case"triangle":o.moveTo(e.x,e.y),o.lineTo(e.x+e.angles[0]*a.size,e.y+e.angles[1]*a.size),o.lineTo(e.x+e.angles[2]*a.size,e.y+e.angles[3]*a.size),o.closePath(),o.fill();break;case"line":o.moveTo(e.x,e.y),o.lineTo(e.x+e.line*a.size,e.y+5*e.radius),o.lineWidth=2*a.size,o.stroke();break;case"square":o.save(),o.translate(e.x+15,e.y+5),o.rotate(e.rotation),o.fillRect(-15*a.size,-5*a.size,15*a.size,5*a.size),o.restore();break;case"svg":o.save();var t=new window.Image;t.src=e.src;var r=e.size||15;o.translate(e.x+r/2,e.y+r/2),e.rotate&&o.rotate(e.rotation),o.drawImage(t,-r/2*a.size,-r/2*a.size,r*a.size,r*a.size),o.restore()}}function c(){a.animate=!1,clearInterval(a.interval),requestAnimationFrame(function(){o.clearRect(0,0,t.width,t.height);var e=t.width;t.width=1,t.width=e})}return{render:function(){t.width=a.width,t.height=a.height,r=[];for(var e=0;e<a.max;e++)r.push(s());return requestAnimationFrame(function e(){for(var t in o.clearRect(0,0,a.width,a.height),r)l(r[t]);!function(){for(var e=0;e<a.max;e++){var t=r[e];t&&(a.animate&&(t.y+=t.speed),t.rotate&&(t.rotation+=t.speed/35),(0<=t.speed&&a.height<t.y||t.speed<0&&t.y<0)&&(a.respawn?(r[e]=t,r[e].x=n(a.width,!0),r[e].y=t.speed<0?parseFloat(a.height):-10):r[e]=void 0))}r.every(function(e){return void 0===e})&&c()}(),a.animate&&requestAnimationFrame(e)})},clear:c}}});


//                             TO DO
// ------------------------------------------------------------

const playButton = document.getElementById('playButton');
const skipButton = document.getElementById('skipButton');
const submitButton = document.getElementById('submitButton');
const openBtn = document.getElementById("openHelp");
const closeBtn = document.getElementById("closeHelp");
const help = document.getElementById("help");
const timerDisplay = document.getElementById('timer');
const confe = document.querySelector('#my-canvas');

const popup = document.querySelector('.winningScreen');
const losingpopup = document.querySelector('.losingScreen');
const close = document.querySelector('.playAgain');
let timerInterval;

const Answer = [];

var confettiSettings = { target: 'my-canvas' };
var confetti = new ConfettiGenerator(confettiSettings);
confetti.render();


openBtn.addEventListener("click", () => {
    help.style.visibility = "visible";
});

closeBtn.addEventListener("click", () => {
    help.style.visibility = "hidden";
});

const closeButtons = document.querySelectorAll('.playAgain');

closeButtons.forEach(button => {
    button.onclick = function() {
        window.location.reload();
        popup.classList.remove('open', 'active');
        losingpopup.classList.remove('open', 'active');
    };
});

// Function to start or update the timer
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
        let elapsedTime = Date.now() - startTime;
        let seconds = Math.floor(elapsedTime / 1000);
        let minutes = Math.floor(seconds / 60);
        seconds = seconds % 60;
        let formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        timerDisplay.textContent = formattedTime;
    }, 1000); // Update timer every second
}

// Function to stop the timer and leave it at the current time
function stopTimer() {
    clearInterval(timerInterval);

    // Calculate the current time
    let elapsedTime = Date.now() - startTime;
    let seconds = Math.floor(elapsedTime / 1000);
    let minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    let formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    timerDisplay.textContent = formattedTime;
}

// Function to stop the timer and reset it
function resetTimer() {
    clearInterval(timerInterval);
    timerDisplay.textContent = '0:00';
}

// Play button
playButton.addEventListener('click', function() {
    this.classList.add('pulse-animation');

    const audioPlayer = document.querySelector('audio');

    if (audioPlayer) {
        audioPlayer.currentTime = 0;
        audioPlayer.play();
        resetTimer();
    }

    setTimeout(() => {
        this.classList.remove('pulse-animation');
    }, 850);
});

// Skip button
let timeBetween = 1000; // Initial time between plays (1 second)
const skipIncrements = [1000, 3000, 3000, 6000]; // Skip time increments in milliseconds
let currentIndex = 0; // Index to keep track of the current increment

skipButton.addEventListener('click', function() {
    this.classList.add('pulse-animation_skip');

    setTimeout(() => {
        this.classList.remove('pulse-animation_skip');
    }, 850);

    timeBetween += skipIncrements[currentIndex];
    this.textContent = `Skip (+${timeBetween / 1000}s)`;
    currentIndex = (currentIndex + 1) % skipIncrements.length;

});

// Submit button
submitButton.addEventListener('click', function() {
    this.classList.add('pulse-animation_submit');

    setTimeout(() => {
        this.classList.remove('pulse-animation_submit');
    }, 850);
});

async function getAccessToken() {
    const clientId = 'e53d2a0a504a4488800a5908036104b9';
    const clientSecret = '1ed609c44ec14bebbe8fcd6e3c26e897';

    const credentials = btoa(`${clientId}:${clientSecret}`);

    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`
        },
        body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    const accessToken = data.access_token;

    return accessToken;
}

async function playRandomSongFromPlaylist() {
    const playlistURI = '4mBFdI5c0rM1LI7CzkzyrC';

    try {
        const accessToken = await getAccessToken();

        const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistURI}/tracks?limit=100`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const data = await response.json();
        const songList = [];

        const tracksWithPreview = data.items.filter(item => item.track.preview_url !== null);

        if (tracksWithPreview.length > 0) {
            // Create a set to store unique track names and artist names
            const uniqueTracks = new Set();

            // Filter unique tracks
            tracksWithPreview.forEach(item => {
                const track = item.track;
                const trackName = track.name;
                const artistNames = track.artists.map(artist => artist.name).join(', ');

                // Combine track name and artist names to create a unique identifier
                const uniqueIdentifier = `${trackName} - ${artistNames}`;

                // Check if the identifier is already in the set
                if (!uniqueTracks.has(uniqueIdentifier)) {
                    uniqueTracks.add(uniqueIdentifier);
                    songList.push({ name: trackName, artistNames: artistNames });
                }
            });

            // Now you have a list of unique tracks, select a random track
            if (songList.length > 0) {
                const randomIndex = Math.floor(Math.random() * songList.length);
                const track = songList[randomIndex];
                const previewUrl = tracksWithPreview.find(item => item.track.name === track.name && item.track.artists.map(artist => artist.name).join(', ') === track.artistNames).track.preview_url;

                const audioPlayer = document.createElement('audio');
                audioPlayer.src = previewUrl;

                Answer.push({ name: track.name, artistNames: track.artistNames });

                listSongsOptions(songList);
                addPlayPauseEventListener(audioPlayer);

                document.getElementById('song-preview').innerHTML = '';
                document.getElementById('song-preview').appendChild(audioPlayer);
            } else {
                document.getElementById('song-preview').innerHTML = 'No unique songs available in the playlist with preview URLs.';
            }
        } else {
            document.getElementById('song-preview').innerHTML = 'No songs available in the playlist with preview URLs.';
        }
    } catch (error) {
        console.error('Error:', error);
    }
    return Answer;
}

function addPlayPauseEventListener(audioPlayer) {
    let isPlaying = false;
    audioPlayer.addEventListener('play', function() {
        startTimer();
        if (!isPlaying) {
            setTimeout(function() {
                audioPlayer.pause();
                isPlaying = false;
                stopTimer();
            }, timeBetween);
            isPlaying = true;
        }
    });
}

function listSongsOptions(songList) {
    // Get the datalist element
    const songListDatalist = document.getElementById('songList');

    // Clear previous options
    songListDatalist.innerHTML = '';

    // Populate options from songList array
    songList.forEach(song => {
        const option = document.createElement('option');
        option.value = `${song.name} - ${song.artistNames}`;
        songListDatalist.appendChild(option);
    });
}

function skip() {
    const guessBox = document.querySelector(`.guessbox${currentGuessBox} p`);
        
    guessBox.textContent = "Skipped";
    guessBox.classList.add('incorrect'); // Add the 'incorrect' class

    const iconSpan = document.createElement('span');
    iconSpan.classList.add('fa', 'fa-x'); // Add Font Awesome classes
    
    // Append the icon before the text content
    guessBox.insertBefore(iconSpan, guessBox.firstChild);

    if (currentGuessBox == 5) {
        losingpopup.classList.add('open');
    } else {
        console.log(currentGuessBox);
        currentGuessBox++;
    }
}

let currentGuessBox = 1;

function submit(guess) {
    const guessBox = document.querySelector(`.guessbox${currentGuessBox} p`);
    let correctGuess = false;
    
    const correctAnswer = Answer[0];

    if (guess === `${correctAnswer.name} - ${correctAnswer.artistNames}`) {
        guessBox.textContent = guess;
        guessBox.classList.add('correct');
    
        const iconSpan = document.createElement('span');
        iconSpan.classList.add('fa', 'fa-check');
    
        guessBox.insertBefore(iconSpan, guessBox.firstChild);

        correctGuess = true;
    
        popup.classList.add('open');
        confe.classList.add('active');

    } else {
        guessBox.textContent = guess;
        guessBox.classList.remove('correct');
        guessBox.classList.add('incorrect');

        const iconSpan = document.createElement('span');
        iconSpan.classList.add('fa', 'fa-x');
        
        guessBox.insertBefore(iconSpan, guessBox.firstChild);
    }

    if (currentGuessBox == 5 && correctGuess == false) {
        losingpopup.classList.add('open');
    } else {
        console.log(currentGuessBox);
        currentGuessBox++;
    }
    document.getElementById('guess').value = "";
}

window.onload = playRandomSongFromPlaylist;

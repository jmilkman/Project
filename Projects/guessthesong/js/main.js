!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):(e=e||self).ConfettiGenerator=t()}(this,function(){"use strict";return function(e){var a={target:"confetti-holder",max:80,size:1,animate:!0,respawn:!0,props:["circle","square","triangle","line"],colors:[[165,104,246],[230,61,135],[0,199,228],[253,214,126]],clock:25,interval:null,rotate:!1,start_from_edge:!1,width:window.innerWidth,height:window.innerHeight};if(e&&(e.target&&(a.target=e.target),e.max&&(a.max=e.max),e.size&&(a.size=e.size),null!=e.animate&&(a.animate=e.animate),null!=e.respawn&&(a.respawn=e.respawn),e.props&&(a.props=e.props),e.colors&&(a.colors=e.colors),e.clock&&(a.clock=e.clock),null!=e.start_from_edge&&(a.start_from_edge=e.start_from_edge),e.width&&(a.width=e.width),e.height&&(a.height=e.height),null!=e.rotate&&(a.rotate=e.rotate)),"object"!=typeof a.target&&"string"!=typeof a.target)throw new TypeError("The target parameter should be a node or string");if("object"==typeof a.target&&(null===a.target||!a.target instanceof HTMLCanvasElement)||"string"==typeof a.target&&(null===document.getElementById(a.target)||!document.getElementById(a.target)instanceof HTMLCanvasElement))throw new ReferenceError("The target element does not exist or is not a canvas element");var t="object"==typeof a.target?a.target:document.getElementById(a.target),o=t.getContext("2d"),r=[];function n(e,t){e=e||1;var r=Math.random()*e;return t?Math.floor(r):r}var i=a.props.reduce(function(e,t){return e+(t.weight||1)},0);function s(){var e=a.props[function(){for(var e=Math.random()*i,t=0;t<a.props.length;++t){var r=a.props[t].weight||1;if(e<r)return t;e-=r}}()];return{prop:e.type?e.type:e,x:n(a.width),y:a.start_from_edge?a.clock<0?parseFloat(a.height)+10:-10:n(a.height),src:e.src,radius:n(4)+1,size:e.size,rotate:a.rotate,line:Math.floor(n(65)-30),angles:[n(10,!0)+2,n(10,!0)+2,n(10,!0)+2,n(10,!0)+2],color:a.colors[n(a.colors.length,!0)],rotation:n(360,!0)*Math.PI/180,speed:n(a.clock/7)+a.clock/30}}function l(e){if(e)switch(o.fillStyle=o.strokeStyle="rgba("+e.color+", "+(3<e.radius?.8:.4)+")",o.beginPath(),e.prop){case"circle":o.moveTo(e.x,e.y),o.arc(e.x,e.y,e.radius*a.size,0,2*Math.PI,!0),o.fill();break;case"triangle":o.moveTo(e.x,e.y),o.lineTo(e.x+e.angles[0]*a.size,e.y+e.angles[1]*a.size),o.lineTo(e.x+e.angles[2]*a.size,e.y+e.angles[3]*a.size),o.closePath(),o.fill();break;case"line":o.moveTo(e.x,e.y),o.lineTo(e.x+e.line*a.size,e.y+5*e.radius),o.lineWidth=2*a.size,o.stroke();break;case"square":o.save(),o.translate(e.x+15,e.y+5),o.rotate(e.rotation),o.fillRect(-15*a.size,-5*a.size,15*a.size,5*a.size),o.restore();break;case"svg":o.save();var t=new window.Image;t.src=e.src;var r=e.size||15;o.translate(e.x+r/2,e.y+r/2),e.rotate&&o.rotate(e.rotation),o.drawImage(t,-r/2*a.size,-r/2*a.size,r*a.size,r*a.size),o.restore()}}function c(){a.animate=!1,clearInterval(a.interval),requestAnimationFrame(function(){o.clearRect(0,0,t.width,t.height);var e=t.width;t.width=1,t.width=e})}return{render:function(){t.width=a.width,t.height=a.height,r=[];for(var e=0;e<a.max;e++)r.push(s());return requestAnimationFrame(function e(){for(var t in o.clearRect(0,0,a.width,a.height),r)l(r[t]);!function(){for(var e=0;e<a.max;e++){var t=r[e];t&&(a.animate&&(t.y+=t.speed),t.rotate&&(t.rotation+=t.speed/35),(0<=t.speed&&a.height<t.y||t.speed<0&&t.y<0)&&(a.respawn?(r[e]=t,r[e].x=n(a.width,!0),r[e].y=t.speed<0?parseFloat(a.height):-10):r[e]=void 0))}r.every(function(e){return void 0===e})&&c()}(),a.animate&&requestAnimationFrame(e)})},clear:c}}});


// Replace with your deployed Worker URL after running `wrangler deploy`
const API = 'https://guessthesong-api.jmielke-projects.workers.dev';

const playButton  = document.getElementById('playButton');
const skipButton  = document.getElementById('skipButton');
const submitButton = document.getElementById('submitButton');
const timerDisplay = document.getElementById('timer');
const confe = document.querySelector('#my-canvas');

const popup      = document.querySelector('.winningScreen');
const losingpopup = document.querySelector('.losingScreen');
let timerInterval;

let gameId        = null;
let gameStartTime = null;

var confettiSettings = { target: 'my-canvas' };
var confetti = new ConfettiGenerator(confettiSettings);
confetti.render();

const closeButtons = document.querySelectorAll('.playAgain');
closeButtons.forEach(button => {
    button.onclick = function() {
        window.location.reload();
        popup.classList.remove('open', 'active');
        losingpopup.classList.remove('open', 'active');
    };
});

// ─── Timer ───────────────────────────────────────────────────────────────────

function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
        let elapsedTime = Date.now() - startTime;
        let seconds = Math.floor(elapsedTime / 1000);
        let minutes = Math.floor(seconds / 60);
        seconds = seconds % 60;
        timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    let elapsedTime = Date.now() - startTime;
    let seconds = Math.floor(elapsedTime / 1000);
    let minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function resetTimer() {
    clearInterval(timerInterval);
    timerDisplay.textContent = '0:00';
}

// ─── Play button ──────────────────────────────────────────────────────────────

const progressBar = document.getElementById('progressBar');
const DURATIONS_MS = [1000, 3000, 8000, 17000, 30000];

playButton.addEventListener('click', function() {
    this.classList.add('pulse-animation');
    setTimeout(() => this.classList.remove('pulse-animation'), 850);

    const audioPlayer = document.querySelector('audio');
    if (!audioPlayer || !gameId) return;

    // Cache-bust by attempt so the browser re-fetches the correct duration from the server
    audioPlayer.src = `${API}/game/${gameId}/audio?a=${currentGuessBox}`;
    if (progressBar) progressBar.style.width = '0%';
    audioPlayer.play().catch(() => {});
    resetTimer();
});

// ─── Skip / Submit button animations ─────────────────────────────────────────

skipButton.addEventListener('click', function() {
    this.classList.add('pulse-animation_skip');
    setTimeout(() => this.classList.remove('pulse-animation_skip'), 850);
});

submitButton.addEventListener('click', function() {
    this.classList.add('pulse-animation_submit');
    setTimeout(() => this.classList.remove('pulse-animation_submit'), 850);
});

// ─── Loading state ────────────────────────────────────────────────────────────

function setLoadingState() {
    const btn = document.getElementById('playButton');
    if (btn) btn.style.opacity = '0.4';
}

function clearLoadingState() {
    const btn = document.getElementById('playButton');
    if (btn) btn.style.opacity = '1';
    const status = document.getElementById('load-status');
    if (status) status.textContent = 'Press play to listen';
}

// ─── Game start ───────────────────────────────────────────────────────────────

async function startGame() {
    setLoadingState();
    try {
        const res = await fetch(`${API}/game/start`, { method: 'POST' });
        const data = await res.json();
        gameId = data.gameId;
        gameStartTime = Date.now();

        const audioPlayer = document.createElement('audio');
        audioPlayer.setAttribute('playsinline', '');
        document.getElementById('song-preview').innerHTML = '';
        document.getElementById('song-preview').appendChild(audioPlayer);

        addPlayPauseEventListener(audioPlayer);
        clearLoadingState();
    } catch {
        const status = document.getElementById('load-status');
        if (status) status.textContent = 'Failed to connect — try refreshing';
    }
}

function addPlayPauseEventListener(audioPlayer) {
    let rafId = null;
    let progressTimer = null;

    audioPlayer.addEventListener('play', function() {
        startTimer();
        cancelAnimationFrame(rafId);
        clearTimeout(progressTimer);

        const playStart = Date.now();
        const duration = DURATIONS_MS[currentGuessBox - 1];

        function updateProgress() {
            const pct = Math.min((Date.now() - playStart) / duration * 100, 100);
            if (progressBar) progressBar.style.width = pct + '%';
            if (pct < 100) rafId = requestAnimationFrame(updateProgress);
        }
        rafId = requestAnimationFrame(updateProgress);

        // Fallback: fill bar and stop timer if stream doesn't fire 'ended' cleanly
        progressTimer = setTimeout(() => {
            if (progressBar) progressBar.style.width = '100%';
            cancelAnimationFrame(rafId);
            stopTimer();
        }, duration);
    });

    audioPlayer.addEventListener('ended', function() {
        clearTimeout(progressTimer);
        cancelAnimationFrame(rafId);
        if (progressBar) progressBar.style.width = '100%';
        stopTimer();
    });

    audioPlayer.addEventListener('pause', function() {
        clearTimeout(progressTimer);
        cancelAnimationFrame(rafId);
    });
}

// ─── Custom search dropdown ───────────────────────────────────────────────────

const guessInput   = document.getElementById('guess');
const dropdown     = document.getElementById('songDropdown');
const dropdownList = document.getElementById('songDropdownList');
const clearBtn     = document.getElementById('clearGuess');
const searchIcon   = document.getElementById('searchIcon');
let highlightedIndex = -1;
let filteredSongs = [];

function positionDropdown() {
    const rect = guessInput.getBoundingClientRect();
    const vvHeight    = window.visualViewport ? window.visualViewport.height    : window.innerHeight;
    const vvOffsetTop = window.visualViewport ? window.visualViewport.offsetTop : 0;

    const spaceAbove = rect.top  - vvOffsetTop;
    const spaceBelow = vvHeight  - (rect.bottom - vvOffsetTop);

    dropdown.style.left  = rect.left + 'px';
    dropdown.style.width = rect.width + 'px';

    if (spaceAbove >= spaceBelow || spaceAbove > 160) {
        dropdown.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
        dropdown.style.top    = 'auto';
        dropdownList.style.maxHeight = Math.min(Math.max(spaceAbove - 16, 80), 320) + 'px';
    } else {
        dropdown.style.top    = (rect.bottom + 8) + 'px';
        dropdown.style.bottom = 'auto';
        dropdownList.style.maxHeight = Math.min(Math.max(spaceBelow - 16, 80), 320) + 'px';
    }
}

function showDropdown(songs, query) {
    filteredSongs = songs;
    highlightedIndex = -1;
    dropdownList.innerHTML = '';

    if (!songs.length) {
        dropdown.classList.add('hidden');
        return;
    }

    const re = query
        ? new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
        : null;

    songs.forEach((song, i) => {
        const el = document.createElement('div');
        el.className = 'song-option';
        el.dataset.index = i;

        const nameEl = document.createElement('span');
        nameEl.className = 'song-name';
        nameEl.innerHTML = re ? song.name.replace(re, '<em>$1</em>') : song.name;

        const artistEl = document.createElement('span');
        artistEl.className = 'song-artist';
        artistEl.textContent = song.artistNames;

        el.appendChild(nameEl);
        el.appendChild(artistEl);

        el.addEventListener('mousedown', (e) => {
            e.preventDefault();
            selectSong(song);
        });

        dropdownList.appendChild(el);
    });

    positionDropdown();
    dropdown.classList.remove('hidden');
}

function selectSong(song) {
    guessInput.value = `${song.name} - ${song.artistNames}`;
    dropdown.classList.add('hidden');
    clearBtn.classList.remove('hidden');
    guessInput.focus();
}

function setHighlight(index) {
    const items = dropdownList.querySelectorAll('.song-option');
    items.forEach(el => el.classList.remove('highlighted'));
    if (index >= 0 && index < items.length) {
        items[index].classList.add('highlighted');
        items[index].scrollIntoView({ block: 'nearest' });
    }
    highlightedIndex = index;
}

function getMatches(q) {
    if (!q) return [...PLAYLIST].sort((a, b) => a.name.localeCompare(b.name));
    const lq = q.toLowerCase();
    return PLAYLIST.filter(s =>
        s.name.toLowerCase().includes(lq) ||
        s.artistNames.toLowerCase().includes(lq)
    );
}

guessInput.addEventListener('input', () => {
    const q = guessInput.value.trim();
    clearBtn.classList.toggle('hidden', q === '');
    searchIcon.style.color = q ? '#00daf3' : '#849396';
    showDropdown(getMatches(q), q);
});

guessInput.addEventListener('keydown', (e) => {
    const items = dropdownList.querySelectorAll('.song-option');
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlight(Math.min(highlightedIndex + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlight(Math.max(highlightedIndex - 1, 0));
    } else if (e.key === 'Enter') {
        if (highlightedIndex >= 0 && filteredSongs[highlightedIndex]) {
            selectSong(filteredSongs[highlightedIndex]);
        }
    } else if (e.key === 'Escape') {
        dropdown.classList.add('hidden');
    }
});

guessInput.addEventListener('focus', () => {
    showDropdown(getMatches(guessInput.value.trim()), guessInput.value.trim());
});

guessInput.addEventListener('blur', () => {
    setTimeout(() => dropdown.classList.add('hidden'), 150);
});

window.addEventListener('resize', () => {
    if (!dropdown.classList.contains('hidden')) positionDropdown();
});

if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
        if (!dropdown.classList.contains('hidden')) positionDropdown();
    });
    window.visualViewport.addEventListener('scroll', () => {
        if (!dropdown.classList.contains('hidden')) positionDropdown();
    });
}

const helpBtn     = document.getElementById('helpBtn');
const helpTooltip = document.getElementById('helpTooltip');

if (helpBtn && helpTooltip) {
    helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = !helpTooltip.classList.contains('opacity-0');
        helpTooltip.classList.toggle('opacity-0', isOpen);
        helpTooltip.classList.toggle('pointer-events-none', isOpen);
    });

    document.addEventListener('click', (e) => {
        if (!helpBtn.contains(e.target)) {
            helpTooltip.classList.add('opacity-0', 'pointer-events-none');
        }
    });
}

clearBtn.addEventListener('click', () => {
    guessInput.value = '';
    clearBtn.classList.add('hidden');
    searchIcon.style.color = '#849396';
    dropdown.classList.add('hidden');
    guessInput.focus();
});

// ─── Game logic ───────────────────────────────────────────────────────────────

let currentGuessBox = 1;

function revealAnswer(songName, artistName, screenPrefix) {
    document.getElementById(screenPrefix + 'SongName').textContent   = songName;
    document.getElementById(screenPrefix + 'SongArtist').textContent = artistName;
}

function advanceActiveBox(from) {
    document.querySelector(`.guessbox${from}`).classList.remove('active-box');
    if (from < 5) {
        document.querySelector(`.guessbox${from + 1}`).classList.add('active-box');
    }
}

async function skip() {
    if (!gameId) return;

    const guessBox = document.querySelector(`.guessbox${currentGuessBox} p`);
    guessBox.textContent = 'Skipped';
    guessBox.classList.add('incorrect');
    const iconSpan = document.createElement('span');
    iconSpan.classList.add('fa', 'fa-x');
    guessBox.insertBefore(iconSpan, guessBox.firstChild);

    if (currentGuessBox === 5) {
        document.querySelector('.guessbox5').classList.remove('active-box');
        try {
            const res  = await fetch(`${API}/game/${gameId}/skip`, { method: 'POST' });
            const data = await res.json();
            revealAnswer(data.songName || '?', data.artistName || '?', 'lose');
        } catch {
            revealAnswer('Unknown', 'Unknown', 'lose');
        }
        losingpopup.classList.add('open');
    } else {
        fetch(`${API}/game/${gameId}/skip`, { method: 'POST' }).catch(() => {});
        advanceActiveBox(currentGuessBox);
        currentGuessBox++;
    }
}

function computeScore(attempts, timeMs) {
    return Math.max(0, 1000 - (attempts - 1) * 150 - Math.floor(timeMs / 1000) * 5);
}

async function submitLeaderboardScore(username, score, songName, artistName, attempts, timeMs) {
    try {
        await fetch(`${API}/leaderboard`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, score, songName, artistName, attempts, timeMs }),
        });
    } catch { /* leaderboard is non-critical */ }
}

function showLeaderboardSubmit(attempts, timeMs, songName, artistName) {
    const score   = computeScore(attempts, timeMs);
    const scoreEl = document.getElementById('winScore');
    if (scoreEl) scoreEl.textContent = `Score: ${score}`;

    const submitBtn = document.getElementById('leaderboardSubmitBtn');
    if (submitBtn) {
        submitBtn.onclick = async function() {
            const username = (document.getElementById('leaderboardUsername').value || '').trim().slice(0, 24);
            if (!username) return;
            this.disabled = true;
            this.textContent = 'Submitted!';
            await submitLeaderboardScore(username, score, songName, artistName, attempts, timeMs);
        };
    }
}

async function submit(guess) {
    if (!guess.trim()) {
        guessInput.classList.add('input-error');
        guessInput.focus();
        setTimeout(() => guessInput.classList.remove('input-error'), 350);
        return;
    }
    if (!gameId) return;

    let data;
    try {
        const res = await fetch(`${API}/game/${gameId}/guess`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guess }),
        });
        data = await res.json();
    } catch {
        return; // network error — don't advance state
    }

    const guessBox = document.querySelector(`.guessbox${currentGuessBox} p`);

    if (data.correct) {
        guessBox.textContent = guess;
        guessBox.classList.add('correct');
        const iconSpan = document.createElement('span');
        iconSpan.classList.add('fa', 'fa-check');
        guessBox.insertBefore(iconSpan, guessBox.firstChild);

        document.querySelector(`.guessbox${currentGuessBox}`).classList.remove('active-box');
        revealAnswer(data.songName, data.artistName, 'win');
        popup.classList.add('open');
        confe.classList.add('active');

        stopTimer();
        const finalTimeMs = Date.now() - gameStartTime;
        showLeaderboardSubmit(currentGuessBox, finalTimeMs, data.songName, data.artistName);

    } else {
        guessBox.textContent = guess;
        guessBox.classList.add('incorrect');
        const iconSpan = document.createElement('span');
        iconSpan.classList.add('fa', 'fa-x');
        guessBox.insertBefore(iconSpan, guessBox.firstChild);

        // Server sends songName on the final wrong answer
        if (data.songName) {
            document.querySelector(`.guessbox${currentGuessBox}`).classList.remove('active-box');
            revealAnswer(data.songName, data.artistName, 'lose');
            losingpopup.classList.add('open');
        } else {
            advanceActiveBox(currentGuessBox);
            currentGuessBox++;
        }
    }

    document.getElementById('guess').value = '';
}

// ─── Leaderboard modal ────────────────────────────────────────────────────────

const leaderboardModal = document.getElementById('leaderboardModal');
const leaderboardContent = document.getElementById('leaderboardContent');

document.getElementById('leaderboardBtn').addEventListener('click', openLeaderboard);
document.getElementById('leaderboardClose').addEventListener('click', () => {
    leaderboardModal.classList.remove('open');
});

async function openLeaderboard() {
    leaderboardModal.classList.add('open');
    leaderboardContent.innerHTML = '<p class="text-outline text-sm text-center py-4">Loading...</p>';
    try {
        const res = await fetch(`${API}/leaderboard`);
        const data = await res.json();
        if (!data.entries || data.entries.length === 0) {
            leaderboardContent.innerHTML = '<p class="text-outline text-sm text-center py-4">No scores yet — be the first!</p>';
            return;
        }
        leaderboardContent.innerHTML = `
            <table class="w-full text-sm">
                <thead>
                    <tr class="text-outline text-xs uppercase tracking-widest border-b border-outline-variant/30">
                        <th class="text-left pb-3 font-medium">#</th>
                        <th class="text-left pb-3 font-medium">Player</th>
                        <th class="text-left pb-3 font-medium">Song</th>
                        <th class="text-right pb-3 font-medium">Score</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.entries.map((e, i) => `
                        <tr class="border-b border-outline-variant/20 ${i === 0 ? 'text-[#00daf3]' : 'text-on-surface-variant'}">
                            <td class="py-3 pr-3 font-bold">${i + 1}</td>
                            <td class="py-3 pr-3 font-medium">${escHtml(e.username)}</td>
                            <td class="py-3 pr-3 text-xs opacity-70">${escHtml(e.song_name)}</td>
                            <td class="py-3 text-right font-bold font-mono">${e.score}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;
    } catch {
        leaderboardContent.innerHTML = '<p class="text-outline text-sm text-center py-4">Failed to load leaderboard.</p>';
    }
}

function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

window.onload = startGame;

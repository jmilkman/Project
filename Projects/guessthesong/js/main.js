// Background confetti
!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):(e=e||self).ConfettiGenerator=t()}(this,function(){"use strict";return function(e){var a={target:"confetti-holder",max:80,size:1,animate:!0,respawn:!0,props:["circle","square","triangle","line"],colors:[[165,104,246],[230,61,135],[0,199,228],[253,214,126]],clock:25,interval:null,rotate:!1,start_from_edge:!1,width:window.innerWidth,height:window.innerHeight};if(e&&(e.target&&(a.target=e.target),e.max&&(a.max=e.max),e.size&&(a.size=e.size),null!=e.animate&&(a.animate=e.animate),null!=e.respawn&&(a.respawn=e.respawn),e.props&&(a.props=e.props),e.colors&&(a.colors=e.colors),e.clock&&(a.clock=e.clock),null!=e.start_from_edge&&(a.start_from_edge=e.start_from_edge),e.width&&(a.width=e.width),e.height&&(a.height=e.height),null!=e.rotate&&(a.rotate=e.rotate)),"object"!=typeof a.target&&"string"!=typeof a.target)throw new TypeError("The target parameter should be a node or string");if("object"==typeof a.target&&(null===a.target||!a.target instanceof HTMLCanvasElement)||"string"==typeof a.target&&(null===document.getElementById(a.target)||!document.getElementById(a.target)instanceof HTMLCanvasElement))throw new ReferenceError("The target element does not exist or is not a canvas element");var t="object"==typeof a.target?a.target:document.getElementById(a.target),o=t.getContext("2d"),r=[];function n(e,t){e=e||1;var r=Math.random()*e;return t?Math.floor(r):r}var i=a.props.reduce(function(e,t){return e+(t.weight||1)},0);function s(){var e=a.props[function(){for(var e=Math.random()*i,t=0;t<a.props.length;++t){var r=a.props[t].weight||1;if(e<r)return t;e-=r}}()];return{prop:e.type?e.type:e,x:n(a.width),y:a.start_from_edge?a.clock<0?parseFloat(a.height)+10:-10:n(a.height),src:e.src,radius:n(4)+1,size:e.size,rotate:a.rotate,line:Math.floor(n(65)-30),angles:[n(10,!0)+2,n(10,!0)+2,n(10,!0)+2,n(10,!0)+2],color:a.colors[n(a.colors.length,!0)],rotation:n(360,!0)*Math.PI/180,speed:n(a.clock/7)+a.clock/30}}function l(e){if(e)switch(o.fillStyle=o.strokeStyle="rgba("+e.color+", "+(3<e.radius?.8:.4)+")",o.beginPath(),e.prop){case"circle":o.moveTo(e.x,e.y),o.arc(e.x,e.y,e.radius*a.size,0,2*Math.PI,!0),o.fill();break;case"triangle":o.moveTo(e.x,e.y),o.lineTo(e.x+e.angles[0]*a.size,e.y+e.angles[1]*a.size),o.lineTo(e.x+e.angles[2]*a.size,e.y+e.angles[3]*a.size),o.closePath(),o.fill();break;case"line":o.moveTo(e.x,e.y),o.lineTo(e.x+e.line*a.size,e.y+5*e.radius),o.lineWidth=2*a.size,o.stroke();break;case"square":o.save(),o.translate(e.x+15,e.y+5),o.rotate(e.rotation),o.fillRect(-15*a.size,-5*a.size,15*a.size,5*a.size),o.restore();break;case"svg":o.save();var t=new window.Image;t.src=e.src;var r=e.size||15;o.translate(e.x+r/2,e.y+r/2),e.rotate&&o.rotate(e.rotation),o.drawImage(t,-r/2*a.size,-r/2*a.size,r*a.size,r*a.size),o.restore()}}function c(){a.animate=!1,clearInterval(a.interval),requestAnimationFrame(function(){o.clearRect(0,0,t.width,t.height);var e=t.width;t.width=1,t.width=e})}return{render:function(){t.width=a.width,t.height=a.height,r=[];for(var e=0;e<a.max;e++)r.push(s());return requestAnimationFrame(function e(){for(var t in o.clearRect(0,0,a.width,a.height),r)l(r[t]);!function(){for(var e=0;e<a.max;e++){var t=r[e];t&&(a.animate&&(t.y+=t.speed),t.rotate&&(t.rotation+=t.speed/35),(0<=t.speed&&a.height<t.y||t.speed<0&&t.y<0)&&(a.respawn?(r[e]=t,r[e].x=n(a.width,!0),r[e].y=t.speed<0?parseFloat(a.height):-10):r[e]=void 0))}r.every(function(e){return void 0===e})&&c()}(),a.animate&&requestAnimationFrame(e)})},clear:c}}});

// ─── Config ──────────────────────────────────────────────────────────────────

const API = 'https://guessthesong-api.jmielke-projects.workers.dev';
const MAX_ATTEMPTS = 5;
const PREVIEW_SECONDS = 30;
let DURATIONS = [1, 3, 8, 17, 30]; // seconds unlocked per attempt; server may override

const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

const $ = (id) => document.getElementById(id);

const playButton   = $('playButton');
const playIcon     = $('playIcon');
const skipButton   = $('skipButton');
const submitButton = $('submitButton');
const guessInput   = $('guess');
const clearBtn     = $('clearGuess');
const searchIcon   = $('searchIcon');
const dropdown     = $('songDropdown');
const dropdownList = $('songDropdownList');
const statusEl     = $('load-status');
const timeEl       = $('timer');
const clipLenEl    = $('timeleft');
const progressBar  = $('progressBar');
const unlockedBar  = $('unlockedBar');
const winScreen    = $('winningScreen');
const loseScreen   = $('losingScreen');
const confettiCanvas = $('my-canvas');

let PLAYLIST = [];
let gameId = null;
let attempt = 0;          // 0-based index of the current attempt
let busy = false;         // a guess/skip request is in flight
let gameOver = false;
let audio = null;
let audioKeyLoaded = null; // which attempt (or 'full') the loaded audio src belongs to
let playLimit = 0;         // seconds to stop playback at (current attempt or full clip)
let rafId = null;
let lastScore = null;
let confetti = null;
let clientStart = null;    // first play, used for scoring only if the API doesn't return timeMs
const guessedSet = new Set();

// ─── Utilities ───────────────────────────────────────────────────────────────

function fmt(sec) {
    sec = Math.max(0, Math.floor(sec));
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

function setStatus(text, isError = false) {
    statusEl.textContent = text;
    statusEl.classList.toggle('status-error', isError);
}

function escHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function normalize(str) {
    return String(str || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
}

async function api(path, options = {}) {
    const res = await fetch(`${API}${path}`, options);
    let data = {};
    try { data = await res.json(); } catch { /* non-JSON */ }
    if (!res.ok) {
        const err = new Error(data.error || `Request failed (${res.status})`);
        err.status = res.status;
        throw err;
    }
    return data;
}

function shakeInput() {
    guessInput.classList.remove('input-error');
    void guessInput.offsetWidth; // restart animation
    guessInput.classList.add('input-error');
    setTimeout(() => guessInput.classList.remove('input-error'), 400);
}

function pulse(el, cls) {
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 850);
}

// ─── Clip timeline UI ────────────────────────────────────────────────────────

function buildMarkers() {
    const holder = $('clipMarkers');
    holder.innerHTML = '';
    DURATIONS.slice(0, -1).forEach(d => {
        const m = document.createElement('span');
        m.className = 'clip-marker';
        m.style.left = `${(d / PREVIEW_SECONDS) * 100}%`;
        holder.appendChild(m);
    });
}

function unlockedSeconds() {
    return gameOver ? PREVIEW_SECONDS : DURATIONS[Math.min(attempt, DURATIONS.length - 1)];
}

function updateClipUI() {
    const secs = unlockedSeconds();
    unlockedBar.style.width = `${(secs / PREVIEW_SECONDS) * 100}%`;
    clipLenEl.textContent = fmt(secs);
    if (!gameOver) {
        if (attempt >= MAX_ATTEMPTS - 1) {
            skipButton.textContent = 'Give up';
        } else {
            const more = DURATIONS[attempt + 1] - DURATIONS[attempt];
            skipButton.textContent = `Skip (+${more}s)`;
        }
    }
}

function setProgress(sec) {
    progressBar.style.width = `${Math.min(sec / PREVIEW_SECONDS, 1) * 100}%`;
    timeEl.textContent = fmt(sec);
}

function setPlayingUI(playing) {
    playIcon.textContent = playing ? 'stop' : 'play_arrow';
    playButton.setAttribute('aria-label', playing ? 'Stop clip' : 'Play clip');
    playButton.classList.toggle('is-playing', playing);
}

function idleStatus() {
    setStatus(gameOver ? 'Tap play to hear it again' : 'Tap play to listen again');
}

// ─── Audio ───────────────────────────────────────────────────────────────────

function stopAudio() {
    cancelAnimationFrame(rafId);
    if (audio && !audio.paused) audio.pause();
    setPlayingUI(false);
}

// Cut playback by the audio clock (not a wall-clock timer), so slow mobile
// buffering can't shorten the clip the player hears.
function tick() {
    if (!audio) return;
    const t = audio.currentTime;
    if (t >= playLimit) {
        audio.pause();
        setProgress(playLimit);
        idleStatus();
        return;
    }
    setProgress(t);
    rafId = requestAnimationFrame(tick);
}

function createAudio() {
    audio = new Audio();
    audio.preload = 'auto';
    audio.setAttribute('playsinline', '');
    audio.setAttribute('webkit-playsinline', '');
    audio.addEventListener('playing', () => {
        setStatus(gameOver ? 'Playing the full clip' : 'Listening…');
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(tick);
    });
    audio.addEventListener('waiting', () => setStatus('Buffering…'));
    // No status update here: 'pause' fires asynchronously and would overwrite
    // messages set right after a programmatic stop (e.g. "+2s unlocked").
    audio.addEventListener('pause', () => {
        cancelAnimationFrame(rafId);
        setPlayingUI(false);
    });
    audio.addEventListener('ended', () => {
        cancelAnimationFrame(rafId);
        setProgress(Math.min(audio.duration || playLimit, playLimit));
        setPlayingUI(false);
        idleStatus();
    });
    audio.addEventListener('error', () => {
        if (!audio.getAttribute('src')) return;
        setPlayingUI(false);
        setStatus('Could not load audio — tap play to retry', true);
        audioKeyLoaded = null;
    });
}

// The server only sends the seconds unlocked for the current attempt,
// so the src changes every time a new attempt (or the full clip) unlocks.
function loadAudioForAttempt() {
    if (!audio || !gameId) return;
    const key = gameOver ? 'full' : String(attempt);
    if (audioKeyLoaded === key) return;
    audioKeyLoaded = key;
    audio.src = `${API}/game/${gameId}/audio?a=${key}`;
    audio.load();
}

function playClip() {
    if (!audio || !gameId) return;
    if (!audio.paused) { stopAudio(); idleStatus(); return; }
    if (!clientStart) clientStart = Date.now();
    loadAudioForAttempt();
    playLimit = unlockedSeconds();
    try { audio.currentTime = 0; } catch { /* not seekable yet */ }
    setProgress(0);
    setPlayingUI(true);
    setStatus('Loading clip…');
    audio.play().catch(() => {
        setPlayingUI(false);
        setStatus('Tap play to listen');
    });
}

playButton.addEventListener('click', () => {
    pulse(playButton, 'pulse-animation');
    playClip();
});

// ─── Game start ──────────────────────────────────────────────────────────────

async function loadPlaylist() {
    try { PLAYLIST = await api('/playlist'); } catch { /* autocomplete stays empty */ }
    PLAYLIST.forEach(s => { s._n = normalize(s.name); s._a = normalize(s.artistNames); });
}

async function startGame() {
    playButton.disabled = true;
    setStatus('Loading song…');
    try {
        const data = await api('/game/start', { method: 'POST' });
        gameId = data.gameId;
        if (Array.isArray(data.durations) && data.durations.length === MAX_ATTEMPTS) DURATIONS = data.durations;
        buildMarkers();
        updateClipUI();
        createAudio();
        loadAudioForAttempt();
        playButton.disabled = false;
        setControlsDisabled(false);
        setStatus(isTouch ? 'Tap play to listen' : 'Press play (or Space) to listen');
    } catch {
        setStatus('Failed to connect — tap here to retry', true);
        statusEl.onclick = () => { statusEl.onclick = null; startGame(); };
    }
}

// ─── Guess rows ──────────────────────────────────────────────────────────────

function rowEl(i) { return document.querySelector(`.guessbox${i + 1}`); }

function markRow(i, text, kind) {
    const row = rowEl(i);
    const p = row.querySelector('p');
    p.textContent = '';
    p.className = kind;
    const icon = document.createElement('span');
    icon.className = 'material-symbols-outlined row-icon';
    icon.textContent = kind === 'correct' ? 'check' : kind === 'skipped' ? 'skip_next' : 'close';
    const label = document.createElement('span');
    label.className = 'row-text';
    label.textContent = text;
    p.append(icon, label);
    row.classList.remove('active-box');
}

function activateRow(i) {
    document.querySelectorAll('.active-box').forEach(el => el.classList.remove('active-box'));
    if (i < MAX_ATTEMPTS) rowEl(i).classList.add('active-box');
}

function setControlsDisabled(disabled) {
    skipButton.disabled = disabled;
    submitButton.disabled = disabled;
}

function advanceTo(nextAttempt, message) {
    attempt = typeof nextAttempt === 'number' ? nextAttempt : attempt + 1;
    activateRow(attempt);
    stopAudio();
    updateClipUI();
    loadAudioForAttempt();
    setProgress(0);
    setStatus(`${message} +${DURATIONS[attempt] - DURATIONS[attempt - 1]}s unlocked — tap play`);
}

// ─── Skip / Submit ───────────────────────────────────────────────────────────

async function skip() {
    if (!gameId || busy || gameOver) return;
    pulse(skipButton, 'pulse-animation_skip');
    busy = true;
    setControlsDisabled(true);
    try {
        const data = await api(`/game/${gameId}/skip`, { method: 'POST' });
        markRow(attempt, attempt >= MAX_ATTEMPTS - 1 ? 'Gave up' : 'Skipped', 'skipped');
        if (data.over || data.songName) endGame(false, data);
        else advanceTo(data.attempt, 'Skipped.');
    } catch (e) {
        handleRequestError(e);
    } finally {
        busy = false;
        if (!gameOver) setControlsDisabled(false);
    }
}

async function submit(guess) {
    guess = (guess || '').trim();
    if (!gameId || busy || gameOver) return;
    if (!guess) { shakeInput(); guessInput.focus(); return; }

    const key = normalize(guess);
    if (guessedSet.has(key)) {
        shakeInput();
        setStatus('You already tried that one', true);
        return;
    }

    pulse(submitButton, 'pulse-animation_submit');
    busy = true;
    setControlsDisabled(true);
    hideDropdown();
    try {
        const data = await api(`/game/${gameId}/guess`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guess }),
        });
        guessedSet.add(key);
        guessInput.value = '';
        onInputChange(false);

        if (data.correct) {
            markRow(attempt, guess, 'correct');
            endGame(true, data);
        } else {
            markRow(attempt, guess, 'incorrect');
            if (data.over || data.songName) endGame(false, data);
            else advanceTo(data.attempt, 'Not quite.');
        }
    } catch (e) {
        handleRequestError(e);
    } finally {
        busy = false;
        if (!gameOver) setControlsDisabled(false);
    }
}

function handleRequestError(e) {
    if (e.status === 404) {
        setStatus('This game expired — starting a new one…', true);
        setTimeout(() => window.location.reload(), 1500);
    } else {
        setStatus('Network error — try again', true);
    }
}

skipButton.addEventListener('click', skip);
submitButton.addEventListener('click', () => submit(guessInput.value));

// ─── End of game ─────────────────────────────────────────────────────────────

function computeScore(attempts, timeMs) {
    return Math.max(0, 1000 - (attempts - 1) * 150 - Math.floor(timeMs / 1000) * 5);
}

function openModal(el) {
    el.classList.add('open');
    document.body.classList.add('modal-open');
}

function closeModal(el) {
    el.classList.remove('open');
    if (!document.querySelector('.winningScreen.open, .losingScreen.open')) {
        document.body.classList.remove('modal-open');
    }
}

function endGame(won, data) {
    gameOver = true;
    stopAudio();
    setControlsDisabled(true);
    guessInput.disabled = true;
    activateRow(MAX_ATTEMPTS);
    updateClipUI();
    loadAudioForAttempt(); // full clip is unlocked once the game is over
    $('resultBar').classList.remove('hidden');
    $('gameControls').classList.add('hidden');

    const name = data.songName || 'Unknown';
    const artist = data.artistName || '';
    const prefix = won ? 'win' : 'lose';
    $(prefix + 'SongName').textContent = name;
    $(prefix + 'SongArtist').textContent = artist;
    $('resultSong').textContent = artist ? `${name} — ${artist}` : name;
    setStatus('Tap play to hear the full clip');

    if (won) {
        const attempts = data.attempts || attempt + 1;
        if (typeof data.timeMs !== 'number') data.timeMs = clientStart ? Date.now() - clientStart : 0;
        lastScore = typeof data.score === 'number' ? data.score : computeScore(attempts, data.timeMs);
        $('winScore').textContent = `Score: ${lastScore}`;
        $('winDetail').textContent = attempts === 1 ? 'First try — nice ear!' : `Solved in ${attempts} attempts.`;
        setupLeaderboardSubmit(attempts, data);
        openModal(winScreen);
        startConfetti();
    } else {
        openModal(loseScreen);
    }
}

function startConfetti() {
    try {
        confettiCanvas.classList.add('active');
        confetti = new ConfettiGenerator({
            target: 'my-canvas', max: isTouch ? 60 : 100,
            width: window.innerWidth, height: window.innerHeight,
        });
        confetti.render();
        setTimeout(stopConfetti, 6000);
    } catch { /* decorative only */ }
}

function stopConfetti() {
    if (confetti) { confetti.clear(); confetti = null; }
    confettiCanvas.classList.remove('active');
}

function setupLeaderboardSubmit(attempts, data) {
    const btn = $('leaderboardSubmitBtn');
    const input = $('leaderboardUsername');
    const msg = $('leaderboardMsg');
    try { input.value = localStorage.getItem('gts-username') || ''; } catch { /* storage blocked */ }

    async function send() {
        const username = input.value.trim().slice(0, 24);
        if (!username) { input.focus(); return; }
        btn.disabled = true;
        input.disabled = true;
        btn.textContent = 'Saving…';
        msg.textContent = '';
        msg.classList.remove('status-error');
        try {
            await api('/leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gameId, username,
                    // legacy fields for the previous API version; the current API computes the score itself
                    score: lastScore, songName: data.songName, artistName: data.artistName,
                    attempts, timeMs: data.timeMs,
                }),
            });
            try { localStorage.setItem('gts-username', username); } catch { /* storage blocked */ }
            btn.textContent = 'Saved!';
            msg.textContent = 'You’re on the board.';
        } catch (e) {
            btn.disabled = false;
            input.disabled = false;
            btn.textContent = 'Submit';
            msg.textContent = e.message || 'Could not save — try again';
            msg.classList.add('status-error');
        }
    }

    btn.onclick = send;
    input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } };
}

document.querySelectorAll('.playAgain').forEach(b => b.addEventListener('click', () => window.location.reload()));

// "See the board" — close the result modal and leave the finished game visible underneath.
document.querySelectorAll('.closeResult').forEach(b => b.addEventListener('click', () => {
    closeModal(b.closest('.winningScreen, .losingScreen'));
    stopConfetti();
}));

// ─── Search dropdown ─────────────────────────────────────────────────────────

const MAX_RESULTS = 60;
let highlightedIndex = -1;
let filteredSongs = [];

function hideDropdown() {
    dropdown.classList.add('hidden');
    guessInput.setAttribute('aria-expanded', 'false');
    guessInput.removeAttribute('aria-activedescendant');
    highlightedIndex = -1;
}

function positionDropdown() {
    // Drop-up anchored to the input; cap height to the visible space above it
    // (the visual viewport shrinks when the mobile keyboard is open).
    const rect = guessInput.getBoundingClientRect();
    const vv = window.visualViewport;
    const top = vv ? rect.top - vv.offsetTop : rect.top;
    const navH = document.querySelector('nav').getBoundingClientRect().height;
    const space = top - navH - 16;
    dropdownList.style.maxHeight = `${Math.max(Math.min(space, 320), 120)}px`;
}

function getMatches(q) {
    const nq = normalize(q);
    if (!nq) return [];
    const scored = [];
    for (const s of PLAYLIST) {
        let rank = -1;
        if (s._n.startsWith(nq)) rank = 0;
        else if (s._n.includes(' ' + nq)) rank = 1;
        else if (s._a.startsWith(nq) || s._a.includes(' ' + nq)) rank = 2;
        else if (s._n.includes(nq)) rank = 3;
        else if (s._a.includes(nq)) rank = 4;
        if (rank >= 0) scored.push([rank, s]);
    }
    scored.sort((a, b) => a[0] - b[0] || a[1].name.localeCompare(b[1].name));
    return scored.slice(0, MAX_RESULTS).map(x => x[1]);
}

function highlight(text, q) {
    const safe = escHtml(text);
    const sq = escHtml(q);
    if (!sq) return safe;
    const re = new RegExp(`(${sq.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return safe.replace(re, '<em>$1</em>');
}

function showDropdown(songs, query) {
    filteredSongs = songs;
    highlightedIndex = -1;
    dropdownList.innerHTML = '';
    if (!songs.length) {
        if (!query || !PLAYLIST.length) { hideDropdown(); return; }
        dropdownList.innerHTML = '<div class="song-empty">No matching songs — you can still submit it</div>';
    }

    songs.forEach((song, i) => {
        const el = document.createElement('div');
        el.className = 'song-option';
        el.setAttribute('role', 'option');
        el.id = `song-opt-${i}`;
        el.innerHTML = `<span class="song-name">${highlight(song.name, query)}</span>` +
                       `<span class="song-artist">${highlight(song.artistNames, query)}</span>`;
        // Keep focus in the input; select on click so a touch-scroll doesn't pick a song.
        el.addEventListener('mousedown', e => e.preventDefault());
        el.addEventListener('click', () => selectSong(song));
        dropdownList.appendChild(el);
    });

    positionDropdown();
    dropdown.classList.remove('hidden');
    dropdownList.scrollTop = 0;
    guessInput.setAttribute('aria-expanded', 'true');
}

function selectSong(song) {
    guessInput.value = `${song.name} - ${song.artistNames}`;
    onInputChange(false);
    hideDropdown();
    // On phones, drop the keyboard so the Submit button is visible.
    if (isTouch) guessInput.blur(); else guessInput.focus();
}

function setHighlight(index) {
    const items = dropdownList.querySelectorAll('.song-option');
    items.forEach(el => el.classList.remove('highlighted'));
    if (index >= 0 && index < items.length) {
        items[index].classList.add('highlighted');
        items[index].scrollIntoView({ block: 'nearest' });
        guessInput.setAttribute('aria-activedescendant', items[index].id);
    }
    highlightedIndex = index;
}

function onInputChange(show = true) {
    const q = guessInput.value.trim();
    clearBtn.classList.toggle('hidden', q === '');
    searchIcon.classList.toggle('active', q !== '');
    if (show) showDropdown(getMatches(q), q);
}

guessInput.addEventListener('input', () => onInputChange(true));

guessInput.addEventListener('keydown', (e) => {
    const open = !dropdown.classList.contains('hidden');
    const count = filteredSongs.length;
    if (e.key === 'ArrowDown' && open && count) {
        e.preventDefault();
        setHighlight(Math.min(highlightedIndex + 1, count - 1));
    } else if (e.key === 'ArrowUp' && open && count) {
        e.preventDefault();
        setHighlight(Math.max(highlightedIndex - 1, 0));
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (open && highlightedIndex >= 0 && filteredSongs[highlightedIndex]) {
            selectSong(filteredSongs[highlightedIndex]);
        } else {
            submit(guessInput.value);
        }
    } else if (e.key === 'Escape') {
        hideDropdown();
    }
});

guessInput.addEventListener('focus', () => {
    if (guessInput.value.trim()) onInputChange(true);
});

guessInput.addEventListener('blur', () => setTimeout(hideDropdown, 150));

clearBtn.addEventListener('mousedown', e => e.preventDefault());
clearBtn.addEventListener('click', () => {
    guessInput.value = '';
    onInputChange(false);
    hideDropdown();
    guessInput.focus();
});

['resize', 'orientationchange'].forEach(ev => window.addEventListener(ev, () => {
    if (!dropdown.classList.contains('hidden')) positionDropdown();
}));
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
        if (!dropdown.classList.contains('hidden')) positionDropdown();
    });
}

// Space toggles playback when not typing
document.addEventListener('keydown', (e) => {
    if (e.code !== 'Space' || e.target.closest('input, textarea, button')) return;
    if (document.body.classList.contains('modal-open')) return;
    e.preventDefault();
    playClip();
});

// ─── Help popover ────────────────────────────────────────────────────────────

const helpBtn = $('helpBtn');
const helpTooltip = $('helpTooltip');

function setHelp(open) {
    helpTooltip.classList.toggle('opacity-0', !open);
    helpTooltip.classList.toggle('pointer-events-none', !open);
    helpBtn.setAttribute('aria-expanded', String(open));
}

helpBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    setHelp(helpTooltip.classList.contains('opacity-0'));
});
document.addEventListener('click', (e) => {
    if (!helpTooltip.contains(e.target)) setHelp(false);
});

// ─── Leaderboard modal ───────────────────────────────────────────────────────

const leaderboardModal = $('leaderboardModal');
const leaderboardContent = $('leaderboardContent');

document.querySelectorAll('.openLeaderboard').forEach(b => b.addEventListener('click', openLeaderboard));
$('leaderboardClose').addEventListener('click', () => closeModal(leaderboardModal));
leaderboardModal.addEventListener('click', (e) => { if (e.target === leaderboardModal) closeModal(leaderboardModal); });
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && leaderboardModal.classList.contains('open')) closeModal(leaderboardModal);
});

async function openLeaderboard() {
    openModal(leaderboardModal);
    leaderboardContent.innerHTML = '<p class="lb-empty">Loading…</p>';
    try {
        const data = await api('/leaderboard');
        if (!data.entries || !data.entries.length) {
            leaderboardContent.innerHTML = '<p class="lb-empty">No scores yet — be the first!</p>';
            return;
        }
        leaderboardContent.innerHTML = `
            <div class="lb-grid">
                <span class="lb-head">#</span>
                <span class="lb-head">Player</span>
                <span class="lb-head">Song</span>
                <span class="lb-head lb-right">Score</span>
                ${data.entries.map((e, i) => {
                    const top = i === 0 ? ' lb-top' : '';
                    const tries = e.attempts ? `${e.attempts} ${e.attempts === 1 ? 'try' : 'tries'}` : '';
                    return `
                    <span class="lb-cell lb-rank${top}">${i + 1}</span>
                    <span class="lb-cell lb-name${top}">${escHtml(e.username)}</span>
                    <span class="lb-cell lb-song" title="${escHtml(e.song_name)} — ${escHtml(e.artist_name)}"><span>${escHtml(e.song_name)}</span><small>${tries}</small></span>
                    <span class="lb-cell lb-right lb-score${top}">${e.score}</span>`;
                }).join('')}
            </div>`;
    } catch {
        leaderboardContent.innerHTML = '<p class="lb-empty">Failed to load leaderboard.</p>';
    }
}

// ─── Boot ────────────────────────────────────────────────────────────────────

setControlsDisabled(true);
buildMarkers();
updateClipUI();
startGame();
loadPlaylist();

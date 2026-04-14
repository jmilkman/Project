// ─── OSRS Location Guesser — Game Logic ──────────────────────────────────────

// ── DOM References ────────────────────────────────────────────────────────────
const mapViewport   = document.getElementById('map-viewport');
const mapDraggable  = document.getElementById('map-draggable');
const mapImg        = document.getElementById('map-img');
const guessMarker   = document.getElementById('guess-marker');
const answerMarker  = document.getElementById('answer-marker');
const revealLine    = document.getElementById('reveal-line');
const revealLineSVG = revealLine.querySelector('line');

const cluePanel     = document.getElementById('clue-panel');
const roundNum      = document.getElementById('round-num');
const clueImgWrap   = document.getElementById('clue-img-wrap');
const clueImg       = document.getElementById('clue-img');
const clueCanvas    = document.getElementById('clue-canvas');
const hintToggle    = document.getElementById('hint-toggle');
const hintWrap      = document.getElementById('hint-wrap');
const hintText      = document.getElementById('hint-text');
const scoreDisplay  = document.getElementById('score-display');

const submitBtn     = document.getElementById('submit-btn');
const placementHint = document.getElementById('placement-hint');

const revealPanel         = document.getElementById('reveal-panel');
const revealLocationName  = document.getElementById('reveal-location-name');
const revealDistanceEl    = document.getElementById('reveal-distance');
const revealScoreValue    = document.getElementById('reveal-score-value');
const nextRoundBtn        = document.getElementById('next-round-btn');

const finalScreen     = document.getElementById('final-screen');
const finalTotal      = document.getElementById('final-total-display');
const finalRoundList  = document.getElementById('final-round-list');
const playAgainBtn    = document.getElementById('play-again-btn');

const mapLoading      = document.getElementById('map-loading');
const zoomInBtn       = document.getElementById('zoom-in-btn');
const zoomOutBtn      = document.getElementById('zoom-out-btn');
const zoomResetBtn    = document.getElementById('zoom-reset-btn');

// ── Game State ────────────────────────────────────────────────────────────────
const STATE = {
  // game
  round: 0,
  totalScore: 0,
  roundScores: [],
  guessPlaced: false,
  guessX: null,
  guessY: null,
  answerX: null,
  answerY: null,
  phase: 'loading',          // 'loading' | 'guessing' | 'revealing' | 'done'
  locationOrder: [],

  // map transform
  mapScale: 1,
  mapX: 0,
  mapY: 0,
  mapNaturalW: 0,
  mapNaturalH: 0,

  // drag tracking
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  dragOriginMapX: 0,
  dragOriginMapY: 0,
  totalDragDelta: 0,

  // pinch tracking
  lastPinchDist: 0,

  // constants
  MIN_SCALE: 0.10,
  MAX_SCALE: 2.5,
  MAX_DISTANCE: 0.5,   // scoring ceiling (half the map diagonal)
  CLICK_THRESHOLD: 6,  // px movement to distinguish click from drag
};

// ── Utilities ─────────────────────────────────────────────────────────────────
function euclideanDist(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function calcScore(distance) {
  return Math.max(0, Math.round(1000 * (1 - distance / STATE.MAX_DISTANCE)));
}

function formatDistance(normDist) {
  const tiles = Math.round(normDist * 10000);
  if (tiles < 30)  return `Only ~${tiles} tiles away — incredible!`;
  if (tiles < 100) return `~${tiles} tiles away — very close!`;
  if (tiles < 300) return `~${tiles} tiles away — not bad!`;
  if (tiles < 700) return `~${tiles} tiles away`;
  return `~${tiles} tiles away — keep exploring!`;
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// ── Map Transform ─────────────────────────────────────────────────────────────
// Convert normalized map coords (0–1) to screen-space px within #game-root
function normToScreen(normX, normY) {
  return {
    x: normX * STATE.mapNaturalW * STATE.mapScale + STATE.mapX,
    y: normY * STATE.mapNaturalH * STATE.mapScale + STATE.mapY,
  };
}

// Reposition markers and reveal line whenever the map transform changes
function updateMarkerPositions() {
  if (STATE.guessX !== null) {
    const p = normToScreen(STATE.guessX, STATE.guessY);
    guessMarker.style.left = p.x + 'px';
    guessMarker.style.top  = p.y + 'px';
  }
  if (STATE.answerX !== null) {
    const p = normToScreen(STATE.answerX, STATE.answerY);
    answerMarker.style.left = p.x + 'px';
    answerMarker.style.top  = p.y + 'px';
  }
  if (STATE.guessX !== null && STATE.answerX !== null && !revealLine.classList.contains('hidden')) {
    const g = normToScreen(STATE.guessX, STATE.guessY);
    const a = normToScreen(STATE.answerX, STATE.answerY);
    revealLineSVG.setAttribute('x1', g.x);
    revealLineSVG.setAttribute('y1', g.y);
    revealLineSVG.setAttribute('x2', a.x);
    revealLineSVG.setAttribute('y2', a.y);
  }
}

function applyMapTransform() {
  mapDraggable.style.transform = `translate3d(${STATE.mapX}px, ${STATE.mapY}px, 0) scale(${STATE.mapScale})`;
  updateMarkerPositions();
}

function clampTransform() {
  const vw = mapViewport.clientWidth;
  const vh = mapViewport.clientHeight;
  const scaledW = STATE.mapNaturalW * STATE.mapScale;
  const scaledH = STATE.mapNaturalH * STATE.mapScale;

  // Allow panning so map edge can reach viewport edge (but not past it by more than a margin)
  const margin = 80;
  STATE.mapX = clamp(STATE.mapX, -(scaledW - margin), vw - margin);
  STATE.mapY = clamp(STATE.mapY, -(scaledH - margin), vh - margin);
}

function zoomAtPoint(clientX, clientY, newScale) {
  newScale = clamp(newScale, STATE.MIN_SCALE, STATE.MAX_SCALE);

  const rect = mapViewport.getBoundingClientRect();
  const cx = clientX - rect.left;
  const cy = clientY - rect.top;

  // Point on map in map-pixel coords
  const mapPointX = (cx - STATE.mapX) / STATE.mapScale;
  const mapPointY = (cy - STATE.mapY) / STATE.mapScale;

  STATE.mapX = cx - mapPointX * newScale;
  STATE.mapY = cy - mapPointY * newScale;
  STATE.mapScale = newScale;

  clampTransform();
  applyMapTransform();
}

// Starting view — adjust these to change where the map opens each round
const START_X     = 0.6966;  // normalized horizontal position to center on
const START_Y     = 0.4050;  // normalized vertical position to center on
const START_SCALE = 1.0;     // zoom level (MIN=0.10, MAX=2.5)

function centerMapOnStart() {
  const vw = mapViewport.clientWidth;
  const vh = mapViewport.clientHeight;
  STATE.mapScale = START_SCALE;
  STATE.mapX = vw / 2 - START_X * STATE.mapNaturalW * START_SCALE;
  STATE.mapY = vh / 2 - START_Y * STATE.mapNaturalH * START_SCALE;
  clampTransform();
  applyMapTransform();
}

// ── Marker Placement ──────────────────────────────────────────────────────────
function placeMarker(markerEl, normX, normY, animate) {
  const p = normToScreen(normX, normY);
  markerEl.style.left = p.x + 'px';
  markerEl.style.top  = p.y + 'px';
  markerEl.classList.remove('hidden');
  if (animate) {
    markerEl.classList.remove('just-placed');
    void markerEl.offsetWidth;
    markerEl.classList.add('just-placed');
    setTimeout(() => markerEl.classList.remove('just-placed'), 450);
  }
}

function placeGuessMarker(normX, normY) {
  guessMarker.classList.remove('answer-pin');
  guessMarker.classList.add('guess-pin');
  placeMarker(guessMarker, normX, normY, true);
}

function placeAnswerMarker(normX, normY) {
  STATE.answerX = normX;
  STATE.answerY = normY;
  answerMarker.classList.remove('guess-pin');
  answerMarker.classList.add('answer-pin');
  placeMarker(answerMarker, normX, normY, true);
}

// ── Reveal Line ───────────────────────────────────────────────────────────────
function drawRevealLine(gx, gy, ax, ay) {
  const g = normToScreen(gx, gy);
  const a = normToScreen(ax, ay);
  revealLineSVG.setAttribute('x1', g.x);
  revealLineSVG.setAttribute('y1', g.y);
  revealLineSVG.setAttribute('x2', a.x);
  revealLineSVG.setAttribute('y2', a.y);
  revealLine.classList.remove('hidden');
}

// ── Pan to Show Both Points ───────────────────────────────────────────────────
function panMapToShowBoth(gx, gy, ax, ay) {
  const vw = mapViewport.clientWidth;
  const vh = mapViewport.clientHeight;
  const padding = 100; // px in screen space

  // Bounding box in normalized coords
  const minNX = Math.min(gx, ax);
  const maxNX = Math.max(gx, ax);
  const minNY = Math.min(gy, ay);
  const maxNY = Math.max(gy, ay);

  const boxW = (maxNX - minNX) * STATE.mapNaturalW;
  const boxH = (maxNY - minNY) * STATE.mapNaturalH;

  const usableW = vw - padding * 2;
  const usableH = vh - padding * 2;

  let targetScale;
  if (boxW < 1 && boxH < 1) {
    // Same or nearly same point — zoom in
    targetScale = clamp(STATE.mapScale * 1.5, STATE.MIN_SCALE, STATE.MAX_SCALE * 0.6);
  } else {
    targetScale = clamp(
      Math.min(usableW / boxW, usableH / boxH) * 0.75,
      STATE.MIN_SCALE,
      STATE.MAX_SCALE * 0.7
    );
  }

  // Center of bounding box
  const centerNX = (minNX + maxNX) / 2;
  const centerNY = (minNY + maxNY) / 2;

  const targetX = vw / 2 - centerNX * STATE.mapNaturalW * targetScale;
  const targetY = vh / 2 - centerNY * STATE.mapNaturalH * targetScale;

  // Animate over 600ms
  const startScale = STATE.mapScale;
  const startX = STATE.mapX;
  const startY = STATE.mapY;
  const duration = 600;
  const startTime = performance.now();

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function step(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const e = easeOut(t);

    STATE.mapScale = lerp(startScale, targetScale, e);
    STATE.mapX = lerp(startX, targetX, e);
    STATE.mapY = lerp(startY, targetY, e);
    clampTransform();
    applyMapTransform();

    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── Round Pips ────────────────────────────────────────────────────────────────
function updateRoundPips() {
  document.querySelectorAll('.round-pip').forEach((pip, i) => {
    pip.classList.remove('done', 'active');
    if (i < STATE.round) pip.classList.add('done');
    else if (i === STATE.round) pip.classList.add('active');
  });
}

// ── Canvas Crop (fallback for locations without a screenshot) ─────────────────
function generateCanvasCrop(location) {
  return new Promise((resolve) => {
    const cacheKey = 'osrs_crop_' + location.id;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      resolve(cached);
      return;
    }

    const offscreen = new Image();
    offscreen.crossOrigin = 'anonymous';
    offscreen.src = 'osrs_map.png';

    offscreen.onload = () => {
      const cropFraction = location.cropZoom || 0.12;
      const cropW = Math.round(offscreen.naturalWidth * cropFraction);
      const cropH = Math.round(cropW * (10 / 16)); // 16:10 ratio

      const srcX = Math.round(location.x * offscreen.naturalWidth  - cropW / 2);
      const srcY = Math.round(location.y * offscreen.naturalHeight - cropH / 2);

      const canvas = document.createElement('canvas');
      canvas.width  = 480;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(offscreen, srcX, srcY, cropW, cropH, 0, 0, 480, 300);

      const dataURL = canvas.toDataURL('image/jpeg', 0.85);
      try { sessionStorage.setItem(cacheKey, dataURL); } catch(e) { /* quota ignore */ }
      resolve(dataURL);
    };
    offscreen.onerror = () => resolve(null);
  });
}

// ── Load Round ────────────────────────────────────────────────────────────────
async function loadRound(roundIndex) {
  STATE.round = roundIndex;
  STATE.guessPlaced = false;
  STATE.guessX = null;
  STATE.guessY = null;
  STATE.answerX = null;
  STATE.answerY = null;
  STATE.phase = 'guessing';

  const loc = LOCATIONS[STATE.locationOrder[roundIndex]];

  // Update UI
  roundNum.textContent = roundIndex + 1;
  updateRoundPips();
  placementHint.textContent = 'Click the map to place your guess';
  submitBtn.disabled = true;

  // Reset markers & line
  guessMarker.classList.add('hidden');
  answerMarker.classList.add('hidden');
  revealLine.classList.add('hidden');
  revealPanel.classList.add('hidden');
  revealPanel.classList.remove('visible');

  // Load hint
  hintText.textContent = loc.hint;
  hintWrap.classList.add('hidden');
  hintToggle.textContent = '💡 Show Hint';

  // Load clue image
  if (loc.image) {
    clueImg.src = loc.image;
    clueImg.classList.remove('hidden');
    clueCanvas.classList.add('hidden');
  } else {
    clueImg.classList.add('hidden');
    clueCanvas.classList.add('hidden');
    const dataURL = await generateCanvasCrop(loc);
    if (dataURL) {
      // Use the img element to display the canvas crop data URL
      clueImg.src = dataURL;
      clueImg.classList.remove('hidden');
    }
  }

  centerMapOnStart();
}

// ── Submit Guess ──────────────────────────────────────────────────────────────
function onSubmitGuess() {
  if (!STATE.guessPlaced || STATE.phase !== 'guessing') return;
  STATE.phase = 'revealing';
  submitBtn.disabled = true;

  const loc = LOCATIONS[STATE.locationOrder[STATE.round]];
  const dist = euclideanDist(STATE.guessX, STATE.guessY, loc.x, loc.y);
  const score = calcScore(dist);

  STATE.roundScores.push({ score, distance: dist, name: loc.name });
  STATE.totalScore += score;

  // Update score display
  scoreDisplay.textContent = `Score: ${STATE.totalScore.toLocaleString()}`;

  // Show reveal
  placeAnswerMarker(loc.x, loc.y);
  drawRevealLine(STATE.guessX, STATE.guessY, loc.x, loc.y);
  panMapToShowBoth(STATE.guessX, STATE.guessY, loc.x, loc.y);

  // Populate reveal panel
  revealLocationName.textContent = loc.name;
  revealDistanceEl.textContent = formatDistance(dist);
  revealScoreValue.textContent = `+${score.toLocaleString()}`;

  // Show reveal panel with animation
  revealPanel.classList.remove('hidden');
  // Force reflow then add visible class for animation
  void revealPanel.offsetWidth;
  revealPanel.classList.add('visible');

  // Update pip
  updateRoundPips();
}

// ── Next Round ────────────────────────────────────────────────────────────────
function onNextRound() {
  const nextRound = STATE.round + 1;
  if (nextRound >= 5) {
    showFinalScreen();
  } else {
    loadRound(nextRound);
  }
}

// ── Final Screen ──────────────────────────────────────────────────────────────
function showFinalScreen() {
  STATE.phase = 'done';

  const maxScore = LOCATIONS.length >= 5 ? 5 * 1000 : STATE.roundScores.length * 1000;
  finalTotal.textContent = STATE.totalScore.toLocaleString() + ' / ' + maxScore.toLocaleString();

  // Rating based on actual max possible
  const pctBase = maxScore;

  finalRoundList.innerHTML = '';
  STATE.roundScores.forEach((r, i) => {
    const row = document.createElement('div');
    row.className = 'round-result-row';
    row.innerHTML = `
      <span class="round-result-name">
        <span style="color:#3b494c;margin-right:6px">#${i + 1}</span>${r.name}
      </span>
      <span class="round-result-score">${r.score.toLocaleString()}</span>
    `;
    finalRoundList.appendChild(row);
  });

  // Rating message
  const pct = STATE.totalScore / pctBase;
  let rating = 'Bronze';
  let ratingColor = '#cd7f32';
  if (pct >= 0.9) { rating = 'Champion'; ratingColor = '#9affec'; }
  else if (pct >= 0.75) { rating = 'Expert'; ratingColor = '#00daf3'; }
  else if (pct >= 0.5) { rating = 'Adventurer'; ratingColor = '#75d5e2'; }
  else if (pct >= 0.25) { rating = 'Novice'; ratingColor = '#c3f5ff'; }

  document.getElementById('final-rating').textContent = rating;
  document.getElementById('final-rating').style.color = ratingColor;

  finalScreen.classList.remove('hidden');
  void finalScreen.offsetWidth;
  finalScreen.classList.add('visible');
}

// ── Init Game ─────────────────────────────────────────────────────────────────
function initGame() {
  STATE.round = 0;
  STATE.totalScore = 0;
  STATE.roundScores = [];
  STATE.guessPlaced = false;
  STATE.guessX = null;
  STATE.guessY = null;
  STATE.answerX = null;
  STATE.answerY = null;
  STATE.phase = 'guessing';

  // Shuffle location order
  STATE.locationOrder = LOCATIONS.map((_, i) => i).sort(() => Math.random() - 0.5);

  scoreDisplay.textContent = 'Score: 0';
  finalScreen.classList.add('hidden');
  finalScreen.classList.remove('visible');

  loadRound(0);
}

// ── Click to Place Guess ──────────────────────────────────────────────────────
function onMapClick(clientX, clientY) {
  if (STATE.phase !== 'guessing') return;

  const rect = mapViewport.getBoundingClientRect();
  const normX = (clientX - rect.left  - STATE.mapX) / (STATE.mapNaturalW * STATE.mapScale);
  const normY = (clientY - rect.top   - STATE.mapY) / (STATE.mapNaturalH * STATE.mapScale);

  // Clamp to map bounds
  if (normX < 0 || normX > 1 || normY < 0 || normY > 1) return;

  STATE.guessX = normX;
  STATE.guessY = normY;
  STATE.guessPlaced = true;

  placeGuessMarker(normX, normY);
  submitBtn.disabled = false;
  placementHint.textContent = 'Reposition by clicking again or submit your guess';

}

// ── Pointer / Drag Events ─────────────────────────────────────────────────────
mapViewport.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  e.preventDefault();
  mapViewport.setPointerCapture(e.pointerId);
  STATE.isDragging = true;
  STATE.dragStartX = e.clientX;
  STATE.dragStartY = e.clientY;
  STATE.dragOriginMapX = STATE.mapX;
  STATE.dragOriginMapY = STATE.mapY;
  STATE.totalDragDelta = 0;
  mapViewport.classList.add('dragging');
});

mapViewport.addEventListener('pointermove', (e) => {
  if (!STATE.isDragging) return;
  e.preventDefault();

  const dx = e.clientX - STATE.dragStartX;
  const dy = e.clientY - STATE.dragStartY;
  STATE.totalDragDelta = Math.sqrt(dx * dx + dy * dy);

  STATE.mapX = STATE.dragOriginMapX + dx;
  STATE.mapY = STATE.dragOriginMapY + dy;
  clampTransform();
  applyMapTransform();
});

mapViewport.addEventListener('pointerup', (e) => {
  if (!STATE.isDragging) return;
  mapViewport.releasePointerCapture(e.pointerId);
  STATE.isDragging = false;
  mapViewport.classList.remove('dragging');

  // Treat as click if minimal movement
  if (STATE.totalDragDelta < STATE.CLICK_THRESHOLD) {
    onMapClick(e.clientX, e.clientY);
  }
});

mapViewport.addEventListener('pointercancel', () => {
  STATE.isDragging = false;
  mapViewport.classList.remove('dragging');
});

// ── Wheel Zoom ────────────────────────────────────────────────────────────────
mapViewport.addEventListener('wheel', (e) => {
  e.preventDefault();
  const factor = e.deltaY > 0 ? 0.85 : 1.18;
  zoomAtPoint(e.clientX, e.clientY, STATE.mapScale * factor);
}, { passive: false });

// ── Touch Pinch Zoom ──────────────────────────────────────────────────────────
mapViewport.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    e.preventDefault();
    const t1 = e.touches[0], t2 = e.touches[1];
    STATE.lastPinchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  }
}, { passive: false });

mapViewport.addEventListener('touchmove', (e) => {
  if (e.touches.length === 2) {
    e.preventDefault();
    const t1 = e.touches[0], t2 = e.touches[1];
    const newDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    const factor = newDist / STATE.lastPinchDist;
    STATE.lastPinchDist = newDist;

    const midX = (t1.clientX + t2.clientX) / 2;
    const midY = (t1.clientY + t2.clientY) / 2;
    zoomAtPoint(midX, midY, STATE.mapScale * factor);
  }
}, { passive: false });

// ── Zoom Buttons ──────────────────────────────────────────────────────────────
zoomInBtn.addEventListener('click', () => {
  const cx = mapViewport.clientWidth / 2;
  const cy = mapViewport.clientHeight / 2;
  zoomAtPoint(cx, cy, STATE.mapScale * 1.35);
});
zoomOutBtn.addEventListener('click', () => {
  const cx = mapViewport.clientWidth / 2;
  const cy = mapViewport.clientHeight / 2;
  zoomAtPoint(cx, cy, STATE.mapScale * 0.74);
});
zoomResetBtn.addEventListener('click', centerMapOnStart);

// ── Hint Toggle ───────────────────────────────────────────────────────────────
hintToggle.addEventListener('click', () => {
  const visible = !hintWrap.classList.contains('hidden');
  hintWrap.classList.toggle('hidden', visible);
  hintToggle.textContent = visible ? '💡 Show Hint' : '🙈 Hide Hint';
});

// ── Game Buttons ──────────────────────────────────────────────────────────────
submitBtn.addEventListener('click', onSubmitGuess);
nextRoundBtn.addEventListener('click', onNextRound);
playAgainBtn.addEventListener('click', initGame);

// ── Lightbox ──────────────────────────────────────────────────────────────────
const lightbox    = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');

clueImgWrap.addEventListener('click', () => {
  if (!clueImg.src || !clueImg.complete || clueImg.naturalWidth === 0) return;
  lightboxImg.src = clueImg.src;
  lightbox.classList.remove('hidden');
});

lightbox.addEventListener('click', () => {
  lightbox.classList.add('hidden');
  lightboxImg.src = '';
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    lightbox.classList.add('hidden');
    lightboxImg.src = '';
  }
});

// ── Window Resize ─────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  clampTransform();
  applyMapTransform();
});

// ── Map Load & Init ───────────────────────────────────────────────────────────
function onMapReady() {
  STATE.mapNaturalW = mapImg.naturalWidth;
  STATE.mapNaturalH = mapImg.naturalHeight;
  mapLoading.classList.add('hidden');
  initGame();
}

if (mapImg.complete && mapImg.naturalWidth > 0) {
  onMapReady();
} else {
  mapImg.addEventListener('load', onMapReady);
  mapImg.addEventListener('error', () => {
    mapLoading.innerHTML = '<p style="color:#ffb4ab;font-family:Inter;font-size:14px">Failed to load map image.</p>';
  });
}

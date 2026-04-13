// ─── State ────────────────────────────────────────────────────────────────────
const slider        = document.getElementById('slider');
const slider2       = document.getElementById('slider2');
const sliderVal     = document.getElementById('slider-val');
const slider2Val    = document.getElementById('slider2-val');
const algoSelect    = document.getElementById('algo');
const sortBtn       = document.getElementById('sort_btn');
const randomizeBtn  = document.getElementById('randomize_array_btn');
const barsContainer = document.getElementById('bars_container');
const swapsEl       = document.getElementById('swaps-count');
const timeEl        = document.getElementById('time-display');
const checksEl      = document.getElementById('checks-count');
const statusDot     = document.getElementById('status-dot');
const statusText    = document.getElementById('status-text');
const algoLabel     = document.getElementById('algo-label');
const complexityLabel = document.getElementById('complexity-label');

let numOfBars  = parseInt(slider.value);
let speedMs    = parseInt(slider2.value);
let arr        = [];
let isSorting  = false;
let swaps      = 0;
let checks     = 0;
let startTime  = null;
let timerHandle= null;

const COMPLEXITY = {
  bubble: 'O(n²) avg',
  merge:  'O(n log n)',
  quick:  'O(n log n) avg',
  heap:   'O(n log n)',
};

const ALGO_NAMES = {
  bubble: 'Bubble Sort',
  merge:  'Merge Sort',
  quick:  'Quick Sort',
  heap:   'Heap Sort',
};

// ─── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  arr = createRandomArray();
  renderBars(arr);
  updateSliderLabels();
});

slider.addEventListener('input', () => {
  if (isSorting) return;
  numOfBars = parseInt(slider.value);
  arr = createRandomArray();
  renderBars(arr);
  updateSliderLabels();
});

slider2.addEventListener('input', () => {
  speedMs = parseInt(slider2.value);
  updateSliderLabels();
});

algoSelect.addEventListener('change', () => {
  if (isSorting) return;
  complexityLabel.textContent = COMPLEXITY[algoSelect.value] || '';
  algoLabel.textContent = ALGO_NAMES[algoSelect.value] || '';
});

randomizeBtn.addEventListener('click', () => {
  if (isSorting) return;
  arr = createRandomArray();
  renderBars(arr);
  resetMetrics();
});

sortBtn.addEventListener('click', () => {
  if (isSorting) return;
  startSort();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function createRandomArray() {
  return Array.from({ length: numOfBars }, () => Math.floor(Math.random() * 95) + 5);
}

function renderBars(array, colors = {}) {
  barsContainer.innerHTML = '';
  array.forEach((val, i) => {
    const bar = document.createElement('div');
    bar.classList.add('bar');
    bar.style.height = val + '%';
    if (colors[i]) bar.classList.add(colors[i]);
    barsContainer.appendChild(bar);
  });
}

function getBars() {
  return Array.from(barsContainer.querySelectorAll('.bar'));
}

function sleep() {
  return new Promise(resolve => setTimeout(resolve, speedMs));
}

function updateSliderLabels() {
  sliderVal.textContent  = `${slider.value} pts`;
  slider2Val.textContent = `${slider2.value}ms`;
}

function resetMetrics() {
  swaps  = 0;
  checks = 0;
  swapsEl.textContent  = '0';
  checksEl.textContent = '0';
  timeEl.textContent   = '00:00';
  if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
}

function setStatus(state) {
  if (state === 'running') {
    statusDot.className  = 'w-2 h-2 rounded-full bg-primary-container animate-pulse';
    statusText.textContent = 'State: Running';
  } else if (state === 'done') {
    statusDot.className  = 'w-2 h-2 rounded-full bg-secondary-container';
    statusText.textContent = 'State: Complete';
  } else {
    statusDot.className  = 'w-2 h-2 rounded-full bg-outline';
    statusText.textContent = 'State: Idle';
  }
}

function startTimer() {
  startTime = Date.now();
  timerHandle = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    timeEl.textContent = `${m}:${s}`;
  }, 500);
}

async function startSort() {
  isSorting = true;
  resetMetrics();
  setStatus('running');
  sortBtn.disabled = true;
  sortBtn.classList.add('opacity-50');
  algoLabel.textContent = ALGO_NAMES[algoSelect.value] || '';
  startTimer();

  const copy = [...arr];

  switch (algoSelect.value) {
    case 'bubble': await bubbleSort(copy); break;
    case 'merge':  await mergeSort(copy, 0, copy.length - 1); break;
    case 'quick':  await quickSort(copy, 0, copy.length - 1); break;
    case 'heap':   await heapSort(copy); break;
    default:       await bubbleSort(copy);
  }

  // Mark all as sorted
  getBars().forEach(b => { b.className = 'bar sorted'; });
  arr = copy;
  clearInterval(timerHandle);
  setStatus('done');
  isSorting = false;
  sortBtn.disabled = false;
  sortBtn.classList.remove('opacity-50');
}

// ─── Color helpers ────────────────────────────────────────────────────────────
function highlight(bars, indices, cls) {
  indices.forEach(i => {
    if (bars[i]) {
      bars[i].className = 'bar ' + cls;
    }
  });
}

function resetColor(bars, indices) {
  indices.forEach(i => {
    if (bars[i]) bars[i].className = 'bar';
  });
}

// ─── Bubble Sort ──────────────────────────────────────────────────────────────
async function bubbleSort(array) {
  const bars = getBars();
  const n = array.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      checks++;
      checksEl.textContent = checks.toLocaleString();
      highlight(bars, [j, j + 1], 'comparing');
      await sleep();

      if (array[j] > array[j + 1]) {
        [array[j], array[j + 1]] = [array[j + 1], array[j]];
        bars[j].style.height     = array[j] + '%';
        bars[j + 1].style.height = array[j + 1] + '%';
        swaps++;
        swapsEl.textContent = swaps.toLocaleString();
        await sleep();
      }
      resetColor(bars, [j, j + 1]);
    }
    bars[n - 1 - i].className = 'bar sorted';
  }
  bars[0].className = 'bar sorted';
}

// ─── Merge Sort ───────────────────────────────────────────────────────────────
async function mergeSort(array, left, right) {
  if (left >= right) return;
  const mid = Math.floor((left + right) / 2);
  await mergeSort(array, left, mid);
  await mergeSort(array, mid + 1, right);
  await merge(array, left, mid, right);
}

async function merge(array, left, mid, right) {
  const bars = getBars();
  const leftPart  = array.slice(left,  mid + 1);
  const rightPart = array.slice(mid + 1, right + 1);
  let i = 0, j = 0, k = left;

  while (i < leftPart.length && j < rightPart.length) {
    checks++;
    checksEl.textContent = checks.toLocaleString();
    highlight(bars, [k], 'comparing');
    await sleep();

    if (leftPart[i] <= rightPart[j]) {
      array[k] = leftPart[i++];
    } else {
      array[k] = rightPart[j++];
      swaps++;
      swapsEl.textContent = swaps.toLocaleString();
    }
    bars[k].style.height = array[k] + '%';
    resetColor(bars, [k]);
    k++;
  }
  while (i < leftPart.length) {
    array[k] = leftPart[i++];
    bars[k].style.height = array[k] + '%';
    k++;
  }
  while (j < rightPart.length) {
    array[k] = rightPart[j++];
    bars[k].style.height = array[k] + '%';
    k++;
  }
}

// ─── Quick Sort ───────────────────────────────────────────────────────────────
async function quickSort(array, low, high) {
  if (low < high) {
    const pi = await partition(array, low, high);
    await quickSort(array, low, pi - 1);
    await quickSort(array, pi + 1, high);
  }
}

async function partition(array, low, high) {
  const bars = getBars();
  const pivot = array[high];
  highlight(bars, [high], 'pivot');
  let i = low - 1;

  for (let j = low; j < high; j++) {
    checks++;
    checksEl.textContent = checks.toLocaleString();
    highlight(bars, [j], 'comparing');
    await sleep();

    if (array[j] < pivot) {
      i++;
      [array[i], array[j]] = [array[j], array[i]];
      bars[i].style.height = array[i] + '%';
      bars[j].style.height = array[j] + '%';
      swaps++;
      swapsEl.textContent = swaps.toLocaleString();
    }
    resetColor(bars, [j]);
  }
  [array[i + 1], array[high]] = [array[high], array[i + 1]];
  bars[i + 1].style.height = array[i + 1] + '%';
  bars[high].style.height  = array[high] + '%';
  swaps++;
  swapsEl.textContent = swaps.toLocaleString();
  resetColor(bars, [high]);
  return i + 1;
}

// ─── Heap Sort ────────────────────────────────────────────────────────────────
async function heapSort(array) {
  const n = array.length;
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    await heapify(array, n, i);
  }
  for (let i = n - 1; i > 0; i--) {
    const bars = getBars();
    [array[0], array[i]] = [array[i], array[0]];
    bars[0].style.height = array[0] + '%';
    bars[i].style.height = array[i] + '%';
    bars[i].className = 'bar sorted';
    swaps++;
    swapsEl.textContent = swaps.toLocaleString();
    await heapify(array, i, 0);
  }
}

async function heapify(array, n, i) {
  const bars = getBars();
  let largest = i;
  const l = 2 * i + 1;
  const r = 2 * i + 2;

  checks++;
  checksEl.textContent = checks.toLocaleString();

  if (l < n && array[l] > array[largest]) largest = l;
  if (r < n && array[r] > array[largest]) largest = r;

  if (largest !== i) {
    highlight(bars, [i, largest], 'comparing');
    await sleep();
    [array[i], array[largest]] = [array[largest], array[i]];
    bars[i].style.height       = array[i] + '%';
    bars[largest].style.height = array[largest] + '%';
    swaps++;
    swapsEl.textContent = swaps.toLocaleString();
    resetColor(bars, [i, largest]);
    await heapify(array, n, largest);
  }
}

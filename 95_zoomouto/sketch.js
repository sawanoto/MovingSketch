// World units are reset at each handoff. The camera is transformed by the same
// affine map, so rebasing never changes a pixel of the reveal composition.
const RATIO = 16;
const WALL_X = 1.1;
const START_X = -1.5;
// The canonical outline reaches x = center - 0.48 * bodyWidth at its equator.
const OUTLINE_REACH = .96;
const NEXT_X = WALL_X + RATIO * OUTLINE_REACH;
const INK = '#202322';
const PAPER = '#f4f0e7';
const BODY = '#fffdf8';
const ease = t => t * t * (3 - 2 * t);
const mix = (a, b, t) => a + (b - a) * t;
let marpan, phase = 'rolling', phaseTime = 0, stage = 0;
let current = { x: START_X, y: 0, angle: 0 };
let previous = null;
let next = { x: NEXT_X, y: 0, angle: 0 };
let camera = { x: 0, y: 0, scale: 1 };
let zoomFrom, settleFrom, impactX;
let lastTime = 0, rollTick = 0, audioContext = null, master = null;

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('stage');
  pixelDensity(Math.min(devicePixelRatio || 1, 2));
  marpan = new Marpan25D({ bodyColor: BODY, expression: 'pupil', autoBlink: false });
  camera.scale = baseScale();
  lastTime = performance.now();
}

function baseScale() { return Math.min(height * .32, width * .185); }

function windowResized() {
  const oldBase = baseScale();
  resizeCanvas(windowWidth, windowHeight);
  camera.scale *= baseScale() / oldBase;
}

// Browsers only permit sound after a gesture; the animation itself needs none.
function mousePressed() { initAudio(); return false; }
function touchStarted() { initAudio(); return false; }
function keyPressed() { if (key === ' ' || keyCode === ENTER) initAudio(); }

function draw() {
  const now = performance.now();
  const dt = Math.min((now - lastTime) / 1000, .05);
  lastTime = now;
  advance(dt);
  renderWorld();
}

function advance(dt) {
  phaseTime += dt;
  if (phase === 'rolling') {
    const speed = 1.25;
    const stopX = WALL_X - OUTLINE_REACH;
    const step = Math.min(speed * dt, stopX - current.x);
    current.x += step;
    current.angle += step; // Rolling without sliding: angle = distance / radius.
    rollTick += step;
    if (rollTick > .24) { rollTick = 0; playRoll(); }
    if (current.x >= stopX - .0001) {
      current.x = stopX;
      impactX = current.x;
      phase = 'impact'; phaseTime = 0;
      playImpact();
    }
  } else if (phase === 'impact') {
    current.x = impactX - Math.sin(Math.min(phaseTime / .32, 1) * Math.PI) * .10;
    if (phaseTime >= .38) {
      current.x = impactX;
      phase = 'zoom'; phaseTime = 0;
      zoomFrom = { ...camera };
      playZoom();
    }
  } else if (phase === 'zoom') {
    const t = ease(Math.min(phaseTime / 2.5, 1));
    const targetScale = baseScale() / RATIO;
    camera.scale = Math.exp(mix(Math.log(zoomFrom.scale), Math.log(targetScale), t));
    camera.x = mix(zoomFrom.x, next.x, t);
    if (phaseTime >= 2.5) {
      rebase();
      phase = 'settle'; phaseTime = 0;
      settleFrom = { ...camera };
    }
  } else if (phase === 'settle') {
    const t = ease(Math.min(phaseTime / 1.4, 1));
    camera.x = mix(settleFrom.x, 0, t);
    camera.scale = mix(settleFrom.scale, baseScale(), t);
    if (phaseTime >= 1.4) {
      camera.x = 0; camera.scale = baseScale();
      phase = 'rolling'; phaseTime = 0; rollTick = 0;
    }
  }
}

function rebase() {
  const transformX = x => (x - next.x) / RATIO + START_X;
  previous = { x: transformX(current.x), y: current.y / RATIO,
    radius: 1 / RATIO, angle: current.angle };
  camera.x = transformX(camera.x);
  camera.y /= RATIO;
  camera.scale *= RATIO;
  current = { x: START_X, y: 0, angle: next.angle };
  next = { x: NEXT_X, y: 0, angle: 0 };
  stage++;
  playArrival();
}

function renderWorld() {
  background(PAPER);
  if (previous) drawMarpan(previous.x, previous.y, previous.radius, previous.angle);
  drawMarpan(next.x, next.y, RATIO, next.angle);
  drawMarpan(current.x, current.y, 1, current.angle);
}

function drawMarpan(x, y, radius, angle) {
  const sx = (x - camera.x) * camera.scale + width / 2;
  const sy = (y - camera.y) * camera.scale + height / 2;
  const pxRadius = radius * camera.scale;
  if (sx + pxRadius < -20 || sx - pxRadius > width + 20 ||
      sy + pxRadius < -20 || sy - pxRadius > height + 20) return;
  push();
  translate(sx, sy);
  rotate(angle);
  // Pass pixel dimensions to the shared renderer. It uses minimum pixel stroke
  // widths, so scaling its world-unit drawing would turn the outline into a blob.
  marpan.drawAt(0, 0, {
    bodyWidth: pxRadius * 2,
    bodyHeight: pxRadius * 2,
    lookX: pxRadius,
    lookY: 0,
    expression: 'pupil'
  });
  pop();
}

function initAudio() {
  if (audioContext) { audioContext.resume(); return; }
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return;
  audioContext = new Audio();
  master = audioContext.createGain();
  master.gain.value = .24;
  master.connect(audioContext.destination);
}

function tone(startHz, endHz, duration, type, volume) {
  if (!audioContext) return;
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(Math.max(25, startHz), now);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(25, endHz), now + duration);
  gain.gain.setValueAtTime(.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + .012);
  gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
  oscillator.connect(gain).connect(master);
  oscillator.start(now);
  oscillator.stop(now + duration + .02);
}

function pitch() { return Math.max(.35, Math.pow(2, -stage / 7)); }
function playRoll() { tone(180 * pitch(), 115 * pitch(), .09, 'sine', .055); }
function playImpact() { tone(135 * pitch(), 48 * pitch(), .2, 'triangle', .35); }
function playZoom() { tone(210 * pitch(), 65 * pitch(), 2.45, 'sine', .15); }
function playArrival() { tone(180 * pitch(), 110 * pitch(), .45, 'triangle', .12); }

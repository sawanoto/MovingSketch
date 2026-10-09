"use strict";

const COLORS = {
  background: "#f7f3e8", thread: "#9c9488", ink: "#403c38",
  star: "#f3c96a", moon: "#e7a882", cloud: "#b9d8d5"
};

let audioContext = null;
let masterGain = null;
let lastInputAt = 0;
let reducedMotion = false;
let layout = {};
const actors = {
  moon: { impulse: 0, spin: 0, weight: 1.08, gazeX: 0, flip: 0, flipFrom: 0, flipTo: 0, flipStarted: -2000 },
  star: { impulse: 0, spin: 0, weight: .82, gazeX: 0, flip: 0, flipFrom: 0, flipTo: 0, flipStarted: -2000 },
  cloud: { impulse: 0, spin: 0, weight: 1.28, gazeX: 0, flip: 0, flipFrom: 0, flipTo: 0, flipStarted: -2000 }
};

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("sketch");
  pixelDensity(min(window.devicePixelRatio || 1, 2));
  strokeCap(ROUND);
  strokeJoin(ROUND);
  reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  lastInputAt = millis();
  calculateLayout();
  canvas.elt.addEventListener("pointerdown", activate, { passive: false });
}

function calculateLayout() {
  const portrait = height > width * 1.05;
  // A nested mobile extends farther to the right than one flat bar. On portrait
  // screens, reserve room for the child bar and the cloud's full silhouette.
  const span = min(width * (portrait ? .59 : .54), height * .67, 570);
  const scale = constrain(span / 470, .62, 1.16);
  const topY = max(30 + envTop(), height * (portrait ? .075 : .065));
  layout = { portrait, span, scale, cx: width * (portrait ? .45 : .5), topY };
}

function draw() {
  background(COLORS.background);
  drawGlow();
  const t = millis() / 1000;
  const energy = reducedMotion ? .32 : 1;

  Object.values(actors).forEach(a => {
    a.impulse *= .974;
    a.spin *= .965;
    updateFlip(a);
  });

  // The resting angles include a small visual torque based on weight × arm length.
  const topBalance = radians((actors.moon.weight * 1.04 -
    (actors.star.weight + actors.cloud.weight) * .57) * 1.9);
  const childBalance = radians((actors.star.weight * .83 - actors.cloud.weight * .58) * 3.3);
  const topAngle = topBalance + energy * (sin(t * .315) * .025 + sin(t * .117 + 1.6) * .012);
  const childAngle = childBalance + energy * (sin(t * .277 + 2.2) * .034 + sin(t * .101) * .011);

  const s = layout.scale;
  const pivot = { x: layout.cx, y: layout.topY };
  drawThread(pivot.x, 0, pivot.x, pivot.y);
  drawKnot(pivot.x, pivot.y);

  const topHalf = layout.span * .44;
  const left = rotatePoint(-topHalf, 0, topAngle, pivot);
  const right = rotatePoint(topHalf, 0, topAngle, pivot);
  drawBar(left, right, 2.15 * s);

  const moonSwing = energy * (sin(t * .47 + .4) * .036 + sin(t * .163 + 2.5) * .012) + actors.moon.impulse;
  const moonLen = layout.span * .43;
  const moonAnchor = pendulum(left, moonLen, moonSwing);
  drawThread(left.x, left.y, moonAnchor.x, moonAnchor.y);

  const subJoint = pendulum(right, layout.span * .255,
    energy * (sin(t * .36 + 1.1) * .018 + sin(t * .13) * .007));
  drawThread(right.x, right.y, subJoint.x, subJoint.y);
  drawKnot(subJoint.x, subJoint.y);
  const childHalf = layout.span * .285;
  const cLeft = rotatePoint(-childHalf, 0, childAngle, subJoint);
  const cRight = rotatePoint(childHalf, 0, childAngle, subJoint);
  drawBar(cLeft, cRight, 1.8 * s);

  const starSwing = energy * (sin(t * .56 + 2.8) * .041 + sin(t * .19) * .012) + actors.star.impulse;
  const cloudSwing = energy * (sin(t * .255 + .3) * .025 + sin(t * .092 + 2) * .009) + actors.cloud.impulse;
  const starAnchor = pendulum(cLeft, layout.span * .29, starSwing);
  const cloudAnchor = pendulum(cRight, layout.span * .335, cloudSwing);
  drawThread(cLeft.x, cLeft.y, starAnchor.x, starAnchor.y);
  drawThread(cRight.x, cRight.y, cloudAnchor.x, cloudAnchor.y);

  const moonSize = layout.span * .24;
  const starSize = layout.span * .225;
  const cloudSize = layout.span * .29;
  const moonPos = { x: moonAnchor.x, y: moonAnchor.y + moonSize * .34 };
  const starPos = { x: starAnchor.x, y: starAnchor.y + starSize * .35 };
  const cloudPos = { x: cloudAnchor.x, y: cloudAnchor.y + cloudSize * .24 };
  layout.targets = { moon: { ...moonPos, r: moonSize * .58 }, star: { ...starPos, r: starSize * .58 }, cloud: { ...cloudPos, r: cloudSize * .57 } };

  const idleFocus = smoothstep(4.5, 10.5, (millis() - lastInputAt) / 1000);
  drawMoon(moonPos.x, moonPos.y, moonSize, moonSwing * .72 + actors.moon.spin, t, idleFocus);
  drawStar(starPos.x, starPos.y, starSize, starSwing + actors.star.spin + sin(t * .22) * .035, t, idleFocus);
  drawCloud(cloudPos.x, cloudPos.y, cloudSize, cloudSwing * .38 + actors.cloud.spin, t, idleFocus);
}

function drawGlow() {
  noStroke();
  for (let i = 7; i > 0; i--) {
    fill(255, 252, 239, 7);
    ellipse(width * .5, height * .35, width * (.3 + i * .11), height * (.2 + i * .08));
  }
}

function rotatePoint(x, y, a, origin) {
  return { x: origin.x + x * cos(a) - y * sin(a), y: origin.y + x * sin(a) + y * cos(a) };
}
function pendulum(origin, len, angle) { return { x: origin.x + sin(angle) * len, y: origin.y + cos(angle) * len }; }
function drawThread(x1, y1, x2, y2) { stroke(COLORS.thread); strokeWeight(max(.7, layout.scale * .82)); line(x1, y1, x2, y2); }
function drawBar(a, b, weight) { stroke(COLORS.ink); strokeWeight(weight); line(a.x, a.y, b.x, b.y); }
function drawKnot(x, y) { noStroke(); fill(COLORS.ink); circle(x, y, max(3, layout.scale * 3.7)); }

function beginMarpan(x, y, angle, actor) {
  push();
  translate(x, y);
  rotate(angle);
  // p5.js is a 2D canvas, so a Y-axis turn is represented by its perspective
  // projection: the body narrows to its edge, then opens on the other side.
  scale(cos(actor.flip), 1);
}
function endMarpan() { pop(); }

function drawStar(x, y, size, angle, t, idleFocus) {
  beginMarpan(x, y, angle, actors.star);
  drawingContext.shadowColor = "rgba(101, 81, 45, .13)"; drawingContext.shadowBlur = size * .1; drawingContext.shadowOffsetY = size * .035;
  noStroke(); fill(COLORS.star); beginShape();
  for (let i = 0; i < 10; i++) {
    const a = -HALF_PI + i * PI / 5;
    const r = i % 2 === 0 ? size * .52 : size * .31;
    const rr = r * (1 + .018 * sin(t * .41 + i));
    curveVertex(cos(a) * rr, sin(a) * rr);
  }
  for (let i = 0; i < 3; i++) { const a = -HALF_PI + i * PI / 5; const r = i % 2 === 0 ? size * .52 : size * .31; curveVertex(cos(a) * r, sin(a) * r); }
  endShape(); resetShadow();
  drawEyes(size, -size * .01, 0, angle, t, idleFocus, actors.star);
  endMarpan();
}

function drawMoon(x, y, size, angle, t, idleFocus) {
  beginMarpan(x, y, angle, actors.moon);
  drawingContext.shadowColor = "rgba(102, 67, 49, .13)"; drawingContext.shadowBlur = size * .1; drawingContext.shadowOffsetY = size * .035;
  noStroke(); fill(COLORS.moon);
  beginShape();
  vertex(size * .18, -size * .52);
  bezierVertex(-size * .43, -size * .5, -size * .58, -size * .12, -size * .48, size * .19);
  bezierVertex(-size * .36, size * .56, size * .07, size * .61, size * .39, size * .27);
  bezierVertex(size * .05, size * .34, -size * .11, size * .13, -size * .09, -size * .08);
  bezierVertex(-size * .07, -size * .29, size * .06, -size * .42, size * .18, -size * .52);
  endShape(CLOSE); resetShadow();
  drawEyes(size * .78, -size * .27, size * .06, angle, t, idleFocus, actors.moon);
  endMarpan();
}

function drawCloud(x, y, size, angle, t, idleFocus) {
  beginMarpan(x, y, angle, actors.cloud);
  drawingContext.shadowColor = "rgba(54, 82, 82, .13)"; drawingContext.shadowBlur = size * .09; drawingContext.shadowOffsetY = size * .035;
  noStroke(); fill(COLORS.cloud);
  beginShape();
  vertex(-size * .49, size * .13);
  bezierVertex(-size * .58, -size * .08, -size * .4, -size * .25, -size * .23, -size * .2);
  bezierVertex(-size * .13, -size * .42, size * .16, -size * .43, size * .27, -size * .2);
  bezierVertex(size * .49, -size * .22, size * .59, -size * .02, size * .48, size * .17);
  bezierVertex(size * .38, size * .34, -size * .34, size * .35, -size * .49, size * .13);
  endShape(CLOSE); resetShadow();
  drawEyes(size * .7, 0, size * .045, angle, t, idleFocus, actors.cloud);
  endMarpan();
}

function drawEyes(size, ox, oy, motionAngle, t, idleFocus, actor) {
  const lag = sin(t * .39 - .62 + motionAngle * 3) * size * .012;
  actor.gazeX = lerp(actor.gazeX, lag * (1 - idleFocus), .035);
  const spacing = size * .19;
  for (let i = -1; i <= 1; i++) {
    const ex = ox + i * spacing;
    const ew = size * .145, eh = size * .19;
    noStroke(); fill(255, 253, 247, 238); ellipse(ex, oy, ew, eh);
    const centerPull = idleFocus * (-ex * .045);
    fill(COLORS.ink); ellipse(ex + actor.gazeX + centerPull, oy + idleFocus * size * .006, size * .046, size * .061);
    fill(255, 255, 255, 175); circle(ex + actor.gazeX + centerPull - size * .009, oy - size * .017, size * .012);
  }
}

function resetShadow() { drawingContext.shadowBlur = 0; drawingContext.shadowOffsetY = 0; }
function smoothstep(a, b, x) { const q = constrain((x - a) / (b - a), 0, 1); return q * q * (3 - 2 * q); }
function envTop() { return 0; }

function updateFlip(actor) {
  const duration = reducedMotion ? 520 : 920;
  const q = constrain((millis() - actor.flipStarted) / duration, 0, 1);
  const eased = q < .5 ? 4 * q * q * q : 1 - pow(-2 * q + 2, 3) / 2;
  actor.flip = lerp(actor.flipFrom, actor.flipTo, eased);
}

function flipHalfTurn(actor) {
  actor.flipFrom = actor.flip;
  actor.flipTo = actor.flip + PI;
  actor.flipStarted = millis();
}

function activate(event) {
  event.preventDefault();
  ensureAudio();
  lastInputAt = millis();
  const hit = hitTest(event.clientX, event.clientY);
  if (!hit) return;
  const actor = actors[hit];
  flipHalfTurn(actor);
  if (hit === "star") { actor.impulse += .11; actor.spin += .075; playStar(); announce("星マーパンが、チリンと鳴りました"); }
  if (hit === "moon") { actor.impulse -= .085; actor.spin -= .045; playMoon(); announce("月マーパンが、ポーンと鳴りました"); }
  if (hit === "cloud") { actor.impulse += .075; actor.spin += .025; playCloud(); announce("雲マーパンが、フワッと鳴りました"); }
}

function hitTest(x, y) {
  if (!layout.targets) return null;
  return Object.keys(layout.targets).find(key => {
    const p = layout.targets[key]; return dist(x, y, p.x, p.y) < p.r * 1.2;
  }) || null;
}

function ensureAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioContext.createGain(); masterGain.gain.value = .24; masterGain.connect(audioContext.destination);
  }
  if (audioContext.state === "suspended") audioContext.resume();
}

function softTone(freq, duration, volume, type = "sine", glide = 1) {
  const now = audioContext.currentTime + .01;
  const osc = audioContext.createOscillator(), gain = audioContext.createGain();
  osc.type = type; osc.frequency.setValueAtTime(freq, now); osc.frequency.exponentialRampToValueAtTime(freq * glide, now + duration);
  gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(volume, now + .018); gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
  osc.connect(gain).connect(masterGain); osc.start(now); osc.stop(now + duration + .04);
}
function playStar() { softTone(987.77, .26, .2, "sine", 1.32); setTimeout(() => softTone(1480, .34, .1, "sine", .98), 55); }
function playMoon() { softTone(261.63, 1.05, .22, "sine", .78); softTone(392, .88, .075, "sine", .76); }
function playCloud() {
  const now = audioContext.currentTime + .01, length = floor(audioContext.sampleRate * .62);
  const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate), data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const envelope = pow(sin(PI * i / length), .72);
    data[i] = (Math.random() * 2 - 1) * envelope;
  }
  const source = audioContext.createBufferSource(), filter = audioContext.createBiquadFilter(), gain = audioContext.createGain();
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.Q.value = .65;
  filter.frequency.setValueAtTime(920, now);
  filter.frequency.exponentialRampToValueAtTime(310, now + .62);
  gain.gain.setValueAtTime(.0001, now);
  gain.gain.linearRampToValueAtTime(.28, now + .13);
  gain.gain.exponentialRampToValueAtTime(.0001, now + .62);
  source.connect(filter).connect(gain).connect(masterGain); source.start(now);
  // A very soft body tone keeps the airy sound audible on small phone speakers.
  softTone(220, .58, .095, "sine", 1.24);
}
function announce(message) { document.getElementById("live").textContent = message; }
function windowResized() { resizeCanvas(windowWidth, windowHeight); calculateLayout(); }

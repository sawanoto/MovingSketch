"use strict";

const STEP_ANGLE = Math.PI / 6.43; // about 28 degrees per note
const MIN_NOTE_MS = 68;
const MELODY = [
  261.63, 329.63, 392.00, 523.25,
  440.00, 392.00, 329.63, 293.66,
  261.63, 329.63, 349.23, 440.00,
  392.00, 329.63, 293.66, 261.63
];
const NOTE_COLORS = ["#df6754", "#e9973f", "#efc348", "#64a879", "#4c8f9d", "#8a72ad"];

let marpanEyes;
let layout;
let handleAngle = -0.72;
let dragging = false;
let pointerId = null;
let previousPointerAngle = 0;
let angularSpeed = 0;
let stepTravel = 0;
let stepCount = 0;
let lastStepAt = -9999;
let lastMotionAt = -9999;
let grindPulse = 0;
let crumbs = [];
let noteBursts = [];
let audio = null;

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("sketch");
  pixelDensity(Math.min(devicePixelRatio || 1, 2));
  canvas.elt.setAttribute("aria-label", "中央のコーヒーミル。丸いつまみをドラッグして回します");
  canvas.elt.setAttribute("role", "application");
  canvas.elt.setAttribute("tabindex", "0");
  canvas.elt.addEventListener("pointerdown", beginTurn);
  canvas.elt.addEventListener("pointermove", continueTurn);
  canvas.elt.addEventListener("pointerup", endTurn);
  canvas.elt.addEventListener("pointercancel", endTurn);
  canvas.elt.addEventListener("keydown", keyboardTurn);
  marpanEyes = new Marpan25D({ autoBlink: true, eyeScale: 1 });
  marpanEyes.enableAutoBlink(2700, 5200);
  calculateLayout();
}

function calculateLayout() {
  const compact = width < 620 || height < 650;
  const scale = Math.min(width / (compact ? 390 : 610), height / (compact ? 660 : 760), 1.12);
  const bodyW = Math.max(190, (compact ? 240 : 285) * scale);
  const bodyH = bodyW * .72;
  const cx = width * .5;
  const baseY = Math.min(height - 45, height * .83);
  const bodyY = baseY - bodyH * .57;
  const pivot = { x: cx, y: bodyY - bodyH * .63 };
  const arm = bodyW * .52;
  layout = { cx, baseY, bodyY, bodyW, bodyH, pivot, arm, scale, compact };
}

function draw() {
  clear();
  updateMotion();
  drawGroundShadow();
  drawCoffeeMill();
  drawNoteBursts();
}

function updateMotion() {
  const moving = millis() - lastMotionAt < 115;
  if (!dragging || !moving) angularSpeed *= .78;
  grindPulse *= .83;
  updateAudio(moving ? Math.abs(angularSpeed) : 0);
  crumbs.forEach(c => { c.x += c.vx; c.y += c.vy; c.vy += .045; c.life--; });
  crumbs = crumbs.filter(c => c.life > 0);
  noteBursts.forEach(n => { n.y -= .24; n.life--; });
  noteBursts = noteBursts.filter(n => n.life > 0);
}

function beginTurn(event) {
  const p = canvasPoint(event);
  const knob = knobPosition();
  if (dist(p.x, p.y, knob.x, knob.y) > Math.max(34, layout.bodyW * .15)) return;
  initAudio();
  dragging = true;
  pointerId = event.pointerId;
  previousPointerAngle = Math.atan2(p.y - layout.pivot.y, p.x - layout.pivot.x);
  lastMotionAt = millis();
  event.currentTarget.setPointerCapture?.(pointerId);
  event.currentTarget.classList.add("dragging");
  event.preventDefault();
}

function continueTurn(event) {
  if (!dragging || event.pointerId !== pointerId) return;
  const p = canvasPoint(event);
  const next = Math.atan2(p.y - layout.pivot.y, p.x - layout.pivot.x);
  let delta = next - previousPointerAngle;
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  // Reject pointer teleports through the pivot while keeping quick circular turns responsive.
  if (Math.abs(delta) < 1.18) applyRotation(delta, Math.max(8, event.timeStamp - (continueTurn.lastTime || event.timeStamp - 16)));
  continueTurn.lastTime = event.timeStamp;
  previousPointerAngle = next;
  event.preventDefault();
}

function endTurn(event) {
  if (!dragging || (event.pointerId !== undefined && event.pointerId !== pointerId)) return;
  dragging = false;
  pointerId = null;
  document.querySelector("canvas")?.classList.remove("dragging");
}

function keyboardTurn(event) {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(event.key)) return;
  initAudio();
  const direction = event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1 : 1;
  applyRotation(direction * STEP_ANGLE * .58, 70);
  event.preventDefault();
}

function applyRotation(delta, dt) {
  if (!Number.isFinite(delta) || Math.abs(delta) < .001) return;
  handleAngle += delta;
  const instant = delta / Math.max(.008, dt / 1000);
  angularSpeed = lerp(angularSpeed, instant, .42);
  stepTravel += Math.abs(delta);
  lastMotionAt = millis();
  setGrinding(Math.min(1, Math.abs(angularSpeed) / 7));
  while (stepTravel >= STEP_ANGLE) {
    stepTravel -= STEP_ANGLE;
    grindStep();
  }
}

function grindStep() {
  const now = millis();
  stepCount++;
  grindPulse = 1;
  makeCrumbs();
  if (now - lastStepAt >= MIN_NOTE_MS) {
    const index = (stepCount - 1) % MELODY.length;
    playNote(MELODY[index], Math.min(1, Math.abs(angularSpeed) / 8));
    playCrack(Math.min(1, Math.abs(angularSpeed) / 8));
    noteBursts.push({ color: NOTE_COLORS[index % NOTE_COLORS.length], life: 34, maxLife: 34, x: layout.cx + random(-14, 14), y: layout.bodyY - layout.bodyH * .04 });
    lastStepAt = now;
  }
  document.body.classList.add("played");
}

function canvasPoint(event) {
  const r = event.currentTarget.getBoundingClientRect();
  return { x: (event.clientX - r.left) * width / r.width, y: (event.clientY - r.top) * height / r.height };
}

function knobPosition() {
  return {
    x: layout.pivot.x + Math.cos(handleAngle) * layout.arm,
    y: layout.pivot.y + Math.sin(handleAngle) * layout.arm * .62
  };
}

function drawGroundShadow() {
  noStroke();
  fill(73, 51, 34, 24);
  ellipse(layout.cx, layout.baseY + 8, layout.bodyW * 1.34, layout.bodyW * .15);
}

function drawCoffeeMill() {
  drawPowderDrawer();
  drawMillBody();
  drawGrindingWindow();
  drawHopper();
  drawHandle();
  drawMarpanEyes();
  drawCrumbs();
}

function drawPowderDrawer() {
  const { cx, baseY, bodyW, bodyH } = layout;
  const w = bodyW * .84, h = bodyH * .43, y = baseY - h * .48;
  stroke("#302a25"); strokeWeight(Math.max(3, bodyW * .013)); strokeJoin(ROUND);
  fill("#9a6240"); rect(cx - w / 2, y - h / 2, w, h, 10);
  fill("#bb8055"); rect(cx - w * .44, y - h * .38, w * .88, h * .7, 7);
  const capacity = 150;
  const amount = Math.min(1, stepCount / capacity);
  const powderH = h * .52 * amount;
  noStroke(); fill("#50301f");
  beginShape();
  vertex(cx - w * .39, y + h * .27);
  for (let i = 0; i <= 12; i++) {
    const xx = lerp(cx - w * .39, cx + w * .39, i / 12);
    vertex(xx, y + h * .27 - powderH + Math.sin(i * 1.7 + stepCount * .08) * 2.2);
  }
  vertex(cx + w * .39, y + h * .29); endShape(CLOSE);
  stroke("#302a25"); strokeWeight(Math.max(3, bodyW * .012)); fill("#f2c979");
  rect(cx - w * .1, y - 3, w * .2, 13, 7);
}

function drawMillBody() {
  const { cx, bodyY, bodyW, bodyH } = layout;
  stroke("#302a25"); strokeWeight(Math.max(3, bodyW * .014)); strokeJoin(ROUND);
  fill("#d37a4f");
  beginShape();
  vertex(cx - bodyW * .44, bodyY - bodyH * .43);
  quadraticVertex(cx - bodyW * .49, bodyY, cx - bodyW * .43, bodyY + bodyH * .46);
  vertex(cx + bodyW * .43, bodyY + bodyH * .46);
  quadraticVertex(cx + bodyW * .49, bodyY, cx + bodyW * .44, bodyY - bodyH * .43);
  endShape(CLOSE);
  noStroke(); fill(255, 209, 153, 31);
  rect(cx - bodyW * .35, bodyY - bodyH * .36, bodyW * .15, bodyH * .68, 30);
  stroke("#302a25"); strokeWeight(Math.max(3, bodyW * .012)); fill("#825033");
  rect(cx - bodyW * .49, bodyY + bodyH * .39, bodyW * .98, bodyH * .12, 5);
}

function drawGrindingWindow() {
  const { cx, bodyY, bodyW, bodyH } = layout;
  const size = bodyW * .18;
  noStroke(); fill(64, 39, 27, 55 + grindPulse * 40);
  circle(cx, bodyY + bodyH * .25, size);
  push(); translate(cx, bodyY + bodyH * .25); rotate(handleAngle * 1.9);
  stroke("#6b432e"); strokeWeight(size * .12); strokeCap(ROUND);
  for (let i = 0; i < 4; i++) { rotate(HALF_PI); line(size * .12, 0, size * .39, 0); }
  pop();
}

function drawHopper() {
  const { cx, bodyY, bodyW, bodyH } = layout;
  const top = bodyY - bodyH * .97;
  stroke("#302a25"); strokeWeight(Math.max(3, bodyW * .013)); strokeJoin(ROUND);
  fill("#8a5738");
  beginShape();
  vertex(cx - bodyW * .35, top); vertex(cx + bodyW * .35, top);
  vertex(cx + bodyW * .22, bodyY - bodyH * .47); vertex(cx - bodyW * .22, bodyY - bodyH * .47);
  endShape(CLOSE);
  fill("#5f3927"); ellipse(cx, top, bodyW * .7, bodyH * .18);
  const remaining = Math.max(0, 18 - Math.floor(stepCount / 7));
  for (let i = 0; i < remaining; i++) {
    const row = Math.floor(i / 6), col = i % 6;
    const bx = cx + (col - 2.5) * bodyW * .09 + (row % 2) * bodyW * .035;
    const by = top - row * bodyW * .035 + Math.sin(i * 2.1) * 2;
    drawBean(bx, by, bodyW * .047, -.6 + i * .73);
  }
  fill("#a96e48"); rect(cx - bodyW * .27, bodyY - bodyH * .51, bodyW * .54, bodyH * .1, 6);
}

function drawBean(x, y, s, angle) {
  push(); translate(x, y); rotate(angle); stroke("#342219"); strokeWeight(Math.max(1.2, s * .08)); fill("#6c3c25");
  ellipse(0, 0, s * 1.45, s); noFill(); arc(0, 0, s * .38, s * .78, -HALF_PI, HALF_PI); pop();
}

function drawHandle() {
  const p = layout.pivot, knob = knobPosition(), weight = Math.max(4, layout.bodyW * .021);
  stroke("#302a25"); strokeWeight(weight + 3); strokeCap(ROUND); line(p.x, p.y, knob.x, knob.y);
  stroke("#c18a58"); strokeWeight(weight); line(p.x, p.y, knob.x, knob.y);
  stroke("#302a25"); strokeWeight(Math.max(3, layout.bodyW * .013)); fill("#e2ad70"); circle(p.x, p.y, layout.bodyW * .1);
  const bob = dragging ? Math.sin(millis() * .035) * 1.2 : 0;
  push(); translate(knob.x, knob.y + bob); rotate(handleAngle + .35);
  fill("#75452e"); rect(-layout.bodyW * .055, -layout.bodyW * .09, layout.bodyW * .11, layout.bodyW * .18, layout.bodyW * .05);
  noStroke(); fill(255, 220, 174, 36); rect(-layout.bodyW * .025, -layout.bodyW * .065, layout.bodyW * .025, layout.bodyW * .105, 8); pop();
}

function drawMarpanEyes() {
  const { cx, bodyY, bodyW, bodyH } = layout;
  const speed = Math.min(1, Math.abs(angularSpeed) / 8);
  let lookAngle = handleAngle;
  if (speed > .62) lookAngle += Math.sin(millis() * .032) * .45 * speed;
  const lookRadius = bodyW * (.18 + speed * .06);
  const lookX = Math.cos(lookAngle) * lookRadius;
  const lookY = Math.sin(lookAngle) * lookRadius;
  marpanEyes.drawEyes(cx, bodyY - bodyH * .08, bodyW * .98, bodyH, 0, lookX, lookY, { eyeScale: .92 });
}

function makeCrumbs() {
  const { cx, bodyY, bodyH } = layout;
  for (let i = 0; i < 3; i++) crumbs.push({ x: cx + random(-12, 12), y: bodyY + bodyH * .29, vx: random(-.28, .28), vy: random(.1, .65), life: random(18, 33), size: random(2.5, 5) });
}

function drawCrumbs() {
  noStroke(); fill("#4e2c1c");
  crumbs.forEach(c => circle(c.x, c.y, c.size));
}

function drawNoteBursts() {
  noteBursts.forEach(n => {
    const a = 220 * n.life / n.maxLife;
    push(); translate(n.x, n.y); noStroke(); fill(colorWithAlpha(n.color, a));
    ellipse(-6, 7, 9, 7); rect(-3, -12, 3, 19, 2); arc(2, -9, 12, 8, -HALF_PI, HALF_PI); pop();
  });
}

function colorWithAlpha(hexColor, alpha) {
  const c = color(hexColor); c.setAlpha(alpha); return c;
}

function initAudio() {
  if (audio) { if (audio.ctx.state === "suspended") audio.ctx.resume(); return; }
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const ctx = new AudioContextClass();
  const master = ctx.createGain(); master.gain.value = .64; master.connect(ctx.destination);
  const grind = ctx.createGain(); grind.gain.value = 0; grind.connect(master);
  const noise = ctx.createBufferSource();
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0); for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  noise.buffer = buffer; noise.loop = true;
  const filter = ctx.createBiquadFilter(); filter.type = "bandpass"; filter.frequency.value = 520; filter.Q.value = .72;
  noise.connect(filter); filter.connect(grind); noise.start();
  audio = { ctx, master, grind, filter };
  document.getElementById("sound-state").textContent = "SOUND ON";
  document.getElementById("sound-state").classList.add("on");
}

function setGrinding(speed) {
  if (!audio) return;
  const t = audio.ctx.currentTime;
  audio.filter.frequency.setTargetAtTime(320 + speed * 500, t, .035);
  audio.grind.gain.setTargetAtTime(.012 + speed * .038, t, .025);
}

function updateAudio(speed) {
  if (!audio) return;
  const target = speed > .05 ? .012 + Math.min(1, speed / 7) * .038 : 0;
  audio.grind.gain.setTargetAtTime(target, audio.ctx.currentTime, .055);
}

function playNote(freq, speed) {
  if (!audio) return;
  const t = audio.ctx.currentTime;
  const osc = audio.ctx.createOscillator();
  const gain = audio.ctx.createGain();
  const filter = audio.ctx.createBiquadFilter();
  osc.type = "triangle"; osc.frequency.setValueAtTime(freq, t);
  filter.type = "lowpass"; filter.frequency.value = 1200 + speed * 1500;
  gain.gain.setValueAtTime(.0001, t); gain.gain.exponentialRampToValueAtTime(.16, t + .012);
  gain.gain.exponentialRampToValueAtTime(.0001, t + .2 + (1 - speed) * .12);
  osc.connect(filter); filter.connect(gain); gain.connect(audio.master); osc.start(t); osc.stop(t + .36);
}

function playCrack(speed) {
  if (!audio) return;
  const t = audio.ctx.currentTime;
  const osc = audio.ctx.createOscillator(); const gain = audio.ctx.createGain();
  osc.type = "sine"; osc.frequency.setValueAtTime(92 + Math.random() * 34, t); osc.frequency.exponentialRampToValueAtTime(48, t + .055);
  gain.gain.setValueAtTime(.035 + speed * .018, t); gain.gain.exponentialRampToValueAtTime(.0001, t + .075);
  osc.connect(gain); gain.connect(audio.master); osc.start(t); osc.stop(t + .08);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight); calculateLayout();
}

window.addEventListener("blur", () => { dragging = false; pointerId = null; });

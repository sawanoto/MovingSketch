let stakes = [];
let strikes = [];
let particles = [];
let layout = {};
let beltPhase = 0;
let nextSpawnAt = 0;
let autoEnabled = false;
let nextAutoAt = 0;
let autoTarget = null;
let audioCtx = null;
let masterGain = null;
let firstHit = false;
let benchShake = 0;
let serial = 0;

const BELT_SPEED = 50;
const SPAWN_MS = 1450;
const SPAWN_JITTER = 430;
const INITIAL_HEIGHTS = [-0.78, -0.42, -0.08, 0.28, 0.62];
const WOODS = ["#d8b779", "#c99b59", "#e0bf7f", "#b9854c", "#d2a664"];

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("sketch");
  pixelDensity(min(window.devicePixelRatio || 1, 2));
  frameRate(60);
  layoutScene();
  for (let i = 0; i < 6; i++) spawnStake(width * (.08 + i * .19));
  nextSpawnAt = millis() + randomSpawnDelay();
  document.getElementById("auto").addEventListener("click", toggleAuto);
}

function layoutScene() {
  const s = min(width, height);
  layout = {
    groundY: height * (width < 620 ? .63 : .66),
    beltH: constrain(height * .22, 128, 210),
    stakeW: constrain(s * .105, 52, 82),
    maxRise: constrain(height * .30, 120, 245),
    sinkStep: constrain(s * .028, 14, 23),
    spacing: constrain(width * .185, 118, 220),
    autoX: width * (width < 620 ? .42 : .38)
  };
}

function draw() {
  const dt = min(deltaTime / 1000, .04);
  beltPhase = (beltPhase + BELT_SPEED * dt) % 52;
  benchShake *= .78;
  updateStakes(dt);
  updateAuto();
  updateParticles(dt);

  const sx = benchShake ? random(-benchShake, benchShake) : 0;
  const sy = benchShake ? random(-benchShake * .35, benchShake * .35) : 0;
  drawBackground();
  push();
  translate(sx, sy);
  drawMachineBack();
  drawStakes();
  drawBenchFront();
  drawParticles();
  pop();
  drawStrikes();
  drawAutoStandby();

  if (millis() >= nextSpawnAt) {
    spawnStake(width + layout.stakeW);
    nextSpawnAt = millis() + randomSpawnDelay();
  }
}

function drawBackground() {
  background("#151a1b");
  noStroke();
  for (let y = 0; y < height; y += 62) {
    fill(y % 124 ? "#171c1d" : "#192021");
    rect(0, y, width, 62);
  }
  stroke(255, 10); strokeWeight(1);
  for (let x = 34; x < width; x += 118) line(x, 0, x, height);
  noStroke(); fill(0, 45);
  rect(0, layout.groundY + layout.beltH * .76, width, height);
}

function drawMachineBack() {
  const top = layout.groundY - 12;
  noStroke(); fill(6, 8, 8, 120); rect(0, top + 18, width, layout.beltH + 32);
  stroke("#090b0b"); strokeWeight(4); fill("#3d4443"); rect(-12, top, width + 24, layout.beltH, 5);
  noStroke(); fill("#282e2e"); rect(-5, top + 13, width + 10, layout.beltH - 26);
  stroke(132, 141, 136, 55); strokeWeight(1);
  for (let x = -52 - beltPhase; x < width + 52; x += 52) line(x, top + 15, x, top + layout.beltH - 15);
  noStroke(); fill("#59605d"); rect(0, top - 10, width, 13);
  fill("#242a29"); rect(0, top - 5, width, 5);
}

function drawStakes() {
  const ordered = stakes.slice().sort((a, b) => a.x - b.x);
  for (const stake of ordered) drawStake(stake);
}

function drawStake(stake) {
  const visibleTop = stakeTop(stake);
  const bottom = layout.groundY + layout.beltH * .64;
  const hitAge = millis() - stake.hitAt;
  const kick = hitAge >= 0 && hitAge < 135 ? sin(hitAge / 135 * PI * 4) * (1 - hitAge / 135) * 4 : 0;
  const w = layout.stakeW;
  const capH = w * .56;
  const bodyTop = visibleTop + capH * .34;

  push(); translate(stake.x + kick, 0);
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(-w, 0, w * 2, layout.groundY + 2);
  drawingContext.clip();
  noStroke(); fill(0, 44); rect(-w * .48 + 6, bodyTop + 8, w * .96, max(0, bottom - bodyTop), 4);
  stroke("#342619"); strokeWeight(max(2, w * .035)); fill(stake.wood);
  rect(-w * .45, bodyTop, w * .9, max(4, bottom - bodyTop), 3);
  stroke(74, 49, 27, 90); strokeWeight(1);
  line(-w * .22, bodyTop + 5, -w * .22, bottom); line(w * .2, bodyTop + 13, w * .2, bottom);
  drawingContext.restore();

  // The shared Ma-pan renderer supplies the canonical three-eye face; the stake itself is custom geometry.
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(-w, 0, w * 2, layout.groundY + 1);
  drawingContext.clip();
  stroke("#2d2319"); strokeWeight(max(2, w * .035)); fill(stake.wood);
  rect(-w * .5, visibleTop, w, capH, 7, 7, 3, 3);
  noStroke(); fill(255, 44); rect(-w * .4, visibleTop + 4, w * .8, capH * .16, 3);
  stake.face.setPosition(0, visibleTop + capH * .51);
  stake.face.lookAt(0, visibleTop + capH * .66);
  stake.face.drawEyes(0, visibleTop + capH * .51, w * 1.02, capH * 1.22, 0, 0, capH * .08, { eyeScale: .9 });
  drawingContext.restore();
  pop();
}

function drawBenchFront() {
  const y = layout.groundY;
  noStroke(); fill("#727a76"); rect(0, y - 3, width, 8);
  fill("#454c4a"); rect(0, y + 5, width, 20);
  fill("#252b2a"); rect(0, y + 25, width, layout.beltH * .7);
  stroke(255, 22); strokeWeight(1); line(0, y + 26, width, y + 26);
  noStroke();
  for (let x = -90 - beltPhase * 1.5; x < width + 90; x += 150) {
    fill("#c19e32"); quad(x, y + 35, x + 46, y + 35, x + 12, y + 64, x - 34, y + 64);
  }
  fill("#1d2221"); rect(0, y + 67, width, layout.beltH);
  fill("#5c6461");
  for (let x = 38; x < width; x += 170) circle(x, y + 15, 5);
}

function spawnStake(x = width + layout.stakeW) {
  // Each stake chooses independently, with a little continuous variation so the
  // stream never settles into a repeating staircase.
  const index = floor(random(INITIAL_HEIGHTS.length));
  const rise = constrain(INITIAL_HEIGHTS[index] + random(-.13, .13), -.88, .76) * layout.maxRise;
  const face = new Marpan25D({ maxSize: layout.stakeW, autoBlink: false, bodyColor: WOODS[serial % WOODS.length] });
  for (let i = 0; i < 3; i++) face.setPupilOffset(i, random(-.08, .08), random(-.02, .08));
  stakes.push({ id: ++serial, x, rise, depth: 0, wood: WOODS[(serial + index) % WOODS.length], face, hitAt: -9999, lastAutoAt: -9999, autoHit: false });
}

function randomSpawnDelay() {
  return SPAWN_MS + random(-SPAWN_JITTER, SPAWN_JITTER);
}

function stakeTop(stake) {
  return layout.groundY - layout.stakeW * .52 - stake.rise + stake.depth;
}

function updateStakes(dt) {
  for (const stake of stakes) stake.x -= BELT_SPEED * dt;
  stakes = stakes.filter(stake => stake.x > -layout.stakeW * 2);
  if (autoTarget && !stakes.includes(autoTarget)) autoTarget = null;
}

function strikeStake(stake, source = "manual") {
  if (!stake || !stakes.includes(stake)) return;
  startAudio();
  const before = stake.rise - stake.depth;
  stake.depth += layout.sinkStep;
  stake.hitAt = millis() + 105;
  stake.lastAutoAt = millis();
  stake.face.blink([0, 1, 2], 90);
  strikes.push({ stake, x: stake.x, startedAt: millis(), source });
  makeImpact(stake.x, layout.groundY - max(2, before));
  playImpact(before);
  benchShake = max(benchShake, 4.5);
  if (!firstHit) {
    firstHit = true;
    document.getElementById("hint").classList.add("hidden");
  }
}

function makeImpact(x, y) {
  for (let i = 0; i < 9; i++) {
    const a = random(PI + .25, TWO_PI - .25), speed = random(34, 95);
    particles.push({ x, y, vx: cos(a) * speed, vy: sin(a) * speed, life: 1, size: random(2, 5) });
  }
}

function updateParticles(dt) {
  for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 190 * dt; p.life -= dt * 3.4; }
  particles = particles.filter(p => p.life > 0);
}

function drawParticles() {
  noStroke();
  for (const p of particles) { fill(211, 190, 145, p.life * 180); circle(p.x, p.y, p.size * p.life); }
}

function drawStrikes() {
  const now = millis();
  strikes = strikes.filter(s => now - s.startedAt < 330 && stakes.includes(s.stake));
  const latestAuto = strikes.filter(s => s.source === "auto").at(-1);
  for (const strike of strikes) {
    if (strike.source === "auto" && strike !== latestAuto) continue;
    const age = now - strike.startedAt;
    // Once AUTO catches a stake, its hammer carriage travels with that stake.
    const x = strike.stake.x;
    const targetY = max(72, stakeTop(strike.stake) - layout.stakeW * .08);
    let headY, angle;
    if (strike.source === "auto") {
      angle = 0;
      if (age < 76) headY = lerp(targetY - 112, targetY - 145, easeOut(age / 76));
      else if (age < 142) headY = lerp(targetY - 145, targetY, easeIn((age - 76) / 66));
      else if (age < 202) headY = targetY - sin((age - 142) / 60 * PI) * 17;
      else headY = lerp(targetY, targetY - 112, easeInOut((age - 202) / 128));
    } else if (age < 70) {
      const t = easeOut(age / 70); headY = targetY - lerp(72, 126, t); angle = lerp(-.42, -.62, t);
    } else if (age < 132) {
      const t = easeIn((age - 70) / 62); headY = lerp(targetY - 126, targetY, t); angle = lerp(-.62, .04, t);
    } else if (age < 190) {
      const t = (age - 132) / 58; headY = targetY - sin(t * PI) * 17; angle = lerp(.04, -.12, t);
    } else {
      const t = easeInOut((age - 190) / 140); headY = lerp(targetY, -layout.stakeW * 1.8, t); angle = lerp(-.12, -.35, t);
    }
    drawHammer(x, headY, angle, age >= 122 && age < 150);
  }
}

function drawAutoStandby() {
  if (!autoEnabled || strikes.some(s => s.source === "auto")) return;
  const parkedY = max(38, layout.groundY - layout.maxRise - layout.stakeW * 1.35);
  drawHammer(layout.autoX, parkedY, 0, false);
}

function drawHammer(x, y, angle, impact) {
  const u = layout.stakeW;
  push(); translate(x, y); rotate(angle);
  if (impact) { drawingContext.shadowColor = "rgba(255,215,95,.45)"; drawingContext.shadowBlur = 14; }
  stroke("#161919"); strokeWeight(max(3, u * .045)); strokeCap(ROUND);
  fill("#777f7c"); rect(-u * .7, -u * .25, u * 1.4, u * .5, 5);
  noStroke(); fill("#9aa19d"); rect(-u * .55, -u * .18, u * 1.05, u * .13, 2);
  stroke("#2d2117"); strokeWeight(u * .18); line(u * .05, u * .19, u * .05, u * 1.32);
  stroke("#b8834d"); strokeWeight(u * .1); line(u * .05, u * .24, u * .05, u * 1.3);
  pop();
}

function easeOut(t) { return 1 - pow(1 - constrain(t, 0, 1), 3); }
function easeIn(t) { return pow(constrain(t, 0, 1), 3); }
function easeInOut(t) { t = constrain(t, 0, 1); return t < .5 ? 4 * t * t * t : 1 - pow(-2 * t + 2, 3) / 2; }

function findStake(px, py) {
  let best = null;
  for (const stake of stakes) {
    const top = min(stakeTop(stake), layout.groundY - 4);
    const left = stake.x - layout.stakeW * .7, right = stake.x + layout.stakeW * .7;
    // The hit area deliberately remains at the belt line after the face sinks below it.
    const upper = min(top - 12, layout.groundY - layout.stakeW * .55);
    const lower = layout.groundY + layout.stakeW * .62;
    if (px >= left && px <= right && py >= upper && py <= lower) best = stake;
  }
  return best;
}

function activateAt(x, y) {
  const stake = findStake(x, y);
  if (stake) strikeStake(stake, "manual");
  else startAudio();
  return false;
}

function toggleAuto(event) {
  event.stopPropagation();
  startAudio();
  autoEnabled = !autoEnabled;
  const button = document.getElementById("auto");
  button.setAttribute("aria-pressed", String(autoEnabled));
  button.querySelector("b").textContent = autoEnabled ? "ON" : "OFF";
  if (!autoEnabled) autoTarget = null;
  nextAutoAt = millis() + 120;
}

function updateAuto() {
  if (!autoEnabled || millis() < nextAutoAt) return;
  if (!autoTarget) {
    const capture = max(12, BELT_SPEED * .38);
    const candidates = stakes.filter(s => !s.autoHit && abs(s.x - layout.autoX) <= capture);
    if (candidates.length) {
      candidates.sort((a, b) => abs(a.x - layout.autoX) - abs(b.x - layout.autoX));
      autoTarget = candidates[0];
    }
  }
  if (autoTarget) {
    // Height is never judged as correct: the press keeps going until even the
    // top edge of the three-eyed cap has disappeared beneath the work surface.
    if (stakeTop(autoTarget) < layout.groundY + 3) {
      strikeStake(autoTarget, "auto");
      nextAutoAt = millis() + 205;
    } else {
      autoTarget.autoHit = true;
      autoTarget = null;
      nextAutoAt = millis() + 90;
    }
    return;
  }
  nextAutoAt = millis() + 45;
}

function startAudio() {
  if (audioCtx) { if (audioCtx.state === "suspended") audioCtx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  audioCtx = new AC();
  masterGain = audioCtx.createGain(); masterGain.gain.value = .22; masterGain.connect(audioCtx.destination);
}

function playImpact(height) {
  if (!audioCtx) return;
  const normalized = constrain(map(height, -layout.maxRise, layout.maxRise, 0, 1), 0, 1);
  const now = audioCtx.currentTime;
  const duration = lerp(.07, .19, normalized);
  const base = lerp(90, 470, normalized);
  const osc = audioCtx.createOscillator(), overtone = audioCtx.createOscillator();
  const gain = audioCtx.createGain(), gain2 = audioCtx.createGain();
  osc.type = normalized > .58 ? "triangle" : "sine";
  overtone.type = "sine";
  osc.frequency.setValueAtTime(base, now); osc.frequency.exponentialRampToValueAtTime(base * .72, now + duration);
  overtone.frequency.setValueAtTime(base * 2.73, now); overtone.frequency.exponentialRampToValueAtTime(base * 2.3, now + duration * .75);
  gain.gain.setValueAtTime(.34, now); gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
  gain2.gain.setValueAtTime(.12 * normalized + .015, now); gain2.gain.exponentialRampToValueAtTime(.0001, now + duration * .7);
  osc.connect(gain); overtone.connect(gain2); gain.connect(masterGain); gain2.connect(masterGain);
  osc.start(now); overtone.start(now); osc.stop(now + duration + .02); overtone.stop(now + duration + .02);
}

function mousePressed() { return activateAt(mouseX, mouseY); }
function touchStarted() { return activateAt(mouseX, mouseY); }

function windowResized() {
  const oldGround = layout.groundY || height * .66;
  resizeCanvas(windowWidth, windowHeight);
  layoutScene();
  const groundDelta = layout.groundY - oldGround;
  for (const stake of stakes) {
    stake.depth = max(0, stake.depth + groundDelta * .04);
    stake.face.maxSize = layout.stakeW;
  }
}

const RED = "#ef2b2d";
const GREEN = "#1fc45b";
const OFF = "#343a36";

let countdownSound;
let soundReady = false;
let phase = -1;
let finished = false;
let phasePulse = 0;
let previousPhase = -1;

function preload() {
  soundFormats("mp3");
  countdownSound = loadSound(
    "321GO.mp3",
    () => soundReady = true,
    () => soundReady = false
  );
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont("sans-serif");
  if (countdownSound) countdownSound.onended(finishRaceSignal);
}

function draw() {
  drawRaceFlagBackground();
  updateSignalFromSound();
  phasePulse *= 0.87;

  const bodyW = min(width * 0.58, height * 0.62, 440);
  const bodyH = bodyW * 0.68;
  const cx = width * 0.5;
  const cy = height * 0.5 - phasePulse * bodyH * 0.018;

  drawHeading();
  drawSignalHalo(cx, cy, bodyW);
  drawGroundShadow(cx, cy, bodyW, bodyH);
  drawMarpan25D(cx, cy, bodyW, bodyH);
  drawPhaseLabel();
  drawGuide();
}

function drawRaceFlagBackground() {
  background(232, 232, 226);
  const cell = constrain(min(width, height) * 0.105, 54, 92);
  const columns = ceil(width / cell) + 2;
  const rows = ceil(height / cell) + 2;
  const waveTime = millis() * 0.00042;

  noStroke();
  for (let row = -1; row < rows; row++) {
    for (let column = -1; column < columns; column++) {
      const wave = sin(row * 0.72 + waveTime) * cell * 0.09;
      const x = column * cell + wave;
      const y = row * cell;
      fill((row + column) % 2 === 0 ? color(28, 30, 28) : color(232, 232, 226));
      rect(x, y, cell + 1, cell + 1);
    }
  }

  fill(8, 10, 9, 92);
  rect(0, 0, width, 68);
  rect(0, height - 50, width, 50);
}

function updateSignalFromSound() {
  if (!soundReady || !countdownSound?.isPlaying()) return;
  const duration = max(0.1, countdownSound.duration());
  const nextPhase = constrain(floor(countdownSound.currentTime() / duration * 4), 0, 3);
  if (nextPhase !== previousPhase) {
    phase = nextPhase;
    previousPhase = nextPhase;
    phasePulse = 1;
  }
}

function startSequence() {
  if (!soundReady) return false;
  userStartAudio();
  countdownSound.stop();
  countdownSound.play();
  phase = 0;
  previousPhase = 0;
  phasePulse = 1;
  finished = false;
  return false;
}

function finishRaceSignal() {
  phase = 3;
  previousPhase = 3;
  phasePulse = 1;
  finished = true;
}

function eyeState(index) {
  if (phase < 0) return { color: OFF, active: false };
  if (phase === 3) return { color: GREEN, active: true };
  return { color: index <= phase ? RED : OFF, active: index <= phase };
}

function drawMarpan25D(cx, cy, bodyW, bodyH) {
  drawDomeBody(cx, cy, bodyW, bodyH);
  beginManjuClip(cx, cy, bodyW, bodyH);
  drawRaceEyes(cx, cy, bodyW);
  drawingContext.restore();
}

function drawDomeBody(cx, cy, bodyW, bodyH) {
  push(); translate(cx, cy);
  stroke(12); strokeWeight(max(5, bodyW * 0.012)); strokeJoin(ROUND); fill(250);
  beginShape();
  vertex(0, -bodyH * 0.5);
  bezierVertex(bodyW * 0.27, -bodyH * 0.5, bodyW * 0.5, -bodyH * 0.25, bodyW * 0.48, bodyH * 0.2);
  bezierVertex(bodyW * 0.46, bodyH * 0.46, bodyW * 0.25, bodyH * 0.5, 0, bodyH * 0.5);
  bezierVertex(-bodyW * 0.25, bodyH * 0.5, -bodyW * 0.46, bodyH * 0.46, -bodyW * 0.48, bodyH * 0.2);
  bezierVertex(-bodyW * 0.5, -bodyH * 0.25, -bodyW * 0.26, -bodyH * 0.5, 0, -bodyH * 0.5);
  endShape(CLOSE);
  pop();
}

function beginManjuClip(cx, cy, bodyW, bodyH) {
  const context = drawingContext;
  context.save(); context.beginPath();
  context.moveTo(cx - bodyW * 0.48, cy + bodyH * 0.2);
  context.bezierCurveTo(cx - bodyW * 0.5, cy - bodyH * 0.25, cx - bodyW * 0.26, cy - bodyH * 0.5, cx, cy - bodyH * 0.5);
  context.bezierCurveTo(cx + bodyW * 0.27, cy - bodyH * 0.5, cx + bodyW * 0.5, cy - bodyH * 0.25, cx + bodyW * 0.48, cy + bodyH * 0.2);
  context.bezierCurveTo(cx + bodyW * 0.46, cy + bodyH * 0.46, cx + bodyW * 0.25, cy + bodyH * 0.5, cx, cy + bodyH * 0.5);
  context.bezierCurveTo(cx - bodyW * 0.25, cy + bodyH * 0.5, cx - bodyW * 0.46, cy + bodyH * 0.46, cx - bodyW * 0.48, cy + bodyH * 0.2);
  context.closePath(); context.clip();
}

function raceEyeModels(cx, cy, bodyW) {
  const baseEyeW = bodyW * 0.135 * 1.42;
  const baseEyeH = baseEyeW * 1.08;
  const eyes = [];
  for (let i = 0; i < 3; i++) {
    const longitude = (i - 1) * 0.44;
    const depth = cos(longitude);
    const scale = 0.76 + depth * 0.24;
    eyes.push({
      index: i,
      depth,
      x: cx + sin(longitude) * bodyW * 0.47,
      y: cy,
      w: baseEyeW * scale * max(0.025, depth),
      h: baseEyeH * scale
    });
  }
  return eyes;
}

function drawRaceEyes(cx, cy, bodyW) {
  const eyes = raceEyeModels(cx, cy, bodyW).sort((a, b) => a.depth - b.depth || a.index - b.index);
  for (const eye of eyes) {
    const state = eyeState(eye.index);
    push(); translate(eye.x, eye.y);
    const popScale = state.active ? 1 + phasePulse * 0.09 : 1;
    scale(popScale);
    if (state.active) {
      drawingContext.shadowColor = state.color;
      drawingContext.shadowBlur = eye.w * 0.55;
    }
    stroke(12); strokeWeight(max(2, eye.w * 0.055)); fill(state.color);
    ellipse(0, 0, eye.w, eye.h);
    drawingContext.shadowBlur = 0;
    if (state.active) {
      noStroke(); fill(255, 185);
      ellipse(-eye.w * 0.16, -eye.h * 0.18, eye.w * 0.12);
    }
    pop();
  }
}

function drawSignalHalo(cx, cy, bodyW) {
  if (phase < 0) return;
  const haloColor = color(phase === 3 ? GREEN : RED);
  noStroke(); fill(red(haloColor), green(haloColor), blue(haloColor), 15);
  ellipse(cx, cy, bodyW * 1.38);
}

function drawGroundShadow(cx, cy, bodyW, bodyH) {
  noStroke(); fill(0, 55);
  ellipse(cx, cy + bodyH * 0.54, bodyW * 0.56, max(8, bodyH * 0.065));
}

function drawHeading() {
  noStroke(); fill(235, 240, 235, 165); textAlign(CENTER, CENTER); textStyle(BOLD);
  textSize(constrain(width * 0.03, 16, 23));
  text("RACE SIGNAL", width * 0.5, 36);
  textStyle(NORMAL);
}

function drawPhaseLabel() {
  let label = "READY";
  let labelColor = color(180);
  if (phase >= 0 && phase < 3) {
    label = `RED ${phase + 1}`;
    labelColor = color(RED);
  } else if (phase === 3) {
    label = "GO!";
    labelColor = color(GREEN);
  }
  noStroke(); fill(labelColor); textAlign(CENTER, CENTER); textStyle(BOLD);
  textSize(constrain(width * 0.058, 25, 48));
  text(label, width * 0.5, height * 0.77);
  textStyle(NORMAL);
}

function drawGuide() {
  const message = !soundReady
    ? "音声を読み込み中…"
    : countdownSound.isPlaying()
      ? "3 · 2 · 1 · GO"
      : finished ? "クリックでもう一度" : "クリックしてスタート";
  noStroke(); fill(225, 230, 225, 105); textAlign(CENTER, CENTER); textSize(13);
  text(message, width * 0.5, height - 24);
}

function mousePressed() { return startSequence(); }
function touchStarted() { return startSequence(); }
function keyPressed() {
  if (key === " ") return startSequence();
  if (key === "r" || key === "R") {
    countdownSound?.stop(); phase = -1; previousPhase = -1; finished = false; return false;
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }

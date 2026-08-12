const NOTES = [
  { name: "ド", midi: 60, eye: 0, color: "#e53935" },
  { name: "レ", midi: 62, eye: 1, color: "#f28c28" },
  { name: "ミ", midi: 64, eye: 2, color: "#f2cf22" },
  { name: "レ", midi: 62, eye: 1, color: "#f28c28" },
  { name: "ド", midi: 60, eye: 0, color: "#e53935" },
  { name: "レ", midi: 62, eye: 1, color: "#f28c28" }
];

const STEP_MS = 620;
const REST_MS = 850;

let audioContext;
let masterGain;
let playing = false;
let stepIndex = -1;
let nextStepAt = 0;
let activeEye = -1;
let activeColor = "#111111";
let pulse = 0;
let hintAlpha = 255;
let blinkStartedAt = -9999;
const BLINK_MS = 180;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont("sans-serif");
}

function draw() {
  background(245, 245, 242);
  updateMusic();
  pulse *= 0.86;
  drawSoftBackdrop();
  drawMarpan(width * 0.5, height * 0.48);
  drawSequence();
  drawHint();
}

function updateMusic() {
  if (!playing || millis() < nextStepAt) return;

  if (stepIndex === NOTES.length - 1) {
    stepIndex = -1;
    activeEye = -1;
    blinkStartedAt = millis() + 90;
    nextStepAt = millis() + REST_MS;
    return;
  }

  stepIndex++;
  nextStepAt = millis() + STEP_MS;

  const note = NOTES[stepIndex];
  activeEye = note.eye;
  activeColor = note.color;
  pulse = 1;
  playBell(note.midi);
}

function drawSoftBackdrop() {
  noStroke();
  fill(226, 226, 221, 72);
  ellipse(width * 0.5, height * 0.76, min(width * 0.5, 520), min(width * 0.07, 58));
}

function drawMarpan(cx, cy) {
  const bodyW = min(width * 0.64, height * 0.78, 620);
  const bodyH = bodyW * 0.68;
  const lift = pulse * bodyH * 0.028;

  push();
  translate(cx, cy - lift);

  // White manju body.
  stroke(18);
  strokeWeight(max(5, bodyW * 0.012));
  strokeJoin(ROUND);
  fill(255);
  beginShape();
  vertex(-bodyW * 0.48, bodyH * 0.2);
  bezierVertex(-bodyW * 0.5, -bodyH * 0.25, -bodyW * 0.26, -bodyH * 0.5, 0, -bodyH * 0.5);
  bezierVertex(bodyW * 0.27, -bodyH * 0.5, bodyW * 0.5, -bodyH * 0.25, bodyW * 0.48, bodyH * 0.2);
  bezierVertex(bodyW * 0.46, bodyH * 0.46, bodyW * 0.25, bodyH * 0.5, 0, bodyH * 0.5);
  bezierVertex(-bodyW * 0.25, bodyH * 0.5, -bodyW * 0.46, bodyH * 0.46, -bodyW * 0.48, bodyH * 0.2);
  endShape(CLOSE);

  // One simple lower-right cel shadow, clipped visually inside the outline.
  noStroke();
  fill(216);
  beginShape();
  vertex(-bodyW * 0.405, bodyH * 0.37);
  bezierVertex(-bodyW * 0.08, bodyH * 0.47, bodyW * 0.29, bodyH * 0.43, bodyW * 0.455, bodyH * 0.14);
  bezierVertex(bodyW * 0.45, bodyH * 0.35, bodyW * 0.25, bodyH * 0.445, 0, bodyH * 0.445);
  bezierVertex(-bodyW * 0.2, bodyH * 0.445, -bodyW * 0.34, bodyH * 0.425, -bodyW * 0.405, bodyH * 0.37);
  endShape(CLOSE);

  drawEyes(bodyW, bodyH);
  pop();
}

function drawEyes(bodyW, bodyH) {
  const eyeW = bodyW * 0.135;
  const eyeH = eyeW * 1.08;
  const gap = eyeW * 0.82;
  const eyeY = -bodyH * 0.03;
  const blinkAge = millis() - blinkStartedAt;
  const isBlinking = blinkAge >= 0 && blinkAge <= BLINK_MS;
  const blinkAmount = isBlinking ? sin(map(blinkAge, 0, BLINK_MS, 0, PI)) : 0;
  const openScale = lerp(1, 0.07, blinkAmount);

  for (let i = 0; i < 3; i++) {
    const isActive = playing && i === activeEye;
    const eyePulse = isActive ? 1 + pulse * 0.16 : 1;
    const x = (i - 1) * gap;

    push();
    translate(x, eyeY);
    scale(eyePulse, eyePulse * openScale);
    noStroke();
    fill(isActive ? activeColor : "#111111");
    ellipse(0, 0, eyeW, eyeH);

    if (openScale > 0.3) {
      fill(255);
      ellipse(-eyeW * 0.19, -eyeH * 0.21, eyeW * 0.19, eyeW * 0.19);
    }
    pop();
  }
}

function drawSequence() {
  const y = min(height - 84, height * 0.86);
  const spacing = min(width * 0.105, 72);
  const startX = width * 0.5 - spacing * (NOTES.length - 1) * 0.5;

  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(constrain(width * 0.038, 17, 27));

  for (let i = 0; i < NOTES.length; i++) {
    const note = NOTES[i];
    const current = playing && i === stepIndex;
    noStroke();
    fill(current ? note.color : color(92, 92, 88, 95));
    text(note.name, startX + spacing * i, y);
  }
  textStyle(NORMAL);
}

function drawHint() {
  const message = playing
    ? "タップで いちじ停止　　Rで はじめから"
    : stepIndex < 0
      ? "タップして ドレミを はじめよう"
      : "タップして つづけよう";

  noStroke();
  fill(45, 45, 43, hintAlpha);
  textAlign(CENTER, CENTER);
  textSize(constrain(width * 0.026, 13, 17));
  text(message, width * 0.5, height - 30);
}

function togglePlayback() {
  ensureAudio();
  playing = !playing;
  hintAlpha = playing ? 120 : 255;
  if (playing) nextStepAt = millis() + 80;
}

function restartPiece() {
  ensureAudio();
  stepIndex = -1;
  activeEye = -1;
  pulse = 0;
  playing = true;
  nextStepAt = millis() + 80;
}

function ensureAudio() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextClass();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.22;
    masterGain.connect(audioContext.destination);
  }
  if (audioContext.state === "suspended") audioContext.resume();
}

function playBell(midi) {
  if (!audioContext || !masterGain) return;

  const now = audioContext.currentTime;
  const frequency = 440 * pow(2, (midi - 69) / 12);
  const envelope = audioContext.createGain();
  const panner = audioContext.createStereoPanner();
  panner.pan.value = map(midi, 60, 64, -0.28, 0.28);

  envelope.gain.setValueAtTime(0.0001, now);
  envelope.gain.exponentialRampToValueAtTime(0.72, now + 0.008);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.52);
  envelope.connect(panner);
  panner.connect(masterGain);

  const partials = [
    { ratio: 1, level: 1 },
    { ratio: 2.01, level: 0.18 },
    { ratio: 3.99, level: 0.05 }
  ];

  for (const partial of partials) {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency * partial.ratio;
    gain.gain.value = partial.level;
    oscillator.connect(gain);
    gain.connect(envelope);
    oscillator.start(now);
    oscillator.stop(now + 0.56);
  }
}

function activate() {
  togglePlayback();
  return false;
}

function mousePressed() {
  return activate();
}

function touchStarted() {
  return activate();
}

function keyPressed() {
  if (key === " ") return activate();
  if (key === "r" || key === "R") {
    restartPiece();
    return false;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

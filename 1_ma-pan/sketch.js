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

let marpan;
let marpanSound;
let playing = false;
let stepIndex = -1;
let nextStepAt = 0;
let hintAlpha = 255;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont("sans-serif");

  marpan = new Marpan({
    x: width * 0.5,
    y: height * 0.48,
    maxSize: 620
  });
  marpanSound = new MarpanSound();
}

function draw() {
  background(245, 245, 242);
  updateMusic();
  drawSoftBackdrop();

  marpan.setPosition(width * 0.5, height * 0.48);
  marpan.lookAt(mouseX, mouseY);
  marpan.update();
  marpan.draw();

  drawSequence();
  drawHint();
}

function updateMusic() {
  if (!playing || millis() < nextStepAt) return;

  if (stepIndex === NOTES.length - 1) {
    stepIndex = -1;
    marpan.clearLight();
    marpan.blink();
    nextStepAt = millis() + REST_MS;
    return;
  }

  stepIndex++;
  nextStepAt = millis() + STEP_MS;

  const note = NOTES[stepIndex];
  marpan.lightEye(note.eye, note.color);
  marpan.bounce();
  marpanSound.playMidi(note.midi, {
    pan: map(note.midi, 60, 64, -0.28, 0.28)
  });
}

function drawSoftBackdrop() {
  noStroke();
  fill(226, 226, 221, 72);
  ellipse(width * 0.5, height * 0.76, min(width * 0.5, 520), min(width * 0.07, 58));
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
  marpanSound.start();
  playing = !playing;
  hintAlpha = playing ? 120 : 255;
  if (playing) {
    nextStepAt = millis() + 80;
  } else {
    marpan.clearLight();
  }
}

function restartPiece() {
  marpanSound.start();
  stepIndex = -1;
  marpan.clearLight();
  playing = true;
  nextStepAt = millis() + 80;
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

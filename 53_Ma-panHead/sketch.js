const SOURCE_WIDTH = 887;
const SOURCE_HEIGHT = 1774;
const HEAD_BOTTOM_Y = 267;
const HEAD_WIDTHS = { small: 150, medium: 195, large: 240 };
const CONFETTI_COLORS = ["#ef476f", "#ffd166", "#06d6a0", "#118ab2", "#8f63d9", "#ff8c42"];

let portrait;
let marpan;
let currentExpression = "pupil";
let currentSize = "small";
let displayedHeadWidth = HEAD_WIDTHS.small;
let targetGazeX = SOURCE_WIDTH * 0.5;
let targetGazeY = SOURCE_HEIGHT * 0.2;
let tapCount = 0;
let lastHeadTapAt = -1000;
let confetti = [];

function preload() { portrait = loadImage("ma-pan-head.png"); }

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("canvas-wrap");
  pixelDensity(min(window.devicePixelRatio || 1, 2));
  imageMode(CORNER);
  marpan = new Marpan25D({ bodyColor: "#ffffff", expression: currentExpression, autoBlink: true });
  marpan.enableAutoBlink(2400, 4800);
  setupControls();
}

function draw() {
  background(255);
  const frame = getPortraitFrame();
  image(portrait, frame.x, frame.y, frame.w, frame.h);
  displayedHeadWidth = lerp(displayedHeadWidth, HEAD_WIDTHS[currentSize], 0.14);
  push();
  translate(frame.x, frame.y);
  scale(frame.scale);
  drawCleanNeckAndHead();
  updateAndDrawConfetti();
  pop();
}

function getPortraitFrame() {
  const scaleValue = min(width / SOURCE_WIDTH, height / SOURCE_HEIGHT) * 0.97;
  const w = SOURCE_WIDTH * scaleValue;
  const h = SOURCE_HEIGHT * scaleValue;
  return { x: (width - w) * 0.5, y: (height - h) * 0.5, w, h, scale: scaleValue };
}

function drawCleanNeckAndHead() {
  noStroke();
  fill(255);
  rect(312, 88, 264, 184);
  rect(432, 248, 24, 73);
  const bodyW = displayedHeadWidth;
  const bodyH = bodyW * 0.68;
  const centerY = HEAD_BOTTOM_Y - bodyH * 0.5;
  marpan.setExpression(currentExpression);
  marpan.lookAt(targetGazeX, targetGazeY);
  marpan.drawAt(444, centerY, { bodyWidth: bodyW, bodyHeight: bodyH });
  if (currentExpression === "crying") drawTears(444, centerY, bodyW, bodyH);
}

function drawTears(cx, cy, bodyW, bodyH) {
  const fall = (millis() * 0.00045) % 1;
  drawTear(cx - bodyW * 0.17, cy + bodyH * (0.13 + fall * 0.25), bodyW * 0.033);
  drawTear(cx + bodyW * 0.17, cy + bodyH * (0.13 + ((fall + 0.5) % 1) * 0.25), bodyW * 0.033);
}

function drawTear(x, y, size) {
  noStroke();
  fill(60, 166, 226, 220);
  beginShape();
  vertex(x, y - size);
  bezierVertex(x + size * 0.75, y, x + size * 0.48, y + size, x, y + size);
  bezierVertex(x - size * 0.48, y + size, x - size * 0.75, y, x, y - size);
  endShape(CLOSE);
}

function setupControls() {
  document.querySelectorAll("[data-expression]").forEach((button) => button.addEventListener("click", () => {
    currentExpression = button.dataset.expression;
    marpan.setExpression(currentExpression);
    marpan.bounce(0.25);
    setActiveButton("[data-expression]", button);
  }));
  document.querySelectorAll("[data-size]").forEach((button) => button.addEventListener("click", () => {
    currentSize = button.dataset.size;
    marpan.bounce(0.18);
    setActiveButton("[data-size]", button);
  }));
}

function setActiveButton(selector, selected) {
  document.querySelectorAll(selector).forEach((button) => {
    const active = button === selected;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function setTarget(screenX, screenY) {
  const frame = getPortraitFrame();
  targetGazeX = (screenX - frame.x) / frame.scale;
  targetGazeY = (screenY - frame.y) / frame.scale;
  document.body.classList.add("has-moved");
}

function isInsideHead(screenX, screenY) {
  const frame = getPortraitFrame();
  const x = (screenX - frame.x) / frame.scale;
  const y = (screenY - frame.y) / frame.scale;
  const bodyH = displayedHeadWidth * 0.68;
  const centerY = HEAD_BOTTOM_Y - bodyH * 0.5;
  const nx = (x - 444) / (displayedHeadWidth * 0.5);
  const ny = (y - centerY) / (bodyH * 0.5);
  return nx * nx + ny * ny <= 1.08;
}

function registerHeadTap() {
  if (!isInsideHead(mouseX, mouseY)) { tapCount = 0; return; }
  const now = millis();
  tapCount = now - lastHeadTapAt <= 650 ? tapCount + 1 : 1;
  lastHeadTapAt = now;
  marpan.bounce(0.24);
  if (tapCount >= 3) { launchConfetti(); tapCount = 0; }
}

function launchConfetti() {
  const topY = HEAD_BOTTOM_Y - displayedHeadWidth * 0.68;
  for (let i = 0; i < 90; i++) confetti.push({ x: 444 + random(-displayedHeadWidth * 0.18, displayedHeadWidth * 0.18), y: topY + random(-8, 7), vx: random(-3.7, 3.7), vy: random(-8.5, -3.1), gravity: random(0.12, 0.2), size: random(4, 9), angle: random(TWO_PI), spin: random(-0.22, 0.22), color: random(CONFETTI_COLORS), life: 255 });
}

function updateAndDrawConfetti() {
  for (let i = confetti.length - 1; i >= 0; i--) {
    const piece = confetti[i];
    piece.x += piece.vx;
    piece.y += piece.vy;
    piece.vy += piece.gravity;
    piece.vx *= 0.995;
    piece.angle += piece.spin;
    piece.life -= 2.2;
    push();
    translate(piece.x, piece.y);
    rotate(piece.angle);
    noStroke();
    const pieceColor = color(piece.color);
    pieceColor.setAlpha(constrain(piece.life, 0, 255));
    fill(pieceColor);
    rectMode(CENTER);
    rect(0, 0, piece.size, piece.size * 0.58, 1);
    pop();
    if (piece.life <= 0 || piece.y > SOURCE_HEIGHT) confetti.splice(i, 1);
  }
}

function mouseMoved() { setTarget(mouseX, mouseY); }
function mouseDragged() { setTarget(mouseX, mouseY); return false; }
function mousePressed() { setTarget(mouseX, mouseY); registerHeadTap(); return false; }
function touchMoved() { setTarget(mouseX, mouseY); return false; }
function touchStarted() { setTarget(mouseX, mouseY); registerHeadTap(); return false; }
function windowResized() { resizeCanvas(windowWidth, windowHeight); }

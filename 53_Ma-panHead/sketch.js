const SOURCE_WIDTH = 887;
const SOURCE_HEIGHT = 1774;

// Generated portrait-space coordinates. All drawing is transformed with the image.
const HEAD = { x: 444, y: 216, w: 150, h: 102 };
const EYES = [
  { x: 414, y: 216 },
  { x: 444, y: 216 },
  { x: 474, y: 216 }
];

let portrait;
let gazeX = 0;
let gazeY = 0;
let targetGazeX = 0;
let targetGazeY = 0;
let nextBlinkAt = 0;
let blinkStartedAt = -1;

function preload() {
  portrait = loadImage("ma-pan-head.png");
}

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("canvas-wrap");
  pixelDensity(min(window.devicePixelRatio || 1, 2));
  imageMode(CORNER);
  targetGazeX = width * 0.5;
  targetGazeY = height * 0.5;
  nextBlinkAt = millis() + random(2200, 4400);
}

function draw() {
  background(255);
  const frame = getPortraitFrame();
  image(portrait, frame.x, frame.y, frame.w, frame.h);

  updateGaze(frame);
  updateBlink();

  push();
  translate(frame.x, frame.y);
  scale(frame.scale);
  drawAnimatedHead();
  pop();
}

function getPortraitFrame() {
  const scaleValue = min(width / SOURCE_WIDTH, height / SOURCE_HEIGHT) * 0.97;
  const w = SOURCE_WIDTH * scaleValue;
  const h = SOURCE_HEIGHT * scaleValue;
  return {
    x: (width - w) * 0.5,
    y: (height - h) * 0.5,
    w,
    h,
    scale: scaleValue
  };
}

function updateGaze(frame) {
  const headScreenX = frame.x + HEAD.x * frame.scale;
  const headScreenY = frame.y + HEAD.y * frame.scale;
  const dx = targetGazeX - headScreenX;
  const dy = targetGazeY - headScreenY;
  const distanceValue = max(1, sqrt(dx * dx + dy * dy));
  const strength = min(1, distanceValue / 95);

  const wantedX = (dx / distanceValue) * strength;
  const wantedY = (dy / distanceValue) * strength;
  gazeX = lerp(gazeX, wantedX, 0.12);
  gazeY = lerp(gazeY, wantedY, 0.12);
}

function updateBlink() {
  if (blinkStartedAt < 0 && millis() >= nextBlinkAt) startBlink();
  if (blinkStartedAt >= 0 && millis() - blinkStartedAt > 300) {
    blinkStartedAt = -1;
    nextBlinkAt = millis() + random(2400, 5200);
  }
}

function blinkAmount() {
  if (blinkStartedAt < 0) return 0;
  const t = (millis() - blinkStartedAt) / 300;
  if (t < 0.36) return easeInOut(t / 0.36);
  if (t < 0.58) return 1;
  return 1 - easeInOut((t - 0.58) / 0.42);
}

function easeInOut(t) {
  const clamped = constrain(t, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

function startBlink() {
  if (blinkStartedAt < 0) blinkStartedAt = millis();
}

function drawAnimatedHead() {
  // Erase the generated head and all skin at the neck before redrawing them.
  noStroke();
  fill(255);
  rect(365, 138, 158, 135);

  // The neck is deliberately pure white: no skin color remains visible.
  stroke(205);
  strokeWeight(1.2);
  fill(255);
  quad(432, 254, 456, 254, 456, 321, 432, 321);

  // Canonical Ma-pan outline: body height is 68% of its width.
  const bodyW = HEAD.w;
  const bodyH = HEAD.h;
  const cx = HEAD.x;
  const cy = HEAD.y;
  const waist = bodyH * 0.2;

  stroke(18);
  strokeWeight(2.2);
  strokeJoin(ROUND);
  fill(255);
  beginShape();
  vertex(cx, cy - bodyH * 0.5);
  bezierVertex(cx + bodyW * 0.27, cy - bodyH * 0.5, cx + bodyW * 0.5, cy - bodyH * 0.25, cx + bodyW * 0.48, cy + waist);
  bezierVertex(cx + bodyW * 0.46, cy + bodyH * 0.46, cx + bodyW * 0.25, cy + bodyH * 0.5, cx, cy + bodyH * 0.5);
  bezierVertex(cx - bodyW * 0.25, cy + bodyH * 0.5, cx - bodyW * 0.46, cy + bodyH * 0.46, cx - bodyW * 0.48, cy + waist);
  bezierVertex(cx - bodyW * 0.5, cy - bodyH * 0.25, cx - bodyW * 0.26, cy - bodyH * 0.5, cx, cy - bodyH * 0.5);
  endShape(CLOSE);

  const closed = blinkAmount();
  for (const eye of EYES) drawEye(eye.x, eye.y, closed);
}

function drawEye(x, y, closed) {
  const eyeW = 28.5;
  const eyeH = max(1.5, 30.8 * (1 - closed));

  stroke(46, 46, 46);
  strokeWeight(1.15);
  fill(249);
  ellipse(x, y, eyeW, eyeH);

  if (closed > 0.78) return;

  const pupilScaleY = max(0.15, 1 - closed);
  noStroke();
  fill(22);
  ellipse(
    x + gazeX * 5.6,
    y + gazeY * 5.1,
    14.8,
    14.8 * pupilScaleY
  );
}

function setTarget(x, y) {
  targetGazeX = constrain(x, 0, width);
  targetGazeY = constrain(y, 0, height);
  document.body.classList.add("has-moved");
}

function mouseMoved() {
  setTarget(mouseX, mouseY);
}

function mouseDragged() {
  setTarget(mouseX, mouseY);
  return false;
}

function mousePressed() {
  setTarget(mouseX, mouseY);
  startBlink();
  return false;
}

function touchMoved() {
  setTarget(mouseX, mouseY);
  return false;
}

function touchStarted() {
  setTarget(mouseX, mouseY);
  startBlink();
  return false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

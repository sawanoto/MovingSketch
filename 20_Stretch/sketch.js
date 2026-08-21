let marpan;
let targetX;
let targetY;
let smoothX;
let smoothY;
let stretch = 0;

const MAX_STRETCH = 0.18;
const SIDE_COMPRESSION = 0.035;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont("sans-serif");
  marpan = new Marpan25D({ maxSize: 440 });
  marpan.enableAutoBlink(2300, 4200);
  targetX = smoothX = width * 0.72;
  targetY = smoothY = height * 0.27;
}

function draw() {
  drawBackground();

  const cx = width * 0.5;
  const cy = height * 0.59;
  marpan.maxSize = min(440, width * 0.68, height * 0.72);
  const bodyW = marpan.getBodyWidth();
  const bodyH = marpan.getBodyHeight(bodyW);

  smoothX = lerp(smoothX, targetX, 0.12);
  smoothY = lerp(smoothY, targetY, 0.12);

  let dx = smoothX - cx;
  let dy = smoothY - cy;
  const distance = max(1, sqrt(dx * dx + dy * dy));
  const ux = dx / distance;
  const uy = dy / distance;

  // Close targets need no stretch; far targets gently approach the safe limit.
  const desiredStretch = map(
    constrain(distance, bodyW * 0.35, bodyW * 1.25),
    bodyW * 0.35,
    bodyW * 1.25,
    0.025,
    MAX_STRETCH
  );
  stretch = lerp(stretch, desiredStretch, 0.075);

  drawHeading();
  drawGroundShadow(cx, cy, bodyW, bodyH, ux, uy);
  drawStretchedMarpan(cx, cy, bodyW, bodyH, ux, uy);
  drawBerry(smoothX, smoothY, bodyW);
  drawGuide();
}

function drawStretchedMarpan(cx, cy, bodyW, bodyH, ux, uy) {
  const along = 1 + stretch;
  const across = 1 - stretch * SIDE_COMPRESSION / MAX_STRETCH;

  // Directional scale matrix: stretch along the pointer direction while
  // keeping the opposite side almost anchored in place.
  const a = across + (along - across) * ux * ux;
  const b = (along - across) * ux * uy;
  const c = b;
  const d = across + (along - across) * uy * uy;
  const reach = stretch * bodyW * 0.22;
  const eyeReach = map(stretch, 0, MAX_STRETCH, 0.018, 0.045);

  push();
  translate(cx + ux * reach, cy + uy * reach);
  applyMatrix(a, b, c, d, 0, 0);
  marpan.lookAt(ux * bodyW, uy * bodyH);
  marpan.drawAt(0, 0, {
    bodyWidth: bodyW,
    bodyHeight: bodyH,
    lookX: ux * bodyW,
    lookY: uy * bodyH,
    eyeGroupOffsetX: ux * bodyW * eyeReach,
    eyeGroupOffsetY: uy * bodyH * eyeReach
  });
  pop();
}

function drawGroundShadow(cx, cy, bodyW, bodyH, ux, uy) {
  noStroke();
  fill(72, 64, 48, 30);
  const lean = abs(ux) * stretch;
  ellipse(
    cx + ux * bodyW * stretch * 0.08,
    cy + bodyH * 0.54,
    bodyW * (0.6 + lean * 0.3),
    max(9, bodyH * 0.075)
  );
}

function drawBerry(x, y, bodyW) {
  const size = constrain(bodyW * 0.075, 22, 34);
  const bob = sin(millis() * 0.004) * 3;
  push();
  translate(x, y + bob);
  rotate(-0.18);
  noStroke();
  fill(82, 139, 73);
  ellipse(size * 0.12, -size * 0.55, size * 0.5, size * 0.24);
  stroke(54, 91, 48);
  strokeWeight(2);
  line(0, -size * 0.35, size * 0.08, -size * 0.68);
  noStroke();
  fill(218, 64, 62);
  ellipse(0, 0, size, size * 1.08);
  fill(255, 184);
  ellipse(-size * 0.19, -size * 0.22, size * 0.18);
  pop();
}

function drawBackground() {
  background(243, 238, 224);
  noStroke();
  fill(214, 226, 199, 80);
  ellipse(width * 0.14, height * 0.18, 270, 270);
  ellipse(width * 0.87, height * 0.24, 340, 340);
  fill(197, 213, 178, 115);
  rect(0, height * 0.85, width, height * 0.15);
}

function drawHeading() {
  noStroke();
  fill(55, 52, 42, 165);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(constrain(width * 0.03, 16, 23));
  text("もうちょっとで届きそう", width * 0.5, 36);
  textStyle(NORMAL);
}

function drawGuide() {
  noStroke();
  fill(55, 52, 42, 125);
  textAlign(CENTER, CENTER);
  textSize(constrain(width * 0.024, 12, 15));
  text("マウスで赤い実を動かしてみよう", width * 0.5, height - 27);
}

function updateTarget(x, y) {
  targetX = constrain(x, 18, width - 18);
  targetY = constrain(y, 62, height - 48);
}

function mouseMoved() {
  updateTarget(mouseX, mouseY);
}

function mouseDragged() {
  updateTarget(mouseX, mouseY);
  return false;
}

function touchStarted() {
  if (touches.length > 0) updateTarget(touches[0].x, touches[0].y);
  return false;
}

function touchMoved() {
  if (touches.length > 0) updateTarget(touches[0].x, touches[0].y);
  return false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  targetX = constrain(targetX, 18, width - 18);
  targetY = constrain(targetY, 62, height - 48);
}

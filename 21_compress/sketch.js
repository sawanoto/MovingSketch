let marpan;
let targetX;
let targetY;
let smoothX;
let smoothY;
let fear = 0;
let recoilX = 0;
let recoilY = 0;
let worried = false;

const BACKGROUND_COLOR = "#dfe5da";
const MAX_RECOIL = 34;
const MAX_COMPRESSION = 0.075;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont("sans-serif");
  marpan = new Marpan25D({ maxSize: 440 });
  marpan.enableAutoBlink(2100, 3900);
  targetX = smoothX = width * 0.18;
  targetY = smoothY = height * 0.35;
}

function draw() {
  drawBackground();

  const homeX = width * 0.5;
  const homeY = height * 0.59;
  marpan.maxSize = min(440, width * 0.68, height * 0.72);
  const bodyW = marpan.getBodyWidth();
  const bodyH = marpan.getBodyHeight(bodyW);

  smoothX = lerp(smoothX, targetX, 0.14);
  smoothY = lerp(smoothY, targetY, 0.14);

  const homeDx = smoothX - homeX;
  const homeDy = smoothY - homeY;
  const distance = max(1, sqrt(homeDx * homeDx + homeDy * homeDy));
  const ux = homeDx / distance;
  const uy = homeDy / distance;
  const dangerRange = bodyW * 1.05;
  const desiredFear = 1 - constrain((distance - bodyW * 0.35) / dangerRange, 0, 1);
  fear = lerp(fear, desiredFear, desiredFear > fear ? 0.11 : 0.055);
  updateExpression();

  recoilX = lerp(recoilX, -ux * MAX_RECOIL * fear, 0.1);
  recoilY = lerp(recoilY, -uy * MAX_RECOIL * 0.5 * fear, 0.1);
  const cx = homeX + recoilX;
  const cy = homeY + recoilY;

  drawHeading();
  drawGroundShadow(cx, cy, bodyW, bodyH, fear);
  drawCompressedMarpan(cx, cy, bodyW, bodyH, ux, uy);
  drawNastyThing(smoothX, smoothY, bodyW);
  drawGuide();
}

function updateExpression() {
  const shouldWorry = worried ? fear > 0.1 : fear > 0.18;
  if (shouldWorry === worried) return;
  worried = shouldWorry;
  if (worried) {
    marpan.setExpression("worried");
    marpan.bounce(0.28);
  } else {
    marpan.setExpression("pupil");
  }
}

function drawCompressedMarpan(cx, cy, bodyW, bodyH, ux, uy) {
  const along = 1 - MAX_COMPRESSION * fear;
  const across = 1 + 0.018 * fear;
  const a = across + (along - across) * ux * ux;
  const b = (along - across) * ux * uy;
  const c = b;
  const d = across + (along - across) * uy * uy;

  push();
  translate(cx, cy);
  applyMatrix(a, b, c, d, 0, 0);
  marpan.drawAt(0, 0, {
    bodyWidth: bodyW,
    bodyHeight: bodyH,
    lookX: ux * bodyW,
    lookY: uy * bodyH,
    eyeGroupOffsetX: -ux * bodyW * fear * 0.018,
    eyeGroupOffsetY: -uy * bodyH * fear * 0.018,
    dentDirectionX: ux,
    dentDirectionY: uy,
    dentAmount: fear
  });
  pop();
}

function drawGroundShadow(cx, cy, bodyW, bodyH, amount) {
  noStroke();
  fill(55, 63, 51, 30);
  ellipse(cx, cy + bodyH * 0.54, bodyW * (0.61 - amount * 0.025), max(9, bodyH * 0.075));
}

function drawNastyThing(x, y, bodyW) {
  const size = constrain(bodyW * 0.09, 29, 42);
  const wobble = sin(millis() * 0.013) * 0.09;
  push();
  translate(x, y);
  rotate(wobble);
  stroke(48, 39, 52);
  strokeWeight(max(2, size * 0.07));
  fill(117, 78, 133);
  beginShape();
  for (let i = 0; i < 16; i++) {
    const angle = TWO_PI * i / 16;
    const radius = i % 2 === 0 ? size * 0.68 : size * 0.44;
    vertex(cos(angle) * radius, sin(angle) * radius);
  }
  endShape(CLOSE);
  fill(30);
  noStroke();
  ellipse(-size * 0.17, -size * 0.08, size * 0.13);
  ellipse(size * 0.17, -size * 0.08, size * 0.13);
  stroke(30);
  strokeWeight(max(2, size * 0.06));
  line(-size * 0.2, size * 0.2, size * 0.2, size * 0.2);
  pop();
}

function drawBackground() {
  background(BACKGROUND_COLOR);
  noStroke();
  fill(190, 204, 184, 72);
  for (let i = 0; i < 7; i++) {
    const x = width * (0.06 + i * 0.16);
    ellipse(x, height * 0.2, 150, 330);
  }
  fill(183, 197, 175, 110);
  rect(0, height * 0.85, width, height * 0.15);
}

function drawHeading() {
  noStroke();
  fill(49, 56, 47, 165);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(constrain(width * 0.03, 16, 23));
  text("それ以上、近づかないで", width * 0.5, 36);
  textStyle(NORMAL);
}

function drawGuide() {
  noStroke();
  fill(49, 56, 47, 125);
  textAlign(CENTER, CENTER);
  textSize(constrain(width * 0.024, 12, 15));
  text("マウスで嫌なものを近づけてみよう", width * 0.5, height - 27);
}

function updateTarget(x, y) {
  targetX = constrain(x, 20, width - 20);
  targetY = constrain(y, 64, height - 48);
}

function mouseMoved() { updateTarget(mouseX, mouseY); }
function mouseDragged() { updateTarget(mouseX, mouseY); return false; }
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
  targetX = constrain(targetX, 20, width - 20);
  targetY = constrain(targetY, 64, height - 48);
}

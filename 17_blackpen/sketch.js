const CLICKS_TO_BLACK = 5;

let marpan;
let inkMarks = [];
let paintCount = 0;
let pointerX;
let pointerY;
let inkPulse = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont("sans-serif");
  marpan = new Marpan25D({ maxSize: 440 });
  marpan.enableAutoBlink(2200, 4200);
  pointerX = width * 0.78;
  pointerY = height * 0.3;
}

function draw() {
  background(243, 241, 236);
  drawPaperTexture();

  const cx = width * 0.5;
  const cy = height * 0.52;
  const bodyW = marpan.getBodyWidth();
  const bodyH = marpan.getBodyHeight(bodyW);
  const hovering = touchesBody(pointerX, pointerY, cx, cy, bodyW, bodyH);
  inkPulse *= 0.88;

  drawHeading();
  drawGroundShadow(cx, cy, bodyW, bodyH);
  drawPaintedMarpan(cx, cy, bodyW, bodyH);
  drawProgress();
  drawBlackPen(pointerX, pointerY, hovering);
  drawGuide(hovering);
}

function drawPaintedMarpan(cx, cy, bodyW, bodyH) {
  marpan.updateAutoBlink();
  marpan.setPosition(cx, cy);
  marpan.lookAt(pointerX, pointerY);

  marpan.drawBody(cx, cy, bodyW, bodyH, 0, "#ffffff");
  marpan.beginClip(cx, cy, bodyW, bodyH, 0);

  noStroke();
  if (paintCount >= CLICKS_TO_BLACK) {
    fill(15, 16, 17);
    rect(cx - bodyW * 0.55, cy - bodyH * 0.56, bodyW * 1.1, bodyH * 1.12);
  } else {
    for (const mark of inkMarks) {
      const x = cx + mark.nx * bodyW;
      const y = cy + mark.ny * bodyH;
      fill(12, 13, 14, mark.alpha);
      ellipse(x, y, mark.radius * bodyW, mark.radius * bodyW * mark.squash);
    }
  }

  marpan.drawEyes(cx, cy, bodyW, bodyH, 0, pointerX - cx, pointerY - cy);
  drawingContext.restore();
}

function addInk(x, y) {
  if (paintCount >= CLICKS_TO_BLACK) return;
  const cx = width * 0.5;
  const cy = height * 0.52;
  const bodyW = marpan.getBodyWidth();
  const bodyH = marpan.getBodyHeight(bodyW);

  paintCount++;
  const baseX = (x - cx) / bodyW;
  const baseY = (y - cy) / bodyH;
  for (let i = 0; i < 16; i++) {
    const angle = random(TWO_PI);
    const distance = random(0.015, 0.105);
    inkMarks.push({
      nx: baseX + cos(angle) * distance,
      ny: baseY + sin(angle) * distance,
      radius: random(0.055, 0.14),
      squash: random(0.72, 1.18),
      alpha: random(205, 255)
    });
  }
  inkPulse = 1;
  marpan.bounce(0.45);
}

function touchesBody(x, y, cx, cy, bodyW, bodyH) {
  const nx = (x - cx) / (bodyW * 0.49);
  const ny = (y - cy) / (bodyH * 0.52);
  return nx * nx + ny * ny <= 1;
}

function drawPaperTexture() {
  noStroke();
  for (let i = 0; i < 90; i++) {
    const x = noise(i * 12.7) * width;
    const y = noise(i * 8.3, 4) * height;
    fill(65, 61, 54, 7);
    circle(x, y, 1.4);
  }
}

function drawHeading() {
  noStroke(); fill(45, 44, 41, 165); textAlign(CENTER, CENTER); textStyle(BOLD);
  textSize(constrain(width * 0.03, 16, 23));
  text("黒マーパンを塗ってみよう", width * 0.5, 36);
  textStyle(NORMAL);
}

function drawGroundShadow(cx, cy, bodyW, bodyH) {
  noStroke(); fill(55, 52, 47, 25);
  ellipse(cx, cy + bodyH * 0.54, bodyW * 0.6, max(8, bodyH * 0.065));
}

function drawProgress() {
  const progress = constrain(paintCount / CLICKS_TO_BLACK, 0, 1);
  const barW = min(width * 0.46, 360);
  const barH = 8;
  const x = width * 0.5 - barW * 0.5;
  const y = height - 52;
  noStroke(); fill(45, 44, 41, 28); rect(x, y, barW, barH, 4);
  fill(20, 21, 22, 205); rect(x, y, barW * progress, barH, 4);
  fill(55, 53, 48, 125); textAlign(CENTER, BOTTOM); textSize(11);
  text(paintCount >= CLICKS_TO_BLACK ? "BLACK MA-PAN" : `${round(progress * 100)}%`, width * 0.5, y - 6);
}

function drawBlackPen(tipX, tipY, hovering) {
  const angle = -0.68;
  const penLength = constrain(min(width, height) * 0.24, 120, 205);
  const penWidth = constrain(penLength * 0.095, 13, 20);

  push();
  translate(tipX, tipY);
  rotate(angle);

  noStroke();
  fill(18, 19, 20);
  triangle(0, 0, penWidth * 0.65, -penWidth * 0.5, penWidth * 0.65, penWidth * 0.5);
  fill(hovering ? 40 : 30);
  rect(penWidth * 0.62, -penWidth * 0.5, penLength, penWidth, penWidth * 0.2);
  fill(70, 72, 73);
  rect(penLength * 0.7, -penWidth * 0.5, penLength * 0.18, penWidth);
  fill(12);
  rect(penLength + penWidth * 0.35, -penWidth * 0.5, penWidth * 0.45, penWidth, 3);

  stroke(225, 225, 220, 95); strokeWeight(1.5);
  line(penWidth * 1.4, -penWidth * 0.22, penLength * 0.65, -penWidth * 0.22);
  pop();

  if (hovering && inkPulse > 0.02) {
    noFill(); stroke(15, 15, 15, inkPulse * 120); strokeWeight(2);
    circle(tipX, tipY, 18 + (1 - inkPulse) * 26);
  }
}

function drawGuide(hovering) {
  let message = "黒ペンをマーパンへ近づけよう";
  if (paintCount >= CLICKS_TO_BLACK) message = "黒マーパンの完成！　R：やり直す";
  else if (hovering) message = "クリックして黒く塗ろう";
  noStroke(); fill(55, 53, 48, 125); textAlign(CENTER, CENTER); textSize(13);
  text(message, width * 0.5, height - 24);
}

function updatePointer() { pointerX = mouseX; pointerY = mouseY; }
function mouseMoved() { updatePointer(); }
function mouseDragged() { updatePointer(); return false; }
function mousePressed() {
  updatePointer();
  const bodyW = marpan.getBodyWidth();
  const bodyH = marpan.getBodyHeight(bodyW);
  if (touchesBody(pointerX, pointerY, width * 0.5, height * 0.52, bodyW, bodyH)) addInk(pointerX, pointerY);
  return false;
}
function touchMoved() { updatePointer(); return false; }
function touchStarted() { return mousePressed(); }
function keyPressed() {
  if (key === "r" || key === "R") { inkMarks = []; paintCount = 0; return false; }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  pointerX = constrain(pointerX, 0, width);
  pointerY = constrain(pointerY, 0, height);
}

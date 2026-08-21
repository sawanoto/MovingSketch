const PALETTE = [
  "#151617", "#ef476f", "#f28c28", "#ffd23f", "#4ecb71",
  "#36a9e1", "#6761d7", "#d967c7", "#ffffff"
];

let marpan;
let selectedColor = 1;
let tool = "pen";
let paintLayer;
let bodyMask;
let pointerX;
let pointerY;
let painting = false;
let lastPaintX = null;
let lastPaintY = null;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont("sans-serif");
  marpan = new Marpan25D({ maxSize: 410 });
  marpan.enableAutoBlink(2400, 4500);
  paintLayer = createGraphics(512, 348);
  paintLayer.pixelDensity(1);
  paintLayer.clear();
  bodyMask = createBodyMask(512, 348);
  pointerX = width * 0.75;
  pointerY = height * 0.28;
}

function draw() {
  background(246, 243, 236);
  drawBackdrop();

  const g = geometry();
  drawHeading();
  drawGroundShadow(g);
  drawColoredMarpan(g);
  drawToolbar();
  drawPalette();
  drawCursor();
}

function geometry() {
  const bodyW = min(width * 0.58, height * 0.51, 410);
  return { cx: width * 0.5, cy: height * 0.43, bodyW, bodyH: bodyW * 0.68 };
}

function drawColoredMarpan(g) {
  marpan.updateAutoBlink();
  marpan.setPosition(g.cx, g.cy);
  marpan.lookAt(pointerX, pointerY);
  marpan.drawBody(g.cx, g.cy, g.bodyW, g.bodyH, 0, "#ffffff");
  marpan.beginClip(g.cx, g.cy, g.bodyW, g.bodyH, 0);
  image(paintLayer, g.cx - g.bodyW * 0.5, g.cy - g.bodyH * 0.5, g.bodyW, g.bodyH);

  marpan.drawEyes(g.cx, g.cy, g.bodyW, g.bodyH, 0, pointerX - g.cx, pointerY - g.cy);
  drawingContext.restore();
  // 着色より手前に正しい外周線を描き直す。
  marpan.drawBody(g.cx, g.cy, g.bodyW, g.bodyH, 0, null);
}

function createBodyMask(maskWidth, maskHeight) {
  const mask = createGraphics(maskWidth, maskHeight);
  mask.pixelDensity(1);
  const cx = maskWidth * 0.5;
  const cy = maskHeight * 0.5;
  const bodyW = maskWidth;
  const bodyH = maskHeight;
  mask.clear();
  mask.noStroke();
  mask.fill(255);
  mask.beginShape();
  mask.vertex(cx, cy - bodyH * 0.5);
  mask.bezierVertex(cx + bodyW * 0.27, cy - bodyH * 0.5, cx + bodyW * 0.5, cy - bodyH * 0.25, cx + bodyW * 0.48, cy + bodyH * 0.2);
  mask.bezierVertex(cx + bodyW * 0.46, cy + bodyH * 0.46, cx + bodyW * 0.25, cy + bodyH * 0.5, cx, cy + bodyH * 0.5);
  mask.bezierVertex(cx - bodyW * 0.25, cy + bodyH * 0.5, cx - bodyW * 0.46, cy + bodyH * 0.46, cx - bodyW * 0.48, cy + bodyH * 0.2);
  mask.bezierVertex(cx - bodyW * 0.5, cy - bodyH * 0.25, cx - bodyW * 0.26, cy - bodyH * 0.5, cx, cy - bodyH * 0.5);
  mask.endShape(CLOSE);
  mask.loadPixels();
  return mask;
}

function addPaint(x, y) {
  const g = geometry();
  if (!touchesBody(x, y, g)) return;
  const distanceFromLast = lastPaintX === null ? Infinity : dist(x, y, lastPaintX, lastPaintY);
  if (distanceFromLast < max(4, g.bodyW * 0.018)) return;
  const point = toPaintCoordinates(x, y, g);
  paintLayer.stroke(PALETTE[selectedColor]);
  paintLayer.strokeWeight(24);
  paintLayer.strokeCap(ROUND);
  if (lastPaintX === null) {
    paintLayer.point(point.x, point.y);
  } else {
    const previous = toPaintCoordinates(lastPaintX, lastPaintY, g);
    paintLayer.line(previous.x, previous.y, point.x, point.y);
  }
  lastPaintX = x;
  lastPaintY = y;
}

function fillRegion(x, y) {
  const g = geometry();
  const start = toPaintCoordinates(x, y, g);
  floodFillPaintLayer(round(start.x), round(start.y), color(PALETTE[selectedColor]));
}

function toPaintCoordinates(x, y, g = geometry()) {
  return {
    x: map(x, g.cx - g.bodyW * 0.5, g.cx + g.bodyW * 0.5, 0, paintLayer.width),
    y: map(y, g.cy - g.bodyH * 0.5, g.cy + g.bodyH * 0.5, 0, paintLayer.height)
  };
}

function floodFillPaintLayer(startX, startY, fillColor) {
  const w = paintLayer.width;
  const h = paintLayer.height;
  if (startX < 0 || startX >= w || startY < 0 || startY >= h) return;

  paintLayer.loadPixels();
  const pixels = paintLayer.pixels;
  const startIndex = 4 * (startY * w + startX);
  const target = [pixels[startIndex], pixels[startIndex + 1], pixels[startIndex + 2], pixels[startIndex + 3]];
  const replacement = [red(fillColor), green(fillColor), blue(fillColor), 255];
  if (target.every((value, i) => abs(value - replacement[i]) < 2)) return;

  const matchesTarget = (index) =>
    abs(pixels[index] - target[0]) < 8 &&
    abs(pixels[index + 1] - target[1]) < 8 &&
    abs(pixels[index + 2] - target[2]) < 8 &&
    abs(pixels[index + 3] - target[3]) < 8;

  const insideBodyMask = (px, py) => bodyMask.pixels[(py * w + px) * 4 + 3] > 20;

  const stack = [[startX, startY]];
  const visited = new Uint8Array(w * h);
  while (stack.length) {
    const [px, py] = stack.pop();
    const pixelNumber = py * w + px;
    if (visited[pixelNumber]) continue;
    visited[pixelNumber] = 1;
    if (!insideBodyMask(px, py)) continue;
    const index = pixelNumber * 4;
    if (!matchesTarget(index)) continue;

    pixels[index] = replacement[0];
    pixels[index + 1] = replacement[1];
    pixels[index + 2] = replacement[2];
    pixels[index + 3] = replacement[3];

    if (px > 0) stack.push([px - 1, py]);
    if (px < w - 1) stack.push([px + 1, py]);
    if (py > 0) stack.push([px, py - 1]);
    if (py < h - 1) stack.push([px, py + 1]);
  }
  paintLayer.updatePixels();
}

function touchesBody(x, y, g) {
  const point = toPaintCoordinates(x, y, g);
  const px = floor(point.x);
  const py = floor(point.y);
  if (px < 0 || px >= bodyMask.width || py < 0 || py >= bodyMask.height) return false;
  return bodyMask.pixels[(py * bodyMask.width + px) * 4 + 3] > 20;
}

function drawBackdrop() {
  noStroke();
  for (let i = 0; i < 7; i++) {
    const c = color(PALETTE[i + 1]);
    fill(red(c), green(c), blue(c), 9);
    circle(width * (0.12 + i * 0.13), height * 0.18 + sin(i * 1.8) * 24, 120);
  }
}

function drawHeading() {
  noStroke(); fill(55, 52, 46, 170); textAlign(CENTER, CENTER); textStyle(BOLD);
  textSize(constrain(width * 0.03, 16, 23));
  text("マーパン・カラーリング", width * 0.5, 32);
  textStyle(NORMAL);
}

function drawGroundShadow(g) {
  noStroke(); fill(65, 60, 52, 24);
  ellipse(g.cx, g.cy + g.bodyH * 0.54, g.bodyW * 0.59, max(8, g.bodyH * 0.065));
}

function toolbarLayout() {
  const y = height - 116;
  const buttonW = constrain(width * 0.19, 78, 112);
  return {
    y, buttonW, buttonH: 38,
    penX: width * 0.5 - buttonW - 8,
    fillX: width * 0.5,
    resetX: width * 0.5 + buttonW + 8
  };
}

function drawToolbar() {
  const b = toolbarLayout();
  drawToolButton(b.penX, b.y, b.buttonW, b.buttonH, "ペン", tool === "pen");
  drawToolButton(b.fillX, b.y, b.buttonW, b.buttonH, "塗りつぶし", tool === "fill");
  drawToolButton(b.resetX, b.y, b.buttonW, b.buttonH, "リセット", false);
}

function drawToolButton(x, y, w, h, label, active) {
  rectMode(CENTER);
  stroke(active ? 25 : 150); strokeWeight(active ? 2.5 : 1.2);
  fill(active ? 225 : 255, active ? 222 : 255, active ? 214 : 255);
  rect(x, y, w, h, 19);
  noStroke(); fill(35); textAlign(CENTER, CENTER); textStyle(BOLD); textSize(13);
  text(label, x, y + 1);
  rectMode(CORNER); textStyle(NORMAL);
}

function paletteLayout() {
  const diameter = constrain((width - 42) / PALETTE.length - 5, 25, 38);
  const gap = min(diameter + 7, (width - 28) / PALETTE.length);
  return { diameter, gap, startX: width * 0.5 - gap * (PALETTE.length - 1) * 0.5, y: height - 52 };
}

function drawPalette() {
  const p = paletteLayout();
  for (let i = 0; i < PALETTE.length; i++) {
    const x = p.startX + i * p.gap;
    stroke(i === selectedColor ? 20 : 130);
    strokeWeight(i === selectedColor ? 4 : 1.5);
    fill(PALETTE[i]);
    circle(x, p.y, p.diameter);
  }
}

function handleControls(x, y) {
  const b = toolbarLayout();
  if (abs(y - b.y) <= b.buttonH * 0.6) {
    if (abs(x - b.penX) <= b.buttonW * 0.5) { tool = "pen"; return true; }
    if (abs(x - b.fillX) <= b.buttonW * 0.5) { tool = "fill"; return true; }
    if (abs(x - b.resetX) <= b.buttonW * 0.5) {
      paintLayer.clear(); return true;
    }
  }

  const p = paletteLayout();
  for (let i = 0; i < PALETTE.length; i++) {
    if (dist(x, y, p.startX + i * p.gap, p.y) <= p.diameter * 0.7) {
      selectedColor = i; return true;
    }
  }
  return false;
}

function drawCursor() {
  const current = color(PALETTE[selectedColor]);
  if (tool === "fill") {
    stroke(30); strokeWeight(2); fill(current);
    rect(pointerX - 10, pointerY - 9, 20, 18, 3);
    noStroke(); fill(40); textAlign(CENTER, CENTER); textSize(10); text("F", pointerX, pointerY + 1);
  } else {
    push(); translate(pointerX, pointerY); rotate(-0.7);
    noStroke(); fill(current); triangle(0, 0, 13, -6, 13, 6);
    fill(35); rect(12, -6, 82, 12, 3);
    fill(current); rect(25, -4, 46, 3, 2);
    pop();
  }
}

function updatePointer() { pointerX = mouseX; pointerY = mouseY; }
function mouseMoved() { updatePointer(); }
function mousePressed() {
  updatePointer();
  if (handleControls(pointerX, pointerY)) return false;
  const g = geometry();
  if (touchesBody(pointerX, pointerY, g)) {
    if (tool === "fill") fillRegion(pointerX, pointerY);
    else { painting = true; addPaint(pointerX, pointerY); }
  }
  return false;
}
function mouseDragged() {
  updatePointer();
  if (painting && tool === "pen") addPaint(pointerX, pointerY);
  return false;
}
function mouseReleased() { painting = false; lastPaintX = null; lastPaintY = null; }
function touchStarted() { return mousePressed(); }
function touchMoved() { return mouseDragged(); }
function touchEnded() { mouseReleased(); return false; }

function keyPressed() {
  if (key === "r" || key === "R") { paintLayer.clear(); return false; }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  pointerX = constrain(pointerX, 0, width);
  pointerY = constrain(pointerY, 0, height);
}

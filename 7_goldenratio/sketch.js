const PHI = (1 + Math.sqrt(5)) / 2;

let showBlueprint = true;
let targetX;
let targetY;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont("sans-serif");
  targetX = width * 0.5;
  targetY = height * 0.28;
}

function draw() {
  background(244, 240, 232);
  const g = goldenGeometry();

  drawTitle();
  drawGroundShadow(g);
  drawBody(g);
  drawEyes(g);

  if (showBlueprint) {
    drawBlueprint(g);
    drawLegend();
  }

  drawPointer();
  drawBlueprintButton();
}

function goldenGeometry() {
  const maxWidth = min(width * 0.7, 600);
  const maxHeight = min(height * 0.58, 370);
  const bodyW = min(maxWidth, maxHeight * PHI);
  const bodyH = bodyW / PHI;
  const left = width * 0.5 - bodyW * 0.5;
  const top = min(height * 0.25, height - bodyH - 125);

  // The three-eye group occupies 1/phi of the body height.
  // Each eye is 1/phi^4 of the body height; each gap is 1/phi^5.
  const eyeD = bodyH / Math.pow(PHI, 4);
  const eyeGap = bodyH / Math.pow(PHI, 5);
  const eyeGroupW = eyeD * 3 + eyeGap * 2;
  const minorRegionLeft = left + bodyH;
  const minorRegionWidth = bodyH / PHI;
  const eyeCenterX = minorRegionLeft + minorRegionWidth * 0.5;
  const eyeCenterY = top + bodyH / Math.pow(PHI, 2);
  const eyeStartX = eyeCenterX - eyeGroupW * 0.5 + eyeD * 0.5;

  return {
    left,
    top,
    bodyW,
    bodyH,
    cx: left + bodyW * 0.5,
    cy: top + bodyH * 0.5,
    eyeD,
    eyeGap,
    eyeGroupW,
    eyeCenterX,
    eyeCenterY,
    eyeStartX
  };
}

function drawBody(g) {
  stroke(20);
  strokeWeight(max(4, g.bodyH * 0.014));
  fill(221, 198, 151);
  ellipse(g.cx, g.cy, g.bodyW, g.bodyH);
}

function drawEyes(g) {
  const spacing = g.eyeD + g.eyeGap;

  for (let i = 0; i < 3; i++) {
    const x = g.eyeStartX + spacing * i;
    const y = g.eyeCenterY;
    const dx = targetX - x;
    const dy = targetY - y;
    const distance = max(1, sqrt(dx * dx + dy * dy));
    const strength = constrain(distance / (g.bodyH * 0.32), 0, 1);
    const pupilTravel = g.eyeD * 0.2;
    const pupilX = dx / distance * pupilTravel * strength;
    const pupilY = dy / distance * pupilTravel * strength;

    stroke(18);
    strokeWeight(max(1.5, g.eyeD * 0.045));
    fill(255);
    circle(x, y, g.eyeD);

    noStroke();
    fill(18);
    circle(x + pupilX, y + pupilY, g.eyeD * 0.38);
  }
}

function drawBlueprint(g) {
  push();
  noFill();
  stroke(103, 77, 43, 125);
  strokeWeight(1);

  // Golden rectangle and the exact ellipse used for the body.
  rect(g.left, g.top, g.bodyW, g.bodyH);
  ellipse(g.cx, g.cy, g.bodyW, g.bodyH);

  // Recursive golden-rectangle subdivisions.
  drawGoldenSubdivisions(g.left, g.top, g.bodyW, g.bodyH, 7);

  // Golden placement axes actually used by the eye group.
  line(g.eyeCenterX, g.top, g.eyeCenterX, g.top + g.bodyH);
  line(g.left, g.eyeCenterY, g.left + g.bodyW, g.eyeCenterY);

  const spacing = g.eyeD + g.eyeGap;
  for (let i = 0; i < 3; i++) {
    circle(g.eyeStartX + spacing * i, g.eyeCenterY, g.eyeD);
  }

  drawDimension(g.left, g.top - 14, g.left + g.bodyW, g.top - 14, "φ");
  drawDimension(g.left - 14, g.top, g.left - 14, g.top + g.bodyH, "1");
  pop();
}

function drawGoldenSubdivisions(x, y, w, h, count) {
  let direction = 0;
  for (let i = 0; i < count; i++) {
    if (w < 1 || h < 1) break;

    if (direction === 0) {
      rect(x, y, h, h);
      x += h;
      w -= h;
    } else if (direction === 1) {
      rect(x, y, w, w);
      y += w;
      h -= w;
    } else if (direction === 2) {
      rect(x + w - h, y, h, h);
      w -= h;
    } else {
      rect(x, y + h - w, w, w);
      h -= w;
    }
    direction = (direction + 1) % 4;
  }
}

function drawDimension(x1, y1, x2, y2, label) {
  line(x1, y1, x2, y2);
  if (abs(x2 - x1) > abs(y2 - y1)) {
    line(x1, y1 - 4, x1, y1 + 4);
    line(x2, y2 - 4, x2, y2 + 4);
  } else {
    line(x1 - 4, y1, x1 + 4, y1);
    line(x2 - 4, y2, x2 + 4, y2);
  }
  noStroke();
  fill(82, 61, 34, 190);
  textAlign(CENTER, CENTER);
  textSize(12);
  text(label, (x1 + x2) * 0.5, (y1 + y2) * 0.5 - 7);
  noFill();
  stroke(103, 77, 43, 125);
}

function drawGroundShadow(g) {
  noStroke();
  fill(83, 70, 48, 20);
  ellipse(g.cx, g.top + g.bodyH * 1.04, g.bodyW * 0.56, max(8, g.bodyH * 0.055));
}

function drawTitle() {
  noStroke();
  fill(43, 39, 33, 180);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(constrain(width * 0.03, 16, 24));
  text("GOLDEN OVAL  φ = 1.618…", width * 0.5, 30);
  textStyle(NORMAL);
}

function drawLegend() {
  const boxW = min(width - 28, 350);
  const x = 14;
  const y = 52;
  noStroke();
  fill(255, 253, 248, 226);
  rect(x, y, boxW, 82, 8);
  stroke(103, 77, 43, 65);
  noFill();
  rect(x, y, boxW, 82, 8);

  noStroke();
  fill(55, 47, 37, 210);
  textAlign(LEFT, TOP);
  textSize(11);
  text(
    "BODY  黄金長方形に内接する楕円（φ : 1）\n" +
    "EYES  直径 = 体高 ÷ φ⁴\n" +
    "GAP    間隔 = 体高 ÷ φ⁵\n" +
    "POINT  目の中心 = 縦横の黄金分割位置",
    x + 12,
    y + 9
  );
}

function drawPointer() {
  noFill();
  stroke(55, 47, 37, 65);
  strokeWeight(1.2);
  circle(targetX, targetY, 16);
  point(targetX, targetY);
}

function blueprintButtonBounds() {
  return { x: width * 0.5, y: height - 42, w: 142, h: 42 };
}

function drawBlueprintButton() {
  const b = blueprintButtonBounds();
  rectMode(CENTER);
  stroke(59, 51, 41, 150);
  strokeWeight(showBlueprint ? 2.5 : 1.3);
  fill(showBlueprint ? 221 : 255);
  rect(b.x, b.y, b.w, b.h, 21);
  rectMode(CORNER);
  noStroke();
  fill(40);
  textAlign(CENTER, CENTER);
  textSize(14);
  text(showBlueprint ? "図面  ON" : "図面  OFF", b.x, b.y + 1);
}

function toggleBlueprint(x, y) {
  const b = blueprintButtonBounds();
  if (abs(x - b.x) <= b.w * 0.5 && abs(y - b.y) <= b.h * 0.6) {
    showBlueprint = !showBlueprint;
    return true;
  }
  return false;
}

function mouseMoved() {
  targetX = mouseX;
  targetY = min(mouseY, height - 100);
}

function mousePressed() {
  return toggleBlueprint(mouseX, mouseY) ? false : undefined;
}

function touchMoved() {
  targetX = mouseX;
  targetY = min(mouseY, height - 100);
  return false;
}

function touchStarted() {
  return toggleBlueprint(mouseX, mouseY) ? false : undefined;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  targetX = constrain(targetX, 0, width);
  targetY = constrain(targetY, 0, height - 100);
}

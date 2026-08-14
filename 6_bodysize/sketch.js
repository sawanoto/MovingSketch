const SIZE_OPTIONS = [
  { label: "小", scale: 0.72 },
  { label: "中", scale: 0.92 },
  { label: "大", scale: 1.16 }
];

let marpans = [];
let selectedSize = 1;
let targetX;
let targetY;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont("sans-serif");
  targetX = width * 0.5;
  targetY = height * 0.28;
  createMarpans();
}

function createMarpans() {
  marpans = SIZE_OPTIONS.map(() => new Marpan({
    x: 0,
    y: 0,
    maxSize: 200,
    eyeStyle: "pupil",
    eyeScale: 1.42,
    showBodyShadow: false
  }));
  updateLayout();
}

function draw() {
  background(245, 245, 242);
  updateLayout();
  drawHeading();

  for (let i = 0; i < marpans.length; i++) {
    drawGroundShadow(i);
    marpans[i].lookAt(targetX, targetY);
    marpans[i].update();
    marpans[i].draw();
  }

  drawPointer();
  drawSizeButtons();
}

function updateLayout() {
  const baseSize = constrain(width / 4.15, 82, 220);
  const baselineY = min(height * 0.68, height - 150);

  for (let i = 0; i < marpans.length; i++) {
    marpans[i].maxSize = baseSize * SIZE_OPTIONS[i].scale;
    const bodyW = marpans[i].getBodyWidth();
    const bodyH = bodyW * 0.68;
    marpans[i].setPosition(
      width * (0.2 + i * 0.3),
      baselineY - bodyH * 0.5
    );
  }
}

function drawHeading() {
  noStroke();
  fill(45, 45, 43, 150);
  textAlign(CENTER, CENTER);
  textSize(constrain(width * 0.026, 13, 18));
  text("3体の目が、いっしょにマウスを追いかけます", width * 0.5, 34);
}

function drawGroundShadow(index) {
  const marpan = marpans[index];
  const bodyW = marpan.getBodyWidth();
  const bodyH = bodyW * 0.68;
  noStroke();
  fill(90, 90, 86, index === selectedSize ? 31 : 18);
  ellipse(marpan.x, marpan.y + bodyH * 0.53, bodyW * 0.62, max(7, bodyH * 0.09));
}

function drawPointer() {
  noFill();
  stroke(55, 55, 52, 70);
  strokeWeight(1.5);
  circle(targetX, targetY, 18);
  point(targetX, targetY);
}

function buttonLayout() {
  const widthPerButton = constrain((width - 64) / 3.5, 76, 118);
  const gap = min(widthPerButton * 1.18, (width - 32) / 3);
  return {
    buttonWidth: widthPerButton,
    buttonHeight: 48,
    gap,
    startX: width * 0.5 - gap,
    y: height - 56
  };
}

function drawSizeButtons() {
  const layout = buttonLayout();
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(17);

  for (let i = 0; i < SIZE_OPTIONS.length; i++) {
    const x = layout.startX + layout.gap * i;
    const active = i === selectedSize;
    stroke(active ? 18 : 145);
    strokeWeight(active ? 3 : 1.5);
    fill(active ? 232 : 255);
    rectMode(CENTER);
    rect(x, layout.y, layout.buttonWidth, layout.buttonHeight, 24);

    noStroke();
    fill(25);
    text(SIZE_OPTIONS[i].label, x, layout.y + 1);
  }
  rectMode(CORNER);
  textStyle(NORMAL);
}

function selectSize(x, y) {
  const layout = buttonLayout();
  for (let i = 0; i < SIZE_OPTIONS.length; i++) {
    const buttonX = layout.startX + layout.gap * i;
    if (
      abs(x - buttonX) <= layout.buttonWidth * 0.5 &&
      abs(y - layout.y) <= layout.buttonHeight * 0.6
    ) {
      selectedSize = i;
      marpans[i].bounce(0.75);
      return true;
    }
  }
  return false;
}

function mouseMoved() {
  targetX = mouseX;
  targetY = min(mouseY, height - 130);
}

function mousePressed() {
  return selectSize(mouseX, mouseY) ? false : undefined;
}

function touchMoved() {
  targetX = mouseX;
  targetY = min(mouseY, height - 130);
  return false;
}

function touchStarted() {
  return selectSize(mouseX, mouseY) ? false : undefined;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  targetX = constrain(targetX, 0, width);
  targetY = constrain(targetY, 0, height - 130);
  updateLayout();
}

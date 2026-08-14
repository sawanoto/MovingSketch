const ACTIONS = [
  { label: "まばたき", eyes: [0, 2] },
  { label: "三つ目瞬き", eyes: [0, 1, 2] },
  { label: "左ウインク", eyes: [0] },
  { label: "右ウインク", eyes: [2] }
];

let marpan;
let targetX;
let targetY;
let nextBlinkAt;
let selectedAction = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont("sans-serif");
  targetX = width * 0.5;
  targetY = height * 0.28;
  nextBlinkAt = millis() + random(2200, 4200);

  marpan = new Marpan({
    x: width * 0.5,
    y: height * 0.48,
    maxSize: 430,
    eyeStyle: "pupil",
    eyeScale: 1.42,
    showBodyShadow: false,
    fixedEyeIndices: [1],
    fixedEyeOffsets: { 1: { x: 0, y: 0.18 } }
  });
}

function draw() {
  background(245, 245, 242);
  updateLayout();
  updateAutomaticBlink();
  drawHeading();
  drawGroundShadow();

  marpan.lookAt(targetX, targetY);
  marpan.update();
  marpan.draw();

  drawPointer();
  drawActionButtons();
}

function updateLayout() {
  marpan.maxSize = min(430, width * 0.64, height * 0.6);
  marpan.setPosition(width * 0.5, height * 0.48);
}

function updateAutomaticBlink() {
  if (millis() < nextBlinkAt) return;

  if (random() < 0.72) {
    marpan.blink([0, 2]);
  } else {
    marpan.wink(random() < 0.5 ? 0 : 2);
  }
  nextBlinkAt = millis() + random(2300, 5000);
}

function drawHeading() {
  noStroke();
  fill(45, 45, 43, 165);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(constrain(width * 0.03, 16, 23));
  text("口はそのまま、左右の目だけまばたき", width * 0.5, 36);
  textStyle(NORMAL);
}

function drawGroundShadow() {
  const bodyW = marpan.getBodyWidth();
  const bodyH = marpan.getBodyHeight(bodyW);
  noStroke();
  fill(90, 90, 86, 22);
  ellipse(marpan.x, marpan.y + bodyH * 0.55, bodyW * 0.58, max(8, bodyH * 0.08));
}

function drawPointer() {
  noFill();
  stroke(55, 55, 52, 65);
  strokeWeight(1.2);
  circle(targetX, targetY, 16);
  point(targetX, targetY);
}

function buttonLayout() {
  const buttonWidth = constrain((width - 44) / 4.35, 68, 118);
  const gap = min(buttonWidth * 1.06, (width - 20) / ACTIONS.length);
  return {
    buttonWidth,
    buttonHeight: 46,
    gap,
    startX: width * 0.5 - gap * (ACTIONS.length - 1) * 0.5,
    y: height - 54
  };
}

function drawActionButtons() {
  const layout = buttonLayout();
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(constrain(layout.buttonWidth * 0.13, 12, 15));

  for (let i = 0; i < ACTIONS.length; i++) {
    const x = layout.startX + layout.gap * i;
    const active = i === selectedAction;
    stroke(active ? 18 : 145);
    strokeWeight(active ? 3 : 1.5);
    fill(active ? 232 : 255);
    rectMode(CENTER);
    rect(x, layout.y, layout.buttonWidth, layout.buttonHeight, 23);
    noStroke();
    fill(25);
    text(ACTIONS[i].label, x, layout.y + 1);
  }
  rectMode(CORNER);
  textStyle(NORMAL);
}

function triggerAction(x, y) {
  const layout = buttonLayout();
  for (let i = 0; i < ACTIONS.length; i++) {
    const buttonX = layout.startX + layout.gap * i;
    if (
      abs(x - buttonX) <= layout.buttonWidth * 0.5 &&
      abs(y - layout.y) <= layout.buttonHeight * 0.6
    ) {
      selectedAction = i;
      marpan.blink(ACTIONS[i].eyes);
      nextBlinkAt = millis() + random(2300, 5000);
      return true;
    }
  }
  return false;
}

function mouseMoved() {
  targetX = mouseX;
  targetY = mouseY;
}

function mousePressed() {
  return triggerAction(mouseX, mouseY) ? false : undefined;
}

function touchMoved() {
  targetX = mouseX;
  targetY = mouseY;
  return false;
}

function touchStarted() {
  return triggerAction(mouseX, mouseY) ? false : undefined;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  targetX = constrain(targetX, 0, width);
  targetY = constrain(targetY, 0, height);
}

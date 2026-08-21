const ROTATION_MODES = [
  { label: "横回転", mode: "horizontal" },
  { label: "右向き", mode: "right" },
  { label: "左向き", mode: "left" },
  { label: "正面", mode: "front" }
];

let marpan;
let rotationMode = "horizontal";
let selectedMode = 0;
let yaw = 0;
let targetX;
let targetY;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont("sans-serif");
  marpan = new Marpan25D({ maxSize: 430 });
  targetX = width * 0.5;
  targetY = height * 0.28;
}

function draw() {
  background(245, 245, 242);
  updateRotation();

  const bodyW = marpan.getBodyWidth();
  const bodyH = marpan.getBodyHeight(bodyW);
  const centerX = width * 0.5;
  const centerY = height * 0.48;

  drawHeading();
  drawGroundShadow(centerX, centerY, bodyW, bodyH);
  marpan.setPosition(centerX, centerY);
  marpan.setYaw(yaw);
  marpan.lookAt(targetX, targetY);
  marpan.draw();
  drawPointer();
  drawRotationButtons();
}

function updateRotation() {
  const speed = deltaTime * 0.00115;
  if (rotationMode === "horizontal") yaw = (yaw + speed) % TWO_PI;
  else if (rotationMode === "right") yaw = lerpAngle(yaw, 0.78, 0.1);
  else if (rotationMode === "left") yaw = lerpAngle(yaw, -0.78, 0.1);
  else yaw = lerpAngle(yaw, 0, 0.12);
}

function lerpAngle(current, target, amount) {
  const difference = atan2(sin(target - current), cos(target - current));
  return current + difference * amount;
}

function drawGroundShadow(cx, cy, bodyW, bodyH) {
  noStroke(); fill(90, 90, 86, 22);
  ellipse(cx, cy + bodyH * 0.54, bodyW * 0.56, max(8, bodyH * 0.065));
}

function drawHeading() {
  noStroke(); fill(45, 45, 43, 165); textAlign(CENTER, CENTER); textStyle(BOLD);
  textSize(constrain(width * 0.03, 16, 23));
  text("横回転と左右の向きをくらべよう", width * 0.5, 36);
  textStyle(NORMAL);
}

function drawPointer() {
  noFill(); stroke(55, 55, 52, 65); strokeWeight(1.2);
  circle(targetX, targetY, 16); point(targetX, targetY);
}

function buttonLayout() {
  const buttonWidth = constrain((width - 44) / (ROTATION_MODES.length + 0.35), 64, 108);
  const gap = min(buttonWidth * 1.16, (width - 30) / ROTATION_MODES.length);
  return { buttonWidth, buttonHeight: 46, gap, startX: width * 0.5 - gap * 1.5, y: height - 54 };
}

function drawRotationButtons() {
  const layout = buttonLayout();
  textAlign(CENTER, CENTER); textStyle(BOLD); textSize(15);
  for (let i = 0; i < ROTATION_MODES.length; i++) {
    const x = layout.startX + layout.gap * i;
    const active = i === selectedMode;
    stroke(active ? 18 : 145); strokeWeight(active ? 3 : 1.5); fill(active ? 232 : 255);
    rectMode(CENTER); rect(x, layout.y, layout.buttonWidth, layout.buttonHeight, 23);
    noStroke(); fill(25); text(ROTATION_MODES[i].label, x, layout.y + 1);
  }
  rectMode(CORNER); textStyle(NORMAL);
}

function selectRotationMode(x, y) {
  const layout = buttonLayout();
  for (let i = 0; i < ROTATION_MODES.length; i++) {
    const buttonX = layout.startX + layout.gap * i;
    if (abs(x - buttonX) <= layout.buttonWidth * 0.5 && abs(y - layout.y) <= layout.buttonHeight * 0.6) {
      selectedMode = i;
      rotationMode = ROTATION_MODES[i].mode;
      return true;
    }
  }
  return false;
}

function mouseMoved() { targetX = mouseX; targetY = mouseY; }
function mousePressed() { return selectRotationMode(mouseX, mouseY) ? false : undefined; }
function touchMoved() { targetX = mouseX; targetY = mouseY; return false; }
function touchStarted() { return selectRotationMode(mouseX, mouseY) ? false : undefined; }

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  targetX = constrain(targetX, 0, width);
  targetY = constrain(targetY, 0, height);
}

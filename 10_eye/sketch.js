const EYE_EXPRESSIONS = [
  { label: "黒目", style: "pupil" },
  { label: "ニコニコ", style: "happy" },
  { label: "眠たい", style: "sleepy" },
  { label: "一文字", style: "flat" },
  { label: "怒り", style: "angry" }
];

let marpan;
let targetX;
let targetY;
let selectedExpression = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont("sans-serif");
  targetX = width * 0.5;
  targetY = height * 0.28;

  marpan = new Marpan({
    x: width * 0.5,
    y: height * 0.48,
    maxSize: 430,
    eyeStyle: "pupil",
    eyeScale: 1.42,
    showBodyShadow: false,
    eyeContentStyles: { 0: "pupil", 1: "pupil", 2: "pupil" }
  });
}

function draw() {
  background(245, 245, 242);
  updateLayout();
  drawHeading();
  drawGroundShadow();

  marpan.lookAt(targetX, targetY);
  marpan.update();
  marpan.draw();

  drawPointer();
  drawExpressionButtons();
}

function updateLayout() {
  marpan.maxSize = min(430, width * 0.64, height * 0.6);
  marpan.setPosition(width * 0.5, height * 0.48);
}

function drawHeading() {
  noStroke();
  fill(45, 45, 43, 165);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(constrain(width * 0.03, 16, 23));
  text("三つ目の表情をくらべてみよう", width * 0.5, 36);
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
  if (selectedExpression !== 0) return;
  noFill();
  stroke(55, 55, 52, 65);
  strokeWeight(1.2);
  circle(targetX, targetY, 16);
  point(targetX, targetY);
}

function buttonLayout() {
  const buttonWidth = constrain((width - 44) / (EYE_EXPRESSIONS.length + 0.35), 56, 106);
  const gap = min(buttonWidth * 1.06, (width - 20) / EYE_EXPRESSIONS.length);
  return {
    buttonWidth,
    buttonHeight: 46,
    gap,
    startX: width * 0.5 - gap * (EYE_EXPRESSIONS.length - 1) * 0.5,
    y: height - 54
  };
}

function drawExpressionButtons() {
  const layout = buttonLayout();
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(constrain(layout.buttonWidth * 0.14, 11, 15));

  for (let i = 0; i < EYE_EXPRESSIONS.length; i++) {
    const x = layout.startX + layout.gap * i;
    const active = i === selectedExpression;
    stroke(active ? 18 : 145);
    strokeWeight(active ? 3 : 1.5);
    fill(active ? 232 : 255);
    rectMode(CENTER);
    rect(x, layout.y, layout.buttonWidth, layout.buttonHeight, 23);
    noStroke();
    fill(25);
    text(EYE_EXPRESSIONS[i].label, x, layout.y + 1);
  }
  rectMode(CORNER);
  textStyle(NORMAL);
}

function selectExpression(x, y) {
  const layout = buttonLayout();
  for (let i = 0; i < EYE_EXPRESSIONS.length; i++) {
    const buttonX = layout.startX + layout.gap * i;
    if (
      abs(x - buttonX) <= layout.buttonWidth * 0.5 &&
      abs(y - layout.y) <= layout.buttonHeight * 0.6
    ) {
      selectedExpression = i;
      for (let eye = 0; eye < 3; eye++) {
        marpan.setEyeContentStyle(eye, EYE_EXPRESSIONS[i].style);
      }
      marpan.bounce(0.35);
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
  return selectExpression(mouseX, mouseY) ? false : undefined;
}

function touchMoved() {
  targetX = mouseX;
  targetY = mouseY;
  return false;
}

function touchStarted() {
  return selectExpression(mouseX, mouseY) ? false : undefined;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  targetX = constrain(targetX, 0, width);
  targetY = constrain(targetY, 0, height);
}

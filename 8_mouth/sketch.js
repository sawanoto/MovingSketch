let marpan;
let targetX;
let targetY;
let selectedMouthPosition = 1;
let selectedMouthExpression = 0;

const MOUTH_POSITIONS = [
  { label: "低", y: 0.18 },
  { label: "中", y: 0 },
  { label: "高", y: -0.18 }
];

const MOUTH_EXPRESSIONS = [
  { label: "黒目", style: "pupil" },
  { label: "にっこり", style: "smile" },
  { label: "一文字", style: "flat" }
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont("sans-serif");

  targetX = width * 0.5;
  targetY = height * 0.28;
  marpan = new Marpan({
    x: width * 0.5,
    y: height * 0.5,
    maxSize: 430,
    eyeStyle: "pupil",
    eyeScale: 1.42,
    showBodyShadow: false,
    fixedEyeIndices: [1],
    fixedEyeOffsets: { 1: { x: 0, y: MOUTH_POSITIONS[selectedMouthPosition].y } },
    eyeContentStyles: { 1: MOUTH_EXPRESSIONS[selectedMouthExpression].style }
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
  drawGuide();
  drawMouthButtons();
  drawExpressionButtons();
}

function updateLayout() {
  marpan.maxSize = min(430, width * 0.64, height * 0.62);
  marpan.setPosition(width * 0.5, height * 0.5);
}

function drawHeading() {
  noStroke();
  fill(45, 45, 43, 165);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(constrain(width * 0.03, 16, 23));
  text("真ん中は、目？ 鼻？ 口？", width * 0.5, 36);
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

function drawGuide() {
  noStroke();
  fill(45, 45, 43, 125);
  textAlign(CENTER, CENTER);
  textSize(constrain(width * 0.024, 12, 16));
  text("左右の目だけがマウスを追いかけます", width * 0.5, height - 174);
}

function mouthButtonLayout() {
  const buttonWidth = constrain((width - 64) / 3.5, 76, 112);
  const gap = min(buttonWidth * 1.18, (width - 32) / 3);
  return {
    buttonWidth,
    buttonHeight: 46,
    gap,
    startX: width * 0.5 - gap,
    y: height - 116
  };
}

function drawMouthButtons() {
  const layout = mouthButtonLayout();
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(16);

  for (let i = 0; i < MOUTH_POSITIONS.length; i++) {
    const x = layout.startX + layout.gap * i;
    const active = i === selectedMouthPosition;
    stroke(active ? 18 : 145);
    strokeWeight(active ? 3 : 1.5);
    fill(active ? 232 : 255);
    rectMode(CENTER);
    rect(x, layout.y, layout.buttonWidth, layout.buttonHeight, 23);
    noStroke();
    fill(25);
    text(MOUTH_POSITIONS[i].label, x, layout.y + 1);
  }

  rectMode(CORNER);
  textStyle(NORMAL);
}

function selectMouthPosition(x, y) {
  const layout = mouthButtonLayout();
  for (let i = 0; i < MOUTH_POSITIONS.length; i++) {
    const buttonX = layout.startX + layout.gap * i;
    if (
      abs(x - buttonX) <= layout.buttonWidth * 0.5 &&
      abs(y - layout.y) <= layout.buttonHeight * 0.6
    ) {
      selectedMouthPosition = i;
      marpan.setFixedEyeOffset(1, 0, MOUTH_POSITIONS[i].y);
      marpan.bounce(0.35);
      return true;
    }
  }
  return false;
}

function expressionButtonLayout() {
  const buttonWidth = constrain((width - 64) / 3.5, 76, 112);
  const gap = min(buttonWidth * 1.18, (width - 32) / 3);
  return {
    buttonWidth,
    buttonHeight: 46,
    gap,
    startX: width * 0.5 - gap,
    y: height - 54
  };
}

function drawExpressionButtons() {
  const layout = expressionButtonLayout();
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(14);

  for (let i = 0; i < MOUTH_EXPRESSIONS.length; i++) {
    const x = layout.startX + layout.gap * i;
    const active = i === selectedMouthExpression;
    stroke(active ? 18 : 145);
    strokeWeight(active ? 3 : 1.5);
    fill(active ? 232 : 255);
    rectMode(CENTER);
    rect(x, layout.y, layout.buttonWidth, layout.buttonHeight, 23);
    noStroke();
    fill(25);
    text(MOUTH_EXPRESSIONS[i].label, x, layout.y + 1);
  }

  rectMode(CORNER);
  textStyle(NORMAL);
}

function selectMouthExpression(x, y) {
  const layout = expressionButtonLayout();
  for (let i = 0; i < MOUTH_EXPRESSIONS.length; i++) {
    const buttonX = layout.startX + layout.gap * i;
    if (
      abs(x - buttonX) <= layout.buttonWidth * 0.5 &&
      abs(y - layout.y) <= layout.buttonHeight * 0.6
    ) {
      selectedMouthExpression = i;
      marpan.setEyeContentStyle(1, MOUTH_EXPRESSIONS[i].style);
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
  return selectMouthPosition(mouseX, mouseY) || selectMouthExpression(mouseX, mouseY)
    ? false
    : undefined;
}

function touchMoved() {
  targetX = mouseX;
  targetY = mouseY;
  return false;
}

function touchStarted() {
  return selectMouthPosition(mouseX, mouseY) || selectMouthExpression(mouseX, mouseY)
    ? false
    : undefined;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  targetX = constrain(targetX, 0, width);
  targetY = constrain(targetY, 0, height);
}

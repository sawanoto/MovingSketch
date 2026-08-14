const FOLLOW_DISTANCE = 54;
const MAX_SPEED = 10;
const ACCELERATION = 0.075;
const DRAG = 0.86;

const BODY_COLORS = [
  { note: "ド", color: [218, 151, 137] },
  { note: "レ", color: [218, 174, 122] },
  { note: "ミ", color: [218, 202, 132] },
  { note: "ファ", color: [139, 171, 132] },
  { note: "ソ", color: [126, 169, 181] },
  { note: "ラ", color: [143, 139, 171] },
  { note: "シ", color: [190, 145, 166] },
  { note: "ド", color: [226, 164, 149] }
];

let marpan;
let position;
let velocity;
let target;
let hasPointer = false;
let selectedColor = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont("sans-serif");

  position = createVector(width * 0.5, height * 0.48);
  velocity = createVector(0, 0);
  target = createVector(width * 0.5, height * 0.3);

  marpan = new Marpan({
    x: position.x,
    y: position.y,
    maxSize: 285,
    eyeStyle: "pupil",
    bodyColor: BODY_COLORS[selectedColor].color,
    showBodyShadow: false
  });
}

function draw() {
  background(245, 245, 242);
  updateFollower();
  drawTrail();
  drawGroundShadow();

  marpan.setPosition(position.x, position.y);
  marpan.lookAt(target.x, target.y);
  marpan.faceDirection(velocity.x, velocity.y);
  marpan.update();
  marpan.draw();

  drawPointer();
  drawPalette();
}

function updateFollower() {
  if (!hasPointer) {
    velocity.mult(DRAG);
    return;
  }

  const toTarget = p5.Vector.sub(target, position);
  const distance = toTarget.mag();
  if (distance > FOLLOW_DISTANCE) {
    const desiredSpeed = map(constrain(distance, FOLLOW_DISTANCE, 420), FOLLOW_DISTANCE, 420, 0.8, MAX_SPEED);
    velocity.lerp(toTarget.copy().setMag(desiredSpeed), ACCELERATION);
  } else {
    velocity.mult(DRAG);
  }

  velocity.limit(MAX_SPEED);
  position.add(velocity);

  const sideMargin = min(width, height) < 500 ? 64 : 92;
  position.x = constrain(position.x, sideMargin, width - sideMargin);
  position.y = constrain(position.y, sideMargin, height - 150);
}

function drawTrail() {
  if (velocity.magSq() < 1) return;
  const direction = velocity.copy().normalize();
  noStroke();
  for (let i = 3; i >= 1; i--) {
    fill(...BODY_COLORS[selectedColor].color, 13 - i * 3);
    circle(position.x - direction.x * (82 + i * 24), position.y - direction.y * (52 + i * 18), 22 - i * 3);
  }
}

function drawGroundShadow() {
  noStroke();
  fill(90, 90, 86, 24);
  ellipse(position.x - velocity.x * 1.6, position.y + 102, 168 + velocity.mag() / MAX_SPEED * 18, 22);
}

function drawPointer() {
  if (!hasPointer) return;
  noFill();
  stroke(55, 55, 52, 70);
  strokeWeight(1.5);
  circle(target.x, target.y, 18);
  point(target.x, target.y);
}

function paletteLayout() {
  const diameter = constrain((width - 48) / 8.4, 38, 58);
  const gap = min(diameter * 1.18, (width - 32) / BODY_COLORS.length);
  const totalWidth = gap * (BODY_COLORS.length - 1);
  return { diameter, gap, startX: width * 0.5 - totalWidth * 0.5, y: height - 52 };
}

function drawPalette() {
  const layout = paletteLayout();
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(constrain(layout.diameter * 0.3, 12, 16));

  for (let i = 0; i < BODY_COLORS.length; i++) {
    const x = layout.startX + layout.gap * i;
    const active = i === selectedColor;
    stroke(active ? 18 : 255);
    strokeWeight(active ? 4 : 2);
    fill(...BODY_COLORS[i].color);
    circle(x, layout.y, layout.diameter);

    noStroke();
    fill(i === 2 ? 45 : 255);
    text(BODY_COLORS[i].note, x, layout.y + 1);
  }
  textStyle(NORMAL);
}

function selectPaletteColor(x, y) {
  const layout = paletteLayout();
  for (let i = 0; i < BODY_COLORS.length; i++) {
    const buttonX = layout.startX + layout.gap * i;
    if (dist(x, y, buttonX, layout.y) <= layout.diameter * 0.58) {
      selectedColor = i;
      marpan.setBodyColor(BODY_COLORS[i].color);
      marpan.bounce(0.45);
      return true;
    }
  }
  return false;
}

function mouseMoved() {
  target.set(mouseX, min(mouseY, height - 145));
  hasPointer = true;
}

function mousePressed() {
  return selectPaletteColor(mouseX, mouseY) ? false : undefined;
}

function touchMoved() {
  target.set(mouseX, min(mouseY, height - 145));
  hasPointer = true;
  return false;
}

function touchStarted() {
  return selectPaletteColor(mouseX, mouseY) ? false : undefined;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  position.x = constrain(position.x, 0, width);
  position.y = constrain(position.y, 0, height - 150);
}

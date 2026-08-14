const FOLLOW_DISTANCE = 54;
const MAX_SPEED = 10;
const ACCELERATION = 0.075;
const DRAG = 0.86;
const EYE_SCALES = [0.64, 0.82, 1, 1.2, 1.42];

let marpan;
let position;
let velocity;
let target;
let hasPointer = false;
let selectedSize = 4;

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
    eyeScale: EYE_SCALES[selectedSize],
    showBodyShadow: false
  });
}

function draw() {
  background(245, 245, 242);
  updateFollower();
  drawGroundShadow();

  marpan.setPosition(position.x, position.y);
  marpan.lookAt(target.x, target.y);
  marpan.faceDirection(velocity.x, velocity.y);
  marpan.update();
  marpan.draw();

  drawPointer();
  drawSizeButtons();
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

function buttonLayout() {
  const diameter = constrain((width - 60) / 6.3, 44, 62);
  const gap = min(diameter * 1.28, (width - 40) / EYE_SCALES.length);
  const totalWidth = gap * (EYE_SCALES.length - 1);
  return { diameter, gap, startX: width * 0.5 - totalWidth * 0.5, y: height - 54 };
}

function drawSizeButtons() {
  const layout = buttonLayout();
  for (let i = 0; i < EYE_SCALES.length; i++) {
    const x = layout.startX + layout.gap * i;
    const active = i === selectedSize;

    stroke(active ? 18 : 135);
    strokeWeight(active ? 3 : 1.5);
    fill(255);
    circle(x, layout.y, layout.diameter);

    const sampleSize = map(i, 0, EYE_SCALES.length - 1, 7, 20);
    noStroke();
    fill(18);
    circle(x, layout.y, sampleSize);
  }
}

function selectEyeSize(x, y) {
  const layout = buttonLayout();
  for (let i = 0; i < EYE_SCALES.length; i++) {
    const buttonX = layout.startX + layout.gap * i;
    if (dist(x, y, buttonX, layout.y) <= layout.diameter * 0.58) {
      selectedSize = i;
      marpan.setEyeScale(EYE_SCALES[i]);
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
  return selectEyeSize(mouseX, mouseY) ? false : undefined;
}

function touchMoved() {
  target.set(mouseX, min(mouseY, height - 145));
  hasPointer = true;
  return false;
}

function touchStarted() {
  return selectEyeSize(mouseX, mouseY) ? false : undefined;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  position.x = constrain(position.x, 0, width);
  position.y = constrain(position.y, 0, height - 150);
}

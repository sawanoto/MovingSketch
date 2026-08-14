const FOLLOW_DISTANCE = 54;
const MAX_SPEED = 10;
const ACCELERATION = 0.075;
const DRAG = 0.86;

let marpan;
let position;
let velocity;
let target;
let hasPointer = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont("sans-serif");

  position = createVector(width * 0.5, height * 0.58);
  velocity = createVector(0, 0);
  target = createVector(width * 0.5, height * 0.35);

  marpan = new Marpan({
    x: position.x,
    y: position.y,
    maxSize: 285,
    eyeStyle: "pupil"
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
  drawHint();
}

function updateFollower() {
  if (!hasPointer) {
    velocity.mult(DRAG);
    return;
  }

  const toTarget = p5.Vector.sub(target, position);
  const distance = toTarget.mag();

  if (distance > FOLLOW_DISTANCE) {
    const desiredSpeed = map(
      constrain(distance, FOLLOW_DISTANCE, 420),
      FOLLOW_DISTANCE,
      420,
      0.8,
      MAX_SPEED
    );
    velocity.lerp(toTarget.copy().setMag(desiredSpeed), ACCELERATION);
  } else {
    velocity.mult(DRAG);
  }

  velocity.limit(MAX_SPEED);
  position.add(velocity);

  const margin = min(width, height) < 500 ? 64 : 92;
  position.x = constrain(position.x, margin, width - margin);
  position.y = constrain(position.y, margin, height - margin);
}

function drawTrail() {
  if (velocity.magSq() < 1) return;

  const direction = velocity.copy().normalize();
  noStroke();
  for (let i = 3; i >= 1; i--) {
    fill(90, 90, 86, 13 - i * 3);
    circle(
      position.x - direction.x * (82 + i * 24),
      position.y - direction.y * (52 + i * 18),
      22 - i * 3
    );
  }
}

function drawGroundShadow() {
  const speedRatio = velocity.mag() / MAX_SPEED;
  noStroke();
  fill(90, 90, 86, 24);
  ellipse(
    position.x - velocity.x * 1.6,
    position.y + 102,
    168 + speedRatio * 18,
    22
  );
}

function drawPointer() {
  if (!hasPointer) return;

  noFill();
  stroke(55, 55, 52, 70);
  strokeWeight(1.5);
  circle(target.x, target.y, 18);
  point(target.x, target.y);
}

function drawHint() {
  noStroke();
  fill(45, 45, 43, 145);
  textAlign(CENTER, CENTER);
  textSize(constrain(width * 0.025, 13, 17));
  text("白い目のマーパンが、マウスを追いかけます", width * 0.5, height - 28);
}

function mouseMoved() {
  target.set(mouseX, mouseY);
  hasPointer = true;
}

function touchMoved() {
  target.set(mouseX, mouseY);
  hasPointer = true;
  return false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  position.x = constrain(position.x, 0, width);
  position.y = constrain(position.y, 0, height);
}

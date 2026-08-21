let bird;
let contactGlow = 0;
let marpan;
let wasTouched = false;
let pointerX;
let pointerY;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  strokeCap(ROUND);
  strokeJoin(ROUND);
  marpan = new Marpan25D({ maxSize: 520 });
  marpan.enableAutoBlink(2200, 4100);
  pointerX = width * 0.2;
  pointerY = height * 0.3;
  resetBird();
}

function draw() {
  drawSky();

  marpan.maxSize = min(520, width * 0.76, height * 0.86);
  marpan.setPosition(width * 0.58, height * 0.59);

  updateBird(marpan);
  contactGlow *= 0.94;
  updateMarpanExpression();

  drawGroundShadow(marpan);
  drawMarpanGlow(marpan);
  marpan.lookAt(bird.x, bird.y);
  marpan.draw();
  drawBird(bird);
}

function drawSky() {
  background(222, 244, 245);
  noStroke();
  fill(255, 255, 255, 115);
  ellipse(width * 0.18, height * 0.18, 210, 58);
  ellipse(width * 0.29, height * 0.15, 145, 46);

  fill(177, 213, 183);
  rect(0, height * 0.82, width, height * 0.18);
  fill(150, 197, 159, 120);
  for (let x = 12; x < width; x += 34) {
    const h = 12 + noise(x * 0.02) * 22;
    triangle(x, height * 0.84, x + 7, height * 0.84 - h, x + 13, height * 0.84);
  }
}

function drawGroundShadow(m) {
  const bodyW = m.getBodyWidth();
  const bodyH = m.getBodyHeight(bodyW);
  noStroke();
  fill(61, 86, 77, 38);
  ellipse(m.x, m.y + bodyH * 0.54, bodyW * 0.62, bodyH * 0.1);
}

function drawMarpanGlow(m) {
  if (contactGlow > 1) {
    const bodyW = m.getBodyWidth();
    const bodyH = m.getBodyHeight(bodyW);
    noStroke();
    fill(255, 224, 52, contactGlow * 0.32);
    ellipse(m.x, m.y - bodyH * 0.03, bodyW * 0.76, bodyH * 1.1);
  }
}

function updateMarpanExpression() {
  if (bird.touched === wasTouched) return;
  wasTouched = bird.touched;
  if (bird.touched) {
    marpan.disableAutoBlink();
    marpan.openEyes();
    marpan.setEyeStyle(1, "beak", "#f6e819");
    marpan.bounce(1);
  } else {
    marpan.clearEyeSettings(1);
    marpan.enableAutoBlink(2200, 4100);
  }
}

function resetBird() {
  bird = {
    x: pointerX,
    y: pointerY,
    dir: 1,
    touched: false,
    wing: random(TWO_PI)
  };
}

function updateBird(m) {
  bird.wing += 0.22;
  const bodyW = m.getBodyWidth();
  const bodyH = m.getBodyHeight(bodyW);
  const dx = pointerX - bird.x;
  const dy = pointerY - bird.y;
  if (abs(dx) > 0.5) bird.dir = dx >= 0 ? 1 : -1;

  bird.x = lerp(bird.x, pointerX, 0.13);
  bird.y = lerp(bird.y, pointerY, 0.13) + sin(frameCount * 0.15) * 0.22;

  const birdSize = constrain(min(width, height) * 0.105, 54, 86);
  const nx = (bird.x - m.x) / (bodyW * 0.49 + birdSize * 0.28);
  const ny = (bird.y - m.y) / (bodyH * 0.52 + birdSize * 0.25);
  const touchingNow = nx * nx + ny * ny <= 1;
  if (touchingNow && !bird.touched) {
    contactGlow = 220;
  }
  bird.touched = touchingNow;
}

function drawBird(b) {
  const s = constrain(min(width, height) * 0.105, 54, 86);
  push();
  translate(b.x, b.y);
  scale(b.dir, 1);
  rotate(sin(frameCount * 0.09) * 0.035);

  stroke(29);
  strokeWeight(max(2.5, s * 0.045));
  fill(84, 151, 174);
  ellipse(0, 0, s, s * 0.72);
  fill(103, 177, 196);
  ellipse(s * 0.29, -s * 0.22, s * 0.56, s * 0.55);

  push();
  translate(-s * 0.12, 0);
  rotate(-0.35 + sin(b.wing) * 0.5);
  fill(56, 124, 151);
  ellipse(-s * 0.1, s * 0.12, s * 0.62, s * 0.28);
  pop();

  fill(246, 201, 35);
  triangle(s * 0.53, -s * 0.22, s * 0.87, -s * 0.11, s * 0.53, -s * 0.03);
  fill(20);
  ellipse(s * 0.37, -s * 0.3, s * 0.09);
  fill(255);
  ellipse(s * 0.35, -s * 0.32, s * 0.025);

  noFill();
  stroke(45, 69, 59);
  line(-s * 0.13, s * 0.32, -s * 0.17, s * 0.48);
  line(s * 0.1, s * 0.32, s * 0.08, s * 0.48);
  pop();
}

function updatePointer(x, y) {
  pointerX = constrain(x, 0, width);
  pointerY = constrain(y, 0, height);
}

function mouseMoved() {
  updatePointer(mouseX, mouseY);
}

function mouseDragged() {
  updatePointer(mouseX, mouseY);
  return false;
}

function touchStarted() {
  if (touches.length > 0) updatePointer(touches[0].x, touches[0].y);
  return false;
}

function touchMoved() {
  if (touches.length > 0) updatePointer(touches[0].x, touches[0].y);
  return false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

let marpan;
let touching = false;
let pointerX;
let pointerY;
let sparklePulse = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont("sans-serif");
  marpan = new Marpan25D({ maxSize: 440 });
  marpan.enableAutoBlink(2100, 3900);
  pointerX = width * 0.78;
  pointerY = height * 0.28;
}

function draw() {
  drawBackground();

  const cx = width * 0.5;
  const cy = height * 0.52;
  const bodyW = marpan.getBodyWidth();
  const bodyH = marpan.getBodyHeight(bodyW);
  const isTouching = touchesBody(pointerX, pointerY, cx, cy, bodyW, bodyH);
  updateExpression(isTouching);
  sparklePulse *= 0.9;

  drawHeading();
  drawGroundShadow(cx, cy, bodyW, bodyH);
  if (touching) drawAura(cx, cy, bodyW);

  marpan.setPosition(cx, cy);
  marpan.lookAt(pointerX, pointerY);
  marpan.draw();

  if (touching) drawFloatingSparkles(cx, cy, bodyW, bodyH);
  drawFoxtail(pointerX, pointerY);
  drawGuide();
}

function updateExpression(isTouching) {
  if (isTouching === touching) return;
  touching = isTouching;

  if (touching) {
    marpan.disableAutoBlink();
    marpan.openEyes();
    marpan.setExpression("diamond");
    for (let i = 0; i < 3; i++) marpan.setEyeColor(i, "#e5a800", true, true);
    marpan.bounce(1);
    sparklePulse = 1;
  } else {
    marpan.setExpression("pupil");
    marpan.clearAllEyeSettings();
    marpan.enableAutoBlink(2100, 3900);
  }
}

function touchesBody(x, y, cx, cy, bodyW, bodyH) {
  const nx = (x - cx) / (bodyW * 0.49);
  const ny = (y - cy) / (bodyH * 0.52);
  return nx * nx + ny * ny <= 1;
}

function drawBackground() {
  background(244, 240, 223);
  noStroke();
  for (let i = 0; i < 9; i++) {
    const x = width * (0.08 + i * 0.12);
    const sway = sin(millis() * 0.0006 + i) * 18;
    fill(124, 146, 79, 12);
    ellipse(x + sway, height * 0.18, 130, 420);
  }
}

function drawHeading() {
  noStroke(); fill(55, 52, 42, 165); textAlign(CENTER, CENTER); textStyle(BOLD);
  textSize(constrain(width * 0.03, 16, 23));
  text("エノコログサに夢中", width * 0.5, 36);
  textStyle(NORMAL);
}

function drawGroundShadow(cx, cy, bodyW, bodyH) {
  noStroke(); fill(85, 78, 58, 24);
  ellipse(cx, cy + bodyH * 0.54, bodyW * 0.58, max(8, bodyH * 0.065));
}

function drawAura(cx, cy, bodyW) {
  noStroke();
  for (let i = 4; i >= 1; i--) {
    fill(229, 168, 0, 5 + i * 2);
    ellipse(cx, cy, bodyW * (1.05 + i * 0.12));
  }
}

function drawFloatingSparkles(cx, cy, bodyW, bodyH) {
  const time = millis() * 0.003;
  for (let i = 0; i < 7; i++) {
    const angle = time * (i % 2 ? 0.3 : -0.24) + i * TWO_PI / 7;
    const x = cx + cos(angle) * bodyW * 0.56;
    const y = cy + sin(angle) * bodyH * 0.66;
    const size = 5 + 3 * sin(time * 2 + i);
    drawSparkle(x, y, size, color(229, 168, 0, 155));
  }
}

function drawSparkle(x, y, size, sparkleColor) {
  push(); translate(x, y); rotate(PI / 4);
  noStroke(); fill(sparkleColor);
  beginShape();
  vertex(0, -size); vertex(size * 0.24, -size * 0.24);
  vertex(size, 0); vertex(size * 0.24, size * 0.24);
  vertex(0, size); vertex(-size * 0.24, size * 0.24);
  vertex(-size, 0); vertex(-size * 0.24, -size * 0.24);
  endShape(CLOSE);
  pop();
}

function drawFoxtail(tipX, tipY) {
  const handleX = tipX + constrain(width * 0.13, 72, 130);
  const handleY = tipY + constrain(height * 0.18, 90, 150);
  const angle = atan2(tipY - handleY, tipX - handleX);

  stroke(70, 112, 48); strokeWeight(4); strokeCap(ROUND);
  line(handleX, handleY, tipX, tipY);

  push(); translate(tipX, tipY); rotate(angle);
  noStroke(); fill(105, 132, 52);
  ellipse(0, 0, 58, 25);
  stroke(89, 111, 43, 205); strokeWeight(1.4);
  for (let i = -6; i <= 6; i++) {
    const x = i * 3.8;
    const reach = 13 - abs(i) * 0.55;
    line(x, 0, x - 8, -reach);
    line(x, 0, x - 8, reach);
  }
  pop();

  noStroke(); fill(61, 82, 43, 170);
  circle(handleX, handleY, 9);
}

function drawGuide() {
  const message = touching ? "キラキラ！　瞳がダイヤになりました" : "エノコログサでマーパンに触れてみよう";
  noStroke(); fill(70, 65, 50, 125); textAlign(CENTER, CENTER); textSize(13);
  text(message, width * 0.5, height - 24);
}

function mouseMoved() { pointerX = mouseX; pointerY = mouseY; }
function mouseDragged() { pointerX = mouseX; pointerY = mouseY; return false; }
function touchMoved() { pointerX = mouseX; pointerY = mouseY; return false; }
function touchStarted() { pointerX = mouseX; pointerY = mouseY; return false; }

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  pointerX = constrain(pointerX, 0, width);
  pointerY = constrain(pointerY, 0, height);
}

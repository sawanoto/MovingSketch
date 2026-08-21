const COLORS = ["#ff4f70", "#ff9f1c", "#ffe45e", "#58e887", "#35c9ff", "#7d75ff", "#d767ff", "#ff70b7"];

let position;
let velocity;
let marpan;
let colorIndex = 0;
let paused = false;
let wallFlash = 0;
let hitSide = "";

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  marpan = new Marpan25D({ maxSize: 230, bodyColor: COLORS[0] });
  resetSaver();
  setTimeout(() => document.querySelector("#guide")?.classList.add("hidden"), 5000);
}

function resetSaver() {
  const bounds = bodyBounds();
  position = createVector(constrain(width * 0.34, bounds.halfW, width - bounds.halfW), constrain(height * 0.38, bounds.halfH, height - bounds.halfH));
  velocity = createVector(155, 116);
  colorIndex = 0;
  paused = false;
  wallFlash = 0;
}

function draw() {
  background(8, 9, 13);
  if (!paused) moveMarpan(min(deltaTime / 1000, 0.04));
  drawGlow();
  drawWallFlash();
  marpan.setPosition(position.x, position.y);
  marpan.setBodyColor(COLORS[colorIndex]);
  marpan.lookAt(position.x, position.y);
  marpan.draw();
  wallFlash *= 0.88;
  if (paused) drawPauseMark();
}

function bodyBounds() {
  const bodyW = marpan.getBodyWidth();
  const bodyH = marpan.getBodyHeight(bodyW);
  return { halfW: bodyW * 0.5, halfH: bodyH * 0.5 };
}

function moveMarpan(dt) {
  const bounds = bodyBounds();
  position.add(p5.Vector.mult(velocity, dt));
  let collided = false;
  if (position.x + bounds.halfW >= width) { position.x = width - bounds.halfW; velocity.x = -abs(velocity.x); hitSide = "right"; collided = true; }
  else if (position.x - bounds.halfW <= 0) { position.x = bounds.halfW; velocity.x = abs(velocity.x); hitSide = "left"; collided = true; }
  if (position.y + bounds.halfH >= height) { position.y = height - bounds.halfH; velocity.y = -abs(velocity.y); hitSide = "bottom"; collided = true; }
  else if (position.y - bounds.halfH <= 0) { position.y = bounds.halfH; velocity.y = abs(velocity.y); hitSide = "top"; collided = true; }
  if (collided) {
    colorIndex = (colorIndex + 1) % COLORS.length;
    wallFlash = 1;
  }
}


function drawGlow() {
  const glow = color(COLORS[colorIndex]);
  noStroke(); fill(red(glow), green(glow), blue(glow), 14);
  ellipse(position.x, position.y, bodyBounds().halfW * 4.5);
}

function drawWallFlash() {
  if (wallFlash < 0.02) return;
  const source = color(COLORS[colorIndex]);
  fill(red(source), green(source), blue(source), 110 * wallFlash); noStroke();
  const thickness = 12 * wallFlash;
  if (hitSide === "left") rect(0, 0, thickness, height);
  if (hitSide === "right") rect(width - thickness, 0, thickness, height);
  if (hitSide === "top") rect(0, 0, width, thickness);
  if (hitSide === "bottom") rect(0, height - thickness, width, thickness);
}

function drawPauseMark() {
  noStroke(); fill(255, 150); rectMode(CENTER);
  rect(width / 2 - 6, height / 2, 4, 20, 2); rect(width / 2 + 6, height / 2, 4, 20, 2);
  rectMode(CORNER);
}

function togglePause() {
  paused = !paused;
  document.querySelector("#guide")?.classList.remove("hidden");
  return false;
}

function mousePressed() { return togglePause(); }
function touchStarted() { return togglePause(); }
function keyPressed() {
  if (key === " ") return togglePause();
  if (key === "r" || key === "R") { resetSaver(); return false; }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  const bounds = bodyBounds();
  position.x = constrain(position.x, bounds.halfW, width - bounds.halfW);
  position.y = constrain(position.y, bounds.halfH, height - bounds.halfH);
}

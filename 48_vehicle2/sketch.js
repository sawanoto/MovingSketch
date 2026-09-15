let vehicle = { x: 0, y: 0, tx: 0, ty: 0 };
let wake = [];

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(document.querySelector("main"));
  canvas.id("vehicleCanvas");
  canvas.attribute("aria-label", "真上から見た移動型マーパン");
  pixelDensity(1);
  strokeCap(ROUND);
  strokeJoin(ROUND);
  vehicle.x = vehicle.tx = width * .5;
  vehicle.y = vehicle.ty = height * .54;
}

function draw() {
  drawBackground();
  updateVehicle();
  drawWake();
  const s = constrain(min(width, height) * .38, 185, 330);
  drawReferenceVehicle(vehicle.x, vehicle.y, s);
}

function drawBackground() {
  background("#f4f7f8");
  noFill();
  stroke(74, 165, 177, 14);
  strokeWeight(1);
  for (let i = 0; i < 8; i++) {
    const x = width * (.14 + i * .12);
    line(x, 0, x, height);
  }
  noStroke();
  fill(38, 57, 66, 11);
  ellipse(vehicle.x, vehicle.y + min(width, height) * .21, min(width, height) * .22, min(width, height) * .035);
}

function updateVehicle() {
  vehicle.x = lerp(vehicle.x, vehicle.tx, .07);
  vehicle.y = lerp(vehicle.y, vehicle.ty, .07);
  if (frameCount % 4 === 0) {
    wake.push({ x: vehicle.x, y: vehicle.y + constrain(min(width, height) * .3, 140, 240), life: 1 });
  }
  for (const point of wake) {
    point.y += .45;
    point.life -= .022;
  }
  wake = wake.filter(point => point.life > 0);
}

function drawWake() {
  noFill();
  for (let lane = -1; lane <= 1; lane++) {
    beginShape();
    for (const point of wake) {
      stroke(76, 201, 214, 75 * point.life);
      strokeWeight(1.4);
      vertex(point.x + lane * 13, point.y);
    }
    endShape();
  }
}

function drawReferenceVehicle(cx, cy, s) {
  const ink = "#263942";
  const cyan = "#69d6df";
  const cyanEdge = "#49b7c3";
  const cyanLight = "#c9f6f4";
  const runner = "#34464e";
  const bodyHalf = s * .285;
  const barHalf = s * .43;
  const barTop = -s * .69;
  const barBottom = -s * .54;
  const bottomY = s * .54;
  const bladeTop = s * .08;
  const bladeBottom = s * .68;
  const floatY = sin(frameCount * .035) * 2;

  push();
  translate(cx, cy + floatY);

  // Thin runners sit behind the blades and never dominate the silhouette.
  for (const side of [-1, 1]) {
    push();
    scale(side, 1);
    noStroke();
    fill(runner);
    rectMode(CENTER);
    rect(s * .355, s * .43, s * .035, s * .69, s * .017);
    pop();
  }

  // One continuous T-shaped shell: the bar grows directly into the body.
  // The body widens toward its middle, then tapers into the rounded lower end.
  stroke(ink);
  strokeWeight(max(2, s * .01));
  fill(cyan);
  beginShape();
  vertex(-barHalf, barTop);
  quadraticVertex(-barHalf - s*.018, barTop, -barHalf - s*.018, barTop + s*.025);
  line(-barHalf - s*.018, barBottom - s*.025);
  quadraticVertex(-barHalf - s*.018, barBottom, -barHalf, barBottom);
  line(-s*.205, barBottom);
  bezierVertex(-s*.22, -s*.47, -s*.26, -s*.39, -s*.275, -s*.25);
  bezierVertex(-bodyHalf, -s*.08, -bodyHalf, s*.12, -s*.265, s*.29);
  bezierVertex(-s*.25, s*.44, -s*.15, bottomY, 0, bottomY);
  bezierVertex(s*.15, bottomY, s*.25, s*.44, s*.265, s*.29);
  bezierVertex(bodyHalf, s*.12, bodyHalf, -s*.08, s*.275, -s*.25);
  bezierVertex(s*.26, -s*.39, s*.22, -s*.47, s*.205, barBottom);
  line(barHalf, barBottom);
  quadraticVertex(barHalf + s*.018, barBottom, barHalf + s*.018, barBottom - s*.025);
  line(barHalf + s*.018, barTop + s*.025);
  quadraticVertex(barHalf + s*.018, barTop, barHalf, barTop);
  endShape(CLOSE);

  // Dark caps are inset into the ends of the integrated crossbar.
  noStroke();
  fill(runner);
  rectMode(CENTER);
  rect(-barHalf, (barTop + barBottom) * .5, s*.055, barBottom - barTop, s*.018);
  rect(barHalf, (barTop + barBottom) * .5, s*.055, barBottom - barTop, s*.018);

  // Each side blade is generated once and reflected across the center.
  for (const side of [-1, 1]) {
    push();
    scale(side, 1);
    stroke(ink);
    strokeWeight(max(1.5, s * .006));
    fill(cyanEdge);
    beginShape();
    vertex(s*.305, bladeTop);
    bezierVertex(s*.35, bladeTop + s*.045, s*.37, bladeTop + s*.13, s*.368, bladeTop + s*.23);
    line(s*.35, bladeBottom - s*.025);
    bezierVertex(s*.345, bladeBottom + s*.025, s*.315, bladeBottom + s*.02, s*.305, bladeBottom - s*.04);
    line(s*.27, bladeTop + s*.075);
    bezierVertex(s*.275, bladeTop + s*.025, s*.288, bladeTop, s*.305, bladeTop);
    endShape(CLOSE);
    pop();
  }

  // A single seam clarifies the bar while its broad root remains connected.
  noFill();
  stroke(ink);
  strokeWeight(max(1, s*.004));
  line(-s*.205, barBottom, s*.205, barBottom);

  // Three small, equal eyes occupy about sixty percent of the body width.
  const eyeY = -s * .32;
  const eyeSize = s * .112;
  const eyeGap = s * .102;
  const blink = frameCount % 230 > 217;
  for (let i = -1; i <= 1; i++) {
    const ex = i * eyeGap;
    stroke(ink);
    strokeWeight(max(1.7, s * .006));
    fill("#fffefb");
    ellipse(ex, eyeY, eyeSize, blink ? s*.01 : eyeSize * 1.06);
    if (!blink) {
      noStroke();
      fill("#152329");
      circle(ex, eyeY + s*.003, eyeSize * .39);
    }
  }

  // Minimal mirrored highlights preserve the flat game-readable color shape.
  noFill();
  stroke(cyanLight);
  strokeWeight(max(1.2, s * .0045));
  line(-barHalf + s*.06, barTop + s*.025, barHalf - s*.06, barTop + s*.025);
  for (const side of [-1, 1]) {
    bezier(side*s*.205, -s*.43, side*s*.245, -s*.16, side*s*.238, s*.23, side*s*.15, s*.43);
  }
  pop();
}

function setTarget(x, y) {
  const marginX = 105;
  const marginY = 170;
  vehicle.tx = constrain(x, marginX, width - marginX);
  vehicle.ty = constrain(y, marginY, height - marginY);
}

function mouseMoved() { setTarget(mouseX, mouseY); }
function mouseDragged() { setTarget(mouseX, mouseY); return false; }
function touchMoved() { setTarget(mouseX, mouseY); return false; }
function mousePressed() { setTarget(mouseX, mouseY); }
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  setTarget(vehicle.tx, vehicle.ty);
}

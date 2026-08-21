const SIGNALS = [
  { name: "青", color: "#28a9e8" },
  { name: "黄", color: "#f4c430" },
  { name: "赤", color: "#e84949" }
];

let activeSignal = 0;
let blinkStartedAt = -9999;
let nextBlinkAt = 0;
let pulse = 0;
let lastActionAt = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont("sans-serif");
  scheduleBlink();
}

function draw() {
  background(245, 245, 242);
  updateBlink();
  pulse *= 0.88;

  const bodyW = min(width * 0.58, height * 0.62, 440);
  const bodyH = bodyW * 0.68;
  const cx = width * 0.5;
  const cy = height * 0.49 - pulse * bodyH * 0.025;

  drawHeading();
  drawSignalGlow(cx, cy, bodyW);
  drawGroundShadow(cx, cy, bodyW, bodyH);
  drawMarpan25D(cx, cy, bodyW, bodyH);
  drawSignalLabels(cx, cy, bodyW, bodyH);
  drawGuide();
}

function updateBlink() {
  if (millis() >= nextBlinkAt) {
    blinkStartedAt = millis();
    scheduleBlink();
  }
}

function scheduleBlink() {
  nextBlinkAt = millis() + random(2300, 4100);
}

function blinkAmount() {
  const age = millis() - blinkStartedAt;
  if (age < 0 || age > 220) return 0;
  return sin(map(age, 0, 220, 0, PI));
}

function changeSignal() {
  activeSignal = (activeSignal + 1) % SIGNALS.length;
  pulse = 1;
  lastActionAt = millis();
  nextBlinkAt = millis() + random(1800, 3000);
  return false;
}

function drawMarpan25D(cx, cy, bodyW, bodyH) {
  drawDomeBody(cx, cy, bodyW, bodyH);
  beginManjuClip(cx, cy, bodyW, bodyH);
  drawSignalEyes(cx, cy, bodyW, bodyH);
  drawingContext.restore();
}

function drawDomeBody(cx, cy, bodyW, bodyH) {
  push();
  translate(cx, cy);
  stroke(18);
  strokeWeight(max(5, bodyW * 0.012));
  strokeJoin(ROUND);
  fill(255);
  beginShape();
  vertex(0, -bodyH * 0.5);
  bezierVertex(bodyW * 0.27, -bodyH * 0.5, bodyW * 0.5, -bodyH * 0.25, bodyW * 0.48, bodyH * 0.2);
  bezierVertex(bodyW * 0.46, bodyH * 0.46, bodyW * 0.25, bodyH * 0.5, 0, bodyH * 0.5);
  bezierVertex(-bodyW * 0.25, bodyH * 0.5, -bodyW * 0.46, bodyH * 0.46, -bodyW * 0.48, bodyH * 0.2);
  bezierVertex(-bodyW * 0.5, -bodyH * 0.25, -bodyW * 0.26, -bodyH * 0.5, 0, -bodyH * 0.5);
  endShape(CLOSE);
  pop();
}

function beginManjuClip(cx, cy, bodyW, bodyH) {
  const context = drawingContext;
  context.save(); context.beginPath();
  context.moveTo(cx - bodyW * 0.48, cy + bodyH * 0.2);
  context.bezierCurveTo(cx - bodyW * 0.5, cy - bodyH * 0.25, cx - bodyW * 0.26, cy - bodyH * 0.5, cx, cy - bodyH * 0.5);
  context.bezierCurveTo(cx + bodyW * 0.27, cy - bodyH * 0.5, cx + bodyW * 0.5, cy - bodyH * 0.25, cx + bodyW * 0.48, cy + bodyH * 0.2);
  context.bezierCurveTo(cx + bodyW * 0.46, cy + bodyH * 0.46, cx + bodyW * 0.25, cy + bodyH * 0.5, cx, cy + bodyH * 0.5);
  context.bezierCurveTo(cx - bodyW * 0.25, cy + bodyH * 0.5, cx - bodyW * 0.46, cy + bodyH * 0.46, cx - bodyW * 0.48, cy + bodyH * 0.2);
  context.closePath(); context.clip();
}

function signalEyeModels(cx, cy, bodyW) {
  const baseEyeW = bodyW * 0.135 * 1.42;
  const baseEyeH = baseEyeW * 1.08;
  const eyes = [];
  for (let i = 0; i < 3; i++) {
    const longitude = (i - 1) * 0.44;
    const depth = cos(longitude);
    const distanceScale = 0.76 + depth * 0.24;
    eyes.push({
      index: i,
      depth,
      x: cx + sin(longitude) * bodyW * 0.47,
      y: cy,
      w: baseEyeW * distanceScale * max(0.025, depth),
      h: baseEyeH * distanceScale
    });
  }
  return eyes;
}

function drawSignalEyes(cx, cy, bodyW) {
  const close = blinkAmount();
  const openScale = lerp(1, 0.055, close);
  const eyes = signalEyeModels(cx, cy, bodyW).sort((a, b) => a.depth - b.depth || a.index - b.index);

  for (const eye of eyes) {
    const signal = SIGNALS[eye.index];
    const active = eye.index === activeSignal;
    push();
    translate(eye.x, eye.y);
    scale(active ? 1 + pulse * 0.08 : 1, openScale);

    if (active && openScale > 0.2) {
      drawingContext.shadowColor = signal.color;
      drawingContext.shadowBlur = eye.w * 0.42;
    }
    stroke(18);
    strokeWeight(max(2, eye.w * 0.045));
    fill(255);
    ellipse(0, 0, eye.w, eye.h);
    drawingContext.shadowBlur = 0;

    if (openScale > 0.18) {
      const c = color(signal.color);
      if (!active) c.setAlpha(74);
      noStroke(); fill(c);
      ellipse(0, 0, eye.w * (active ? 0.48 : 0.38));
      if (active) {
        fill(255, 205);
        ellipse(-eye.w * 0.1, -eye.w * 0.1, eye.w * 0.1);
      }
    }
    pop();
  }
}

function drawSignalGlow(cx, cy, bodyW) {
  const eye = signalEyeModels(cx, cy, bodyW)[activeSignal];
  const source = color(SIGNALS[activeSignal].color);
  noStroke(); fill(red(source), green(source), blue(source), 18);
  ellipse(eye.x, eye.y, bodyW * 0.42);
}

function drawGroundShadow(cx, cy, bodyW, bodyH) {
  noStroke(); fill(90, 90, 86, 22);
  ellipse(cx, cy + bodyH * 0.54, bodyW * 0.56, max(8, bodyH * 0.065));
}

function drawHeading() {
  noStroke(); fill(45, 45, 43, 165); textAlign(CENTER, CENTER); textStyle(BOLD);
  textSize(constrain(width * 0.03, 16, 23));
  text("マーパン・シグナル", width * 0.5, 36);
  textStyle(NORMAL);
}

function drawSignalLabels(cx, cy, bodyW, bodyH) {
  const eyes = signalEyeModels(cx, cy, bodyW);
  textAlign(CENTER, CENTER); textStyle(BOLD); textSize(constrain(bodyW * 0.04, 11, 15));
  for (const eye of eyes) {
    const active = eye.index === activeSignal;
    const c = color(SIGNALS[eye.index].color);
    if (!active) c.setAlpha(95);
    noStroke(); fill(c);
    text(SIGNALS[eye.index].name, eye.x, cy + bodyH * 0.32);
  }
  textStyle(NORMAL);
}

function drawGuide() {
  noStroke(); fill(55, 55, 52, 115); textAlign(CENTER, CENTER); textSize(13);
  text(`クリックで切り替え　青 → 黄 → 赤　　現在：${SIGNALS[activeSignal].name}`, width * 0.5, height - 25);
}

function mousePressed() { return changeSignal(); }
function touchStarted() { return changeSignal(); }
function keyPressed() {
  if (key === " ") return changeSignal();
  if (key === "r" || key === "R") { activeSignal = 0; pulse = 1; return false; }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }

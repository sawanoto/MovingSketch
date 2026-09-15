const TIMING = Object.freeze({ gaze: 420, pause: 780, reveal: 420, after: 400, back: 430 });
let marpan, stage, cleanButton, caption;
let sequenceStart = -1, currentPoopEmitted = false, queuedPoops = 0, poops = [];
let currentOffsets = [[0, 0], [0, 0], [0, 0]];

function setup() {
  stage = document.querySelector("#stage");
  const box = stage.getBoundingClientRect();
  const canvas = createCanvas(box.width, box.height);
  canvas.parent("canvasHost");
  pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
  marpan = new Marpan25D({ id: "marpan-poop", expression: "pupil", autoBlink: true });
  marpan.enableAutoBlink(2600, 4600);
  marpan.setExpressionState("normal");
  cleanButton = document.querySelector("#cleanButton");
  caption = document.querySelector("#caption");
  cleanButton.addEventListener("click", cleanUp);
  updateCleanButton();
}

function draw() {
  background("#f5f1e9");
  drawBackdrop();
  updatePooping();
  drawPoops();
  drawSharedMarpan();
}

function startPooping() {
  if (sequenceStart >= 0) {
    queuedPoops = min(queuedPoops + 1, 8);
    caption.textContent = `次のうんち待ち × ${queuedPoops}`;
    return;
  }
  sequenceStart = millis();
  currentPoopEmitted = false;
  caption.textContent = "…………";
}

function updatePooping() {
  if (sequenceStart < 0) return applyPreset("normal", 0.14);
  const t = millis() - sequenceStart;
  const poopAt = TIMING.gaze + TIMING.pause;
  const backAt = poopAt + TIMING.reveal + TIMING.after;
  const endAt = backAt + TIMING.back;
  if (t < TIMING.gaze) applyPreset("pooping", ease(t / TIMING.gaze));
  else if (t < backAt) {
    applyPreset("pooping", 1);
    if (!currentPoopEmitted) addPoop(poopAt, t);
  } else if (t < endAt) applyPreset("normal", ease((t - backAt) / TIMING.back));
  else finishSequence();
}

function applyPreset(name, amount) {
  const preset = Marpan25D.EXPRESSION_PRESETS[name];
  for (let i = 0; i < 3; i++) {
    currentOffsets[i][0] = lerp(currentOffsets[i][0], preset[i][0], amount);
    currentOffsets[i][1] = lerp(currentOffsets[i][1], preset[i][1], amount);
    marpan.setPupilOffset(i, currentOffsets[i][0], currentOffsets[i][1]);
  }
  marpan.expressionState = name;
}

function addPoop(poopAt, elapsed) {
  if (elapsed < poopAt) return;
  currentPoopEmitted = true;
  const bodyW = getBodyWidth(), count = poops.length;
  const side = count % 2 === 0 ? 1 : -1, ring = floor(count / 2);
  poops.push({
    sequence: sequenceStart, born: millis(),
    xOffset: side * bodyW * (0.35 + min(ring, 4) * 0.105),
    yOffset: (ring % 2) * 10,
    rotation: random(-0.16, 0.16), scale: random(0.84, 1.13)
  });
  caption.textContent = `休符が ${poops.length} 個になりました`;
  updateCleanButton();
}

function finishSequence() {
  marpan.setExpressionState("normal");
  currentOffsets = [[0, 0], [0, 0], [0, 0]];
  sequenceStart = -1;
  if (queuedPoops > 0) { queuedPoops--; startPooping(); }
  else caption.textContent = "もう一度タップできます";
}

function cleanUp(event) {
  event.stopPropagation();
  poops = [];
  queuedPoops = 0;
  caption.textContent = "キレイになりました";
  updateCleanButton();
}

function updateCleanButton() {
  cleanButton.disabled = poops.length === 0;
  cleanButton.textContent = poops.length ? `キレイにする（${poops.length}）` : "キレイにする";
}

function getBodyWidth() { return min(width * 0.68, height * 0.64, 520); }

function drawSharedMarpan() {
  const bodyW = getBodyWidth();
  const held = sequenceStart >= 0 && millis() - sequenceStart > 700;
  const squeeze = held ? 1 + sin((millis() - sequenceStart) * 0.018) * 0.006 : 1;
  marpan.drawAt(width / 2, height * 0.49, {
    bodyWidth: bodyW, bodyHeight: bodyW * 0.68,
    scaleX: squeeze, scaleY: 2 - squeeze,
    lookX: width / 2, lookY: height * 0.49, expression: "pupil"
  });
}

function drawBackdrop() {
  noStroke();
  for (let i = 8; i > 0; i--) {
    fill(255, 255, 255, 9 + i * 2);
    circle(width / 2, height * 0.45, min(width, height) * i * 0.18);
  }
  fill(36, 33, 29, 20);
  ellipse(width / 2, height * 0.76, min(width * 0.5, 390), 24);
}

function drawPoops() {
  const floorY = height * 0.75;
  for (const poop of poops) {
    const p = ease(constrain((millis() - poop.born) / TIMING.reveal, 0, 1));
    push();
    translate(width / 2 + poop.xOffset, lerp(floorY - 40, floorY + poop.yOffset, p));
    rotate(poop.rotation);
    scale(lerp(0.15, poop.scale, p));
    drawRest();
    pop();
  }
}

function drawRest() {
  stroke("#24211d"); strokeWeight(max(4, getBodyWidth() * 0.014)); strokeCap(ROUND); noFill();
  beginShape();
  vertex(4, -42); vertex(-9, -19); vertex(9, -12); vertex(-5, 5); vertex(10, 14); vertex(1, 28);
  endShape();
  noStroke(); fill("#24211d"); ellipse(2, 31, 26, 10);
}

function ease(t) {
  t = constrain(t, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - pow(-2 * t + 2, 3) / 2;
}

function mousePressed(event) {
  if (event?.target === cleanButton) return;
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) startPooping();
}
function touchStarted(event) {
  if (event?.target === cleanButton) return true;
  if (touches.length) startPooping();
  return false;
}
function keyPressed() { if (key === " ") { startPooping(); return false; } }
function windowResized() {
  const box = stage.getBoundingClientRect();
  resizeCanvas(box.width, box.height);
}

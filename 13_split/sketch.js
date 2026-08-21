const SPLIT_DURATION = 820;
const MERGE_DURATION = 1050;
const MERGE_COUNT = 64;

let marpans = [];
let splitting = false;
let splitStartedAt = 0;
let generation = 0;
let splitProgress = 1;
let splitAxis = "horizontal";
let merging = false;
let mergeStartedAt = 0;
let marpanDesign;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont("sans-serif");
  marpanDesign = new Marpan25D();
  resetSplit();
}

function resetSplit() {
  generation = 0;
  splitting = false;
  merging = false;
  marpans = [makeMarpan(width * 0.5, height * 0.5, 0)];
  assignTargets(marpans);
}

function makeMarpan(x, y, branch) {
  return { x, y, startX: x, startY: y, targetX: x, targetY: y, branch };
}

function draw() {
  background(245, 245, 242);
  drawHeading();

  if (splitting) splitProgress = updateSplit();
  else if (merging) updateMerge();
  else settlePositions();

  if (splitting && splitProgress < 0.5) {
    const pulse = sin(map(splitProgress, 0, 0.5, 0, PI));
    const parentW = bodyWidth(marpans.length / 2);
    for (const parent of pairCenters()) {
      const scaleX = splitAxis === "horizontal" ? 1 + pulse * 0.3 : 1 - pulse * 0.12;
      const scaleY = splitAxis === "vertical" ? 1 + pulse * 0.3 : 1 - pulse * 0.12;
      drawGroundShadow(parent.x, parent.y, parentW * scaleX);
      marpanDesign.drawAt(parent.x, parent.y, { bodyWidth: parentW, scaleX, scaleY, pinch: pulse, lookX: parent.x, lookY: parent.y });
    }
  } else {
    const bodyW = bodyWidth(marpans.length);
    for (const marpan of marpans) {
      drawGroundShadow(marpan.x, marpan.y, bodyW);
      marpanDesign.drawAt(marpan.x, marpan.y, { bodyWidth: bodyW, lookX: marpan.x, lookY: marpan.y });
    }
  }

  drawCounter();
  drawGuide();
}

function startSplit() {
  if (splitting || merging || marpans.length >= MERGE_COUNT) return;

  splitAxis = generation % 2 === 0 ? "horizontal" : "vertical";
  const children = [];
  for (const parent of marpans) {
    children.push(makeMarpan(parent.x, parent.y, -1));
    children.push(makeMarpan(parent.x, parent.y, 1));
  }
  marpans = children;
  generation++;
  assignTargets(marpans);
  splitStartedAt = millis();
  splitProgress = 0;
  splitting = true;
}

function startMerge() {
  if (splitting || merging || marpans.length < MERGE_COUNT) return;
  for (const marpan of marpans) {
    marpan.startX = marpan.x;
    marpan.startY = marpan.y;
  }
  mergeStartedAt = millis();
  merging = true;
}

function updateMerge() {
  const raw = constrain((millis() - mergeStartedAt) / MERGE_DURATION, 0, 1);
  const movement = easeInOutCubic(raw);
  const spiral = sin(raw * PI) * (1 - raw) * 34;

  for (let i = 0; i < marpans.length; i++) {
    const marpan = marpans[i];
    const angle = TWO_PI * i / marpans.length;
    marpan.x = lerp(marpan.startX, width * 0.5, movement) + cos(angle) * spiral;
    marpan.y = lerp(marpan.startY, height * 0.5, movement) + sin(angle) * spiral;
  }

  if (raw >= 1) {
    generation = 0;
    merging = false;
    marpans = [makeMarpan(width * 0.5, height * 0.5, 0)];
    assignTargets(marpans);
  }
}

function updateSplit() {
  const raw = constrain((millis() - splitStartedAt) / SPLIT_DURATION, 0, 1);
  const movement = easeInOutCubic(raw);
  const separation = smoothstep(0.24, 1, raw);
  const bodyW = bodyWidth(marpans.length / 2);

  for (const child of marpans) {
    const preSplitStretch = sin(constrain(raw / 0.48, 0, 1) * PI) * (1 - separation);
    const splitDistance = bodyW * 0.23 * child.branch * preSplitStretch;
    child.x = lerp(child.startX, child.targetX, movement) + (splitAxis === "horizontal" ? splitDistance : 0);
    child.y = lerp(child.startY, child.targetY, movement) + (splitAxis === "vertical" ? splitDistance * 0.68 : 0);
  }

  if (raw >= 1) splitting = false;
  return raw;
}

function pairCenters() {
  const parents = [];
  for (let i = 0; i < marpans.length; i += 2) {
    parents.push({
      x: (marpans[i].startX + marpans[i + 1].startX) * 0.5,
      y: (marpans[i].startY + marpans[i + 1].startY) * 0.5
    });
  }
  return parents;
}

function settlePositions() {
  for (const marpan of marpans) {
    marpan.x = lerp(marpan.x, marpan.targetX, 0.16);
    marpan.y = lerp(marpan.y, marpan.targetY, 0.16);
  }
}

function assignTargets(items) {
  const layout = targetLayout(items.length);
  for (let i = 0; i < items.length; i++) {
    items[i].startX = items[i].x;
    items[i].startY = items[i].y;
    items[i].targetX = layout[i].x;
    items[i].targetY = layout[i].y;
  }
}

function targetLayout(count) {
  if (count === 1) return [{ x: width * 0.5, y: height * 0.5 }];

  const columns = pow(2, ceil(generation / 2));
  const rows = pow(2, floor(generation / 2));
  const areaTop = 72;
  const areaBottom = height - 54;
  const cellW = width / columns;
  const cellH = (areaBottom - areaTop) / rows;
  const points = [];

  for (let i = 0; i < count; i++) {
    const column = i % columns;
    const row = floor(i / columns);
    points.push({
      x: (column + 0.5) * cellW,
      y: areaTop + (row + 0.5) * cellH
    });
  }
  return points;
}

function bodyWidth(count) {
  if (count === 1) return min(290, width * 0.56, (height - 126) * 0.72);
  const itemGeneration = round(log(count) / log(2));
  const columns = pow(2, ceil(itemGeneration / 2));
  const rows = pow(2, floor(itemGeneration / 2));
  const cellW = width / columns;
  const cellH = (height - 126) / rows;
  return min(290, cellW * 0.76, cellH * 0.76 / 0.68);
}

function drawGroundShadow(cx, cy, bodyW) {
  noStroke(); fill(90, 90, 86, 20);
  ellipse(cx, cy + bodyW * 0.68 * 0.54, bodyW * 0.56, max(7, bodyW * 0.04));
}

function drawHeading() {
  noStroke(); fill(45, 45, 43, 165); textAlign(CENTER, CENTER); textStyle(BOLD);
  textSize(constrain(width * 0.03, 16, 23));
  text("マーパンの細胞分裂", width * 0.5, 34);
  textStyle(NORMAL);
}

function drawCounter() {
  noStroke(); fill(25, 25, 23, 190); textAlign(LEFT, CENTER); textStyle(BOLD);
  textSize(15); text(`${marpans.length}体`, 20, height - 24); textStyle(NORMAL);
}

function drawGuide() {
  const nextDirection = generation % 2 === 0 ? "左右" : "上下";
  const message = merging
    ? "64体がひとつに合体中…"
    : marpans.length >= MERGE_COUNT
      ? "クリック：ひとつに合体　R：はじめから"
      : `クリック：${nextDirection}に分裂　R：はじめから`;
  noStroke(); fill(55, 55, 52, 120); textAlign(RIGHT, CENTER); textSize(13);
  text(message, width - 20, height - 24);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - pow(-2 * t + 2, 3) / 2;
}

function smoothstep(edge0, edge1, value) {
  const t = constrain((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function activate() {
  if (marpans.length >= MERGE_COUNT) startMerge();
  else startSplit();
  return false;
}

function mousePressed() { return activate(); }
function touchStarted() { return activate(); }
function keyPressed() {
  if (key === " ") return activate();
  if (key === "r" || key === "R") { resetSplit(); return false; }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  assignTargets(marpans);
  if (!splitting) for (const marpan of marpans) { marpan.x = marpan.targetX; marpan.y = marpan.targetY; }
}

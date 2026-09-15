let layout = {};
let parcels = [];
let held = null;
let nextSpawnAt = 0;
let beltPhase = 0;
let firstAction = false;
let audio = null;
let lastPointerX = 0;
let lastPointerY = 0;

const BELT_SPEED = 42;
const FEED_SPEED = 54;
const SPAWN_GAP = 1750;

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("sketch");
  pixelDensity(min(window.devicePixelRatio || 1, 2));
  frameRate(60);
  layoutScene();
  spawnMarpan(true);
  nextSpawnAt = millis() + SPAWN_GAP;
}

function layoutScene() {
  const s = min(width, height);
  const beltW = constrain(s * 0.205, 126, 190);
  const beltH = constrain(s * 0.16, 96, 142);
  const gap = constrain(s * 0.075, 42, 67);
  const endY = height * 0.49;
  const verticalX = constrain(width * 0.66, width * 0.55, width - beltW * 0.72 - 18);
  const verticalTop = -32;
  const horizontalRight = verticalX - beltW * 0.5 - gap;
  const horizontalLeft = -35;
  layout = {
    s, beltW, beltH, gap, verticalX, verticalTop, endY,
    horizontalLeft, horizontalRight,
    horizontalY: endY + beltH * 0.13,
    marpanW: constrain(s * 0.125, 72, 112)
  };
}

function draw() {
  const dt = min(deltaTime / 1000, 0.035);
  beltPhase = (beltPhase + BELT_SPEED * dt) % 40;
  drawFactory();
  drawVerticalBelt();
  drawHorizontalBelt();
  updateParcels(dt);
  drawParcels();
  drawGapDetails();
  if (millis() >= nextSpawnAt) {
    spawnMarpan(false);
    nextSpawnAt = millis() + SPAWN_GAP;
  }
}

function drawFactory() {
  background(25, 29, 29);
  noStroke();
  for (let y = 0; y < height; y += 64) {
    fill(y % 128 === 0 ? 28 : 26, y % 128 === 0 ? 32 : 30, 31);
    rect(0, y, width, 64);
  }
  stroke(255, 10);
  strokeWeight(1);
  for (let x = 30; x < width; x += 96) line(x, 0, x, height);
  noStroke();
  fill(0, 38);
  rect(0, layout.endY + layout.beltH * .9, width, height);
}

function drawVerticalBelt() {
  const x = layout.verticalX - layout.beltW / 2;
  const h = layout.endY - layout.verticalTop;
  drawBeltBase(x, layout.verticalTop, layout.beltW, h);
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(x + 9, layout.verticalTop, layout.beltW - 18, h);
  drawingContext.clip();
  noStroke();
  for (let y = layout.verticalTop - 38 + beltPhase; y < layout.endY + 40; y += 40) {
    fill(113, 119, 114, 105);
    rect(x + 12, y, layout.beltW - 24, 5, 2);
  }
  drawingContext.restore();
  drawEndRoller(layout.verticalX, layout.endY, layout.beltW - 10, "horizontal");
}

function drawHorizontalBelt() {
  const y = layout.horizontalY - layout.beltH / 2;
  const w = layout.horizontalRight - layout.horizontalLeft;
  drawBeltBase(layout.horizontalLeft, y, w, layout.beltH);
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(layout.horizontalLeft, y + 9, w, layout.beltH - 18);
  drawingContext.clip();
  noStroke();
  for (let x = layout.horizontalLeft - 44 - beltPhase; x < layout.horizontalRight + 44; x += 40) {
    fill(113, 119, 114, 105);
    rect(x, y + 12, 5, layout.beltH - 24, 2);
  }
  drawingContext.restore();
  drawEndRoller(layout.horizontalRight, layout.horizontalY, layout.beltH - 10, "vertical");
}

function drawBeltBase(x, y, w, h) {
  noStroke(); fill(8, 10, 10, 80); rect(x + 8, y + 12, w, h, 5);
  stroke(8); strokeWeight(4); fill(66, 72, 69); rect(x, y, w, h, 5);
  noStroke(); fill(47, 52, 50); rect(x + 9, y + 9, w - 18, h - 18, 2);
  stroke(142, 146, 137, 80); strokeWeight(1); noFill(); rect(x + 9, y + 9, w - 18, h - 18, 2);
}

function drawEndRoller(cx, cy, length, axis) {
  // The long dimension is the roller's axle. Only its small end caps face us;
  // the belt itself curves around the barrel and disappears underneath.
  const radius = 17;
  const turn = beltPhase / 40 * TWO_PI;
  push(); translate(cx, cy);
  stroke(8); strokeWeight(3);
  if (axis === "horizontal") {
    fill(55, 61, 58);
    rect(-length / 2, -radius, length, radius * 2, 4);
    noStroke(); fill(40, 45, 43);
    arc(0, 0, length, radius * 2, 0, PI, CHORD);
    stroke(151, 156, 147, 65); strokeWeight(2);
    for (let x = -length / 2 + 20; x < length / 2; x += 28) {
      const offset = sin(turn + x * .04) * 4;
      line(x, -radius + 3 + offset, x, radius - 3 + offset);
    }
    stroke(8); strokeWeight(3); fill(80, 85, 80);
    ellipse(-length / 2, 0, 9, radius * 2);
    ellipse(length / 2, 0, 9, radius * 2);
    stroke(14); strokeWeight(3); line(-length / 2 - 8, 0, -length / 2 + 8, 0); line(length / 2 - 8, 0, length / 2 + 8, 0);
  } else {
    fill(55, 61, 58);
    rect(-radius, -length / 2, radius * 2, length, 4);
    noStroke(); fill(40, 45, 43);
    arc(0, 0, radius * 2, length, HALF_PI, PI + HALF_PI, CHORD);
    stroke(151, 156, 147, 65); strokeWeight(2);
    for (let y = -length / 2 + 20; y < length / 2; y += 28) {
      const offset = sin(turn + y * .04) * 4;
      line(-radius + 3 + offset, y, radius - 3 + offset, y);
    }
    stroke(8); strokeWeight(3); fill(80, 85, 80);
    ellipse(0, -length / 2, radius * 2, 9);
    ellipse(0, length / 2, radius * 2, 9);
    stroke(14); strokeWeight(3); line(0, -length / 2 - 8, 0, -length / 2 + 8); line(0, length / 2 - 8, 0, length / 2 + 8);
  }
  pop();
}

function drawGapDetails() {
  const gx = (layout.horizontalRight + layout.verticalX - layout.beltW * .5) * .5;
  stroke(226, 177, 53, 70); strokeWeight(2);
  for (let y = layout.endY + layout.beltH * .65; y < height; y += 24) {
    line(gx - 13, y, gx + 13, y + 13);
  }
}

function spawnMarpan(initial) {
  const verticals = parcels.filter(p => p.state === "vertical");
  const backY = verticals.length ? min(...verticals.map(p => p.y)) : Infinity;
  const spawnY = initial ? layout.verticalTop + 75 : min(-layout.marpanW, backY - layout.marpanW * .82);
  const m = new Marpan25D({
    x: layout.verticalX,
    y: spawnY,
    maxSize: layout.marpanW,
    bodyColor: "#eee9d5",
    autoBlink: true,
    autoBlinkMin: 2600,
    autoBlinkMax: 5600
  });
  parcels.push({ actor: m, x: m.x, y: m.y, vx: 0, vy: 0, state: "vertical", landedAt: 0 });
}

function updateParcels(dt) {
  const waitingY = layout.endY - layout.marpanW * .38;
  const spacing = layout.marpanW * .82;
  const verticals = parcels.filter(p => p.state === "vertical").sort((a, b) => b.y - a.y);
  for (let i = 0; i < verticals.length; i++) {
    const limit = i === 0 ? waitingY : verticals[i - 1].y - spacing;
    const oldY = verticals[i].y;
    verticals[i].y = min(limit, oldY + FEED_SPEED * dt);
    if (i === 0 && verticals[i].y >= waitingY - .5) {
      verticals[i].state = "falling";
      verticals[i].vy = FEED_SPEED;
      verticals[i].vx = random(-7, 7);
      playDrop();
    }
    // A tiny compression makes a stationary queue feel physical without jitter.
    verticals[i].compression = constrain((oldY + FEED_SPEED * dt - limit) / 10, 0, .055);
  }
  for (const p of parcels) {
    if (p === held) {
      p.x = lerp(p.x, mouseX, .48);
      p.y = lerp(p.y, mouseY - layout.marpanW * .18, .48);
      p.vx = (mouseX - lastPointerX) * 22;
      p.vy = (mouseY - lastPointerY) * 22;
    } else if (p.state === "vertical") {
      p.x = lerp(p.x, layout.verticalX, min(1, dt * 9));
    } else if (p.state === "horizontal") {
      p.x -= BELT_SPEED * dt;
      p.y = lerp(p.y, layout.horizontalY - layout.beltH * .47, min(1, dt * 9));
    } else if (p.state === "falling") {
      p.vy += 760 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= pow(.985, dt * 60);
    }
    p.actor.setPosition(p.x, p.y);
    p.actor.lookAt(held === p ? mouseX : p.x - 80, held === p ? mouseY : p.y + 8);
  }
  parcels = parcels.filter(p => p.x > -layout.marpanW * 1.2 && p.y < height + layout.marpanW * 1.5);
  lastPointerX = mouseX; lastPointerY = mouseY;
}

function drawParcels() {
  const ordered = parcels.slice().sort((a, b) => (a === held ? 1 : 0) - (b === held ? 1 : 0));
  for (const p of ordered) {
    push();
    if (p === held) {
      noStroke(); fill(0, 45); ellipse(p.x + 9, p.y + layout.marpanW * .38, layout.marpanW * .72, 14);
      p.actor.draw({ bodyWidth: layout.marpanW * 1.05, scaleY: 1.04, pulse: .65 });
    } else {
      const squeeze = p.state === "vertical" ? (p.compression || 0) : 0;
      p.actor.draw({ bodyWidth: layout.marpanW, scaleX: p.state === "falling" ? .96 : 1 + squeeze, scaleY: p.state === "falling" ? 1.04 : 1 - squeeze * .45 });
    }
    pop();
  }
}

function beginGrab(px, py) {
  startAudio();
  const waitingY = layout.endY - layout.marpanW * .38;
  for (let i = parcels.length - 1; i >= 0; i--) {
    const p = parcels[i];
    const nearEnd = p.state === "vertical" && p.y > waitingY - layout.marpanW * .65;
    if (nearEnd && dist(px, py, p.x, p.y) < layout.marpanW * .62) {
      held = p;
      p.state = "held";
      p.actor.bounce(.8);
      playPick();
      if (!firstAction) {
        firstAction = true;
        document.getElementById("instruction").classList.add("hidden");
      }
      return false;
    }
  }
  return false;
}

function releaseGrab(px, py) {
  if (!held) return false;
  const p = held;
  held = null;
  const top = layout.horizontalY - layout.beltH / 2;
  const bottom = top + layout.beltH;
  const bodyCenterY = py - layout.marpanW * .18;
  const bodyHalfW = layout.marpanW * .48;
  const bodyHalfH = layout.marpanW * .34;
  const validX = px + bodyHalfW > layout.horizontalLeft && px - bodyHalfW < layout.horizontalRight + 18;
  const validY = bodyCenterY + bodyHalfH > top && bodyCenterY - bodyHalfH < bottom;
  if (validX && validY) {
    p.state = "horizontal";
    p.x = min(px, layout.horizontalRight - layout.marpanW * .05);
    p.y = top - layout.marpanW * .32;
    p.vx = -BELT_SPEED; p.vy = 0;
    p.actor.bounce(.45);
    playPlace();
  } else {
    p.state = "falling";
    p.vx *= .16;
    p.vy = max(15, p.vy * .12);
    playDrop();
  }
  return false;
}

function mousePressed() { return beginGrab(mouseX, mouseY); }
function mouseReleased() { return releaseGrab(mouseX, mouseY); }
function touchStarted() { return beginGrab(mouseX, mouseY); }
function touchEnded() { return releaseGrab(mouseX, mouseY); }

function startAudio() {
  if (audio) {
    if (audio.ctx.state === "suspended") audio.ctx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  const ctx = new AC();
  const master = ctx.createGain(); master.gain.value = .19; master.connect(ctx.destination);
  const hum = ctx.createOscillator(); hum.type = "sawtooth"; hum.frequency.value = 43;
  const humGain = ctx.createGain(); humGain.gain.value = .055;
  const filter = ctx.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = 125;
  hum.connect(filter); filter.connect(humGain); humGain.connect(master); hum.start();
  const pulse = ctx.createOscillator(); pulse.type = "sine"; pulse.frequency.value = .78;
  const pulseGain = ctx.createGain(); pulseGain.gain.value = .018;
  pulse.connect(pulseGain); pulseGain.connect(master); pulse.start();
  audio = { ctx, master };
}

function tone(freq, duration, volume, type = "sine", endFreq = freq) {
  if (!audio) return;
  const now = audio.ctx.currentTime;
  const osc = audio.ctx.createOscillator();
  const gain = audio.ctx.createGain();
  osc.type = type; osc.frequency.setValueAtTime(freq, now); osc.frequency.exponentialRampToValueAtTime(max(1, endFreq), now + duration);
  gain.gain.setValueAtTime(volume, now); gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
  osc.connect(gain); gain.connect(audio.master); osc.start(now); osc.stop(now + duration);
}

function playPick() { tone(210, .075, .24, "sine", 285); }
function playPlace() { tone(145, .12, .29, "triangle", 82); setTimeout(() => tone(92, .08, .16, "sine", 65), 38); }
function playDrop() { tone(75, .2, .12, "triangle", 38); }

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  layoutScene();
  for (const p of parcels) p.actor.maxSize = layout.marpanW;
}

let baby;
let focusTarget = "baby";
let awaySince = 0;
let stageTimes = [];
let mood = 0;
let recovery = 1;
let wasCrying = false;
let recoveryCelebrated = true;
let nextReactionAt = 0;
let reaction = { type: "none", started: 0, duration: 0 };
let nextVoiceAt = 0;
let audioCtx = null;
let masterGain = null;
let layout = {};
let motes = [];
let hintTimer = 0;
let voiceText = "";
let voiceUntil = 0;

const CREAM = "#fffaf0";
const INK = "#302b28";
const ACCENT = "#e7a6a0";

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("sketch");
  pixelDensity(min(window.devicePixelRatio || 1, 2));
  frameRate(60);
  baby = new FamilyMarpan({
    familyRole: "baby",
    bodyScale: .53,
    eyeScale: 1.28,
    accessoryColor: "#6b5142",
    bodyColor: CREAM,
    autoBlink: true,
    autoBlinkMin: 2400,
    autoBlinkMax: 5200
  });
  layoutScene();
  resetAwaySchedule();
  nextReactionAt = millis() + random(1500, 3300);
  for (let i = 0; i < 18; i++) motes.push({ x: random(1), y: random(1), r: random(2, 7), phase: random(TWO_PI) });
  hintTimer = millis() + 700;
}

function layoutScene() {
  const compact = width < 680;
  const short = height < 620;
  const s = min(width, height);
  const babyW = constrain(min(width * (compact ? .59 : .35), height * (short ? .53 : .43)), 178, 410);
  const floorY = height * (compact ? .70 : .72);
  layout = {
    compact, short, s, babyW, floorY,
    babyX: width * .5,
    babyY: floorY - babyW * .34,
    tv: compact ? { x: width * .18, y: height * .19, w: min(width * .27, 120), h: min(width * .19, 82) }
                : { x: width * .16, y: height * .30, w: min(width * .19, 190), h: min(width * .125, 125) },
    phone: compact ? { x: width * .80, y: height * .20, w: 47, h: 78 }
                   : { x: width * .83, y: height * .35, w: 58, h: 98 },
    book: compact ? { x: width * .78, y: floorY + 54, w: min(width * .25, 105), h: 57 }
                  : { x: width * .78, y: floorY + 55, w: min(width * .15, 150), h: 78 }
  };
  baby.maxSize = babyW;
}

function draw() {
  const dt = min(deltaTime / 1000, .05);
  updateState(dt);
  drawRoom();
  drawAttentionObjects();
  drawBaby();
  drawVoice();
  updateHint();
}

function updateState(dt) {
  if (focusTarget === "baby") {
    const before = recovery;
    recovery = min(1, recovery + dt * (wasCrying ? .115 : .34));
    mood = lerp(mood, 0, min(1, dt * 2.2));
    if (!recoveryCelebrated && before < .985 && recovery >= .985) {
      wasCrying = false;
      recoveryCelebrated = true;
      reaction = { type: "giggle", started: millis(), duration: 1150 };
      baby.bounce(.9);
      playGiggle();
      nextReactionAt = millis() + random(3500, 5800);
    }
    if (recovery > .72 && millis() >= nextReactionAt) triggerHappyReaction();
  } else {
    const elapsed = millis() - awaySince;
    let targetMood = 0;
    for (let i = 0; i < stageTimes.length; i++) if (elapsed >= stageTimes[i]) targetMood = i + 1;
    mood = lerp(mood, targetMood, min(1, dt * .9));
    recovery = 0;
    if (targetMood >= 6) wasCrying = true;
    if (targetMood >= 5 && millis() >= nextVoiceAt) {
      if (targetMood >= 6) playCry(); else playWhimper();
      nextVoiceAt = millis() + (targetMood >= 6 ? random(2200, 3900) : random(3000, 5200));
    }
  }
}

function resetAwaySchedule() {
  // The whole emotional arc completes in about five seconds. Its exact pace
  // still varies slightly so repeated glances away do not feel clockwork-like.
  const cryAt = random(4700, 5300);
  stageTimes = [.14, .30, .46, .62, .78, 1].map(point => cryAt * point);
}

function triggerHappyReaction() {
  const types = ["bounce", "sway", "kick", "sparkle", "giggle"];
  reaction = { type: random(types), started: millis(), duration: random(650, 1250) };
  baby.bounce(random(.5, 1));
  if (reaction.type === "giggle" || random() < .38) playGiggle();
  nextReactionAt = millis() + random(2600, 6100);
}

function reactionAmount() {
  const age = millis() - reaction.started;
  if (age < 0 || age > reaction.duration) return 0;
  return sin(age / reaction.duration * PI);
}

function drawRoom() {
  background("#f3e7d0");
  noStroke();
  fill("#f7eedc"); rect(0, 0, width, layout.floorY);
  fill("#dec9aa"); rect(0, layout.floorY, width, height - layout.floorY);
  fill(125, 91, 63, 13);
  for (let x = -60; x < width + 80; x += 120) quad(x, layout.floorY, x + 55, layout.floorY, x + 145, height, x + 80, height);
  fill(255, 250, 232, 90);
  for (const m of motes) circle(m.x * width, m.y * layout.floorY + sin(frameCount * .008 + m.phase) * 5, m.r);
  noFill(); stroke(174, 128, 100, 33); strokeWeight(2);
  arc(width * .5, layout.floorY + 35, min(width * .72, 720), min(height * .23, 150), PI, TWO_PI);
}

function drawAttentionObjects() {
  drawTV(layout.tv, focusTarget === "tv");
  drawPhone(layout.phone, focusTarget === "phone");
  drawBook(layout.book, focusTarget === "book");
}

function selectedGlow(active, x, y, w, h) {
  if (!active) return;
  noStroke(); fill(255, 221, 125, 45 + sin(millis() * .005) * 18);
  ellipse(x, y, w * 1.55, h * 1.5);
}

function drawTV(o, active) {
  selectedGlow(active, o.x, o.y, o.w, o.h);
  push(); translate(o.x, o.y);
  stroke(INK); strokeWeight(max(2, o.w * .022)); strokeJoin(ROUND);
  fill("#876f5c"); rect(-o.w / 2, -o.h / 2, o.w, o.h, 10);
  fill(active ? "#9bc7c8" : "#b9c9c3"); rect(-o.w * .41, -o.h * .37, o.w * .66, o.h * .62, 7);
  noStroke(); fill(255, active ? 95 : 45);
  for (let i = 0; i < 3; i++) rect(-o.w * .37, -o.h * .27 + i * o.h * .16, o.w * .57, o.h * .055, 2);
  stroke(INK); strokeWeight(2); fill("#dbc47e"); circle(o.w * .36, -o.h * .14, o.w * .09); circle(o.w * .36, o.h * .1, o.w * .09);
  line(-o.w * .26, o.h * .51, -o.w * .32, o.h * .7); line(o.w * .25, o.h * .51, o.w * .31, o.h * .7);
  pop();
}

function drawPhone(o, active) {
  selectedGlow(active, o.x, o.y, o.w, o.h);
  push(); translate(o.x, o.y); rotate(-.08);
  stroke(INK); strokeWeight(3); fill("#5e5854"); rect(-o.w / 2, -o.h / 2, o.w, o.h, o.w * .18);
  noStroke(); fill(active ? "#efb6aa" : "#c9b9b0"); rect(-o.w * .39, -o.h * .37, o.w * .78, o.h * .67, o.w * .08);
  fill(255, active ? 105 : 55); circle(-o.w * .12, -o.h * .12, o.w * .25); rect(o.w * .05, -o.h * .2, o.w * .23, o.h * .06, 3);
  fill("#d8d0c7"); circle(0, o.h * .4, o.w * .1);
  pop();
}

function drawBook(o, active) {
  selectedGlow(active, o.x, o.y, o.w, o.h);
  push(); translate(o.x, o.y);
  stroke(INK); strokeWeight(2); strokeJoin(ROUND);
  fill(active ? "#e6ae76" : "#c99568");
  beginShape(); vertex(0, -o.h * .35); vertex(-o.w * .5, -o.h * .48); vertex(-o.w * .47, o.h * .42); vertex(0, o.h * .3); endShape(CLOSE);
  fill(active ? "#efbd82" : "#d4a275");
  beginShape(); vertex(0, -o.h * .35); vertex(o.w * .5, -o.h * .48); vertex(o.w * .47, o.h * .42); vertex(0, o.h * .3); endShape(CLOSE);
  stroke(255, 235, 205, 125); strokeWeight(2); line(-o.w * .36, -o.h * .2, -o.w * .1, -o.h * .14); line(o.w * .1, -o.h * .13, o.w * .36, -o.h * .2);
  pop();
}

function drawBaby() {
  const p = getPose();
  const w = layout.babyW;
  const h = w * .68;
  const x = layout.babyX + p.x;
  const y = layout.babyY + p.y;
  noStroke(); fill(78, 55, 41, 25); ellipse(layout.babyX, layout.floorY + 5, w * .67, h * .18);

  push(); translate(x, y); rotate(p.rotation);
  drawLimbs(w, h, p);
  baby.setPosition(0, 0);
  baby.setEyeScale(p.eyeScale);
  baby.setExpression(p.expression);
  baby.lookAt(p.lookX, p.lookY);
  // FamilyMarpan's baby is defined at 53% of its family base size. Passing
  // the inverse keeps the on-screen size while retaining its tuft and eye ratio.
  baby.drawFamilyAt(0, 0, w / .53, {
    lookX: p.lookX,
    lookY: p.lookY,
    eyeScale: p.eyeScale,
    pulse: p.pulse,
    animated: true
  });
  drawCheeks(w, h, p);
  if (p.tears > 0) drawTears(w, h, p.tears);
  pop();
}

function getPose() {
  const t = millis() / 1000;
  const w = layout.babyW;
  let p = { x: 0, y: sin(t * 2) * 1.4, rotation: 0, eyeScale: 1.18, expression: "pupil", lookX: 0, lookY: 3, pulse: 0, tears: 0, limb: .08 };
  if (focusTarget === "baby") {
    if (wasCrying || recovery < .99) {
      if (recovery < .2) { p.expression = "crying"; p.tears = 1 - recovery * 2; p.x = sin(t * 24) * 2.2; }
      else if (recovery < .43) { p.expression = "worried"; p.tears = max(0, .65 - recovery); p.lookY = 18; }
      else if (recovery < .68) { p.expression = "pupil"; p.eyeScale = 1.1 + recovery * .15; p.lookY = -6; }
      else { p.expression = "surprised"; p.eyeScale = 1.27; p.pulse = sin(map(recovery, .68, 1, 0, PI)) * .75; }
    } else {
      const a = reactionAmount();
      p.lookY = -8;
      if (reaction.type === "bounce") { p.y -= abs(sin(t * 8)) * w * .035 * a; p.pulse = a * .7; }
      if (reaction.type === "sway") p.rotation = sin(t * 6) * .075 * a;
      if (reaction.type === "kick") p.limb = .2 + a * .85;
      if (reaction.type === "sparkle") { p.expression = "diamond"; p.eyeScale = 1.25; }
      if (reaction.type === "giggle") { p.expression = "happy"; p.y -= abs(sin(t * 10)) * 5 * a; }
    }
  } else {
    const m = mood;
    if (m < 1) { p.lookX = targetLocalX(); p.lookY = targetLocalY(); }
    else if (m < 2) { p.lookX = sin(t * .8) * 18; p.lookY = 7; p.eyeScale = 1.1; }
    else if (m < 3.3) { p.lookX = sin(t * 2.15) * w * .38; p.lookY = -12 + cos(t * 1.4) * 9; p.eyeScale = 1.14; }
    else if (m < 4.5) { p.lookX = sin(t * .55) * 15; p.lookY = 18; p.y += 3; p.eyeScale = 1.06; }
    else if (m < 5.35) { p.expression = "worried"; p.lookX = sin(t * 1.3) * 20; p.lookY = 12; p.rotation = sin(t * .9) * .025; }
    else if (m < 6) { p.expression = "crying"; p.tears = (m - 5.35) / .65 * .5; p.y += sin(t * 8) * 1.2; }
    else { p.expression = "crying"; p.tears = min(1, .55 + (m - 6) * .4); p.x = sin(t * 23) * 2.7; p.y += abs(sin(t * 7)) * 2; p.limb = .36; }
  }
  return p;
}

function targetLocalX() { const o = layout[focusTarget]; return o ? o.x - layout.babyX : 0; }
function targetLocalY() { const o = layout[focusTarget]; return o ? o.y - layout.babyY : 0; }

function drawLimbs(w, h, p) {
  const flap = sin(millis() * .018) * p.limb;
  stroke(INK); strokeWeight(max(4, w * .025)); strokeCap(ROUND); noFill();
  line(-w * .36, h * .19, -w * (.49 + flap * .06), h * (.31 - flap * .08));
  line(w * .36, h * .19, w * (.49 + flap * .06), h * (.31 + flap * .08));
  line(-w * .18, h * .43, -w * (.27 + flap * .05), h * (.55 + flap * .04));
  line(w * .18, h * .43, w * (.27 + flap * .05), h * (.55 - flap * .04));
  noStroke(); fill(CREAM);
  circle(-w * (.49 + flap * .06), h * (.31 - flap * .08), w * .075); circle(w * (.49 + flap * .06), h * (.31 + flap * .08), w * .075);
  circle(-w * (.27 + flap * .05), h * (.55 + flap * .04), w * .085); circle(w * (.27 + flap * .05), h * (.55 - flap * .04), w * .085);
}

function drawCheeks(w, h, p) {
  const visible = focusTarget === "baby" && recovery > .63 ? constrain((recovery - .63) * 3, 0, .52) : 0;
  if (!visible) return;
  noStroke(); fill(236, 147, 143, visible * 145);
  ellipse(-w * .29, h * .17, w * .11, h * .07); ellipse(w * .29, h * .17, w * .11, h * .07);
}

function drawTears(w, h, amount) {
  noStroke(); fill(105, 181, 215, 185 * amount);
  const fall = (millis() * .085) % max(16, h * .18);
  for (const ex of [-.205, 0, .205]) {
    ellipse(w * ex, h * .13 + fall, w * .045 * amount, h * .12 * amount);
    ellipse(w * ex, h * .14 + (fall + h * .1) % (h * .2), w * .025 * amount, h * .065 * amount);
  }
}

function drawVoice() {
  const age = millis() - reaction.started;
  let message = "";
  if (focusTarget === "baby" && recovery > .82 && reaction.type === "giggle" && age < reaction.duration) message = randomSeededLabel();
  else if (millis() < voiceUntil) message = voiceText;
  if (!message) return;
  const alpha = 145 + sin(millis() * .01) * 45;
  noStroke(); fill(92, 74, 66, alpha); textAlign(CENTER, CENTER); textSize(constrain(layout.babyW * .06, 13, 22));
  text(message, layout.babyX, layout.babyY - layout.babyW * .47);
}

function randomSeededLabel() { return reaction.duration > 900 ? "きゃっきゃ" : "キャッ"; }

function pickTarget(x, y) {
  const bw = layout.babyW, bh = bw * .68;
  if (dist(x, y, layout.babyX, layout.babyY) < bw * .57) return "baby";
  for (const key of ["tv", "phone", "book"]) {
    const o = layout[key];
    if (abs(x - o.x) < o.w * .75 && abs(y - o.y) < o.h * .8) return key;
  }
  return null;
}

function activateAt(x, y) {
  startAudio();
  const next = pickTarget(x, y);
  if (!next) return false;
  if (next === "baby") {
    const returning = focusTarget !== "baby";
    focusTarget = "baby";
    reaction = { type: "none", started: millis(), duration: 0 };
    if (returning) {
      recovery = wasCrying || mood > 4.7 ? 0 : .58;
      recoveryCelebrated = false;
      baby.bounce(.18);
      nextReactionAt = millis() + random(2800, 4300);
      if (mood > 2) playNotice();
    } else triggerHappyReaction();
  } else {
    if (focusTarget === "baby") {
      awaySince = millis();
      resetAwaySchedule();
      mood = 0;
    }
    focusTarget = next;
  }
  hideHint();
  return false;
}

function updateHint() {
  const hint = document.getElementById("whisper");
  if (millis() > hintTimer && hintTimer > 0) hint.classList.add("show");
}
function hideHint() { document.getElementById("whisper").classList.remove("show"); hintTimer = 0; }

function startAudio() {
  if (audioCtx) { if (audioCtx.state === "suspended") audioCtx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  audioCtx = new AC();
  masterGain = audioCtx.createGain(); masterGain.gain.value = .18; masterGain.connect(audioCtx.destination);
}

function voiceNote(freq, delay, duration, level, endRatio = .75, type = "sine") {
  if (!audioCtx) return;
  const at = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
  osc.type = type; osc.frequency.setValueAtTime(freq, at); osc.frequency.exponentialRampToValueAtTime(max(45, freq * endRatio), at + duration);
  gain.gain.setValueAtTime(.0001, at); gain.gain.exponentialRampToValueAtTime(level, at + .025); gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
  osc.connect(gain); gain.connect(masterGain); osc.start(at); osc.stop(at + duration + .03);
}

function playGiggle() {
  startAudio();
  voiceText = random() < .5 ? "キャッ" : "きゃっきゃ"; voiceUntil = millis() + 900;
  voiceNote(random(520, 610), 0, .11, .22, 1.3, "triangle");
  voiceNote(random(640, 730), .13, .13, .19, 1.18, "triangle");
  if (random() < .55) voiceNote(random(570, 680), .31, .12, .16, 1.25, "triangle");
}
function playNotice() { startAudio(); voiceNote(410, 0, .18, .12, 1.42, "triangle"); }
function playWhimper() { voiceText = "ふぇ…"; voiceUntil = millis() + 850; voiceNote(360, 0, .38, .1, .62, "triangle"); voiceNote(330, .44, .28, .07, .72, "sine"); }
function playCry() {
  voiceText = random() < .5 ? "ふぇーん" : "うぇーん"; voiceUntil = millis() + 1400;
  voiceNote(random(390, 440), 0, .55, .15, .52, "sawtooth");
  voiceNote(random(350, 405), .66, .62, .13, .5, "triangle");
}

function mouseMoved() { const t = pickTarget(mouseX, mouseY); cursor(t ? HAND : ARROW); }
function mousePressed() { return activateAt(mouseX, mouseY); }
function touchStarted() { return activateAt(mouseX, mouseY); }
function windowResized() { resizeCanvas(windowWidth, windowHeight); layoutScene(); }

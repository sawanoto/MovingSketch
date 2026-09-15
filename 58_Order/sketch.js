const SILENT = 0, WATCHING = 1, WHISPERING = 2, TALKING = 3, ARGUING = 4;
const STATE_POWER = [0, 0, 0.24, 0.62, 1.0];
const WORDS = {
  ja: ["…", "？", "！", "いや", "しかし", "それは", "賛成", "反対"],
  en: ["…", "?", "!", "NO", "BUT", "WELL", "AYE", "NAY"]
};
const PALETTE = ["#f5eddb", "#eee1c8", "#f2e7d3", "#e8dbc2", "#f7f0e2"];

let members = [], speaker;
let orderedAt = 0, frozenUntil = 0, seedAfter = 0, orderFlashUntil = 0;
let noise = 0, threshold = .68, overThresholdAt = 0, cycle = 0;
let audioCtx = null, murmurGain = null, murmurFilter = null, murmurSources = [];
let language = "ja", pointerX = 0, pointerY = 0, hasPointer = false;

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("sketch");
  pixelDensity(min(window.devicePixelRatio || 1, 2));
  frameRate(60);
  textFont("Yu Gothic, Hiragino Kaku Gothic ProN, sans-serif");
  buildChamber();
  callToOrder(true);
  document.getElementById("language").addEventListener("click", toggleLanguage);
}

function buildChamber() {
  members = [];
  const rows = [9, 12, 14, 15, 16];
  const top = height * .32, bottom = height * .88;
  rows.forEach((count, row) => {
    const t = row / (rows.length - 1);
    const y = lerp(top, bottom, pow(t, .88));
    const spread = lerp(width * .31, width * .86, t);
    for (let col = 0; col < count; col++) {
      const x = width * .5 + (col - (count - 1) / 2) * spread / max(1, count - 1);
    const size = constrain(lerp(min(width, height) * .045, min(width, height) * .078, t), 27, 62);
      const actor = new Marpan25D({ maxSize: size, bodyColor: random(PALETTE), autoBlink: false });
      members.push({
        actor, x, y, baseY: y, size, row, col, state: SILENT, stateAt: 0,
        wakeAt: 0, changeAt: 0, eyeStep: 0, eyeStepAt: 0,
        phrase: "…", phraseAt: 0, phase: random(TWO_PI), intensity: 0
      });
    }
  });
  members.sort((a, b) => a.y - b.y);
  speaker = new Marpan25D({ maxSize: constrain(min(width, height) * .13, 76, 128), bodyColor: "#fff8e8", autoBlink: false });
}

function draw() {
  updateAssembly();
  drawChamber();
  drawSpeaker();
  drawMembers();
  drawOrderFlash();
  updateAudio();
}

function updateAssembly() {
  const now = millis();
  const hardFreeze = now < frozenUntil;
  if (!hardFreeze) members.forEach(m => updateMember(m, now));

  const raw = members.reduce((sum, m) => sum + STATE_POWER[m.state], 0) / members.length;
  noise = hardFreeze ? 0 : lerp(noise, raw, .14);
  if (noise > threshold) {
    if (!overThresholdAt) overThresholdAt = now;
    if (now - overThresholdAt > random(320, 560)) callToOrder(false);
  } else overThresholdAt = 0;
}

function updateMember(m, now) {
  if (m.state === SILENT && now >= m.wakeAt) enterState(m, WATCHING);

  if (m.state === WATCHING) {
    if (now >= m.eyeStepAt) {
      m.eyeStep = (m.eyeStep + 1) % 3;
      m.eyeStepAt = now + random(420, 1050);
    }
    if (now > seedAfter) {
      const neighbors = talkingNeighbors(m);
      const elapsed = constrain((now - seedAfter) / 6500, 0, 1);
      const chance = .00032 + elapsed * .00064 + neighbors * .0024;
      if (random() < chance) enterState(m, WHISPERING);
    }
  } else if (m.state >= WHISPERING) {
    const neighbors = talkingNeighbors(m);
    const age = now - m.stateAt;
    if (now >= m.phraseAt) {
      m.phrase = random(WORDS[language]);
      m.phraseAt = now + random(700, 1800) / max(.75, m.state);
    }
    if (m.state === WHISPERING && age > 450 && random() < .0014 + neighbors * .0026) enterState(m, TALKING);
    else if (m.state === TALKING && age > 550 && random() < .0009 + neighbors * .0015) enterState(m, ARGUING);
    else if (random() < .00008 && m.state > WHISPERING) enterState(m, m.state - 1);
  }
  m.intensity = lerp(m.intensity, STATE_POWER[m.state], .09);
}

function talkingNeighbors(m) {
  let count = 0;
  const radius = min(width, height) * .25;
  for (const other of members) {
    if (other !== m && other.state >= WHISPERING && dist(m.x, m.y, other.x, other.y) < radius) count++;
  }
  return count;
}

function enterState(m, state) {
  m.state = state;
  m.stateAt = millis();
  m.phraseAt = millis() + random(100, 500);
  if (state === WATCHING) m.eyeStepAt = millis() + random(100, 700);
}

function callToOrder(initial) {
  const now = millis();
  cycle++;
  orderedAt = now;
  frozenUntil = now + random(1250, 1900);
  seedAfter = frozenUntil + random(450, 1300);
  threshold = random(.61, .74);
  overThresholdAt = 0;
  noise = 0;
  if (!initial) {
    orderFlashUntil = now + 1050;
    playGavel();
  }
  members.forEach(m => {
    m.state = SILENT; m.stateAt = now; m.intensity = 0;
    m.wakeAt = frozenUntil + random(120, 1200);
    m.eyeStep = floor(random(3)); m.eyeStepAt = m.wakeAt;
    m.phrase = "…"; m.actor.clearAllEyeSettings();
  });
}

function drawChamber() {
  background("#e9e1d3");
  noStroke(); fill("#d8cbb7"); rect(0, 0, width, height * .27);
  fill("#c9b99e"); rect(0, height * .255, width, height * .018);
  fill("#efe8dc"); quad(0, height * .27, width, height * .27, width, height, 0, height);
  stroke(113, 91, 64, 20); strokeWeight(1);
  for (let i = 0; i < 9; i++) line(width * i / 8, height, width * .5 + (i - 4) * width * .035, height * .27);
  noStroke(); fill(70, 49, 34, 18); ellipse(width * .5, height * .63, width * .9, height * .67);
  fill("#866548"); rect(width * .37, height * .105, width * .26, height * .135, 8);
  fill("#ad8861"); rect(width * .385, height * .125, width * .23, height * .105, 5);
  fill(255, 225); rect(width * .41, height * .142, width * .18, height * .008, 3);
}

function drawMembers() {
  const frozen = millis() < frozenUntil;
  members.forEach(m => {
    const speaking = !frozen && m.state >= WHISPERING;
    const amp = speaking ? (m.state - 1) * m.size * .012 : 0;
    const bob = speaking ? sin(millis() * (.009 + m.state * .002) + m.phase) * amp : 0;
    const xJitter = m.state === ARGUING ? sin(millis() * .018 + m.phase) * 2 : 0;
    m.actor.maxSize = m.size;
    m.actor.setPosition(m.x + xJitter, m.y + bob);
    setMemberEyes(m, frozen);

    noStroke(); fill(59, 43, 31, 28); ellipse(m.x + 3, m.y + m.size * .29, m.size * .78, m.size * .17);
    fill("#9a7655"); rect(m.x - m.size * .47, m.y + m.size * .18, m.size * .94, m.size * .25, 5);
    fill("#b9936c"); rect(m.x - m.size * .43, m.y + m.size * .17, m.size * .86, m.size * .075, 3);
    m.actor.draw({ bodyWidth: m.size, scaleX: 1 + m.intensity * sin(millis() * .013 + m.phase) * .035 });
    if (speaking && shouldShowBubble(m)) drawBubble(m);
  });
}

function setMemberEyes(m, frozen) {
  if (frozen || m.state === SILENT) {
    for (let i = 0; i < 3; i++) m.actor.setPupilOffset(i, 0, 0);
    return;
  }
  if (m.state === WATCHING) {
    const patterns = [[[-.22,0],[.18,.02],[-.08,.11]], [[.2,.02],[-.2,0],[.18,-.08]], [[-.1,.1],[-.05,-.08],[.23,.03]]];
    patterns[m.eyeStep].forEach((p, i) => m.actor.setPupilOffset(i, p[0], p[1]));
  } else {
    const side = sin(millis() * .002 + m.phase) > 0 ? .2 : -.2;
    for (let i = 0; i < 3; i++) m.actor.setPupilOffset(i, side * (i === 1 ? -.5 : 1), sin(m.phase + i) * .06);
  }
}

function shouldShowBubble(m) {
  const density = [.0, .0, .36, .48, .6][m.state];
  return noise < .3 ? randomSeedStable(m, 1.0) < density : randomSeedStable(m, .55) < density;
}

function randomSeedStable(m, speed) {
  return (sin(m.phase * 91.7 + floor(millis() / (800 / speed)) * 12.31) + 1) * .5;
}

function drawBubble(m) {
  const s = constrain(m.size * .24, 10, 18);
  const side = m.col % 2 ? 1 : -1;
  const bx = m.x + side * m.size * .38, by = m.y - m.size * .48;
  textSize(s); textAlign(CENTER, CENTER); textStyle(BOLD);
  const tw = textWidth(m.phrase) + s * 1.15, bh = s * 1.65;
  noStroke(); fill(255, 249, 237, 220); ellipse(bx, by, tw, bh);
  triangle(bx - side * 4, by + bh * .37, bx + side * 3, by + bh * .68, bx + side * 8, by + bh * .32);
  fill(47, 40, 34, 205); text(m.phrase, bx, by - 1); textStyle(NORMAL);
}

function drawSpeaker() {
  const striking = millis() < orderFlashUntil;
  const lift = striking ? -sin(constrain((millis() - orderedAt) / 500, 0, 1) * PI) * 10 : 0;
  const sx = width * .5, sy = height * .19 + lift;
  speaker.setPosition(sx, sy);
  speaker.maxSize = constrain(min(width, height) * .13, 76, 128);
  if (striking) {
    speaker.setEyeExpression(0, "angry"); speaker.setEyeExpression(1, "angry"); speaker.setEyeExpression(2, "angry");
  } else speaker.clearAllEyeSettings();
  speaker.lookAt(hasPointer ? pointerX : sx, hasPointer ? pointerY : height * .68);
  speaker.draw({ bodyWidth: speaker.maxSize, scaleX: striking ? 1.08 : 1 });
  drawGavel(sx + speaker.maxSize * .58, sy + speaker.maxSize * .16, striking);
}

function drawGavel(x, y, striking) {
  push(); translate(x, y); rotate(striking ? .75 : -.35);
  stroke("#493526"); strokeWeight(max(3, min(width,height) * .005)); strokeCap(ROUND); line(0, 0, 0, 30);
  noStroke(); fill("#745139"); rect(-15, -7, 30, 14, 3); fill("#a47a55"); rect(-11, -5, 22, 4, 2); pop();
}

function drawOrderFlash() {
  if (millis() >= orderFlashUntil) return;
  const age = millis() - orderedAt;
  const alpha = age < 650 ? 255 : map(age, 650, 1050, 255, 0);
  const size = constrain(min(width, height) * .105, 38, 86) * (1 + max(0, .16 - age / 1000));
  push(); textAlign(CENTER, CENTER); textStyle(BOLD); textSize(size);
  stroke(248, 239, 218, alpha); strokeWeight(max(5, size * .12)); fill(47, 36, 30, alpha);
  text(language === "ja" ? "静粛に！" : "ORDER!", width * .5, height * .36); pop();
}

function mousePressed() { activateAt(mouseX, mouseY); return false; }
function touchStarted() { activateAt(mouseX, mouseY); return false; }
function mouseMoved() { pointerX = mouseX; pointerY = mouseY; hasPointer = true; }
function mouseDragged() { pointerX = mouseX; pointerY = mouseY; hasPointer = true; return false; }
function touchMoved() { pointerX = mouseX; pointerY = mouseY; hasPointer = true; return false; }
function activateAt(x, y) {
  startAudio();
  const chairX = width * .5, chairY = height * .19;
  if (dist(x, y, chairX, chairY) < speaker.maxSize * .72) {
    callToOrder(false);
    return;
  }
  if (millis() < frozenUntil) return;
  let best = null, bestD = Infinity;
  for (const m of members) {
    const d = dist(x, y, m.x, m.y);
    if (d < m.size * .62 && d < bestD) { best = m; bestD = d; }
  }
  if (best) {
    enterState(best, max(WHISPERING, best.state));
    seedAfter = min(seedAfter, millis());
    best.actor.bounce(.9);
    playChirp(best.state);
  }
}

function toggleLanguage(event) {
  event.stopPropagation();
  language = language === "ja" ? "en" : "ja";
  const button = document.getElementById("language");
  button.textContent = language === "ja" ? "EN" : "JP";
  button.setAttribute("aria-label", language === "ja" ? "Switch to English" : "日本語に切り替える");
  document.documentElement.lang = language;
  document.title = language === "ja" ? "ORDER! — Ma-pan" : "ORDER! — Ma-pan Parliament";
  document.getElementById("sketch").setAttribute("aria-label", language === "ja"
    ? "マーパンたちが集う議場。議員をクリックすると発言し、議長をクリックすると静粛になります"
    : "A parliament of Ma-pans. Click a member to speak or the chair to call for order");
  members.forEach(m => { if (m.state >= WHISPERING) m.phrase = random(WORDS[language]); });
}

function startAudio() {
  if (audioCtx) { if (audioCtx.state === "suspended") audioCtx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  audioCtx = new AC();
  murmurGain = audioCtx.createGain(); murmurGain.gain.value = 0;
  murmurFilter = audioCtx.createBiquadFilter(); murmurFilter.type = "lowpass"; murmurFilter.frequency.value = 620;
  murmurGain.connect(murmurFilter); murmurFilter.connect(audioCtx.destination);
  for (let i = 0; i < 4; i++) {
    const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
    osc.type = i % 2 ? "triangle" : "sawtooth"; osc.frequency.value = 72 + i * 19; gain.gain.value = .035;
    osc.connect(gain); gain.connect(murmurGain); osc.start(); murmurSources.push(osc);
  }
}

function updateAudio() {
  if (!audioCtx || !murmurGain) return;
  const now = audioCtx.currentTime;
  const target = millis() < frozenUntil ? .0001 : noise * .13;
  murmurGain.gain.cancelScheduledValues(now); murmurGain.gain.setTargetAtTime(target, now, target < .001 ? .015 : .18);
  murmurFilter.frequency.setTargetAtTime(330 + noise * 900, now, .15);
  murmurSources.forEach((o, i) => o.detune.setTargetAtTime(sin(millis() * .0017 + i * 2) * (10 + noise * 55), now, .1));
}

function playGavel() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  [0, .2].forEach((delay, hit) => {
    const hitAt = now + delay;
    [620, 940, 1460, 2180].forEach((frequency, partial) => {
      const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
      osc.type = partial < 2 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(frequency * (1 + hit * .018), hitAt);
      osc.frequency.exponentialRampToValueAtTime(frequency * .94, hitAt + .24);
      const volume = [.13, .085, .04, .022][partial];
      gain.gain.setValueAtTime(.0001, hitAt);
      gain.gain.linearRampToValueAtTime(volume, hitAt + .004);
      gain.gain.exponentialRampToValueAtTime(.0001, hitAt + .22 + partial * .035);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(hitAt); osc.stop(hitAt + .38);
    });
  });
}

function playChirp(state) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime, osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
  osc.type = "triangle"; osc.frequency.value = 115 + state * 28;
  gain.gain.setValueAtTime(.055, now); gain.gain.exponentialRampToValueAtTime(.0001, now + .16);
  osc.connect(gain); gain.connect(audioCtx.destination); osc.start(now); osc.stop(now + .17);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  buildChamber();
  callToOrder(true);
}

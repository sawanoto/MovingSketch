const NOTES = [
  { label: "ド", freq: 261.63, color: "#ff6b6b" },
  { label: "レ", freq: 293.66, color: "#ff9f43" },
  { label: "ミ", freq: 329.63, color: "#ffd93d" },
  { label: "ファ", freq: 349.23, color: "#6bcb77" },
  { label: "ソ", freq: 392.00, color: "#4d96ff" },
  { label: "ラ", freq: 440.00, color: "#7b6cff" },
  { label: "シ", freq: 493.88, color: "#c56cf0" },
  { label: "ド", freq: 523.25, color: "#ff70a6" }
];

let marpan, audioContext, masterGain;
let melody = [], incoming = [], sparks = [], storedMotes = [];
let bodyPulse = 0, releasePulse = 0, releaseStartedAt = -9999, releasing = false, hoverBody = false;
let lastTouchAt = 0;

function setup() {
  const wrap = document.getElementById("canvas-wrap");
  const canvas = createCanvas(wrap.clientWidth, wrap.clientHeight);
  canvas.parent(wrap);
  pixelDensity(Math.min(devicePixelRatio || 1, 2));
  marpan = new Marpan25D({ x: width / 2, y: height * .48, maxSize: 455, bodyColor: "#fffdf7", autoBlink: true });
  marpan.enableAutoBlink(2400, 4800);
  makeKeys();
}

function makeKeys() {
  const holder = document.getElementById("keys");
  NOTES.forEach((note, index) => {
    const key = document.createElement("button");
    key.className = "key";
    key.textContent = note.label;
    key.style.setProperty("--note", note.color);
    key.setAttribute("aria-label", `${note.label}の音`);
    const play = e => { e.preventDefault(); key.setPointerCapture?.(e.pointerId); pressKey(index, key); };
    key.addEventListener("pointerdown", play);
    key.addEventListener("pointerup", () => key.classList.remove("pressed"));
    key.addEventListener("pointercancel", () => key.classList.remove("pressed"));
    holder.appendChild(key);
  });
}

function draw() {
  clear();
  const targetX = width / 2;
  const targetY = height * .49;
  marpan.setPosition(targetX, targetY);
  marpan.lookAt(mouseX || targetX, mouseY || targetY);
  hoverBody = insideBody(mouseX, mouseY);
  document.querySelector("canvas").style.cursor = hoverBody && melody.length && !releasing ? "pointer" : "default";

  drawAmbient();
  updateIncoming();
  updateSparks();
  bodyPulse *= .83;
  releasePulse *= .86;
  const storedScale = 1 + Math.min(melody.length, 32) * .0065;
  const wobble = bodyPulse * Math.sin(frameCount * .72);
  const releaseWobble = releasePulse * Math.sin(frameCount * .5);
  let sx = storedScale + wobble * .045 + releaseWobble * .035;
  let sy = storedScale - wobble * .028 - releaseWobble * .018;
  const releaseAge = millis() - releaseStartedAt;
  if (releaseAge >= 0 && releaseAge < 360) {
    if (releaseAge < 105) {
      const squeeze = easeOut(releaseAge / 105);
      sx *= lerp(1, .86, squeeze); sy *= lerp(1, .91, squeeze);
    } else {
      const bounce = Math.sin(map(releaseAge, 105, 360, 0, PI)) * (1 - (releaseAge - 105) / 510);
      sx *= 1 + bounce * .17; sy *= 1 + bounce * .13;
    }
  }

  push();
  translate(targetX, targetY);
  scale(sx, sy);
  translate(-targetX, -targetY);
  marpan.draw({ pulse: bodyPulse * .8 + releasePulse * 1.1 });
  drawStoredMotes();
  pop();

  drawIncoming();
  drawSparks();
  drawHint();
}

function bodySize() {
  const w = Math.min(width * .56, height * .63, 455);
  return { w, h: w * .68 };
}

function pressKey(index, element) {
  if (releasing) return;
  initAudio();
  playTone(NOTES[index].freq, .38, .12);
  melody.push(index);
  element.classList.add("pressed");
  setTimeout(() => element.classList.remove("pressed"), 130);
  const r = element.getBoundingClientRect();
  const canvasRect = document.querySelector("canvas").getBoundingClientRect();
  incoming.push({
    index, color: NOTES[index].color,
    x: r.left + r.width / 2 - canvasRect.left,
    y: height + 8,
    tx: width / 2 + random(-55, 55), ty: marpan.y + random(15, 55),
    t: 0, bend: random(-65, 65), spin: random(-.18, .18)
  });
}

function updateIncoming() {
  for (let i = incoming.length - 1; i >= 0; i--) {
    const n = incoming[i];
    n.t = Math.min(1, n.t + .028);
    if (n.t >= 1) {
      storedMotes.push({ color: n.color, phase: random(TWO_PI), radius: random(8, 50), speed: random(.006, .014), size: random(4, 9) });
      if (storedMotes.length > 22) storedMotes.shift();
      bodyPulse = 1;
      marpan.blink([floor(random(3))], 150);
      for (let k = 0; k < 7; k++) sparks.push(makeSpark(n.tx, n.ty, n.color, random(TWO_PI), random(.4, 1.8), 34));
      incoming.splice(i, 1);
    }
  }
}

function incomingPosition(n) {
  const t = 1 - Math.pow(1 - n.t, 2);
  return {
    x: lerp(n.x, n.tx, t) + Math.sin(n.t * PI) * n.bend,
    y: lerp(n.y, n.ty, t) - Math.sin(n.t * PI) * Math.min(90, height * .15)
  };
}

function drawIncoming() {
  incoming.forEach(n => {
    const p = incomingPosition(n);
    push(); translate(p.x, p.y); rotate(n.t * TWO_PI * n.spin);
    drawMusicNote(0, 0, 22 + n.t * 5, n.color, 255);
    noFill(); stroke(n.color + "55"); strokeWeight(3); circle(0, 0, 35 + n.t * 12); pop();
  });
}

function drawStoredMotes() {
  if (!storedMotes.length) return;
  const { w, h } = bodySize();
  storedMotes.forEach((m, i) => {
    const a = m.phase + frameCount * m.speed;
    const x = marpan.x + Math.cos(a * 1.3) * m.radius * 1.35;
    const y = marpan.y + h * .18 + Math.sin(a) * m.radius * .58;
    noStroke(); fill(m.color + "5e"); circle(x, y, m.size + Math.sin(a * 2) * 2);
    if (i % 5 === 0) drawMusicNote(x, y, 11, m.color, 72);
  });
  noFill(); stroke(255, 255, 255, 95); strokeWeight(2);
  arc(marpan.x, marpan.y + h * .2, w * .48, h * .28, .1, PI - .1);
}

function releaseMelody() {
  if (releasing || melody.length === 0) return;
  initAudio();
  releasing = true;
  releaseStartedAt = millis();
  const sequence = melody.slice();
  melody = [];
  storedMotes = [];
  releasePulse = 1;
  marpan.blink([0, 1, 2], 230);
  sequence.forEach((index, i) => {
    setTimeout(() => {
      const note = NOTES[index];
      playTone(note.freq, .3, .1);
      burstNote(index, i, sequence.length);
      releasePulse = Math.max(releasePulse, .52);
    }, 260 + i * 175);
  });
  setTimeout(() => { releasing = false; releasePulse = .65; }, 420 + sequence.length * 175);
}

function burstNote(index, step, total) {
  const note = NOTES[index];
  const angle = (step / Math.max(total, 7)) * TWO_PI - HALF_PI + random(-.3, .3);
  const { w } = bodySize();
  const x = marpan.x + Math.cos(angle) * w * .31;
  const y = marpan.y + Math.sin(angle) * w * .2;
  sparks.push({ ...makeSpark(x, y, note.color, angle, random(4.5, 7), 90), note: true, size: 25 });
  for (let k = 0; k < 9; k++) sparks.push(makeSpark(x, y, note.color, angle + random(-.7, .7), random(2, 5), 65));
}

function makeSpark(x, y, color, angle, speed, life) {
  return { x, y, color, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life, maxLife: life, size: random(3, 7), note: false };
}

function updateSparks() {
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i]; s.x += s.vx; s.y += s.vy; s.vy += s.note ? .015 : .025; s.vx *= .992; s.life--;
    if (s.life <= 0) sparks.splice(i, 1);
  }
}

function drawSparks() {
  sparks.forEach(s => {
    const alpha = 255 * Math.min(1, s.life / 18);
    if (s.note) drawMusicNote(s.x, s.y, s.size, s.color, alpha);
    else { noStroke(); fill(s.color + hex(floor(alpha), 2)); circle(s.x, s.y, s.size * (s.life / s.maxLife + .45)); }
  });
}

function drawMusicNote(x, y, size, color, alpha) {
  push(); translate(x, y); noStroke(); fill(color + hex(floor(alpha), 2));
  ellipse(-size * .18, size * .28, size * .46, size * .34);
  rect(-size * .02, -size * .48, size * .13, size * .72, size * .05);
  arc(size * .12, -size * .35, size * .48, size * .36, -HALF_PI, HALF_PI); pop();
}

function drawAmbient() {
  noStroke();
  for (let i = 0; i < 7; i++) {
    const x = width * (.12 + i * .127) + Math.sin(frameCount * .006 + i) * 9;
    const y = height * (.18 + (i % 3) * .16);
    fill(255, 214, 132, 18); circle(x, y, 18 + i * 5);
  }
}

function drawHint() {
  if (melody.length === 0 || releasing) return;
  const { h } = bodySize();
  const y = marpan.y - h * .67;
  const pulse = .75 + Math.sin(frameCount * .07) * .2;
  textAlign(CENTER, CENTER); textStyle(BOLD); textSize(Math.max(12, Math.min(17, width * .025)));
  noStroke(); fill(84, 73, 60, 180 * pulse); text("おして ぽんっ！", marpan.x, y);
}

function easeOut(t) { return 1 - Math.pow(1 - constrain(t, 0, 1), 3); }

function insideBody(x, y) {
  const { w, h } = bodySize();
  return Math.pow((x - marpan.x) / (w * .52), 2) + Math.pow((y - marpan.y) / (h * .56), 2) < 1;
}

function mousePressed() {
  if (millis() - lastTouchAt < 450) return;
  if (insideBody(mouseX, mouseY)) releaseMelody();
}

function touchStarted() {
  lastTouchAt = millis();
  if (touches[0] && insideBody(touches[0].x, touches[0].y)) releaseMelody();
  return false;
}

function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioContext.createGain(); masterGain.gain.value = .2; masterGain.connect(audioContext.destination);
  }
  if (audioContext.state === "suspended") audioContext.resume();
}

function playTone(freq, duration = .34, volume = .11) {
  if (!audioContext) return;
  const now = audioContext.currentTime;
  const osc = audioContext.createOscillator(), gain = audioContext.createGain();
  const overtone = audioContext.createOscillator(), overtoneGain = audioContext.createGain();
  osc.type = "sine"; osc.frequency.setValueAtTime(freq, now);
  overtone.type = "sine"; overtone.frequency.setValueAtTime(freq * 2, now);
  gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(volume, now + .012); gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
  overtoneGain.gain.setValueAtTime(.0001, now); overtoneGain.gain.exponentialRampToValueAtTime(volume * .16, now + .008); overtoneGain.gain.exponentialRampToValueAtTime(.0001, now + duration * .55);
  osc.connect(gain).connect(masterGain); overtone.connect(overtoneGain).connect(masterGain);
  osc.start(now); overtone.start(now); osc.stop(now + duration + .03); overtone.stop(now + duration + .03);
}

function windowResized() {
  const wrap = document.getElementById("canvas-wrap");
  resizeCanvas(wrap.clientWidth, wrap.clientHeight);
}

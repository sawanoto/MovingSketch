"use strict";

const SIDE_COUNT = 50;
const PALETTE = { paper: "#e9e7df", ink: "#171817", a: "#d95b45", b: "#426e9c" };
let crowd = [], player, host, startedAt = 0, choice = null, chosenAt = 0;
let audioContext = null;

function setup() {
  host = document.getElementById("sketch");
  const canvas = createCanvas(host.clientWidth, host.clientHeight);
  canvas.parent(host);
  pixelDensity(1);
  frameRate(45);
  buildCrowd();
  bindUI();
  startedAt = millis();
}

function buildCrowd() {
  crowd = [];
  ["A", "B"].forEach(side => {
    for (let i = 0; i < SIDE_COUNT; i++) {
      const m = new Marpan25D({ id: `${side}-${i}`, bodyColor: "#fbfaf5", expression: "pupil" });
      m.blinkStartedAt = -9999;
      const dust = Array.from({ length: 22 }, (_, n) => ({
        x: random(-.46, .46), y: random(-.44, .44),
        angle: random(-PI, PI), speed: random(.12, .48), size: random(.018, .055),
        delay: random(0, .26), seed: random(TWO_PI)
      }));
      crowd.push({
        side, index: i, marpan: m, phase: random(TWO_PI),
        blinkAt: random(900, 4300), blinkGap: random(2800, 6800),
        vanishDelay: random(0, 520), dust
      });
    }
  });
  player = new Marpan25D({ id: "the-last-one", bodyColor: "#fffef9", expression: "pupil" });
}

function bindUI() {
  document.getElementById("choose-a").addEventListener("click", () => decide("A"));
  document.getElementById("choose-b").addEventListener("click", () => decide("B"));
  document.getElementById("again").addEventListener("click", resetVote);
  window.addEventListener("keydown", event => {
    if (!choice && (event.key === "a" || event.key === "A")) decide("A");
    if (!choice && (event.key === "b" || event.key === "B")) decide("B");
    if (choice && event.key === "Escape") resetVote();
  });
}

function draw() {
  background(PALETTE.paper);
  const cx = width * .5, cy = height * .48;
  drawAtmosphere(cx, cy);
  const ordered = crowd.slice().sort((a, b) => crowdPosition(a).size - crowdPosition(b).size);
  ordered.forEach(member => drawMember(member, cx, cy));
  drawPlayer(cx, cy);
  if (choice && millis() - chosenAt > 3600) document.getElementById("again").hidden = false;
}

function crowdPosition(member) {
  const col = member.index % 5;
  const row = floor(member.index / 5);
  const sideSign = member.side === "A" ? -1 : 1;
  const depth = col / 4;
  const spreadX = lerp(width * .46, width * .27, depth);
  const baseX = width * .5 + sideSign * spreadX;
  const rowT = row / 9;
  const arc = sin(rowT * PI);
  const y = height * (.13 + rowT * .72) + (col % 2) * height * .012;
  const x = baseX + sideSign * (arc * width * .045 + (row % 2) * width * .008);
  const size = constrain(lerp(width * .034, width * .063, depth), 24, 76);
  return { x, y, size, sideSign, row, col };
}

function drawMember(member, cx, cy) {
  const p = crowdPosition(member);
  const elapsed = choice ? chosenAt - startedAt : millis() - startedAt;
  const pressure = choice ? constrain(elapsed / 24000, 0, 1) : constrain((elapsed - 2500) / 26000, 0, 1);
  const settle = choice ? constrain((millis() - chosenAt) / 900, 0, 1) : 0;
  const winner = member.side === choice;
  const inward = choice ? 0 : ease(pressure) * width * .016;
  let x = p.x - p.sideSign * inward;
  let y = p.y;
  const breathing = sin(millis() * .0012 + member.phase) * (1.7 - pressure * 1.15);
  const quiet = choice && !winner ? lerp(1, 0, settle) : 1;
  y += breathing * quiet;
  if (choice && winner) y += sin(millis() * .004 + member.phase) * 2.1 * settle;
  if (!choice && millis() > member.blinkAt) {
    member.marpan.blink([0,1,2], 150);
    member.blinkAt = millis() + member.blinkGap + random(-500, 500);
  }
  // Every body faces the audience. Only the pupils track the lone voter.
  const lookX = cx;
  const lookY = cy;
  const options = {
    bodyWidth: p.size, bodyHeight: p.size * .68, yaw: 0,
    lookX, lookY, eyeScale: choice && !winner ? 1.1 : lerp(.96, 1.08, pressure),
    bodyColor: choice && winner ? lerpColor(color("#fbfaf5"), color(member.side === "A" ? "#f5d8d1" : "#d9e5f0"), settle * .32) : "#fbfaf5"
  };

  if (choice && !winner) {
    drawVanishingMember(member, x, y, p.size, options);
  } else {
    member.marpan.drawAt(x, y, options);
  }
}

function drawVanishingMember(member, x, y, size, options) {
  const age = millis() - chosenAt - member.vanishDelay;
  if (age < 0) {
    member.marpan.drawAt(x, y, options);
    return;
  }
  const t = constrain(age / 1500, 0, 1);
  if (t >= 1) return;

  // The body leaves first. Its eyes remain intact and fixed on the voter.
  const bodyAlpha = 1 - constrain(t / .57, 0, 1);
  if (bodyAlpha > 0) {
    push();
    drawingContext.globalAlpha = bodyAlpha;
    member.marpan.drawAt(x, y, options);
    pop();
  }

  drawDust(member, x, y, size, t);

  const eyeStart = .38;
  const desiredEyeAlpha = t < eyeStart ? 1 : 1 - constrain((t - eyeStart) / (1 - eyeStart), 0, 1);
  // Add only the opacity lost with the fading body, so the eyes neither flash nor double up.
  const eyeAlpha = constrain(desiredEyeAlpha - bodyAlpha, 0, 1);
  if (eyeAlpha > 0) {
    push();
    drawingContext.globalAlpha = eyeAlpha;
    member.marpan.drawEyes(x, y, size, size * .68, 0, width * .5 - x, height * .48 - y, {
      eyeScale: 1.1, expression: "pupil"
    });
    pop();
  }
}

function drawDust(member, x, y, size, t) {
  noStroke();
  for (const mote of member.dust) {
    const mt = constrain((t - mote.delay) / (1 - mote.delay), 0, 1);
    if (mt <= 0 || mt >= 1) continue;
    const drift = size * mote.speed * ease(mt);
    const outward = member.side === "A" ? -1 : 1;
    const px = x + mote.x * size + cos(mote.angle) * drift + outward * drift * .55;
    const py = y + mote.y * size * .68 + sin(mote.angle) * drift - drift * .22 + sin(millis() * .004 + mote.seed) * 1.5;
    const alpha = sin(mt * PI) * 105;
    fill(35, 35, 33, alpha);
    circle(px, py, max(1.2, size * mote.size * (1 - mt * .35)));
  }
}

function drawPlayer(cx, cy) {
  const after = choice ? millis() - chosenAt : 0;
  const drop = choice ? sin(min(1, after / 700) * PI) * 2 : sin(millis() * .0014) * .8;
  const size = constrain(min(width * .13, height * .23), 88, 178);
  noStroke(); fill(20, 18); ellipse(cx, cy + size * .38, size * .72, size * .12);
  player.drawAt(cx, cy + drop, {
    bodyWidth: size, bodyHeight: size * .68, yaw: choice === "A" ? -.09 : choice === "B" ? .09 : 0,
    lookX: choice === "A" ? cx - size : choice === "B" ? cx + size : cx,
    lookY: cy, eyeScale: 1.05, bodyColor: "#fffef9"
  });
}

function drawAtmosphere(cx, cy) {
  noStroke();
  const halo = drawingContext.createRadialGradient(cx, cy, 10, cx, cy, min(width, height) * .7);
  halo.addColorStop(0, "rgba(255,255,252,.9)"); halo.addColorStop(1, "rgba(205,202,192,.16)");
  drawingContext.fillStyle = halo; rect(0, 0, width, height);
  stroke(23, 24, 23, 18); strokeWeight(1); line(cx, height * .06, cx, height * .9);
}

function decide(side) {
  if (choice) return;
  choice = side; chosenAt = millis();
  document.getElementById("score-a").textContent = side === "A" ? "51" : "50";
  document.getElementById("score-b").textContent = side === "B" ? "51" : "50";
  document.getElementById("choices").hidden = true;
  crowd.filter(m => m.side === side).forEach((m, i) => setTimeout(() => m.marpan.blink([0,1,2], 180), i * 9));
  player.blink([0,1,2], 260);
  playDrop();
}

function resetVote() {
  choice = null; chosenAt = 0; startedAt = millis();
  document.getElementById("score-a").textContent = "50";
  document.getElementById("score-b").textContent = "50";
  document.getElementById("choices").hidden = false;
  document.getElementById("again").hidden = true;
}

function playDrop() {
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const t = audioContext.currentTime, osc = audioContext.createOscillator(), gain = audioContext.createGain();
    osc.type = "sine"; osc.frequency.setValueAtTime(145, t); osc.frequency.exponentialRampToValueAtTime(72, t + .09);
    gain.gain.setValueAtTime(.0001, t); gain.gain.exponentialRampToValueAtTime(.07, t + .008); gain.gain.exponentialRampToValueAtTime(.0001, t + .13);
    osc.connect(gain).connect(audioContext.destination); osc.start(t); osc.stop(t + .14);
  } catch (_) {}
}

function ease(t) { return t * t * (3 - 2 * t); }
function windowResized() { resizeCanvas(host.clientWidth, host.clientHeight); }

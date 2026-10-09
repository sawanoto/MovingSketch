const PAGES = [
  { bg: "#fff8df", ink: "#4c402f", words: ["マーパン", "コロコロ"] },
  { bg: "#eaf8f2", ink: "#376b5c", words: ["コロ", "コロ", "コロロ"] },
  { bg: "#edf2ff", ink: "#53679b", words: ["コロン", "コロン", "コロロン"] },
  { bg: "#fff0ea", ink: "#a95043", words: ["コロッ", "コロッ", "コーン"] }
];

const EN_WORDS = ["rolrol", "rolrolroll", "rolrolrool", "rolrolrolln"];

let marpan;
let page = 0;
let phase = "waiting";
let phaseStarted = 0;
let finaleDone = false;
let audioContext = null;
let lastPointerAt = -1000;
let reducedMotion = false;
let language = "ja";

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight, P2D, document.getElementById("story"));
  pixelDensity(min(window.devicePixelRatio || 1, 2));
  textFont('"Hiragino Maru Gothic ProN", "Yu Gothic", "Noto Sans JP", sans-serif');
  marpan = new Marpan25D({ id: "common-marpan", maxSize: 360 });
  marpan.enableAutoBlink(2300, 4500);
  reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  canvas.elt.addEventListener("pointerdown", handleTap, { passive: false });
  const languageButton = document.getElementById("language");
  languageButton.addEventListener("pointerdown", event => event.stopPropagation());
  languageButton.addEventListener("click", toggleLanguage);
  phase = "playing";
  phaseStarted = millis() + 420;
}

function draw() {
  const now = millis();
  const pageStyle = PAGES[page];
  background(pageStyle.bg);
  drawPaperTexture(pageStyle.ink);

  push();
  if (page === 0) drawPageOne(now);
  if (page === 1) drawPageTwo(now);
  if (page === 2) drawPageThree(now);
  if (page === 3) drawPageFour(now);
  pop();
}

function handleTap(event) {
  event.preventDefault();
  const now = millis();
  if (now - lastPointerAt < 280 || phase !== "waiting") return;
  lastPointerAt = now;
  ensureAudio();

  page = (page + 1) % 4;
  finaleDone = false;
  phase = "playing";
  phaseStarted = now;
  playPageSound(page);
  announcePage();
}

function finishAfter(duration, hold = 620) {
  const elapsed = millis() - phaseStarted;
  if (phase === "playing" && elapsed >= duration + hold) {
    phase = "waiting";
    finaleDone = page === 3;
    if (finaleDone) announce(language === "ja" ? "4ページ目。コーン！ タップすると最初に戻ります" : "Page 4. rolrolrolln. Tap to start again");
  }
}

function drawPageOne(now) {
  const duration = reducedMotion ? 650 : 1350;
  const playingT = phase === "playing" ? constrain((now - phaseStarted) / duration, 0, 1) : 1;
  const e = easeInOut(playingT);
  const idle = sin(now * 0.0022) * 0.025;
  const rock = phase === "playing" ? e * TWO_PI : TWO_PI + idle;
  const size = constrain(min(width * 0.53, height * 0.25), 180, 300);
  const groundY = height * 0.66;
  const cx = lerp(width * 0.34, width * 0.66, e);
  const cy = groundY - size * 0.34;

  drawFlatGround(groundY, PAGES[0].ink);
  const title = language === "ja" ? "マーパン コロコロ" : EN_WORDS[0];
  drawTitleWord(title, width * 0.5, height * 0.22, constrain(width * 0.18, 74, 112), PAGES[0].ink, sin(now * 0.002) * 0.01);
  drawSoftShadow(cx, groundY + 3, size, 0);
  drawMarpan(cx, cy, size, rock, 0);
  if (phase === "playing") finishAfter(duration, 520);
}

function drawPageTwo(now) {
  const duration = reducedMotion ? 900 : 2500;
  const t = phase === "playing" ? constrain((now - phaseStarted) / duration, 0, 1) : 0;
  const e = easeInOut(t);
  const size = constrain(min(width * 0.42, height * 0.22), 145, 240);
  const start = { x: width * 0.14, y: height * 0.31 };
  const end = { x: width * 0.85, y: height * 0.70 };
  const x = lerp(start.x, end.x, e);
  const groundY = lerp(start.y, end.y, e);
  const y = groundY - size * 0.34 - sin(t * PI * 5) * size * 0.045 * sin(t * PI);
  const angle = t * TWO_PI * 2.85 + sin(t * TWO_PI * 2) * 0.08;

  drawSlope(start, end, PAGES[1].ink);
  drawPageWords(1, [[0.25,0.52,-0.12],[0.50,0.61,0.04],[0.74,0.72,0.12]], now, t);
  drawSoftShadow(x, groundY + 3, size, sin(t * PI * 5));
  drawMarpan(x, y, size, angle, t);
  if (phase === "playing") finishAfter(duration, 700);
}

function drawPageThree(now) {
  const duration = reducedMotion ? 1000 : 3100;
  const t = phase === "playing" ? constrain((now - phaseStarted) / duration, 0, 1) : 0;
  const e = easeInOut(t);
  const size = constrain(min(width * 0.4, height * 0.21), 145, 230);
  const start = { x: width * 0.14, y: height * 0.75 };
  const end = { x: width * 0.85, y: height * 0.31 };
  const bounce = abs(sin(t * PI * 3)) * size * 0.09 * sin(t * PI);
  const x = lerp(start.x, end.x, e);
  const groundY = lerp(start.y, end.y, e);
  const y = groundY - size * 0.34 - bounce;
  const angle = t * TWO_PI * 2.35;

  drawSlope(start, end, PAGES[2].ink);
  drawPageWords(2, [[0.23,0.79,0.12],[0.49,0.61,-0.04],[0.73,0.43,-0.12]], now, t);
  drawSoftShadow(x, groundY + 3, size, bounce / size * 8);
  drawMarpan(x, y, size, angle, t);
  if (phase === "playing") finishAfter(duration, 760);
}

function drawPageFour(now) {
  const duration = reducedMotion ? 1100 : 2850;
  const t = phase === "playing" ? constrain((now - phaseStarted) / duration, 0, 1) : 0;
  const size = constrain(min(width * 0.4, height * 0.21), 145, 230);
  let x = width * 0.18;
  let y = jumpGroundY(x) - size * 0.34;
  let angle = 0;
  let lift = 0;

  if (phase === "playing" || finaleDone) {
    if (t < 0.58) {
      const r = t / 0.58;
      x = lerp(width * 0.18, width * 0.71, r);
      const groundY = jumpGroundY(x);
      y = groundY - size * 0.34 - abs(sin(r * TWO_PI)) * size * 0.07;
      angle = r * TWO_PI * 1.55;
    } else {
      const f = (t - 0.58) / 0.42;
      const hang = 1 - pow(2 * f - 1, 2);
      x = lerp(width * 0.71, width * 1.18, f);
      y = lerp(jumpGroundY(width * 0.71) - size * 0.34, -height * 0.15, f) - hang * height * 0.18;
      angle = TWO_PI * 1.55 + f * PI * 1.15;
      lift = hang;
    }
  }

  drawJumpGround(PAGES[3].ink);
  drawPageWords(3, [[0.21,0.70,-0.08],[0.49,0.66,0.02],[0.76,0.33,-0.13]], now, t);
  if (y < height + size && t < 0.64) drawSoftShadow(x, jumpGroundY(x) + 3, size, lift * 4);
  drawMarpan(x, y, size, angle, t);
  if (phase === "playing") finishAfter(duration, 780);
}

function drawMarpan(x, y, size, angle, motion) {
  push();
  translate(x, y);
  rotate(angle);
  marpan.drawAt(0, 0, {
    bodyWidth: size,
    bodyHeight: size * 0.68,
    lookX: x + cos(angle) * size * 0.08,
    lookY: y,
    pulse: abs(sin(motion * PI * 5)) * 0.35
  });
  pop();
}

function drawSoftShadow(x, y, size, lift) {
  noStroke();
  fill(66, 55, 43, constrain(25 - abs(lift) * 4, 8, 25));
  ellipse(x, y, size * (0.54 - min(abs(lift), 1) * 0.15), max(7, size * 0.055));
}

function groundColor(ink, alpha) {
  const c = color(ink);
  c.setAlpha(alpha);
  return c;
}

function drawFlatGround(y, ink) {
  noStroke();
  fill(groundColor(ink, 12));
  rect(0, y, width, height - y);
  stroke(groundColor(ink, 125));
  strokeWeight(max(3, width * 0.006));
  line(0, y, width, y);
}

function drawSlope(start, end, ink) {
  noStroke();
  fill(groundColor(ink, 12));
  beginShape();
  vertex(0, start.y - (start.x / (end.x - start.x)) * (end.y - start.y));
  vertex(width, end.y + ((width - end.x) / (end.x - start.x)) * (end.y - start.y));
  vertex(width, height);
  vertex(0, height);
  endShape(CLOSE);
  stroke(groundColor(ink, 135));
  strokeWeight(max(3, width * 0.006));
  line(0, start.y - (start.x / (end.x - start.x)) * (end.y - start.y), width, end.y + ((width - end.x) / (end.x - start.x)) * (end.y - start.y));
}

function jumpGroundY(x) {
  const q = constrain((x - width * 0.12) / (width * 0.62), 0, 1);
  return height * (0.79 - 0.47 * q * q);
}

function drawJumpGround(ink) {
  noStroke();
  fill(groundColor(ink, 13));
  beginShape();
  vertex(0, jumpGroundY(0));
  for (let x = 0; x <= width * 0.82; x += max(4, width / 70)) vertex(x, jumpGroundY(x));
  vertex(width * 0.82, height);
  vertex(0, height);
  endShape(CLOSE);
  noFill();
  stroke(groundColor(ink, 145));
  strokeWeight(max(3, width * 0.006));
  beginShape();
  for (let x = 0; x <= width * 0.82; x += max(4, width / 70)) vertex(x, jumpGroundY(x));
  endShape();
}

function drawTitleWord(word, x, y, size, ink, angle) {
  push();
  translate(x, y);
  rotate(angle);
  noStroke();
  fill(ink);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(size);
  text(word, 0, 0);
  pop();
}

function drawTrailWords(style, positions, now, progress = 0) {
  for (let i = 0; i < style.words.length; i++) {
    const [px, py, angle] = positions[i];
    const pulse = 1 + sin(now * 0.0024 + i * 1.7) * 0.025;
    const popScale = progress > 0 && progress > i * 0.2 ? 1.07 : 1;
    push();
    translate(width * px, height * py);
    rotate(angle);
    scale(pulse * popScale);
    noStroke();
    fill(style.ink);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(constrain(width * (i === 2 ? 0.36 : 0.4), 170, 230));
    text(style.words[i], 0, 0);
    pop();
  }
}

function drawPageWords(pageIndex, positions, now, progress) {
  if (language === "ja") {
    drawTrailWords(PAGES[pageIndex], positions, now, progress);
    return;
  }
  const angle = pageIndex === 1 ? 0.1 : pageIndex === 2 ? -0.1 : -0.12;
  drawTitleWord(EN_WORDS[pageIndex], width * 0.52, height * (pageIndex === 3 ? 0.22 : 0.18), constrain(width * 0.22, 92, 142), PAGES[pageIndex].ink, angle);
}

function drawPaperTexture(ink) {
  randomSeed(84);
  noStroke();
  const c = color(ink);
  for (let i = 0; i < 45; i++) {
    c.setAlpha(5);
    fill(c);
    circle(random(width), random(height), random(1, 3));
  }
}

function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - pow(-2 * t + 2, 3) / 2;
}

function ensureAudio() {
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === "suspended") audioContext.resume();
}

function playPageSound(pageIndex) {
  if (!audioContext) return;
  const base = audioContext.currentTime + 0.04;
  if (pageIndex === 0) {
    tone(base, 330, 0.12, 0.025, "sine", 380);
  } else if (pageIndex === 1) {
    [0, .28, .55, .81, 1.08, 1.32, 1.55, 1.78].forEach((d, i) => tone(base + d, 245 + (i % 3) * 18, .11, .035, "triangle", 180));
  } else if (pageIndex === 2) {
    [0, .72, 1.45].forEach((d, i) => tone(base + d, 205 + i * 12, .34, .045, "sine", 145));
  } else {
    tone(base + .28, 250, .16, .045, "triangle", 190);
    tone(base + .92, 270, .16, .045, "triangle", 205);
    tone(base + 1.48, 430, .72, .07, "sine", 760);
  }
}

function tone(at, from, duration, volume, type, to) {
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.exponentialRampToValueAtTime(to, at + duration);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(volume, at + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.connect(gain).connect(audioContext.destination);
  osc.start(at);
  osc.stop(at + duration + 0.03);
}

function toggleLanguage(event) {
  event.preventDefault();
  event.stopPropagation();
  language = language === "ja" ? "en" : "ja";
  const button = document.getElementById("language");
  button.textContent = language === "ja" ? "EN" : "JP";
  button.setAttribute("aria-label", language === "ja" ? "Switch to English" : "日本語に切り替える");
  button.style.color = PAGES[page].ink;
  announcePage();
}

function announcePage() {
  const words = ["マーパン コロコロ", "コロコロコロロ", "コロンコロンコロロン", "コロッコロッコーン"];
  announce(language === "ja" ? `${page + 1}ページ目。${words[page]}` : `Page ${page + 1}. ${EN_WORDS[page]}`);
}

function announce(message) {
  document.getElementById("live").textContent = message;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

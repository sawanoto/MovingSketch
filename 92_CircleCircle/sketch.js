const PAGES = [
  { title: 'まあぱん　ぐるぐる', en: 'Maarpan Circle-Circle', bg: '#fff8df', ink: '#4c402f' },
  { title: 'まあぱん　ぐーるぐる', en: 'Maarpan Ciiircle-Circle', bg: '#eaf8f2', ink: '#376b5c' },
  { title: 'まあぱん　ぐるぐーる', en: 'Maarpan Circle-Ciiircle', bg: '#edf2ff', ink: '#53679b' },
  { title: 'まあぱん　ぐるんぐるん', en: 'Maarpan Whirly-Whirly', bg: '#fff0ea', ink: '#a95043' }
];

let marpan, page = 0, phase = 'idle', started = 0, count = 0;
let turnFrom = 0, turnTo = 0, lastInput = -1000, audio = null;
let firstTurnDone = false, sprite = { x: 0, y: 0, radius: 0 };
let language = 'ja';
let lastSwing = -1, lastFinalSound = 0;
const title = document.getElementById('title');
const live = document.getElementById('live');
const languageButton = document.getElementById('language');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp01 = x => Math.max(0, Math.min(1, x));
const smooth = x => { x = clamp01(x); return x * x * (3 - 2 * x); };

function setup() {
  createCanvas(windowWidth, windowHeight, P2D, document.getElementById('story'));
  pixelDensity(Math.min(devicePixelRatio || 1, 2));
  marpan = new Marpan25D({ id: 'common-marpan', maxSize: 360 });
  marpan.enableAutoBlink(2300, 4500);
  document.getElementById('book').addEventListener('pointerup', activate);
  languageButton.addEventListener('click', e => {
    e.stopPropagation();
    language = language === 'ja' ? 'en' : 'ja';
    document.documentElement.lang = language;
    languageButton.textContent = language === 'ja' ? 'EN' : 'JP';
    languageButton.setAttribute('aria-label', language === 'ja' ? 'Switch to English' : '日本語に切り替える');
    updateTitle();
  });
  document.getElementById('book').addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(e); }
  });
}

function activate(e) {
  e.preventDefault();
  const now = millis();
  if (now - lastInput < 110 || phase === 'vanish' || phase === 'reborn') return;
  lastInput = now;
  ensureAudio();
  const onMarpan = e.clientX === undefined || Math.hypot(e.clientX - sprite.x, e.clientY - sprite.y) <= sprite.radius;
  if (page === 0) {
    if (phase === 'turn' || phase === 'fullTurn') return;
    if (!firstTurnDone) {
      phase = 'fullTurn'; started = now;
      tone(330, 450, .18, .028);
      live.textContent = 'マーパンが一回転しています。';
      return;
    }
    if (!onMarpan) { setPage(1); return; }
    count++;
    turnFrom = (count - 1) * Math.PI / 4;
    turnTo = count * Math.PI / 4;
    started = now;
    phase = 'turn';
    tone(330 + count * 25, 430 + count * 22, .12, .028);
    live.textContent = `${count}回目。45度回りました。`;
    return;
  }
  if (page === 1 || page === 2) {
    if (!onMarpan) { setPage(page + 1); return; }
    startMotion(now);
  } else if (page === 3 && onMarpan) {
    startMotion(now);
  }
}

function setPage(next) {
  page = next; started = millis();
  updateTitle();
  live.textContent = `${page + 1}ページ目。${PAGES[page].title}。マーパンをタップすると動きを繰り返し、背景をタップすると次へ進みます。`;
  if (page > 0) startMotion(started);
  else phase = 'idle';
}

function updateTitle() {
  title.textContent = language === 'ja' ? PAGES[page].title : PAGES[page].en;
  title.classList.toggle('english', language === 'en');
  title.style.color = PAGES[page].ink;
  languageButton.style.color = PAGES[page].ink;
}

function startMotion(now) {
  phase = 'moving'; started = now;
  lastOrbitSound = now - 700;
  lastSwing = -1; lastFinalSound = now;
}

function draw() {
  const now = millis();
  background(PAGES[page].bg);
  paperTexture();
  const size = Math.min(width * (page === 0 || page === 3 ? .54 : .34), height * (page === 0 || page === 3 ? .29 : .21), page === 0 || page === 3 ? 300 : 205);
  const cx = width / 2, cy = height * .54;
  if (page === 0) {
    const t = phase === 'turn' ? smooth((now - started) / (reduced ? 130 : 260)) : 1;
    const fullT = phase === 'fullTurn' ? smooth((now - started) / (reduced ? 650 : 1500)) : 0;
    if (phase !== 'reborn') drawMarpan(cx, cy, size, phase === 'fullTurn' ? Math.PI * 2 * fullT : phase === 'turn' ? lerp(turnFrom, turnTo, t) : count * Math.PI / 4);
    if (phase === 'fullTurn' && fullT >= 1) {
      phase = 'idle'; firstTurnDone = true;
      live.textContent = 'マーパンをタップすると45度回ります。背景をタップすると次のページへ進みます。';
    }
    if (phase === 'turn' && t >= 1) {
      phase = 'idle';
    }
  } else if (page === 1 || page === 2) {
    const duration = reduced ? 1900 : page === 1 ? 4400 : 4800;
    const t = phase === 'moving' || phase === 'finished' ? clamp01((now - started) / duration) : 0;
    // Start at the top. Negative angle advances counterclockwise on the canvas.
    const theta = -Math.PI / 2 + (page === 1 ? 1 : -1) * t * Math.PI * 2;
    const rx = Math.min(width * .29, 260);
    const ry = Math.min(height * .225, 190);
    const x = cx + Math.cos(theta) * rx;
    const y = cy + Math.sin(theta) * ry;
    const spin = page === 2 ? -t * Math.PI * 5 : 0;
    drawMarpan(x, y, size, spin);
    if (phase === 'moving') {
      if (!reduced) orbitSound(now, t);
      if (t >= 1) { phase = 'finished'; live.textContent = 'もう一度タップすると次のページへ進みます。'; }
    }
  } else {
    const elapsed = phase === 'moving' ? now - started : 0;
    const duration = reduced ? 2500 : 3900;
    const t = clamp01(elapsed / duration);
    let angle = 0, scaleValue = 1, alpha = 255;
    if (phase === 'moving') {
      const beats = [0, .17, .34, .51, .68];
      const angles = [0, Math.PI * .55, -Math.PI * .8, Math.PI * 1.18, -Math.PI * 1.5];
      if (t < .68) {
        let i = 0; while (i < 3 && t > beats[i + 1]) i++;
        angle = lerp(angles[i], angles[i + 1], smooth((t - beats[i]) / (beats[i + 1] - beats[i])));
        if (i !== lastSwing) {
          tone(i % 2 ? 370 : 250, i % 2 ? 270 : 390, .2, .019);
          lastSwing = i;
        }
      } else {
        const f = (t - .68) / .32;
        angle = angles[4] + Math.PI * 8 * f * f;
        scaleValue = 1 - smooth(f);
        alpha = 255 * (1 - smooth(f));
        if (now - lastFinalSound > 230 && f < .88) {
          tone(450 + 300 * f, 500 + 350 * f, .13, .013 * (1 - f));
          lastFinalSound = now;
        }
      }
      if (t >= 1) { phase = 'vanish'; started = now; live.textContent = 'マーパンが消えました。最初のページへ戻ります。'; }
    }
    if (phase !== 'vanish' && phase !== 'quiet') drawMarpan(cx, cy, size, angle, scaleValue, alpha);
    if (phase === 'vanish' && now - started > 600) {
      page = 0; phase = 'reborn'; started = now; count = 0; firstTurnDone = false;
      updateTitle();
      live.textContent = '1ページ目。まあぱん ぐるぐる。';
      tone(390, 490, .16, .024);
    }
  }
  if (page === 0 && phase === 'reborn') {
    const t = smooth((now - started) / (reduced ? 170 : 380));
    background(PAGES[0].bg); paperTexture();
    drawMarpan(cx, cy, size, 0, .72 + .28 * t, 255 * t);
    if (t >= 1) phase = 'idle';
  }
}

function drawMarpan(x, y, size, angle, s = 1, alpha = 255) {
  sprite = { x, y, radius: size * .53 * s };
  push(); translate(x, y); rotate(angle); scale(Math.max(s, .0001));
  drawingContext.globalAlpha = alpha / 255;
  marpan.drawAt(0, 0, { bodyWidth: size, bodyHeight: size * .68, lookX: 0, lookY: 0, pulse: 0 });
  pop();
}

function paperTexture() {
  randomSeed(84); noStroke(); fill(76, 64, 47, 5);
  for (let i = 0; i < 45; i++) circle(random(width), random(height), random(1, 3));
}

let lastOrbitSound = 0;
function orbitSound(now, t) {
  const interval = page === 1 ? 650 : 520;
  if (now - lastOrbitSound < interval) return;
  lastOrbitSound = now;
  const base = page === 1 ? 240 : 285;
  tone(base + 95 * Math.sin(t * Math.PI * 2), base + 35 + 95 * Math.sin((t + .07) * Math.PI * 2), .28, .013);
  if (page === 2 && Math.floor(t * 8) % 2 === 0) tone(420 + 40 * Math.sin(t * Math.PI * 5), 480, .1, .008);
}

function ensureAudio() {
  if (!audio && (window.AudioContext || window.webkitAudioContext)) audio = new (window.AudioContext || window.webkitAudioContext)();
  if (audio?.state === 'suspended') audio.resume();
}
function tone(from, to, duration, volume) {
  if (!audio) return;
  const at = audio.currentTime, osc = audio.createOscillator(), gain = audio.createGain();
  osc.type = 'sine'; osc.frequency.setValueAtTime(Math.max(50, from), at);
  osc.frequency.exponentialRampToValueAtTime(Math.max(50, to), at + duration);
  gain.gain.setValueAtTime(.0001, at);
  gain.gain.exponentialRampToValueAtTime(volume, at + .018);
  gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
  osc.connect(gain).connect(audio.destination); osc.start(at); osc.stop(at + duration + .02);
}
function windowResized() { resizeCanvas(windowWidth, windowHeight); }

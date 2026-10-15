const TITLES = ['いないいない　ばあ', 'いないいなーい　ばあ', 'いない、いない、ばあ', 'いないいない　ばーあ'];
const NOTES = [[72], [72, 76], [72, 76, 79], [72, 76, 79, 84]];
const DELAYS = [[0], [0, 230], [0, 190, 380], [0, 0, 0, 0]];
const DURATION = [440, 690, 850, 590];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const book = document.getElementById('book');
const title = document.getElementById('title');
const pageLabel = document.getElementById('page');
const live = document.getElementById('live');
const sound = new MarpanSound({ volume: 0.12 });
let page = 0;
let phase = 'hidden';
let started = 0;
let lastInput = -1000;
let played = [];
let marpans = [];

// Keep the canonical body and eye drawing. Only gate the common eye routine.
class PeekabooMarpan extends Marpan25D {
  constructor(options) { super(options); this.eyeVisible = false; }
  drawEyes(...args) {
    if (this.eyeVisible) super.drawEyes(...args);
  }
}

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(book);
  pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
  marpans = Array.from({ length: 4 }, (_, i) => new PeekabooMarpan({ id: `peekaboo-${i}`, autoBlink: false }));
  book.addEventListener('pointerup', activate);
  book.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') activate(e);
  });
}

function activate(event) {
  event.preventDefault();
  const now = millis();
  if (now - lastInput < 130 || phase === 'revealing') return;
  lastInput = now;
  sound.start();
  if (phase === 'shown') {
    page = (page + 1) % 4;
    phase = 'hidden';
    played = [];
    marpans.forEach(m => { m.eyeVisible = false; m.openEyes(); });
    title.textContent = TITLES[page];
    pageLabel.textContent = `${page + 1}/4`;
    pageLabel.setAttribute('aria-label', `${page + 1}ページ目、全4ページ`);
    live.textContent = `${page + 1}ページ目。画面をタップするとマーパンの目が現れます。`;
  } else {
    phase = 'revealing';
    started = now;
    played = Array(DELAYS[page].length).fill(false);
    live.textContent = 'ばあ！';
    // The first gesture unlocks audio; the draw loop times later notes to the eyes.
    playDueNotes(0);
  }
}

function playDueNotes(elapsed) {
  DELAYS[page].forEach((delay, i) => {
    if (played[i] || elapsed < delay) return;
    played[i] = true;
    sound.playMidi(NOTES[page][i], { duration: page === 3 ? 0.34 : 0.22, level: page === 3 ? 0.27 : 0.5, pan: page === 3 ? 0 : (i - (DELAYS[page].length - 1) / 2) * 0.28 });
  });
}

function easeOutBack(t) {
  t = Math.max(0, Math.min(1, t));
  return 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
}

function layout() {
  const cx = width / 2;
  const cy = height * 0.54;
  const areaW = width * 0.91;
  const areaH = Math.max(160, height * 0.58);
  if (page === 0) {
    const size = Math.min(areaW * 0.73, areaH * 1.08, 420);
    return [{ x: cx, y: cy, size, yaw: 0, angle: 0, dx: 0, dy: 0 }];
  }
  if (page === 1 || page === 2) {
    const count = page + 1;
    const size = Math.min(areaW / (count + 0.18), areaH * 0.82, page === 1 ? 260 : 210);
    const gap = size * 1.02;
    return Array.from({ length: count }, (_, i) => ({
      x: cx + (i - (count - 1) / 2) * gap,
      y: cy + (page === 1 ? (i ? size * 0.035 : -size * 0.035) : 0),
      size: size * (page === 1 && i ? 0.88 : 1),
      yaw: page === 2 ? [-0.9, 0.9, 0][i] : (i ? 0.14 : -0.12),
      angle: page === 1 ? (i ? 0.07 : -0.06) : 0,
      dx: 0, dy: 0
    }));
  }
  const size = Math.min(areaW * 0.41, areaH * 0.48, 225);
  const rx = Math.min(areaW * 0.285, size * 0.75);
  const ry = Math.min(areaH * 0.30, size * 0.58);
  return [
    { x: cx, y: cy - ry, size, yaw: 0, angle: Math.PI / 2, dx: 0, dy: -1 },
    { x: cx + rx, y: cy, size, yaw: 0, angle: Math.PI, dx: 1, dy: 0 },
    { x: cx, y: cy + ry, size, yaw: 0, angle: -Math.PI / 2, dx: 0, dy: 1 },
    { x: cx - rx, y: cy, size, yaw: 0, angle: 0, dx: -1, dy: 0 }
  ];
}

function draw() {
  background(255);
  const elapsed = phase === 'revealing' ? millis() - started : -1;
  if (phase === 'revealing') playDueNotes(elapsed);
  layout().forEach((item, i) => {
    const delay = DELAYS[page][i];
    const appeared = phase === 'shown' || (phase === 'revealing' && elapsed >= delay);
    const t = appeared ? Math.max(0, elapsed - delay) : 0;
    const bounce = appeared && phase === 'revealing' && !reducedMotion
      ? Math.max(0, Math.sin(Math.min(1, t / 280) * Math.PI)) * 0.055 : 0;
    const outward = page === 3 && appeared && phase === 'revealing' && !reducedMotion
      ? Math.sin(Math.min(1, t / 450) * Math.PI) * item.size * 0.065 : 0;
    const m = marpans[i];
    m.eyeVisible = appeared;
    push();
    translate(item.x + item.dx * outward, item.y + item.dy * outward);
    rotate(item.angle);
    const scale = 1 + bounce;
    // Turned bodies use the canonical dented outline and the canonical yaw-based eyes.
    m.drawAt(0, 0, {
      bodyWidth: item.size,
      bodyHeight: item.size * 0.68,
      yaw: item.yaw,
      dentAmount: Math.abs(item.yaw) * 0.35,
      dentDirectionX: item.yaw < 0 ? -1 : 1,
      scaleX: scale * (Math.abs(item.yaw) > 0.5 ? 0.92 : 1),
      scaleY: scale,
      eyeScale: appeared && phase === 'revealing' && !reducedMotion ? Math.max(0.35, easeOutBack(t / 160)) : 1,
      lookX: 0, lookY: 0
    });
    pop();
  });
  if (phase === 'revealing' && elapsed >= DURATION[page]) {
    phase = 'shown';
    live.textContent = page === 3 ? 'ばーあ！次のタップで最初のページに戻ります。' : 'ばあ！次のタップで次のページに進みます。';
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }

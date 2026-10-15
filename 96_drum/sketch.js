const PAPER = '#eee8dc';
const INK = '#2b211c';
let marpan;
let hits = [];
let audioContext, master, compressor;
const samples = { don: null, ka: null };

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('stage');
  pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
  marpan = new Marpan25D({ expression: 'pupil', autoBlink: false });
  initAudio();
  loadSample('don', 'audio/don.mp3');
  loadSample('ka', 'audio/ka.mp3');
  canvas.elt.addEventListener('pointerdown', strike, { passive: false });
  canvas.elt.addEventListener('contextmenu', event => event.preventDefault());
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
function drumRadius() { return Math.min(width * .42, height * .42, 330); }

function draw() {
  background(PAPER);
  const r = drumRadius(), cx = width / 2, cy = height / 2;
  const now = performance.now();
  hits = hits.filter(hit => now - hit.time < (hit.kind === 'don' ? 650 : 230));
  const dent = hits.reduce((value, hit) => hit.kind === 'don'
    ? Math.max(value, Math.exp(-(now - hit.time) / 105) * .025) : value, 0);

  noStroke(); fill(90, 64, 44, 27);
  ellipse(cx, cy + r * .13, r * 2.15, r * 2.12);
  fill('#563522'); stroke(INK); strokeWeight(Math.max(3, r * .014));
  circle(cx, cy, r * 2);
  noFill(); stroke('#a1683c'); strokeWeight(r * .13);
  circle(cx, cy, r * 1.85);
  stroke('#d39a5a'); strokeWeight(r * .012);
  circle(cx, cy, r * 1.75);

  // Tacks sit on the wooden rim, clear of the playing face.
  for (let i = 0; i < 32; i++) {
    const a = TWO_PI * i / 32;
    const x = cx + cos(a) * r * .895, y = cy + sin(a) * r * .895;
    noStroke(); fill('#3a261c'); circle(x + r * .006, y + r * .009, r * .057);
    fill('#dfbd75'); circle(x, y, r * .049);
    fill('#f7df9c'); circle(x - r * .009, y - r * .01, r * .014);
  }

  push(); translate(cx, cy); scale(1 - dent);
  stroke(INK); strokeWeight(Math.max(3, r * .012));
  fill('#f4e6ca'); circle(0, 0, r * 1.65);
  noFill(); stroke('#c8ae87'); strokeWeight(r * .007);
  circle(0, 0, r * 1.56);
  // The eyes are drawn by the shared Marpan implementation, with no mouth.
  drawingContext.save();
  drawingContext.beginPath(); drawingContext.arc(0, 0, r * .8, 0, TWO_PI); drawingContext.clip();
  marpan.drawEyes(0, 0, r * 1.75, r * 1.75, 0, 0, 0);
  drawingContext.restore();
  pop();

  for (const hit of hits) {
    const age = now - hit.time;
    if (hit.kind === 'don') {
      const t = age / 650;
      noFill(); stroke(111, 74, 46, 100 * (1 - t)); strokeWeight(Math.max(1, r * .018 * (1 - t)));
      circle(cx, cy, r * (.22 + 1.36 * t));
      stroke(166, 111, 66, 65 * (1 - t)); strokeWeight(Math.max(1, r * .009));
      circle(cx, cy, r * (.12 + 1.48 * t));
    } else {
      const t = age / 230;
      noFill(); stroke(248, 225, 170, 220 * (1 - t)); strokeWeight(Math.max(1, r * .022 * (1 - t)));
      circle(hit.x, hit.y, r * (.055 + .18 * t));
      stroke(72, 42, 25, 130 * (1 - t)); strokeWeight(Math.max(1, r * .008));
      circle(hit.x, hit.y, r * (.08 + .26 * t));
    }
  }
}

function strike(event) {
  event.preventDefault();
  const rect = event.currentTarget.getBoundingClientRect();
  const x = (event.clientX - rect.left) * width / rect.width;
  const y = (event.clientY - rect.top) * height / rect.height;
  const r = drumRadius();
  const distance = Math.hypot(x - width / 2, y - height / 2);
  if (distance > r) return;
  const kind = distance <= r * .75 ? 'don' : 'ka';
  hits.push({ kind, x, y, time: performance.now() });
  if (hits.length > 24) hits.shift();
  play(kind);
}

function initAudio() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    audioContext = new AudioContextClass({ latencyHint: 'interactive' });
    master = audioContext.createGain(); master.gain.value = .7;
    compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -14; compressor.knee.value = 15;
    compressor.ratio.value = 4; compressor.attack.value = .003; compressor.release.value = .18;
    master.connect(compressor); compressor.connect(audioContext.destination);
  }
  if (audioContext.state === 'suspended') audioContext.resume();
  return true;
}

async function loadSample(kind, url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    samples[kind] = await audioContext.decodeAudioData(await response.arrayBuffer());
  } catch (error) {
    console.error(`Could not load ${kind} drum sample:`, error);
  }
}

function play(kind) {
  if (!initAudio()) return;
  if (!samples[kind]) return;
  // Each strike gets its own source, so fast repeats keep the previous tail.
  const source = audioContext.createBufferSource();
  source.buffer = samples[kind];
  const gain = audioContext.createGain();
  gain.gain.value = kind === 'don' ? .9 : .75;
  source.connect(gain); gain.connect(master);
  source.start(audioContext.currentTime);
  source.onended = () => { source.disconnect(); gain.disconnect(); };
}

(() => {
  "use strict";

  let canvas, ctx;
  const startButton = document.querySelector("#soundStart");
  const flipButton = document.querySelector("#flip");

  // The series' shared do-re-mi palette (23_MelodyFlight / 46_Tower).
  const NOTES = [
    { name: "ド", frequency: 261.63, color: "#ef6a67" },
    { name: "レ", frequency: 293.66, color: "#f29b52" },
    { name: "ミ", frequency: 329.63, color: "#e5c64f" },
    { name: "ファ", frequency: 349.23, color: "#63b875" },
    { name: "ソ", frequency: 392.00, color: "#4da9c9" },
    { name: "ラ", frequency: 440.00, color: "#6f86d6" },
    { name: "シ", frequency: 493.88, color: "#9a72c7" },
    { name: "高いド", frequency: 523.25, color: "#e65f91" }
  ];

  const COUNT = 88;
  let W = 0, H = 0, dpr = 1, geo;
  let marpans = [], running = false, flipping = false, flipAngle = 0, flipStarted = 0;
  let lastTime = performance.now(), audio = null;

  function geometry() {
    const glassH = Math.min(H * .80, 690);
    const chamberW = Math.min(W * .68, glassH * .64, 440);
    const radius = Math.max(7.5, Math.min(11, chamberW / 35));
    return { cx: W / 2, cy: H / 2, top: (H - glassH) / 2, bottom: (H + glassH) / 2,
      glassH, chamberW, half: chamberW / 2, throat: radius * 1.08, r: radius };
  }

  function wallHalfWidth(y) {
    const t = Math.min(1, Math.abs(y - geo.cy) / (geo.glassH / 2));
    return geo.throat + (geo.half - geo.throat) * Math.pow(t, .78);
  }

  function resize() {
    const old = geo;
    W = innerWidth; H = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
    pixelDensity(dpr); resizeCanvas(W, H); ctx = drawingContext;
    geo = geometry();
    flipButton.style.left = `${geo.cx + geo.throat + Math.max(28, geo.r * 2.5)}px`;
    flipButton.style.top = `${geo.cy}px`;
    if (old && marpans.length) {
      const sx = geo.chamberW / old.chamberW, sy = geo.glassH / old.glassH;
      marpans.forEach(p => { p.x = geo.cx + (p.x - old.cx) * sx; p.y = geo.cy + (p.y - old.cy) * sy; p.r = geo.r; });
    } else seed();
  }

  function seed() {
    marpans = [];
    const r = geo.r, stepX = r * 2.28, stepY = r * 1.92;
    let i = 0;
    for (let row = 0; i < COUNT; row++) {
      const y = geo.top + r * 2.1 + row * stepY;
      const available = Math.max(1, Math.floor((wallHalfWidth(y) * 2 - r * 3) / stepX));
      for (let col = 0; col < available && i < COUNT; col++, i++) {
        const x = geo.cx + (col - (available - 1) / 2) * stepX + (Math.random() - .5) * r * .24;
        const note = NOTES[i % NOTES.length];
        marpans.push({ x, y: y + Math.random() * r * .18, px: x, py: y, vx: (Math.random() - .5) * .15,
          vy: 0, r, note, design: new Marpan25D({ maxSize: r * 2, bodyColor: note.color }),
          glow: 0, spin: (Math.random() - .5) * .16, angle: (Math.random() - .5) * .25 });
      }
    }
  }

  function simulate(dt) {
    const substeps = 3, sdt = dt / substeps;
    for (let step = 0; step < substeps; step++) {
      for (const p of marpans) {
        p.px = p.x; p.py = p.y;
        // Gentle gravity and fluid-like drag give the fall a soft, underwater feel.
        p.vy += 400 * sdt; p.vx *= .992; p.vy *= .985;
        // A near-imperceptible shuffle prevents a stable two-body arch at the tiny throat.
        if (p.y > geo.cy - p.r * 7 && p.y < geo.cy && Math.abs(p.vy) < 35) p.vx += (Math.random() - .5) * 12 * sdt;
        p.x += p.vx * sdt; p.y += p.vy * sdt; p.angle += p.spin * sdt;
        contain(p);
      }
      for (let pass = 0; pass < 2; pass++) solvePairs();
      for (const p of marpans) {
        if (p.py < geo.cy && p.y >= geo.cy && Math.abs(p.x - geo.cx) < geo.throat + p.r * .25) soundAtThroat(p);
      }
    }
    marpans.forEach(p => p.glow = Math.max(0, p.glow - dt * 3.5));
  }

  function contain(p) {
    const r = p.r;
    if (p.y + r > geo.bottom) { p.y = geo.bottom - r; p.vy = -Math.abs(p.vy) * .06; p.vx *= .84; p.spin *= .9; }
    if (p.y - r < geo.top) { p.y = geo.top + r; p.vy = Math.abs(p.vy) * .08; }
    const limit = wallHalfWidth(p.y) - r * .82;
    const dx = p.x - geo.cx;
    if (Math.abs(dx) > limit) {
      p.x = geo.cx + Math.sign(dx) * limit;
      p.vx = -p.vx * .12 - Math.sign(dx) * Math.abs(p.vy) * .035;
      p.vy *= .91;
    }
  }

  function solvePairs() {
    for (let i = 0; i < marpans.length; i++) for (let j = i + 1; j < marpans.length; j++) {
      const a = marpans[i], b = marpans[j], dx = b.x - a.x, dy = b.y - a.y;
      const minD = (a.r + b.r) * .88, d2 = dx * dx + dy * dy;
      if (d2 >= minD * minD) continue;
      const d = Math.sqrt(d2) || .01, nx = dx / d, ny = dy / d, push = (minD - d) * .51;
      a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
      const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (rel < 0) { const impulse = -rel * .36; a.vx -= nx * impulse; a.vy -= ny * impulse; b.vx += nx * impulse; b.vy += ny * impulse; }
      a.vx *= .985; b.vx *= .985;
    }
  }

  function startAudio() {
    if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
  }

  function soundAtThroat(p) {
    if (!running || !audio) return;
    p.glow = 1;
    const now = audio.currentTime, gain = audio.createGain(), pan = audio.createStereoPanner();
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(.115, now + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, now + .48);
    pan.pan.value = Math.max(-.22, Math.min(.22, (p.x - geo.cx) / geo.throat * .2));
    gain.connect(pan); pan.connect(audio.destination);
    [[1, 1], [2.01, .14], [3.98, .035]].forEach(([ratio, level]) => {
      const osc = audio.createOscillator(), partial = audio.createGain();
      osc.type = "sine"; osc.frequency.value = p.note.frequency * ratio; partial.gain.value = level;
      osc.connect(partial); partial.connect(gain); osc.start(now); osc.stop(now + .52);
    });
  }

  function drawMarpan(p) {
    push();
    translate(p.x, p.y); rotate(p.angle); translate(-p.x, -p.y);
    if (p.glow > 0) { drawingContext.shadowColor = p.note.color; drawingContext.shadowBlur = 18 * p.glow; }
    const sharedStrokeWeight = window.strokeWeight;
    window.strokeWeight = amount => sharedStrokeWeight(amount * .24);
    try {
      p.design.drawAt(p.x, p.y, {
        bodyWidth: p.r * 2,
        bodyHeight: p.r * 1.36,
        bodyColor: p.note.color,
        lookX: p.x,
        lookY: p.y,
        eyeScale: .92
      });
    } finally {
      window.strokeWeight = sharedStrokeWeight;
    }
    drawingContext.shadowBlur = 0;
    pop();
  }

  function glassPath() {
    const { cx, cy, top, bottom, half, throat } = geo;
    ctx.beginPath(); ctx.moveTo(cx - half, top); ctx.bezierCurveTo(cx - half * .96, cy - geo.glassH * .28, cx - throat, cy - geo.glassH * .10, cx - throat, cy);
    ctx.bezierCurveTo(cx - throat, cy + geo.glassH * .10, cx - half * .96, cy + geo.glassH * .28, cx - half, bottom);
    ctx.lineTo(cx + half, bottom); ctx.bezierCurveTo(cx + half * .96, cy + geo.glassH * .28, cx + throat, cy + geo.glassH * .10, cx + throat, cy);
    ctx.bezierCurveTo(cx + throat, cy - geo.glassH * .10, cx + half * .96, cy - geo.glassH * .28, cx + half, top); ctx.closePath();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W / 2, H * .45, 20, W / 2, H * .5, Math.max(W, H) * .7);
    bg.addColorStop(0, "#fffdf7"); bg.addColorStop(1, "#e9e2d5"); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(geo.cx, geo.cy); ctx.rotate(flipAngle); ctx.translate(-geo.cx, -geo.cy);
    ctx.save(); glassPath(); ctx.clip();
    const glassFill = ctx.createLinearGradient(geo.cx - geo.half, 0, geo.cx + geo.half, 0);
    glassFill.addColorStop(0, "rgba(190,220,225,.16)"); glassFill.addColorStop(.45, "rgba(255,255,255,.04)"); glassFill.addColorStop(1, "rgba(178,211,219,.20)");
    ctx.fillStyle = glassFill; ctx.fillRect(geo.cx - geo.half, geo.top, geo.chamberW, geo.glassH);
    marpans.forEach(drawMarpan); ctx.restore();
    glassPath(); ctx.strokeStyle = "rgba(75,105,112,.58)"; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.72)"; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.restore();
  }

  function loop(time) {
    const dt = Math.min(.028, (time - lastTime) / 1000 || .016); lastTime = time;
    if (running && !flipping) simulate(dt);
    if (flipping) {
      const t = Math.min(1, (time - flipStarted) / 720), eased = .5 - Math.cos(Math.PI * t) / 2;
      flipAngle = Math.PI * eased;
      if (t >= 1) completeFlip();
    }
    draw();
  }

  function beginFlip() {
    if (!running || flipping) return;
    startAudio(); flipping = true; flipStarted = performance.now(); flipButton.disabled = true;
  }

  function completeFlip() {
    marpans.forEach(p => { p.x = 2 * geo.cx - p.x + (Math.random() - .5) * geo.r * .7; p.y = 2 * geo.cy - p.y; p.px = p.x; p.py = p.y; p.vx = (Math.random() - .5) * 18; p.vy = Math.random() * 8; p.angle += Math.PI; });
    flipAngle = 0; flipping = false; flipButton.disabled = false;
  }

  startButton.addEventListener("click", () => {
    startAudio(); running = true; startButton.classList.add("is-hidden"); flipButton.disabled = false;
    setTimeout(() => { startButton.hidden = true; }, 380);
  });
  flipButton.addEventListener("click", beginFlip);
  addEventListener("keydown", e => { if ((e.code === "Space" || e.key.toLowerCase() === "r") && running) { e.preventDefault(); beginFlip(); } });
  window.setup = () => {
    pixelDensity(Math.min(devicePixelRatio || 1, 2));
    const renderer = createCanvas(innerWidth, innerHeight);
    renderer.parent("canvas-wrap"); canvas = renderer.elt; ctx = drawingContext;
    resize(); lastTime = performance.now();
  };
  window.draw = () => loop(performance.now());
  window.windowResized = resize;
})();

(() => {
  "use strict";

  const canvas = document.querySelector("#earth");
  const ctx = canvas.getContext("2d");
  const hint = document.querySelector("#tap-hint");
  const status = document.querySelector("#sound-status");
  const NOTES = [
    { ja: "ド", label: "C", frequency: 261.63, color: "#ef6a67" },
    { ja: "レ", label: "D", frequency: 293.66, color: "#f29b52" },
    { ja: "ミ", label: "E", frequency: 329.63, color: "#e5c64f" },
    { ja: "ファ", label: "F", frequency: 349.23, color: "#63b875" },
    { ja: "ソ", label: "G", frequency: 392.0, color: "#4da9c9" },
    { ja: "ラ", label: "A", frequency: 440.0, color: "#6f86d6" },
    { ja: "シ", label: "B", frequency: 493.88, color: "#9a72c7" },
    { ja: "ド", label: "C", frequency: 523.25, color: "#e65f91" }
  ];

  let w = 0, h = 0, dpr = 1, stars = [], rotation = 0, last = performance.now();
  let globe = { cx: 0, cy: 0, r: 0 }, noteIndex = 0, audioContext = null;
  const flyingNotes = [], frozenNotes = [], iceBursts = [];
  const earthTexture = new Image();
  let textureReady = false;
  earthTexture.addEventListener("load", () => { textureReady = true; });
  earthTexture.src = "earth-texture.png";

  const seed = (i) => { const x = Math.sin(i * 91.717) * 43758.5453; return x - Math.floor(x); };

  function resize() {
    w = innerWidth; h = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: Math.min(210, Math.floor(w * h / 5800)) }, (_, i) => ({
      x: seed(i) * w, y: seed(i + 317) * h, r: .25 + seed(i + 811) * 1.05,
      a: .18 + seed(i + 99) * .58, phase: seed(i + 1201) * Math.PI * 2
    }));
  }

  function drawTextureSphere(cx, cy, rx, ry) {
    if (!textureReady) return;
    const strips = Math.max(150, Math.round(rx * .72));
    const turn = ((rotation / (Math.PI * 2)) % 1 + 1) % 1;
    for (let i = 0; i < strips; i++) {
      const x0 = -1 + i * 2 / strips, x1 = -1 + (i + 1) * 2 / strips;
      const mid = (x0 + x1) * .5, lon = Math.asin(mid) / (Math.PI * 2);
      const u = ((.5 + lon - turn) % 1 + 1) % 1;
      const sx = Math.floor(u * earthTexture.width);
      const sw = Math.max(1, Math.ceil(earthTexture.width / strips * 1.8));
      const dx = cx + x0 * rx - .5, dw = (x1 - x0) * rx + 1.25;
      const chord = Math.sqrt(Math.max(0, 1 - mid * mid));
      const dy = cy - ry * chord, dh = ry * chord * 2;
      if (sx + sw <= earthTexture.width) ctx.drawImage(earthTexture, sx, 0, sw, earthTexture.height, dx, dy, dw, dh);
      else {
        const first = earthTexture.width - sx, ratio = first / sw;
        ctx.drawImage(earthTexture, sx, 0, first, earthTexture.height, dx, dy, dw * ratio, dh);
        ctx.drawImage(earthTexture, 0, 0, sw - first, earthTexture.height, dx + dw * ratio, dy, dw * (1 - ratio), dh);
      }
    }
  }

  function drawEyes(cx, cy, r, time) {
    const blinkPhase = time % 6100;
    const blink = blinkPhase > 5900 ? Math.max(.055, Math.abs((blinkPhase - 6000) / 100)) : 1;
    [-.44, 0, .44].forEach((longitude) => {
      const depth = Math.cos(longitude), ex = cx + Math.sin(longitude) * r * .94;
      const ey = cy - r * .045;
      const eyeW = r * .383 * (.76 + depth * .24) * depth;
      const eyeH = r * .383 * 1.08 * (.76 + depth * .24) * blink;
      ctx.save(); ctx.translate(ex, ey);
      ctx.shadowColor = "rgba(0,0,0,.28)"; ctx.shadowBlur = r * .018;
      ctx.fillStyle = "rgba(255,255,255,.97)"; ctx.strokeStyle = "#121212"; ctx.lineWidth = Math.max(2, eyeW * .045);
      ctx.beginPath(); ctx.ellipse(0, 0, eyeW * .5, eyeH * .5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      if (blink > .18) { ctx.fillStyle = "#121212"; ctx.beginPath(); ctx.arc(0, 0, eyeW * .19, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    });
  }

  function drawEarth(time) {
    const compact = h < 620;
    const r = Math.min(w * .33, h * (compact ? .335 : .355), 330);
    const cx = w / 2, cy = h * (compact ? .45 : .46);
    globe = { cx, cy, r };
    ctx.save();
    ctx.shadowColor = "rgba(76,165,230,.42)"; ctx.shadowBlur = r * .1;
    ctx.fillStyle = "#0e659d"; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
    const ocean = ctx.createRadialGradient(cx - r * .28, cy - r * .36, r * .05, cx, cy, r * 1.2);
    ocean.addColorStop(0, "#43a8d2"); ocean.addColorStop(.52, "#126d9f"); ocean.addColorStop(1, "#052c52");
    ctx.fillStyle = ocean; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    drawTextureSphere(cx, cy, r, r);
    const daylight = ctx.createRadialGradient(cx - r * .33, cy - r * .34, r * .04, cx - r * .05, cy, r * 1.17);
    daylight.addColorStop(0, "rgba(152,220,255,.18)"); daylight.addColorStop(.53, "rgba(0,0,0,0)");
    daylight.addColorStop(.82, "rgba(0,5,16,.19)"); daylight.addColorStop(1, "rgba(0,2,10,.88)");
    ctx.fillStyle = daylight; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
    ctx.strokeStyle = "rgba(143,214,255,.5)"; ctx.lineWidth = Math.max(1.2, r * .008);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "rgba(120,205,255,.12)"; ctx.lineWidth = Math.max(5, r * .045);
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.075, 0, Math.PI * 2); ctx.stroke();
    drawEyes(cx, cy, r, time);
  }

  function beginTone(note) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioContext) audioContext = new AudioContextClass();
    if (audioContext.state === "suspended") audioContext.resume();
    const now = audioContext.currentTime;
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    filter.type = "lowpass"; filter.frequency.value = 1800;
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(.16, now + .018);
    gain.connect(filter); filter.connect(audioContext.destination);
    const oscillators = [
      { ratio: 1, volume: 1 }, { ratio: 2, volume: .12 }, { ratio: .5, volume: .08 }
    ].map(({ ratio, volume }) => {
      const osc = audioContext.createOscillator(), partial = audioContext.createGain();
      osc.type = "sine"; osc.frequency.value = note.frequency * ratio; partial.gain.value = volume;
      osc.connect(partial); partial.connect(gain); osc.start(); return osc;
    });
    return { gain, oscillators, stopped: false };
  }

  function stopTone(voice) {
    if (!voice || voice.stopped || !audioContext) return;
    voice.stopped = true;
    const now = audioContext.currentTime;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(0, now);
    voice.oscillators.forEach((osc) => { try { osc.stop(now + .006); } catch (_) {} });
  }

  function launchNote() {
    const note = NOTES[noteIndex % NOTES.length]; noteIndex++;
    const angle = -Math.PI * .82 + Math.random() * Math.PI * .64;
    const startRadius = globe.r * .72;
    flyingNotes.push({
      note, angle, distance: startRadius, boundary: globe.r * 1.13,
      speed: Math.max(105, globe.r * .58), size: Math.max(18, globe.r * .085),
      voice: beginTone(note), wobble: Math.random() * Math.PI * 2
    });
    hint.classList.add("is-hidden");
    status.textContent = `${note.ja}の音が地球から飛び出しました`;
  }

  function freezeNote(item) {
    stopTone(item.voice);
    const orbit = item.boundary + 5 + Math.random() * globe.r * .42;
    const frozen = {
      note: item.note, angle: item.angle, orbit, size: item.size,
      speed: (.018 + Math.random() * .022) * (Math.random() < .5 ? -1 : 1),
      tilt: .68 + Math.random() * .2, phase: Math.random() * Math.PI * 2,
      born: performance.now()
    };
    frozenNotes.push(frozen);
    if (frozenNotes.length > 120) frozenNotes.shift();
    for (let i = 0; i < 12; i++) iceBursts.push({
      angle: item.angle, orbit: item.boundary, direction: i / 12 * Math.PI * 2,
      distance: 0, speed: 14 + Math.random() * 24, life: 1, color: item.note.color
    });
    status.textContent = `${item.note.ja}の音が宇宙で凍りました`;
  }

  function notePosition(angle, distance, tilt = 1) {
    return { x: globe.cx + Math.cos(angle) * distance, y: globe.cy + Math.sin(angle) * distance * tilt };
  }

  function drawMusicNote(x, y, size, color, frozen, angle = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle * .18);
    if (frozen) {
      ctx.globalAlpha = .84; ctx.shadowColor = "rgba(158,228,255,.75)"; ctx.shadowBlur = size * .72;
      ctx.fillStyle = "rgba(185,235,255,.17)"; ctx.strokeStyle = "rgba(220,249,255,.75)"; ctx.lineWidth = Math.max(1, size * .045);
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 6, rr = i % 2 ? size * .7 : size * .9;
        const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(235,253,255,.7)"; ctx.lineWidth = Math.max(.8, size * .032);
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * size * .72, Math.sin(a) * size * .72);
        ctx.lineTo(Math.cos(a) * size * .96, Math.sin(a) * size * .96); ctx.stroke();
      }
    } else { ctx.shadowColor = color; ctx.shadowBlur = size * .8; }
    ctx.globalAlpha = frozen ? .82 : 1; ctx.fillStyle = color;
    ctx.font = `700 ${size * 1.45}px Georgia, serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("♪", 0, 0); ctx.restore();
  }

  function updateAndDrawNotes(dt, time) {
    for (let i = flyingNotes.length - 1; i >= 0; i--) {
      const item = flyingNotes[i]; item.distance += item.speed * dt;
      if (item.distance >= item.boundary) { freezeNote(item); flyingNotes.splice(i, 1); continue; }
      const p = notePosition(item.angle + Math.sin(time * .004 + item.wobble) * .012, item.distance);
      drawMusicNote(p.x, p.y, item.size, item.note.color, false, item.angle);
    }
    frozenNotes.forEach((item) => {
      item.angle += item.speed * dt;
      const bob = Math.sin(time * .00055 + item.phase) * globe.r * .012;
      const p = notePosition(item.angle, item.orbit + bob, item.tilt);
      const appear = Math.min(1, (time - item.born) / 180);
      ctx.save(); ctx.globalAlpha = appear;
      drawMusicNote(p.x, p.y, item.size, item.note.color, true, item.angle); ctx.restore();
    });
    for (let i = iceBursts.length - 1; i >= 0; i--) {
      const p = notePosition(iceBursts[i].angle, iceBursts[i].orbit);
      const shard = iceBursts[i]; shard.distance += shard.speed * dt; shard.life -= dt * 1.35;
      ctx.globalAlpha = Math.max(0, shard.life); ctx.strokeStyle = "#dff8ff"; ctx.lineWidth = 1.2;
      const x = p.x + Math.cos(shard.direction) * shard.distance, y = p.y + Math.sin(shard.direction) * shard.distance;
      ctx.beginPath(); ctx.moveTo(x - 2, y); ctx.lineTo(x + 2, y); ctx.moveTo(x, y - 2); ctx.lineTo(x, y + 2); ctx.stroke();
      if (shard.life <= 0) iceBursts.splice(i, 1);
    }
    ctx.globalAlpha = 1;
  }

  function drawScene(time, dt) {
    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createRadialGradient(w * .5, h * .42, 0, w * .5, h * .48, Math.max(w, h) * .76);
    bg.addColorStop(0, "#0a1727"); bg.addColorStop(.48, "#040b17"); bg.addColorStop(1, "#01040a");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    stars.forEach((s) => { ctx.globalAlpha = s.a * (.82 + .18 * Math.sin(time * .00035 + s.phase)); ctx.fillStyle = "#d9e8f4"; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); });
    ctx.globalAlpha = 1;
    drawEarth(time);
    updateAndDrawNotes(dt, time);
  }

  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) rotation += dt * .055;
    drawScene(now, dt); requestAnimationFrame(frame);
  }

  canvas.addEventListener("pointerdown", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left, y = event.clientY - rect.top;
    if (Math.hypot(x - globe.cx, y - globe.cy) <= globe.r * 1.04) {
      event.preventDefault(); launchNote();
    }
  });
  canvas.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    canvas.style.cursor = Math.hypot(event.clientX - rect.left - globe.cx, event.clientY - rect.top - globe.cy) <= globe.r * 1.04 ? "pointer" : "default";
  });
  addEventListener("blur", () => flyingNotes.forEach((item) => stopTone(item.voice)));
  addEventListener("resize", resize);
  resize(); requestAnimationFrame(frame);
})();

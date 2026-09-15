/* global MineSong, MusicMineBoard, Marpan25D, MarpanSound, createCanvas, resizeCanvas, pixelDensity, clear, frameRate, drawingContext */
const $ = selector => document.querySelector(selector);
const song = MineSong;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let model, actors = [], buttons = [], stageSize = 500, cellPoints = [];
let sound = new MarpanSound({ volume: 0.17 });
let soundOn = true, audioAvailable = true, transport = null;
let gesture = null, suppressClick = null;

function unlockSound() {
  if (!soundOn || !audioAvailable) return;
  try {
    if (!(window.AudioContext || window.webkitAudioContext)) throw new Error("Audio unavailable");
    sound.start();
    if (sound.context.state === "suspended") sound.context.resume().catch(() => {});
  } catch {
    audioAvailable = false;
    $("#sound").textContent = "音 非対応";
    $("#sound").disabled = true;
  }
}
function playNote(event) {
  if (!soundOn || !audioAvailable) return;
  unlockSound();
  if (audioAvailable) sound.playMidi(song.notes[event.pitch].midi, {
    duration: Math.min(1.2, event.beats * 60 / song.bpm * 0.95), level: 0.65
  });
}
function hush() {
  if (!sound.context) return;
  sound.masterGain.disconnect();
  sound.masterGain = sound.context.createGain();
  sound.masterGain.gain.value = soundOn ? sound.volume : 0;
  sound.masterGain.connect(sound.context.destination);
}
function setup() {
  const canvas = createCanvas(500, 500);
  canvas.parent("characters");
  pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
  frameRate(60);
  startGame();
  new ResizeObserver(entries => {
    stageSize = entries[0].contentRect.width;
    resizeCanvas(stageSize, stageSize);
    measureCells();
  }).observe($("#musicStage"));
}
function measureCells() {
  const frame = $("#musicStage").getBoundingClientRect();
  cellPoints = buttons.map(button => {
    const rect = button.getBoundingClientRect();
    return { x: rect.left - frame.left + rect.width / 2, y: rect.top - frame.top + rect.height / 2, width: rect.width };
  });
}
function startGame() {
  clearGesture();
  suppressClick = null;
  transport = null;
  hush();
  model = new MusicMineBoard(song);
  actors = song.melody.map((event, position) => ({
    character: new Marpan25D({ id: "chain-" + position, bodyColor: song.notes[event.pitch].color, autoBlink: true }),
    visible: position >= 12, sounded: false, burstAt: -10000
  }));
  $(".game-shell").classList.remove("is-chain", "is-finished");
  $("#again").hidden = true;
  $("#restart").hidden = false;
  $("#restart").disabled = false;
  $("#status").textContent = "数字をたよりに、安全なマスをひらこう。";
  $("#musicStage").dataset.phase = "playing";
  $("#musicStage").dataset.note = "0";
  $("#board").innerHTML = model.cells.map(cell => '<button class="cell" type="button" data-index="' + cell.index + '"></button>').join("");
  buttons = [...document.querySelectorAll(".cell")];
  updateUI();
  measureCells();
}
function updateUI() {
  const locked = model.phase !== "playing";
  model.cells.forEach((cell, index) => {
    const button = buttons[index];
    const revealed = cell.mine && (cell.sounded || (locked && model.outcome === "clear"));
    button.disabled = locked;
    button.className = "cell" + (cell.opened ? " opened" : "") +
      (cell.marked && !locked ? " marked" : "") + (revealed ? " revealed" : "") +
      (cell.sounded ? " sounded" : "");
    const coords = (Math.floor(index / 8) + 1) + "行" + (index % 8 + 1) + "列";
    if (cell.mine && revealed) {
      button.textContent = "";
      button.removeAttribute("data-count");
      button.setAttribute("aria-label", coords + (cell.sounded ? "、連鎖した地雷" : "、地雷"));
    } else if (cell.opened) {
      button.dataset.count = cell.count;
      button.innerHTML = cell.count ? '<span class="number">' + cell.count + '</span>' : "";
      button.setAttribute("aria-label", coords + "、周囲の地雷" + cell.count + "個");
    } else {
      button.removeAttribute("data-count");
      button.textContent = cell.marked && !locked ? "♪" : "";
      button.setAttribute("aria-label", coords + (cell.marked && !locked ? "、音符マーク" : "、未開封"));
    }
  });
  const marked = model.cells.filter(cell => cell.marked).length;
  $("#counterLabel").textContent = locked ? "きらきら星" : "地雷 − ♪ マーク";
  $("#remaining").innerHTML = locked ? "♪" : (12 - marked) + " <small>/ 12</small>";
  $("#safeCount").textContent = "安全 " + model.safeOpened + " / 52";
}
function reveal(index) {
  if (model.phase !== "playing") return;
  unlockSound();
  const result = model.open(index);
  if (!result) return;
  updateUI();
  if (result === "mine" || result === "clear") beginPerformance();
}
function mark(index) {
  if (model.mark(index)) updateUI();
}
function beginPerformance() {
  clearGesture();
  $(".game-shell").classList.add("is-chain");
  $("#musicStage").dataset.phase = "chain";
  $("#restart").disabled = true;
  $("#restart").hidden = true;
  $("#again").hidden = true;
  $("#status").textContent = model.outcome === "clear" ? "ぜんぶ、ひらけた。音楽を解き放とう。" : "ポン。かくれていた音楽が、動き出す。";
  if (model.outcome === "clear") actors.slice(0, 12).forEach(actor => { actor.visible = true; });
  const now = performance.now();
  transport = { start: now, cursor: 0, pausedAt: null };
  // The hit and its first sound happen together, without a countdown.
  ignite(model.chain[0], now);
  transport.cursor = 1;
}
function ignite(event, now) {
  const actor = actors[event.position];
  actor.visible = true;
  actor.sounded = true;
  actor.burstAt = now;
  if (event.cell !== null) {
    model.cells[event.cell].sounded = true;
    model.cells[event.cell].marked = false;
  }
  updateUI();
  if (event.cell !== null) buttons[event.cell].classList.add("singing");
  $("#musicStage").dataset.note = String(event.position + 1);
  if (event.position === 12) $("#status").textContent = "音楽が、盤面の外へあふれ出す。";
  playNote(event);
}
function tickTransport(now) {
  if (!transport || transport.pausedAt !== null) return;
  const next = model.chain[transport.cursor];
  if (next && now >= transport.start + next.at) {
    // A stalled frame delays the chain; never skip notes or burst several at once.
    const late = now - transport.start - next.at;
    if (late > 100) transport.start += late;
    ignite(next, now);
    transport.cursor++;
  }
  if (transport.cursor === model.chain.length && now >= transport.start + model.duration + 450) {
    model.finish();
    transport = null;
    $(".game-shell").classList.remove("is-chain");
    $(".game-shell").classList.add("is-finished");
    $("#musicStage").dataset.phase = "finished";
    $("#status").textContent = model.outcome === "clear" ? "すべての安全マスから、きらきら星が生まれました。" : "ひとつの「ポン」が、きらきら星になりました。";
    updateUI();
    $("#again").hidden = false;
  }
}
function outerPoint(index) {
  // Begin at the upper right, then travel clockwise at equal arc distances.
  const side = stageSize * 0.9, low = stageSize * 0.05, high = stageSize * 0.95;
  const distance = index / (song.melody.length - 12) * side * 4;
  if (distance < side) return { x: high, y: low + distance };
  if (distance < side * 2) return { x: high - (distance - side), y: high };
  if (distance < side * 3) return { x: low, y: high - (distance - side * 2) };
  return { x: low + (distance - side * 3), y: low };
}
function eventPoint(event) {
  return event.cell !== null ? cellPoints[event.cell] : outerPoint(event.outer);
}
function linkPoints(position) {
  const from = eventPoint(model.chain[position]), to = eventPoint(model.chain[position + 1]);
  if (position === 11) return [from, { x: stageSize * 0.9, y: from.y }, { x: stageSize * 0.95, y: from.y }, to];
  if (position >= 12) {
    const a = model.chain[position].outer, b = a + 1, count = song.melody.length - 12;
    const fromSide = Math.floor(a / count * 4), toSide = Math.floor(b / count * 4);
    if (fromSide !== toSide) {
      const corners = [{ x: .95, y: .95 }, { x: .05, y: .95 }, { x: .05, y: .05 }];
      const corner = corners[fromSide];
      return [from, { x: corner.x * stageSize, y: corner.y * stageSize }, to];
    }
  }
  return [from, to];
}
function pointAlong(points, progress) {
  const lengths = points.slice(1).map((point, index) => Math.hypot(point.x - points[index].x, point.y - points[index].y));
  let distance = lengths.reduce((a, b) => a + b, 0) * Math.max(0, Math.min(1, progress));
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i] || i === lengths.length - 1) {
      const t = lengths[i] ? distance / lengths[i] : 1;
      return { x: points[i].x + (points[i + 1].x - points[i].x) * t, y: points[i].y + (points[i + 1].y - points[i].y) * t };
    }
    distance -= lengths[i];
  }
  return points[0];
}
function drawLinks(ctx, now) {
  if (!transport || transport.cursor === 0) return;
  const position = transport.cursor - 1;
  if (position >= model.chain.length - 1) return;
  const current = model.chain[position], next = model.chain[position + 1];
  const progress = Math.max(0, Math.min(1, (now - transport.start - current.at) / (next.at - current.at)));
  const points = linkPoints(position);
  ctx.save();
  ctx.lineWidth = position === 11 ? 3 : 2;
  ctx.strokeStyle = position === 11 ? "#d9a943" : "#bbccad";
  ctx.setLineDash([3, 5]);
  ctx.beginPath();
  points.forEach((point, i) => i ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
  ctx.stroke();
  ctx.setLineDash([]);
  if (!reducedMotion.matches) {
    const point = pointAlong(points, progress);
    ctx.shadowColor = "#ffe399";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "#e2ad39";
    ctx.beginPath(); ctx.arc(point.x, point.y, position === 11 ? 5 : 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#a77720"; ctx.font = "bold 14px sans-serif"; ctx.fillText("♪", point.x + 5, point.y - 5);
  }
  ctx.restore();
}
function drawBurst(ctx, point, age, note) {
  if (age < 0 || age > 1) return;
  const strength = 1 - age, unit = stageSize / 500;
  ctx.save();
  ctx.globalAlpha = strength;
  ctx.strokeStyle = note.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(point.x, point.y, (12 + age * 27) * unit, 0, Math.PI * 2);
  ctx.stroke();
  if (!reducedMotion.matches) {
    ctx.fillStyle = note.color;
    for (let i = 0; i < 7; i++) {
      const angle = i * Math.PI * 2 / 7;
      const radius = (10 + age * 30) * unit;
      ctx.beginPath(); ctx.arc(point.x + Math.cos(angle) * radius, point.y + Math.sin(angle) * radius, 2 * unit, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = "#987224"; ctx.font = "bold " + Math.max(10, 13 * unit) + "px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("♪ " + note.label, point.x, Math.max(12, point.y - (18 + age * 16) * unit));
  }
  ctx.restore();
}
function draw() {
  clear();
  if (!model || !cellPoints.length) return;
  const now = performance.now();
  tickTransport(now);
  const ctx = drawingContext;
  drawLinks(ctx, now);
  actors.forEach((actor, position) => {
    if (!actor.visible) return;
    const event = model.chain[position] || { ...song.melody[position], cell: null, outer: position - 12 };
    const point = eventPoint(event), note = song.notes[event.pitch];
    const age = (now - actor.burstAt) / 750;
    const active = age >= 0 && age < 1;
    const bounce = !reducedMotion.matches && active ? Math.sin(age * Math.PI) * stageSize * 0.018 : 0;
    const bodyWidth = position < 12 ? point.width * 0.8 : stageSize * 0.065;
    if (active) drawBurst(ctx, point, age, note);
    ctx.save();
    ctx.globalAlpha = actor.sounded ? 1 : .8;
    actor.character.drawAt(point.x, point.y - bounce, {
      bodyWidth, bodyColor: position < 12 && !actor.sounded ? "#dce4d7" : note.color,
      lookX: point.x, lookY: point.y, scaleY: 1 + bounce / stageSize * 4
    });
    ctx.restore();
  });
}
function clearGesture() {
  if (gesture) clearTimeout(gesture.timer);
  gesture = null;
}

$("#board").addEventListener("pointerdown", event => {
  const button = event.target.closest(".cell");
  if (event.pointerType === "mouse") suppressClick = null;
  if (!button || event.button !== 0 || model.phase !== "playing") return;
  clearGesture();
  suppressClick = null;
  unlockSound();
  const index = Number(button.dataset.index);
  gesture = { index, id: event.pointerId, x: event.clientX, y: event.clientY, timer: null };
  if (event.pointerType !== "mouse") gesture.timer = setTimeout(() => {
    mark(index);
    suppressClick = index;
    clearGesture();
  }, 480);
});
$("#board").addEventListener("pointermove", event => {
  if (gesture && event.pointerId === gesture.id && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 10) {
    suppressClick = gesture.index;
    clearGesture();
  }
});
window.addEventListener("pointerup", clearGesture);
window.addEventListener("pointercancel", () => {
  if (gesture) suppressClick = gesture.index;
  clearGesture();
});
$("#board").addEventListener("click", event => {
  const button = event.target.closest(".cell");
  if (!button) return;
  const index = Number(button.dataset.index);
  if (suppressClick === index) { suppressClick = null; return; }
  reveal(index);
});
$("#board").addEventListener("contextmenu", event => {
  event.preventDefault();
  const button = event.target.closest(".cell");
  if (!button || model.phase !== "playing") return;
  const index = Number(button.dataset.index);
  if (suppressClick === index) return;
  clearGesture();
  mark(index);
  suppressClick = index;
});
$("#board").addEventListener("keydown", event => {
  suppressClick = null;
  const button = event.target.closest(".cell");
  if (!button || model.phase !== "playing") return;
  const index = Number(button.dataset.index), offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -8, ArrowDown: 8 };
  if (event.key in offsets) {
    event.preventDefault();
    buttons[Math.max(0, Math.min(63, index + offsets[event.key]))].focus();
  } else if (event.key.toLowerCase() === "f") {
    event.preventDefault(); mark(index);
  }
});
$("#restart").addEventListener("click", () => { if (model.phase === "playing") startGame(); });
$("#again").addEventListener("click", () => { if (model.phase === "finished") startGame(); });
$("#sound").addEventListener("click", () => {
  soundOn = !soundOn;
  hush();
  if (soundOn) unlockSound();
  $("#sound").textContent = soundOn ? "音 ON" : "音 OFF";
  $("#sound").setAttribute("aria-pressed", String(soundOn));
});
document.addEventListener("visibilitychange", () => {
  clearGesture();
  if (!transport) return;
  if (document.hidden) {
    transport.pausedAt = performance.now();
    hush();
  } else if (transport.pausedAt !== null) {
    transport.start += performance.now() - transport.pausedAt;
    actors.forEach(actor => { actor.burstAt += performance.now() - transport.pausedAt; });
    transport.pausedAt = null;
  }
});


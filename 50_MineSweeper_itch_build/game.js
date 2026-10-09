/* global MineSong, MusicMineBoard, Marpan25D, MarpanSound, createCanvas, resizeCanvas, pixelDensity, clear, frameRate, drawingContext */
const $ = selector => document.querySelector(selector);
let language = (typeof localStorage !== "undefined" && localStorage.getItem("marpan-minesweeper-language")) || "ja";
let song = MineSong, selectedStage = null;
const COPY = {
  ja: { titleTop:"マーパン",titleMain:"マインスイーパー",subtitle:"ひとつの「ポン」から、きらきら星。",selectTitle:"ステージを選択",selectLead:"庭が広いほど、音楽は深くかくれています。",stages:"ステージ選択",guide:"タップでひらく · 長押し / 右クリックで ♪ マーク",play:"この庭であそぶ",counter:"地雷 − ♪ マーク",safe:"安全",restart:"↻ はじめから",soundOn:"音 ON",soundOff:"音 OFF",unsupported:"音 非対応",ready:"数字をたよりに、安全なマスをひらこう。",clearStart:"ぜんぶ、ひらけた。音楽を解き放とう。",mineStart:"ポン。かくれていた音楽が、動き出す。",overflow:"音楽が、盤面の外へあふれ出す。",clearEnd:"すべての安全マスから、きらきら星が生まれました。",mineEnd:"ひとつの「ポン」が、きらきら星になりました。",again:"もういちど",selectAgain:"ステージ選択へ",board:"音楽の地雷原",toggle:"Switch to English" },
  en: { titleTop:"MA-PAN",titleMain:"MINESWEEPER",subtitle:"One little pop becomes a sparkling song.",selectTitle:"SELECT A STAGE",selectLead:"The larger the garden, the deeper the music hides.",stages:"STAGE SELECT",guide:"Tap to open · Hold / right-click to mark ♪",play:"PLAY THIS GARDEN",counter:"MINES − ♪ MARKS",safe:"SAFE",restart:"↻ RESTART",soundOn:"SOUND ON",soundOff:"SOUND OFF",unsupported:"NO AUDIO",ready:"Use the numbers to uncover every safe tile.",clearStart:"Every safe tile is open. Set the music free!",mineStart:"Pop! The hidden music begins to move.",overflow:"The music spills beyond the board.",clearEnd:"Twinkle, Twinkle, Little Star bloomed from every safe tile.",mineEnd:"One little pop became Twinkle, Twinkle, Little Star.",again:"PLAY AGAIN",selectAgain:"STAGE SELECT",board:"musical minefield",toggle:"日本語に切り替え" }
};
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
    $("#sound").textContent = COPY[language].unsupported;
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
  renderStageSelect();
  applyLanguage();
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
function startGame(stage = selectedStage || MineStages[1]) {
  selectedStage = stage;
  song = stage;
  $("#stageSelect").hidden = true;
  $("#gameArea").hidden = false;
  clearGesture();
  suppressClick = null;
  transport = null;
  hush();
  model = new MusicMineBoard(song, Math.random, stage);
  actors = song.melody.map((event, position) => ({
    character: new Marpan25D({ id: "chain-" + position, bodyColor: song.notes[event.pitch].color, autoBlink: true }),
    visible: position >= model.mineCount, sounded: false, burstAt: -10000
  }));
  $(".game-shell").classList.remove("is-chain", "is-finished");
  $("#resultActions").hidden = true;
  $("#again").hidden = true;
  $("#restart").hidden = false;
  $("#restart").disabled = false;
  $("#status").textContent = COPY[language].ready;
  $("#musicStage").dataset.phase = "playing";
  $("#musicStage").dataset.note = "0";
  $("#board").innerHTML = model.cells.map(cell => '<button class="cell" type="button" data-index="' + cell.index + '"></button>').join("");
  $("#board").style.setProperty("--size", model.size);
  $("#stageName").textContent = language === "ja" ? stage.name : stage.nameEn;
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
    const row = Math.floor(index / model.size) + 1, col = index % model.size + 1;
    const coords = language === "ja" ? `${row}行${col}列` : `row ${row}, column ${col}`;
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
  $("#counterLabel").textContent = locked ? (language === "ja" ? song.title : song.titleEn) : COPY[language].counter;
  $("#remaining").innerHTML = locked ? "♪" : (model.mineCount - marked) + ` <small>/ ${model.mineCount}</small>`;
  $("#safeCount").textContent = COPY[language].safe + " " + model.safeOpened + " / " + (model.cells.length - model.mineCount);
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
  $("#resultActions").hidden = true;
  $("#again").hidden = true;
  $("#status").textContent = model.outcome === "clear" ? COPY[language].clearStart : COPY[language].mineStart;
  if (model.outcome === "clear") actors.slice(0, model.mineCount).forEach(actor => { actor.visible = true; });
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
  if (event.position === model.mineCount) $("#status").textContent = COPY[language].overflow;
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
    $("#status").textContent = model.outcome === "clear" ? COPY[language].clearEnd : COPY[language].mineEnd;
    updateUI();
    $("#resultActions").hidden = false;
    $("#again").hidden = false;
  }
}
function outerPoint(index) {
  // Begin at the upper right, then travel clockwise at equal arc distances.
  const side = stageSize * 0.9, low = stageSize * 0.05, high = stageSize * 0.95;
  const outsideCount = song.melody.length - model.mineCount;
  const distance = index / Math.max(1, outsideCount) * side * 4;
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
  if (position === model.mineCount - 1) return [from, { x: stageSize * 0.9, y: from.y }, { x: stageSize * 0.95, y: from.y }, to];
  if (position >= model.mineCount) {
    const a = model.chain[position].outer, b = a + 1, count = song.melody.length - model.mineCount;
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
  ctx.lineWidth = position === model.mineCount - 1 ? 3 : 2;
  ctx.strokeStyle = position === model.mineCount - 1 ? "#d9a943" : "#bbccad";
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
    ctx.beginPath(); ctx.arc(point.x, point.y, position === model.mineCount - 1 ? 5 : 3.5, 0, Math.PI * 2); ctx.fill();
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
    const event = model.chain[position] || { ...song.melody[position], cell: null, outer: position - model.mineCount };
    const point = eventPoint(event), note = song.notes[event.pitch];
    const age = (now - actor.burstAt) / 750;
    const active = age >= 0 && age < 1;
    const bounce = !reducedMotion.matches && active ? Math.sin(age * Math.PI) * stageSize * 0.018 : 0;
    const bodyWidth = position < model.mineCount ? point.width * 0.8 : stageSize * 0.065;
    if (active) drawBurst(ctx, point, age, note);
    ctx.save();
    ctx.globalAlpha = actor.sounded ? 1 : .8;
    actor.character.drawAt(point.x, point.y - bounce, {
      bodyWidth, bodyColor: position < model.mineCount && !actor.sounded ? "#dce4d7" : note.color,
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
    const offset = event.key === "ArrowUp" ? -model.size : event.key === "ArrowDown" ? model.size : offsets[event.key];
    buttons[Math.max(0, Math.min(model.cells.length - 1, index + offset))].focus();
  } else if (event.key.toLowerCase() === "f") {
    event.preventDefault(); mark(index);
  }
});
$("#restart").addEventListener("click", () => { if (model.phase === "playing") startGame(); });
$("#again").addEventListener("click", () => { if (model.phase === "finished") startGame(selectedStage); });
$("#selectAgain").addEventListener("click", showStageSelect);
$("#stageBack").addEventListener("click", showStageSelect);
$("#sound").addEventListener("click", () => {
  soundOn = !soundOn;
  hush();
  if (soundOn) unlockSound();
  $("#sound").textContent = soundOn ? COPY[language].soundOn : COPY[language].soundOff;
  $("#sound").setAttribute("aria-pressed", String(soundOn));
});
function renderStageSelect() {
  $("#stageCards").innerHTML = MineStages.map((stage, index) => `<button class="stage-card" type="button" data-stage="${index}"><span class="stage-number">STAGE ${stage.number}</span><strong>${language === "ja" ? stage.name : stage.nameEn}</strong><span>${language === "ja" ? stage.detail : stage.detailEn}</span><em>${COPY[language].play} →</em></button>`).join("");
  document.querySelectorAll(".stage-card").forEach(button => button.addEventListener("click", () => startGame(MineStages[Number(button.dataset.stage)])));
}
function showStageSelect() {
  clearGesture(); transport = null; hush(); model = null; actors = []; cellPoints = [];
  $("#gameArea").hidden = true;
  $("#stageSelect").hidden = false;
  $(".game-shell").classList.remove("is-chain", "is-finished");
}
function applyLanguage() {
  const copy = COPY[language];
  document.documentElement.lang = language;
  document.querySelectorAll("[data-copy]").forEach(element => { element.textContent = copy[element.dataset.copy]; });
  $("#language").textContent = language === "ja" ? "EN" : "JP";
  $("#language").setAttribute("aria-label", copy.toggle);
  $("#sound").textContent = audioAvailable ? (soundOn ? copy.soundOn : copy.soundOff) : copy.unsupported;
  $("#restart").textContent = copy.restart;
  $("#again").textContent = copy.again;
  $("#selectAgain").textContent = copy.selectAgain;
  $("#garden").setAttribute("aria-label", copy.board);
  renderStageSelect();
  if (model) {
    $("#stageName").textContent = language === "ja" ? selectedStage.name : selectedStage.nameEn;
    updateUI();
  }
}
$("#language").addEventListener("click", () => {
  language = language === "ja" ? "en" : "ja";
  if (typeof localStorage !== "undefined") localStorage.setItem("marpan-minesweeper-language", language);
  applyLanguage();
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


// メロディー設定：別作品では FLAPPY_CONFIG から曲名と音列を差し替えられます。
const flappyConfig = window.FLAPPY_CONFIG || {};
const stages = flappyConfig.stages
  ? [...flappyConfig.stages].sort((a, b) => a.melody.length - b.melody.length)
  : null;
let melody = flappyConfig.melody || ["ド", "ド", "ソ", "ソ", "ラ", "ラ", "ソ", "ファ", "ファ", "ミ", "ミ", "レ", "レ", "ド"];
let gameTitle = flappyConfig.gameTitle || "メロディーフライト / MELODY FLIGHT";
let clearMessage = flappyConfig.clearMessage || "きらきら星を飛び切りました！\nTwinkle, Twinkle, Little Star complete!";
const noteHeights = {
  "ド": 0.70, "レ": 0.63, "ミ": 0.56, "ファ": 0.49,
  "ソ": 0.42, "ラ": 0.35, "シ": 0.28, "高いド": 0.21
};
const noteFrequencies = {
  "ド": "C4", "レ": "D4", "ミ": "E4", "ファ": "F4",
  "ソ": "G4", "ラ": "A4", "シ": "B4", "高いド": "C5"
};
const noteEnglish = {
  "ド": "C", "レ": "D", "ミ": "E", "ファ": "F",
  "ソ": "G", "ラ": "A", "シ": "B", "高いド": "High C"
};
const noteColors = {
  "ド": "#ef6a67",
  "レ": "#f29b52",
  "ミ": "#e5c64f",
  "ファ": "#63b875",
  "ソ": "#4da9c9",
  "ラ": "#6f86d6",
  "シ": "#9a72c7",
  "高いド": "#e65f91"
};

// ゲームバランス設定
let gravity = 0.42;
let jumpPower = -7.2;
let wallSpeed = 3.1;
let gapSize = 190;
const difficulties = {
  easy: {
    label: "EASY", stars: 1,
    gravity: 0.26, jumpPower: -5.5, wallSpeed: 1.45, gapSize: 360, beatPixelWidth: 120
  },
  normal: {
    label: "NORMAL", stars: 2,
    gravity: 0.42, jumpPower: -7.2, wallSpeed: 2.0, gapSize: 240, beatPixelWidth: 180
  },
  tempo: {
    label: "HARD", stars: 3,
    gravity: 0.42, jumpPower: -7.2, gapSize: 215, beatPixelWidth: 120, tempoSynced: true
  }
};
let selectedDifficulty = "easy";
let beatPixelWidth = 120;
const menuUi = {
  marpanFloat: 5,
  marpanTilt: 0.035,
  cardLift: 4,
  cardScale: 1.015,
  previewLineWidth: 2,
  previewNoteSize: 5
};

let player, synth;
let walls = [];
let particles = [];
let score = 0;
let gameState = "ready";
let debugMode = false;
let selectedStageIndex = -1;
const stageStars = loadStageStars();
let stageHoverAmounts = [];
let pendingStageIndex = -1;
let stageStartPending = false;

function loadStageStars() {
  try {
    const saved = JSON.parse(localStorage.getItem("melodyFlyStageStars") || "{}");
    return new Map(Object.entries(saved).map(([index, stars]) => [Number(index), Number(stars)]));
  } catch (error) {
    return new Map();
  }
}

function saveStageStars() {
  try {
    localStorage.setItem("melodyFlyStageStars", JSON.stringify(Object.fromEntries(stageStars)));
  } catch (error) {
    // 保存できない環境でもゲームはそのまま続行します。
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont("sans-serif");
  synth = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.01, decay: 0.12, sustain: 0.18, release: 0.35 }
  }).toDestination();
  resetGame();
}

function resetGame(nextState) {
  player = {
    x: constrain(width * 0.25, 70, 180), y: height * 0.5,
    radius: constrain(min(width, height) * 0.04, 22, 30), velocity: 0,
    marpan: new Marpan25D({ maxSize: 72, yaw: 0.78, bodyColor: "#fff8e8" })
  };
  player.marpan.enableAutoBlink(1800, 3400);
  walls = [];
  particles = [];
  score = 0;
  gameState = nextState || (stages ? "stageSelect" : "ready");
}

function applyDifficulty() {
  const difficulty = difficulties[selectedDifficulty];
  if (!difficulty) return;
  gravity = difficulty.gravity;
  jumpPower = difficulty.jumpPower;
  beatPixelWidth = difficulty.beatPixelWidth;
  gapSize = min(difficulty.gapSize, height * (selectedDifficulty === "easy" ? 0.56 : 0.48));
  if (difficulty.tempoSynced) {
    const bpm = stages[selectedStageIndex]?.tempoBpm || 110;
    wallSpeed = beatPixelWidth * bpm / 3600;
  } else {
    wallSpeed = difficulty.wallSpeed;
  }
}

function melodyNote(entry) {
  return typeof entry === "string" ? entry : entry.note;
}

function melodyBeats(entry) {
  return typeof entry === "string" ? 1 : max(0.5, Number(entry.beats) || 1);
}

function pitchStepDistance(fromNote, toNote) {
  if (!fromNote || !toNote) return 0;
  return round(abs((noteHeights[fromNote] ?? 0.5) - (noteHeights[toNote] ?? 0.5)) / 0.07);
}

function draw() {
  background(223, 243, 255);
  if (gameState === "stageSelect") {
    drawStageSelect();
    return;
  }
  if (gameState === "playing") updateGame();
  updateEffects();
  drawWalls();
  drawParticles();
  drawPlayer();
  drawInterface();
}

function updateGame() {
  const frameScale = min(deltaTime / (1000 / 60), 2);
  if (debugMode) {
    updateDebugFlight(frameScale);
  } else {
    player.velocity += gravity * frameScale;
    player.y += player.velocity * frameScale;
  }

  for (const wall of walls) {
    wall.x -= wallSpeed * frameScale;
    if (!wall.sounded && wall.x <= player.x) {
      wall.sounded = true;
      playNote(wall.note, wall.beats);
    }
    if (!wall.passed && wall.x + wall.width < player.x - player.radius) {
      wall.passed = true;
      score++;
      wall.flash = 1;
      emitPassParticles(wall);
      if (score >= melody.length) {
        clearGame();
        return;
      }
    }
    if (!debugMode && circleHitsWall(wall)) endGame();
  }
  walls = walls.filter(wall => wall.x + wall.width > -10);
  if (!debugMode && (player.y - player.radius <= 0 || player.y + player.radius >= height)) endGame();
}

function updateDebugFlight(frameScale) {
  const nextWall = walls.find(wall => wall.x + wall.width >= player.x - player.radius);
  const targetY = nextWall ? nextWall.gapY : height * 0.5;
  const previousY = player.y;
  player.y = lerp(player.y, targetY, 0.055 * frameScale);
  player.velocity = (player.y - previousY) / max(frameScale, 0.01);
}

function buildWalls() {
  const firstWallDistance = constrain(width * 0.22, 210, 300);
  let wallX = player.x + firstWallDistance;
  walls = [];
  for (let index = 0; index < melody.length; index++) {
    const entry = melody[index];
    const note = melodyNote(entry);
    const beats = melodyBeats(entry);
    const safeMargin = gapSize * 0.5 + 24;
    const gapY = constrain(height * noteHeights[note], safeMargin, height - safeMargin);
    const widthForDuration = max(34, beatPixelWidth * beats * 0.48);
    walls.push({
      x: wallX, width: widthForDuration, gapY, note, beats,
      sounded: false, passed: false, flash: 0
    });
    let transitionSpace = 0;
    if (selectedDifficulty === "tempo" && index < melody.length - 1) {
      const nextNote = melodyNote(melody[index + 1]);
      const pitchSteps = pitchStepDistance(note, nextNote);
      transitionSpace = max(0, pitchSteps - 2) * 60;
    }
    wallX += beatPixelWidth * beats + transitionSpace;
  }
}

function circleHitsWall(wall) {
  const overlapsX = player.x + player.radius > wall.x && player.x - player.radius < wall.x + wall.width;
  if (!overlapsX) return false;
  return player.y - player.radius < wall.gapY - gapSize / 2 || player.y + player.radius > wall.gapY + gapSize / 2;
}

function drawWalls() {
  noStroke();
  textAlign(CENTER, CENTER);
  for (const wall of walls) {
    const gapTop = wall.gapY - gapSize / 2;
    const gapBottom = wall.gapY + gapSize / 2;
    const wallColor = noteColors[wall.note];
    if (wall.flash > 0) {
      drawingContext.shadowColor = wallColor;
      drawingContext.shadowBlur = 34 * wall.flash;
    }
    fill(wallColor);
    rect(wall.x, 0, wall.width, gapTop, 5);
    rect(wall.x, gapBottom, wall.width, height - gapBottom, 5);
    drawingContext.shadowBlur = 0;
    if (wall.flash > 0) {
      fill(255, 235 * wall.flash);
      rect(wall.x, 0, wall.width, gapTop, 5);
      rect(wall.x, gapBottom, wall.width, height - gapBottom, 5);
    }
    fill(32, 91, 57);
    textSize(12); textStyle(BOLD);
    text(`${wall.note} / ${noteEnglish[wall.note]}`, wall.x + wall.width / 2, wall.gapY);
  }
  textStyle(NORMAL);
}

function emitPassParticles(wall) {
  const colorValue = noteColors[wall.note];
  const edgeX = wall.x + wall.width;
  const edges = [wall.gapY - gapSize / 2, wall.gapY + gapSize / 2];
  for (let i = 0; i < 22; i++) {
    const fromTop = i % 2 === 0;
    particles.push({
      x: edgeX + random(-8, 8),
      y: edges[fromTop ? 0 : 1] + random(-7, 7),
      vx: random(-2.6, 2.8),
      vy: fromTop ? random(0.8, 4.2) : random(-4.2, -0.8),
      size: random(3, 8),
      life: 1,
      color: colorValue
    });
  }
}

function updateEffects() {
  const frameScale = min(deltaTime / (1000 / 60), 2);
  for (const wall of walls) wall.flash = max(0, wall.flash - 0.055 * frameScale);
  for (const particle of particles) {
    particle.x += particle.vx * frameScale;
    particle.y += particle.vy * frameScale;
    particle.vy += 0.045 * frameScale;
    particle.life -= 0.032 * frameScale;
  }
  particles = particles.filter(particle => particle.life > 0);
}

function drawParticles() {
  noStroke();
  for (const particle of particles) {
    const particleColor = color(particle.color);
    particleColor.setAlpha(255 * particle.life);
    fill(particleColor);
    circle(particle.x, particle.y, particle.size * (0.45 + particle.life * 0.55));
  }
}

function drawPlayer() {
  push();
  translate(player.x, player.y);
  if (gameState === "playing") rotate(constrain(player.velocity * 0.045, -0.35, 0.65));
  const bodyWidth = player.radius * 2.25;
  player.marpan.drawAt(0, 0, {
    bodyWidth,
    bodyHeight: bodyWidth * 0.68,
    yaw: 0.78,
    lookX: bodyWidth,
    lookY: -player.velocity * 0.7,
    eyeScale: 0.92
  });
  pop();
}

function stageButtonLayout() {
  const manyStages = stages.length > 4;
  const columns = manyStages && width >= 700 ? 2 : 1;
  const buttonWidth = columns === 2
    ? constrain(width * 0.41, 290, 430)
    : constrain(width * 0.82, 270, 520);
  const buttonHeight = manyStages
    ? constrain(height * 0.065, 44, 58)
    : constrain(height * 0.105, 58, 76);
  const gapX = buttonWidth + constrain(width * 0.025, 16, 30);
  const gapY = buttonHeight + (manyStages ? 8 : constrain(height * 0.025, 12, 22));
  const rows = ceil(stages.length / columns);
  const startY = manyStages ? height * 0.48 : height * 0.52;
  return stages.map((stage, index) => ({
    x: width / 2 + (index % columns - (columns - 1) / 2) * gapX,
    y: startY + floor(index / columns) * gapY,
    width: buttonWidth,
    height: buttonHeight,
    stage,
    index
  }));
}

function difficultyButtonLayout() {
  const entries = Object.entries(difficulties);
  const buttonWidth = constrain(width * 0.22, 118, 190);
  const buttonHeight = 42;
  const gap = constrain(width * 0.018, 8, 18);
  const totalWidth = entries.length * buttonWidth + (entries.length - 1) * gap;
  return entries.map(([key, difficulty], index) => ({
    key,
    difficulty,
    x: width / 2 - totalWidth / 2 + buttonWidth / 2 + index * (buttonWidth + gap),
    y: height * 0.405,
    width: buttonWidth,
    height: buttonHeight
  }));
}

function drawStageSelect() {
  drawMenuAtmosphere();
  fill(31, 59, 76);
  noStroke();
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(constrain(width * 0.075, 34, 58));
  text(flappyConfig.menuTitle || "MELODY FLY", width / 2, height * 0.12);
  textStyle(NORMAL);
  textSize(constrain(width * 0.028, 14, 18));
  text("ステージを選択 / SELECT A STAGE", width / 2, height * 0.19);

  drawMenuMarpan();

  for (const button of difficultyButtonLayout()) drawDifficultyButton(button);

  for (const button of stageButtonLayout()) {
    const earnedStars = stageStars.get(button.stage.name) || 0;
    const hovered = pointInButton(mouseX, mouseY, button) || pendingStageIndex === button.index;
    stageHoverAmounts[button.index] = lerp(stageHoverAmounts[button.index] || 0, hovered ? 1 : 0, 0.18);
    drawStageCard(button, earnedStars, stageHoverAmounts[button.index]);
  }
  rectMode(CORNER);
  textStyle(NORMAL);
}

function drawDifficultyButton(button) {
  const selected = selectedDifficulty === button.key;
  const disabled = false;
  rectMode(CENTER);
  stroke(selected ? "#e0a51d" : "#7692a2");
  strokeWeight(selected ? 3 : 1.5);
  fill(disabled ? "#e7ecef" : selected ? "#fff4c7" : "#ffffff");
  rect(button.x, button.y, button.width, button.height, 13);
  noStroke();
  fill(disabled ? "#89979f" : "#1f3b4c");
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(constrain(button.width * 0.083, 11, 14));
  const stars = "★".repeat(button.difficulty.stars);
  text(`${stars} ${button.difficulty.label}`, button.x, button.y);
}

function drawMenuAtmosphere() {
  noStroke();
  textAlign(CENTER, CENTER);
  textStyle(NORMAL);
  textSize(constrain(width * 0.04, 18, 30));
  const notes = [
    { x: 0.10, y: 0.17, phase: 0.2 }, { x: 0.88, y: 0.22, phase: 1.5 },
    { x: 0.17, y: 0.34, phase: 2.8 }, { x: 0.82, y: 0.36, phase: 4.1 }
  ];
  for (const note of notes) {
    fill(77, 137, 166, 38);
    text("♪", width * note.x, height * note.y + sin(millis() * 0.0012 + note.phase) * 7);
  }
}

function drawMenuMarpan() {
  const time = millis() * 0.001;
  const bodyWidth = constrain(min(width, height) * 0.14, 68, 105);
  const floatY = sin(time * 1.55) * menuUi.marpanFloat;
  const tilt = sin(time * 1.05) * menuUi.marpanTilt;
  const yaw = 0.72 + sin(time * 0.72) * 0.16;
  push();
  translate(width / 2, height * 0.30 + floatY);
  rotate(tilt);
  player.marpan.drawAt(0, 0, {
    bodyWidth,
    bodyHeight: bodyWidth * 0.68,
    yaw,
    lookX: 90 + sin(time * 0.9) * 28,
    lookY: sin(time * 1.3) * 12
  });
  pop();
}

function drawStageCard(button, earnedStars, hoverAmount) {
  const isClear = earnedStars > 0;
  const compact = stages.length > 4;
  const lift = hoverAmount * menuUi.cardLift;
  const scaleAmount = lerp(1, menuUi.cardScale, hoverAmount);
  push();
  translate(button.x, button.y - lift);
  scale(scaleAmount);
  rectMode(CENTER);
  stroke(isClear ? "#4b9b69" : lerpColor(color("#6a8798"), color("#3d7898"), hoverAmount));
  strokeWeight((isClear ? 2.5 : 1.7) + hoverAmount * 0.8);
  fill(isClear ? "#e7f7e9" : lerpColor(color("#ffffff"), color("#f5fbff"), hoverAmount));
  drawingContext.shadowColor = `rgba(48, 91, 113, ${0.08 + hoverAmount * 0.12})`;
  drawingContext.shadowBlur = 10 + hoverAmount * 8;
  drawingContext.shadowOffsetY = 3 + hoverAmount * 2;
  rect(0, 0, button.width, button.height, 16);
  drawingContext.shadowBlur = 0;
  drawingContext.shadowOffsetY = 0;

  const left = -button.width / 2;
  const labelX = left + button.width * 0.055;
  const previewX = compact ? button.width * 0.17 : left + button.width * 0.47;
  const previewWidth = button.width * (compact ? 0.25 : 0.34);
  const playX = button.width * 0.42;
  const number = String(button.index + 1).padStart(2, "0");
  const titleParts = button.stage.name.split(" / ");
  const japaneseTitle = titleParts[0];
  const englishTitle = titleParts.slice(1).join(" / ");

  noStroke();
  fill(31, 59, 76);
  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  textSize(constrain(button.width * (compact ? 0.032 : 0.038), 11, compact ? 15 : 18));
  text(`♪ ${number}  ${japaneseTitle}`, labelX, compact ? -button.height * 0.20 : -button.height * 0.10);
  if (englishTitle) {
    textStyle(NORMAL);
    textSize(constrain(button.width * 0.024, 9, 11));
    text(englishTitle, labelX, compact ? button.height * 0.08 : button.height * 0.15);
  }
  if (isClear) {
    fill("#398254");
    textSize(constrain(button.width * 0.027, 10, 13));
    text(`${"★".repeat(earnedStars)}  BEST`, labelX, button.height * 0.34);
  }

  drawMelodyPreview(button.stage.melody, previewX, 0, previewWidth, button.height * 0.52, hoverAmount);

  fill(48, 91, 113, 180 + hoverAmount * 75);
  textAlign(CENTER, CENTER);
  textSize(constrain(button.height * 0.34, 16, 24));
  text("▶", playX + hoverAmount * 2, 0);
  pop();
}

function drawMelodyPreview(stageMelody, centerX, centerY, previewWidth, previewHeight, emphasis) {
  if (!stageMelody?.length) return;
  const left = centerX - previewWidth / 2;
  const top = centerY - previewHeight / 2;
  const noteY = note => top + map(noteHeights[note] ?? 0.5, 0.21, 0.70, 0, previewHeight);

  noFill();
  stroke(64, 105, 128, 105 + emphasis * 90);
  strokeWeight(menuUi.previewLineWidth + emphasis * 0.7);
  beginShape();
  for (let i = 0; i < stageMelody.length; i++) {
    const x = stageMelody.length === 1 ? centerX : map(i, 0, stageMelody.length - 1, left, left + previewWidth);
    vertex(x, noteY(melodyNote(stageMelody[i])));
  }
  endShape();

  noStroke();
  for (let i = 0; i < stageMelody.length; i++) {
    const note = melodyNote(stageMelody[i]);
    const x = stageMelody.length === 1 ? centerX : map(i, 0, stageMelody.length - 1, left, left + previewWidth);
    fill(noteColors[note] || "#6a8798");
    circle(x, noteY(note), menuUi.previewNoteSize + emphasis * 1.8);
  }
}

function resultButtonLayout() {
  const buttonWidth = constrain(width * 0.32, 130, 220);
  const buttonHeight = 54;
  const gap = constrain(width * 0.025, 12, 24);
  return [
    { action: "retry", label: "RETRY", x: width / 2 - buttonWidth / 2 - gap / 2, y: height * 0.63, width: buttonWidth, height: buttonHeight },
    { action: "select", label: "STAGE SELECT", x: width / 2 + buttonWidth / 2 + gap / 2, y: height * 0.63, width: buttonWidth, height: buttonHeight }
  ];
}

function drawStageResult() {
  const stage = stages[selectedStageIndex];
  fill(31, 59, 76, 225);
  noStroke();
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(constrain(width * 0.07, 32, 54));
  text(gameState === "stageClear" ? "CLEAR!" : "GAME OVER", width / 2, height * 0.36);
  textSize(constrain(width * 0.035, 17, 25));
  text(stage.name, width / 2, height * 0.46);
  if (gameState === "stageClear") {
    const stars = difficulties[selectedDifficulty].stars;
    fill("#d99a13");
    textSize(constrain(width * 0.05, 24, 38));
    text(`${"★".repeat(stars)}  ${difficulties[selectedDifficulty].label} CLEAR`, width / 2, height * 0.535);
  }

  for (const button of resultButtonLayout()) {
    rectMode(CENTER);
    stroke(66, 96, 112);
    strokeWeight(2);
    fill(255, 245);
    rect(button.x, button.y, button.width, button.height, 14);
    noStroke();
    fill(31, 59, 76);
    textSize(constrain(width * 0.026, 13, 17));
    text(button.label, button.x, button.y);
  }
  rectMode(CORNER);
  textStyle(NORMAL);
}

function drawInterface() {
  noStroke(); fill(31, 59, 76);
  textAlign(CENTER, TOP); textStyle(BOLD); textSize(constrain(width * 0.055, 25, 40));
  text(`${score} / ${melody.length}`, width / 2, 18); textStyle(NORMAL);
  if (stages && selectedStageIndex >= 0) {
    fill(31, 59, 76, 190);
    textAlign(LEFT, TOP);
    textStyle(BOLD);
    textSize(constrain(width * 0.025, 12, 16));
    const difficulty = difficulties[selectedDifficulty];
    const bpmLabel = difficulty.tempoSynced ? ` · ${stages[selectedStageIndex].tempoBpm} BPM` : "";
    text(`${"★".repeat(difficulty.stars)} ${difficulty.label}${bpmLabel}`, 16, 18);
    textStyle(NORMAL);
  }
  if (debugMode) {
    fill(184, 55, 55);
    textAlign(RIGHT, TOP);
    textStyle(BOLD);
    textSize(constrain(width * 0.026, 12, 16));
    text("デバッグ：自動飛行 / DEBUG: AUTO FLIGHT\nDキーで終了 / Press D to exit", width - 16, 18);
    textStyle(NORMAL);
  }
  if (stages && (gameState === "gameOver" || gameState === "stageClear")) {
    drawStageResult();
    return;
  }
  if (gameState === "playing") return;
  fill(31, 59, 76, 220); textAlign(CENTER, CENTER); textStyle(BOLD);
  textSize(constrain(width * 0.045, 22, 34));
  const heading = gameState === "gameover"
    ? "ゲームオーバー / GAME OVER"
    : gameState === "clear"
      ? "クリア！ / MELODY COMPLETE!"
      : gameTitle;
  text(heading, width / 2, height * 0.40);
  textAlign(CENTER, TOP);
  textStyle(NORMAL); textSize(constrain(width * 0.033, 15, 20));
  textLeading(constrain(height * 0.052, 24, 31));
  text(
    gameState === "gameover"
      ? "タップ / Space で再スタート\nTap / Space to restart"
      : gameState === "clear"
        ? `${clearMessage}\n\nタップ / Space でもう一度\nTap / Space to play again`
      : "タップ / クリック / Space でジャンプ\nTap / Click / Space to jump",
    width / 2,
    height * 0.49
  );
}

async function handleAction() {
  await Tone.start();
  if (gameState === "gameover" || gameState === "clear") resetGame();
  if (gameState === "ready") { gameState = "playing"; buildWalls(); }
  player.velocity = jumpPower;
  return false;
}

function startStage(index) {
  const stage = stages[index];
  selectedStageIndex = index;
  melody = stage.melody;
  gameTitle = stage.gameTitle || stage.name;
  clearMessage = stage.clearMessage || `${stage.name}を飛び切りました！`;
  applyDifficulty();
  pendingStageIndex = -1;
  stageStartPending = false;
  resetGame("playing");
  buildWalls();
}

function retryStage() {
  resetGame("playing");
  buildWalls();
}

function returnToStageSelect() {
  debugMode = false;
  selectedStageIndex = -1;
  pendingStageIndex = -1;
  stageStartPending = false;
  resetGame("stageSelect");
}

function pointInButton(x, y, button) {
  return abs(x - button.x) <= button.width / 2 && abs(y - button.y) <= button.height / 2;
}

async function handlePointerAction(x, y) {
  await Tone.start();
  if (gameState === "stageSelect") {
    const difficultyButton = difficultyButtonLayout().find(item => pointInButton(x, y, item));
    if (difficultyButton) {
      selectedDifficulty = difficultyButton.key;
      return false;
    }
    const button = stageButtonLayout().find(item => pointInButton(x, y, item));
    if (button && !stageStartPending) {
      stageStartPending = true;
      pendingStageIndex = button.index;
      playStagePreview(button.stage.melody);
      setTimeout(() => startStage(button.index), 480);
    }
    return false;
  }
  if (stages && (gameState === "gameOver" || gameState === "stageClear")) {
    const button = resultButtonLayout().find(item => pointInButton(x, y, item));
    if (button?.action === "retry") retryStage();
    if (button?.action === "select") returnToStageSelect();
    return false;
  }
  return handleAction();
}

function playStagePreview(stageMelody) {
  if (Tone.context.state !== "running") return;
  const startTime = Tone.now();
  for (let i = 0; i < min(4, stageMelody.length); i++) {
    synth.triggerAttackRelease(noteFrequencies[melodyNote(stageMelody[i])], "32n", startTime + i * 0.12);
  }
}

function playNote(note, beats = 1) {
  if (Tone.context.state === "running") {
    const secondsPerBeat = selectedDifficulty === "tempo"
      ? 60 / (stages[selectedStageIndex]?.tempoBpm || 110)
      : 0.32;
    synth.triggerAttackRelease(noteFrequencies[note], max(0.12, secondsPerBeat * beats * 0.88));
  }
}
function endGame() { gameState = stages ? "gameOver" : "gameover"; }
function clearGame() {
  if (stages) {
    const earnedStars = difficulties[selectedDifficulty].stars;
    const stageKey = stages[selectedStageIndex].name;
    stageStars.set(stageKey, max(stageStars.get(stageKey) || 0, earnedStars));
    saveStageStars();
    gameState = "stageClear";
  } else {
    gameState = "clear";
  }
}
function mousePressed() { return handlePointerAction(mouseX, mouseY); }
function touchStarted() { return handlePointerAction(mouseX, mouseY); }
function keyPressed() {
  if (key === " ") {
    if (stages && (gameState === "gameOver" || gameState === "stageClear")) {
      retryStage();
      return false;
    }
    if (gameState !== "stageSelect") return handleAction();
  }
  if (key === "d" || key === "D") {
    if (gameState === "stageSelect") return false;
    debugMode = !debugMode;
    if (debugMode && (gameState === "gameover" || gameState === "clear" || gameState === "gameOver" || gameState === "stageClear")) {
      if (stages) retryStage();
      else resetGame();
    }
    if (debugMode && gameState === "ready") {
      gameState = "playing";
      buildWalls();
    }
    if (!debugMode) player.velocity = 0;
    return false;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  player.x = constrain(width * 0.25, 70, 180);
  player.y = constrain(player.y, player.radius, height - player.radius);
}

const NOTES = ["ド", "レ", "ミ", "ファ", "ソ", "ラ", "シ", "高いド"];
const KEYBOARD_LANES = ["a", "s", "d", "f", "g", "h", "j", "k"];
const NOTE_DATA = {
  "ド": { frequency: 261.63, color: "#ef6a67" },
  "レ": { frequency: 293.66, color: "#f29b52" },
  "ミ": { frequency: 329.63, color: "#e5c64f" },
  "ファ": { frequency: 349.23, color: "#63b875" },
  "ソ": { frequency: 392.00, color: "#4da9c9" },
  "ラ": { frequency: 440.00, color: "#6f86d6" },
  "シ": { frequency: 493.88, color: "#9a72c7" },
  "高いド": { frequency: 523.25, color: "#e65f91" }
};

const q = note => ({ note, beats: 1 });
const h = note => ({ note, beats: 2 });
const e = note => ({ note, beats: .5 });
const dh = note => ({ note, beats: 1.5 });
const SONGS = [
  {
    title: "きらきら星", subtitle: "TWINKLE, TWINKLE", bpm: 100,
    melody: [q("ド"),q("ド"),q("ソ"),q("ソ"),q("ラ"),q("ラ"),h("ソ"),q("ファ"),q("ファ"),q("ミ"),q("ミ"),q("レ"),q("レ"),h("ド")]
  },
  {
    title: "メリーさんのひつじ", subtitle: "MARY HAD A LITTLE LAMB", bpm: 112,
    melody: [q("ミ"),q("レ"),q("ド"),q("レ"),q("ミ"),q("ミ"),h("ミ"),q("レ"),q("レ"),h("レ"),q("ミ"),q("ソ"),h("ソ"),q("ミ"),q("レ"),q("ド"),q("レ"),q("ミ"),q("ミ"),q("ミ"),q("ミ"),q("レ"),q("レ"),q("ミ"),q("レ"),h("ド")]
  },
  {
    title: "ちょうちょう", subtitle: "BUTTERFLY", bpm: 108,
    melody: [q("ソ"),q("ミ"),h("ミ"),q("ファ"),q("レ"),h("レ"),q("ド"),q("レ"),q("ミ"),q("ファ"),q("ソ"),q("ソ"),h("ソ"),q("ソ"),q("ミ"),q("ミ"),q("ミ"),q("ファ"),q("レ"),q("レ"),q("レ"),q("ド"),q("ミ"),q("ソ"),q("ソ"),q("ド"),q("ド"),h("ド")]
  },
  {
    title: "ぶんぶんぶん", subtitle: "BUZZ, BUZZ, BUZZ", bpm: 120,
    melody: [q("ソ"),q("ファ"),q("ミ"),q("レ"),q("ミ"),q("ファ"),h("レ"),h("ド"),q("ミ"),q("ファ"),q("ソ"),q("ミ"),q("レ"),q("ミ"),q("ファ"),h("レ"),q("ミ"),q("ファ"),q("ソ"),q("ミ"),q("レ"),q("ミ"),q("ファ"),h("レ"),q("ソ"),q("ファ"),q("ミ"),q("レ"),q("ミ"),q("ファ"),h("レ"),h("ド")]
  },
  {
    title: "歓喜の歌", subtitle: "BEETHOVEN · ODE TO JOY", bpm: 132,
    melody: [
      q("ミ"),q("ミ"),q("ファ"),q("ソ"),q("ソ"),q("ファ"),q("ミ"),q("レ"),
      q("ド"),q("ド"),q("レ"),q("ミ"),dh("ミ"),e("レ"),h("レ"),
      q("ミ"),q("ミ"),q("ファ"),q("ソ"),q("ソ"),q("ファ"),q("ミ"),q("レ"),
      q("ド"),q("ド"),q("レ"),q("ミ"),dh("レ"),e("ド"),h("ド")
    ]
  },
  {
    title: "交響曲第5番《運命》", subtitle: "BEETHOVEN · SYMPHONY NO. 5", bpm: 168,
    melody: [
      e("ミ"),e("ミ"),e("ミ"),dh("ド"),e("レ"),e("レ"),e("レ"),dh("シ"),
      e("ミ"),e("ミ"),e("ミ"),dh("ド"),e("ソ"),e("ソ"),e("ソ"),dh("ミ"),
      e("ラ"),e("ラ"),e("ラ"),dh("ファ"),e("ソ"),e("ソ"),e("ソ"),dh("ミ"),
      e("ソ"),e("ソ"),e("ファ"),e("ミ"),e("レ"),e("ド"),q("ソ"),h("ド")
    ]
  }
];

let gameState = "menu";
let song = null;
let player;
let enemies = [];
let bullets = [];
let particles = [];
let labels = [];
let warpEchoes = [];
let pianoButtons = [];
let nextSpawn = 0;
let spawnSchedule = [];
let enemySpeed = 1.25;
let resolved = 0;
let played = [];
let audioContext = null;
let zoneFlash = 0;
const playZone = { centerY: 0, halfHeight: 0 };

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(document.getElementById("gameShell"));
  canvas.id("gameCanvas");
  pixelDensity(1);
  textFont("sans-serif");
  strokeCap(ROUND);
  strokeJoin(ROUND);
  buildSongMenu();
  buildPiano();
  resetPlayer();
}

function draw() {
  drawMusicWorld();
  if (gameState === "playing") updateGame();
  drawBullets();
  drawEnemies();
  drawParticles();
  drawWarpEchoes();
  drawPlayer();
}

function buildSongMenu() {
  const root = document.getElementById("songList");
  SONGS.forEach((entry, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "song";
    button.innerHTML = `${entry.title}<span>${entry.subtitle} · ${entry.bpm} BPM</span>`;
    button.addEventListener("click", () => startSong(index));
    root.appendChild(button);
  });
  document.getElementById("retryButton").addEventListener("click", () => startSong(SONGS.indexOf(song)));
  document.getElementById("menuButton").addEventListener("click", showMenu);
}

function buildPiano() {
  const root = document.getElementById("piano");
  pianoButtons = NOTES.map((note, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `${note}<span>${KEYBOARD_LANES[index].toUpperCase()}</span>`;
    button.style.setProperty("--note-color", NOTE_DATA[note].color);
    button.style.setProperty("--note-soft", `${NOTE_DATA[note].color}55`);
    button.addEventListener("pointerdown", event => {
      event.preventDefault();
      warpToLane(index);
    });
    root.appendChild(button);
    return button;
  });
}

function playerRestY() {
  return height - constrain(height * .14, 100, 126);
}

function resetPlayer() {
  player = {
    x: width * .5,
    y: playerRestY(),
    lane: 3,
    targetX: width * .5,
    cooldown: 0
  };
  player.targetX = laneX(NOTES[player.lane], player.y);
  player.x = player.targetX;
}

async function startSong(index) {
  song = SONGS[index];
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === "suspended") await audioContext.resume();
  enemies = []; bullets = []; particles = []; labels = []; warpEchoes = []; played = [];
  nextSpawn = 0; resolved = 0;
  resetPlayer();
  configurePlayZone();
  buildSpawnSchedule();
  zoneFlash = 0;
  gameState = "playing";
  document.getElementById("menuScreen").hidden = true;
  document.getElementById("resultScreen").hidden = true;
  document.getElementById("hud").hidden = false;
  document.getElementById("gameGuide").hidden = false;
  document.getElementById("piano").hidden = false;
  document.getElementById("songTitle").textContent = song.title;
  updateProgress();
}

function showMenu() {
  gameState = "menu";
  enemies = []; bullets = []; particles = []; labels = [];
  document.getElementById("menuScreen").hidden = false;
  document.getElementById("resultScreen").hidden = true;
  document.getElementById("hud").hidden = true;
  document.getElementById("gameGuide").hidden = true;
  document.getElementById("piano").hidden = true;
}

function updateGame() {
  const frameScale = min(deltaTime / (1000 / 60), 2);
  configurePlayZone();
  player.targetX = laneX(NOTES[player.lane], player.y);
  player.x = lerp(player.x, player.targetX, 1 - pow(.78, frameScale));
  player.cooldown = max(0, player.cooldown - deltaTime);

  while (nextSpawn < song.melody.length && millis() >= spawnSchedule[nextSpawn]) {
    const entry = song.melody[nextSpawn];
    spawnEnemy(entry, nextSpawn);
    nextSpawn++;
  }

  for (const bullet of bullets) {
    bullet.y -= 9.5 * frameScale;
    bullet.x = laneX(NOTES[bullet.lane], bullet.y);
  }
  for (const enemy of enemies) {
    enemy.y += enemy.speed * frameScale;
    enemy.phase += .045 * frameScale;
  }

  checkCollisions();
  checkPlayerCollision();
  if (gameState !== "playing") return;
  bullets = bullets.filter(bullet => bullet.alive && bullet.y > -30);
  for (const enemy of enemies) {
    if (enemy.alive && enemy.y - enemy.size > height) {
      enemy.alive = false;
      resolved++;
      played.push(null);
      updateProgress();
    }
  }
  enemies = enemies.filter(enemy => enemy.alive);
  updateEffects(frameScale);
  zoneFlash *= pow(.89, frameScale);

  if (nextSpawn >= song.melody.length && resolved >= song.melody.length && enemies.length === 0) finishSong();
}

function laneX(note, y) {
  const index = NOTES.indexOf(note);
  const topWidth = width * .34;
  const bottomWidth = min(width * .88, 760);
  const perspective = constrain(y / height, 0, 1);
  const roadWidth = lerp(topWidth, bottomWidth, perspective);
  return width / 2 + map(index, 0, NOTES.length - 1, -roadWidth * .45, roadWidth * .45);
}

function spawnEnemy(entry, index) {
  const size = constrain(min(width, height) * .055, 31, 47);
  enemies.push({
    note: entry.note, beats: entry.beats, index,
    x: laneX(entry.note, -size), y: -size * 1.6, size,
    speed: enemySpeed, phase: random(TWO_PI), alive: true
  });
}

function configurePlayZone() {
  const staffLineStep = constrain(height * .1, 60, 90);
  playZone.centerY = height * .7 - staffLineStep;
  playZone.halfHeight = constrain(height * .055, 34, 58);
}

function buildSpawnSchedule() {
  enemySpeed = constrain(height / 610, 1.05, 1.75);
  const enemySize = constrain(min(width, height) * .055, 31, 47);
  const startY = -enemySize * 1.6;
  const travelMilliseconds = (playZone.centerY - startY) / (enemySpeed * 60) * 1000;
  const firstArrival = millis() + travelMilliseconds + 900;
  const millisecondsPerBeat = 60000 / song.bpm;
  let elapsedBeats = 0;
  spawnSchedule = song.melody.map(entry => {
    const time = firstArrival + elapsedBeats * millisecondsPerBeat - travelMilliseconds;
    elapsedBeats += entry.beats;
    return time;
  });
}

function fireNote() {
  if (gameState !== "playing" || player.cooldown > 0) return;
  bullets.push({ x: player.x, y: player.y - 34, lane: player.lane, alive: true, pulse: random(TWO_PI) });
  player.cooldown = 120;
}

function warpToLane(index) {
  if (gameState !== "playing" || index < 0 || index >= NOTES.length) return;
  const fromX = player.x;
  player.lane = index;
  player.targetX = laneX(NOTES[index], player.y);
  const distance = player.targetX - fromX;
  if (abs(distance) > 2) {
    for (let i = 0; i < 6; i++) {
      warpEchoes.push({
        x: lerp(fromX, player.targetX, i / 6),
        y: player.y,
        life: 1 - i * .08,
        color: NOTE_DATA[NOTES[index]].color
      });
    }
  }
  player.x = player.targetX;
  pulsePiano(index);
  updateProgress();
}

function pulsePiano(index) {
  const button = pianoButtons[index];
  if (!button) return;
  button.classList.remove("pressed");
  void button.offsetWidth;
  button.classList.add("pressed");
  clearTimeout(button.releaseTimer);
  button.releaseTimer = setTimeout(() => button.classList.remove("pressed"), 110);
}

function checkCollisions() {
  for (const bullet of bullets) {
    if (!bullet.alive) continue;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const hitWidth = enemy.size * .7;
      const hitHeight = enemy.size * .92;
      if (abs(bullet.x - enemy.x) < hitWidth && abs(bullet.y - enemy.y) < hitHeight) {
        bullet.alive = false;
        enemy.alive = false;
        resolved++;
        played.push(enemy.note);
        const resonance = playZoneResonance(enemy.y);
        playTone(enemy.note, enemy.beats, resonance);
        burstEnemy(enemy, resonance);
        zoneFlash = max(zoneFlash, resonance);
        updateProgress();
        break;
      }
    }
  }
}

function playZoneResonance(y) {
  const distance = abs(y - playZone.centerY);
  const reach = height * .34;
  const proximity = 1 - constrain(distance / reach, 0, 1);
  return proximity * proximity * (3 - 2 * proximity);
}

function checkPlayerCollision() {
  const playerSize = constrain(min(width,height)*.075,42,64);
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const hitX = enemy.size * .62 + playerSize * .42;
    const hitY = enemy.size * .72 + playerSize * .4;
    if ((dx * dx) / (hitX * hitX) + (dy * dy) / (hitY * hitY) <= 1) {
      showGameOver();
      return;
    }
  }
}

function playTone(note, beats, resonance) {
  if (!audioContext) return;
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(NOTE_DATA[note].frequency, now);
  gain.gain.setValueAtTime(.0001, now);
  const volume = lerp(.075, .24, resonance);
  const release = lerp(.16, .48, resonance) + beats * .1;
  gain.gain.exponentialRampToValueAtTime(volume, now + .012);
  gain.gain.exponentialRampToValueAtTime(.0001, now + release);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + release + .04);
}

function burstEnemy(enemy, resonance) {
  const colorValue = NOTE_DATA[enemy.note].color;
  const particleCount = round(lerp(7, 28, resonance));
  for (let i = 0; i < particleCount; i++) {
    const angle = random(TWO_PI);
    const speed = random(1.2, 4.4);
    particles.push({ x:enemy.x, y:enemy.y, vx:cos(angle)*speed, vy:sin(angle)*speed, life:1, size:random(3,lerp(6,10,resonance)), color:colorValue });
  }
  labels.push({ x:enemy.x, y:enemy.y, life:lerp(.45,1,resonance), text:`♪ ${enemy.note}`, color:colorValue, scale:lerp(.82,1.16,resonance) });
  particles.push({ x:enemy.x, y:enemy.y, vx:0, vy:0, life:1, size:lerp(enemy.size*.8,enemy.size*1.8,resonance), color:colorValue, ring:true });
}

function updateEffects(frameScale) {
  for (const p of particles) { p.x += p.vx*frameScale; p.y += p.vy*frameScale; p.vy += .025*frameScale; p.life -= .035*frameScale; }
  for (const label of labels) { label.y -= .7*frameScale; label.life -= .025*frameScale; }
  for (const echo of warpEchoes) echo.life -= .14 * frameScale;
  particles = particles.filter(p => p.life > 0);
  labels = labels.filter(label => label.life > 0);
  warpEchoes = warpEchoes.filter(echo => echo.life > 0);
}

function finishSong() {
  gameState = "result";
  const sounded = played.filter(Boolean).length;
  document.getElementById("resultTitle").textContent = "演奏がおわりました";
  document.getElementById("resultText").textContent = `${song.title}：${sounded} / ${song.melody.length} 音が響きました`;
  document.getElementById("resultScreen").hidden = false;
  document.getElementById("hud").hidden = true;
  document.getElementById("gameGuide").hidden = true;
  document.getElementById("piano").hidden = true;
}

function showGameOver() {
  gameState = "gameOver";
  bullets = [];
  document.getElementById("resultTitle").textContent = "GAME OVER";
  document.getElementById("resultText").textContent = "流れてきたエネミーマーパンとぶつかりました";
  document.getElementById("resultScreen").hidden = false;
  document.getElementById("hud").hidden = true;
  document.getElementById("gameGuide").hidden = true;
  document.getElementById("piano").hidden = true;
}

function updateProgress() {
  if (!song) return;
  document.getElementById("progressText").textContent = `${resolved} / ${song.melody.length} ・ レーン ${NOTES[player.lane]}`;
}

function drawMusicWorld() {
  const top = color("#102b3a");
  const bottom = color("#24556b");
  for (let y = 0; y < height; y += 4) {
    stroke(lerpColor(top, bottom, y / height));
    strokeWeight(5);
    line(0, y, width, y);
  }
  drawStaffRoad();
}

function drawStaffRoad() {
  const vanishY = height * .04;
  const topWidth = width * .3;
  const bottomWidth = min(width * .94, 820);
  drawPlayZone();
  stroke(190, 237, 238, 80 + zoneFlash * 65);
  strokeWeight(1.5);
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    line(width/2 + lerp(-topWidth*.5,topWidth*.5,t), vanishY, width/2 + lerp(-bottomWidth*.5,bottomWidth*.5,t), height);
  }
  const travel = (millis() * .08) % 90;
  for (let y = vanishY - 90 + travel; y < height; y += 90) {
    const p = constrain(y / height, 0, 1);
    const w = lerp(topWidth,bottomWidth,p);
    stroke(190,237,238,25 + p*45);
    line(width/2-w/2,y,width/2+w/2,y);
  }
  noStroke();
  textAlign(CENTER,CENTER); textSize(10);
  for (const note of NOTES) {
    const data = NOTE_DATA[note]; fill(data.color + "99");
    text(note, laneX(note,height*.97), height-18);
  }
}

function drawPlayZone() {
  if (gameState !== "playing") return;
  const y = playZone.centerY;
  const topY = y - playZone.halfHeight;
  const bottomY = y + playZone.halfHeight;
  const topW = lerp(width*.3,min(width*.94,820),topY/height);
  const bottomW = lerp(width*.3,min(width*.94,820),bottomY/height);
  noStroke();
  fill(190,237,238,12 + zoneFlash*35);
  quad(width/2-topW/2,topY,width/2+topW/2,topY,width/2+bottomW/2,bottomY,width/2-bottomW/2,bottomY);
  stroke(213,250,245,38 + zoneFlash*105);
  strokeWeight(1 + zoneFlash*1.5);
  line(width/2-topW/2,y,width/2+topW/2,y);
}

function drawBullets() {
  textAlign(CENTER,CENTER); textStyle(BOLD);
  for (const bullet of bullets) {
    const glow = 12 + sin(frameCount*.15 + bullet.pulse)*4;
    drawingContext.shadowColor = "#fff6ac";
    drawingContext.shadowBlur = glow;
    fill("#fff6ac"); noStroke(); textSize(23); text("♪",bullet.x,bullet.y);
    drawingContext.shadowBlur = 0;
  }
  textStyle(NORMAL);
}

function drawEnemies() {
  for (const enemy of enemies) {
    const targetX = laneX(enemy.note, enemy.y);
    enemy.x = lerp(enemy.x,targetX,.035);
    const perspective = constrain(enemy.y / height,0,1);
    const displaySize = enemy.size * lerp(.58,1.24,perspective);
    push(); translate(enemy.x,enemy.y + sin(enemy.phase)*2);
    drawEnemyMarpan(displaySize, NOTE_DATA[enemy.note].color);
    pop();
  }
}

// Replace only this function when the final Enemy Ma-pan design is ready.
function drawEnemyMarpan(s, noteColor) {
  const ink = "#203640";
  push(); rotate(PI); scale(.92);
  noStroke(); fill(0,35); ellipse(0,s*.72,s*.75,s*.14);
  stroke(ink); strokeWeight(max(1.4,s*.035)); fill(noteColor);
  rectMode(CENTER); rect(0,-s*.55,s*.92,s*.16,s*.035);
  fill("#3d4b52"); rect(-s*.49,-s*.55,s*.08,s*.17,s*.025); rect(s*.49,-s*.55,s*.08,s*.17,s*.025);
  fill(noteColor);
  beginShape();
  vertex(0,-s*.48); bezierVertex(-s*.3,-s*.48,-s*.38,-s*.23,-s*.36,s*.1);
  bezierVertex(-s*.34,s*.43,-s*.22,s*.58,0,s*.59);
  bezierVertex(s*.22,s*.58,s*.34,s*.43,s*.36,s*.1);
  bezierVertex(s*.38,-s*.23,s*.3,-s*.48,0,-s*.48); endShape(CLOSE);
  for(const side of [-1,1]){
    push(); scale(side,1); fill(noteColor);
    beginShape(); vertex(s*.37,s*.08); bezierVertex(s*.47,s*.18,s*.46,s*.47,s*.4,s*.68); line(s*.32,s*.68); line(s*.29,s*.16); endShape(CLOSE);
    stroke("#34464e"); strokeWeight(max(1,s*.022)); line(s*.43,s*.18,s*.4,s*.7); pop();
  }
  const eyeY=-s*.14; const eyeSize=s*.2;
  for(let i=-1;i<=1;i++){
    stroke(ink); strokeWeight(max(1.2,s*.025)); fill(255); ellipse(i*s*.175,eyeY,eyeSize,eyeSize*1.05);
    noStroke(); fill("#152329"); circle(i*s*.175,eyeY+s*.01,eyeSize*.38);
  }
  pop();
}

function drawPlayer() {
  if (gameState === "menu") return;
  const s = constrain(min(width,height)*.075,42,64);
  push(); translate(player.x,player.y);
  const laneColor = NOTE_DATA[NOTES[player.lane]].color;
  noStroke(); fill(laneColor + "44"); circle(0,0,s*1.35);
  noStroke(); fill(0,40); ellipse(0,s*.48,s*.85,s*.13);
  stroke("#1c303a"); strokeWeight(max(2,s*.035)); fill("#fff8e8");
  beginShape(); vertex(0,-s*.48); bezierVertex(s*.38,-s*.48,s*.5,-s*.2,s*.46,s*.12); bezierVertex(s*.42,s*.47,-s*.42,s*.47,-s*.46,s*.12); bezierVertex(-s*.5,-s*.2,-s*.38,-s*.48,0,-s*.48); endShape(CLOSE);
  for(let i=-1;i<=1;i++){
    fill(255); ellipse(i*s*.25,-s*.04,s*.22,s*.25);
    noStroke(); fill("#17242a"); circle(i*s*.25,-s*.055,s*.075); stroke("#1c303a"); strokeWeight(max(2,s*.035));
  }
  pop();
}

function drawWarpEchoes() {
  if (gameState !== "playing") return;
  const s = constrain(min(width,height)*.075,42,64);
  noStroke();
  for (const echo of warpEchoes) {
    const c = color(echo.color);
    c.setAlpha(75 * echo.life);
    fill(c);
    ellipse(echo.x, echo.y, s * (1.25 - echo.life * .2), s * .54);
    fill(255, 60 * echo.life);
    for (let i = -1; i <= 1; i++) circle(echo.x + i*s*.18, echo.y-s*.04, s*.12);
  }
}

function drawParticles() {
  noStroke();
  for(const p of particles){
    const c=color(p.color); c.setAlpha(255*p.life);
    if(p.ring){ noFill(); stroke(c); strokeWeight(2*p.life); circle(p.x,p.y,p.size*(1.25-p.life*.25)); noStroke(); }
    else { fill(c); circle(p.x,p.y,p.size*p.life); }
  }
  textAlign(CENTER,CENTER); textStyle(BOLD);
  for(const label of labels){ const c=color(label.color); c.setAlpha(255*label.life); fill(c); textSize(13*label.scale); text(label.text,label.x,label.y); }
  textStyle(NORMAL);
}

function keyPressed(event) {
  const pianoIndex = KEYBOARD_LANES.indexOf(String(key).toLowerCase());
  if (gameState === "playing" && pianoIndex >= 0 && !event?.repeat) {
    warpToLane(pianoIndex);
    return false;
  }
  if (gameState === "playing" && keyCode === LEFT_ARROW) {
    player.lane = max(0, player.lane - 1);
    updateProgress();
    return false;
  }
  if (gameState === "playing" && keyCode === RIGHT_ARROW) {
    player.lane = min(NOTES.length - 1, player.lane + 1);
    updateProgress();
    return false;
  }
  if ((key === " " || keyCode === 32) && !event?.repeat) {
    fireNote();
    return false;
  }
}

function windowResized() {
  resizeCanvas(windowWidth,windowHeight);
  player.y = playerRestY();
  player.targetX = laneX(NOTES[player.lane],player.y);
  player.x = player.targetX;
}

"use strict";

const YARNS = [
  {id:"empty", name:"消す", color:"#ffffff", symbol:"", note:null, eraser:true},
  {id:"white", name:"白", color:"#ffffff", symbol:"□", note:null},
  {id:"black", name:"黒", color:"#202020", symbol:"■", note:null},
  {id:"red", name:"赤", color:"#e85145", symbol:"ド", note:261.63},
  {id:"orange", name:"橙", color:"#ed9238", symbol:"レ", note:293.66},
  {id:"yellow", name:"黄", color:"#f1cf3d", symbol:"ミ", note:329.63},
  {id:"green", name:"緑", color:"#62a667", symbol:"ファ", note:349.23},
  {id:"cyan", name:"水", color:"#69bfd1", symbol:"ソ", note:392.00},
  {id:"blue", name:"青", color:"#4878bd", symbol:"ラ", note:440.00},
  {id:"purple", name:"紫", color:"#8a62ad", symbol:"シ", note:493.88}
];
const yarnById = Object.fromEntries(YARNS.map(y => [y.id, y]));
const POSITION_SCALE = [
  {name:"ド", frequency:261.63}, {name:"レ", frequency:293.66},
  {name:"ミ", frequency:329.63}, {name:"ファ", frequency:349.23},
  {name:"ソ", frequency:392.00}, {name:"ラ", frequency:440.00},
  {name:"シ", frequency:493.88}, {name:"ド", frequency:523.25}
];

let cols = 30, rows = 30, cells = [];
let selected = "black", chartMode = false;
let gridX = 0, gridY = 0, cellSize = 16, gridW = 0, gridH = 0;
let painting = false, lastPainted = "";
let playTimer = null, playIndex = -1, playOrder = [];
let synth = null, soundReady = false;

function setup(){
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("sketch");
  pixelDensity(min(window.devicePixelRatio || 1, 2));
  textFont('"Avenir Next", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif');
  makePalette();
  bindUI();
  resizeGrid(30);
}

function makePalette(){
  const palette = document.getElementById("palette");
  YARNS.forEach(yarn => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "swatch" + (yarn.eraser ? " eraser" : "");
    button.dataset.yarn = yarn.id;
    button.setAttribute("aria-label", yarn.eraser ? "消しゴム" : yarn.name + "の毛糸");
    button.style.setProperty("--color", yarn.color);
    button.innerHTML = `<i></i><span>${yarn.name}</span>`;
    button.onclick = () => selectYarn(yarn.id);
    palette.appendChild(button);
  });
  selectYarn(selected);
}

function bindUI(){
  document.getElementById("grid-size").addEventListener("change", e => resizeGrid(Number(e.target.value)));
  document.getElementById("sample").onclick = createMarpan;
  document.getElementById("chart-mode").onclick = toggleChart;
  document.getElementById("reset").onclick = resetGrid;
  document.getElementById("play").onclick = togglePlayback;
}

function selectYarn(id){
  selected = id;
  document.querySelectorAll(".swatch").forEach(b => b.classList.toggle("selected", b.dataset.yarn === id));
  const yarn = yarnById[id];
  setStatus(yarn.eraser ? "消しゴム" : `${yarn.name}の毛糸を選択`);
}

function resizeGrid(size){
  stopPlayback();
  cols = rows = size;
  cells = Array.from({length: rows}, () => Array(cols).fill("empty"));
  calculateGrid();
  setStatus(`${cols}目 × ${rows}段`);
}

function calculateGrid(){
  const mobile = width < 760;
  const top = mobile ? 140 : 155;
  const bottom = mobile ? 42 : 48;
  const side = mobile ? 54 : 78;
  cellSize = min((width - side * 2) / cols, (height - top - bottom) / rows, 23);
  cellSize = max(3.5, cellSize);
  gridW = cellSize * cols;
  gridH = cellSize * rows;
  gridX = (width - gridW) / 2;
  gridY = top + max(0, (height - top - bottom - gridH) / 2);
}

function draw(){
  background(255);
  drawGrid();
  drawLabels();
}

function drawGrid(){
  noStroke();
  for(let r = 0; r < rows; r++){
    for(let c = 0; c < cols; c++){
      const yarn = yarnById[cells[r][c]];
      fill(yarn.color);
      rect(gridX + c * cellSize, gridY + r * cellSize, cellSize, cellSize);

      if(chartMode && cells[r][c] !== "empty" && cellSize >= 8){
        const dark = cells[r][c] === "black" || cells[r][c] === "blue" || cells[r][c] === "purple";
        fill(dark ? 255 : 30);
        textAlign(CENTER, CENTER);
        textStyle(BOLD);
        textSize(constrain(cellSize * (yarn.symbol.length > 1 ? .36 : .52), 4, 11));
        text(yarn.symbol, gridX + (c + .5) * cellSize, gridY + (r + .51) * cellSize);
      }
    }
  }

  stroke(190); strokeWeight(cellSize < 7 ? .45 : .7); noFill();
  for(let c = 0; c <= cols; c++) line(gridX + c * cellSize, gridY, gridX + c * cellSize, gridY + gridH);
  for(let r = 0; r <= rows; r++) line(gridX, gridY + r * cellSize, gridX + gridW, gridY + r * cellSize);
  stroke(40); strokeWeight(1.2); rect(gridX, gridY, gridW, gridH);

  if(playIndex >= 0 && playIndex < playOrder.length){
    const p = playOrder[playIndex];
    noFill(); stroke("#e34f3f"); strokeWeight(max(2, cellSize * .14));
    rect(gridX + p.c * cellSize + 1, gridY + p.r * cellSize + 1, cellSize - 2, cellSize - 2);
    noStroke(); fill(227,79,63,28);
    rect(gridX, gridY + p.r * cellSize, gridW, cellSize);
  }
}

function drawLabels(){
  const small = cellSize < 9;
  fill(90); noStroke(); textStyle(NORMAL); textSize(small ? 7 : 9); textAlign(RIGHT, CENTER);
  for(let r = 0; r < rows; r++){
    if(!small || r % 5 === 0 || r === rows - 1){
      const stage = rows - r;
      text(`${stage}段`, gridX - 7, gridY + (r + .5) * cellSize);
    }
  }
  textAlign(CENTER, BOTTOM);
  for(let c = 0; c < cols; c++){
    if(!small || c % 5 === 0 || c === cols - 1) text(`${c + 1}目`, gridX + (c + .5) * cellSize, gridY - 5);
  }
  textAlign(LEFT, CENTER);
  text(`${cols}目`, gridX + gridW + 7, gridY + gridH - cellSize / 2);
}

function gridCellAt(x, y){
  if(x < gridX || y < gridY || x >= gridX + gridW || y >= gridY + gridH) return null;
  return {c: floor((x - gridX) / cellSize), r: floor((y - gridY) / cellSize)};
}

function paintAt(x, y){
  if(playTimer) return;
  const p = gridCellAt(x, y);
  if(!p) return;
  const key = `${p.r}:${p.c}`;
  if(key === lastPainted) return;
  lastPainted = key;
  cells[p.r][p.c] = selected;
  if(selected !== "empty" && selected !== "white") playTone(noteForCell(p.r, p.c).frequency, .11);
}

function mousePressed(){
  if(!gridCellAt(mouseX, mouseY)) return true;
  userStartAudio();
  painting = true; lastPainted = ""; paintAt(mouseX, mouseY); return false;
}
function mouseDragged(){ if(painting) paintAt(mouseX, mouseY); return false; }
function mouseReleased(){ painting = false; lastPainted = ""; return false; }
function touchStarted(){ return mousePressed(); }
function touchMoved(){ return mouseDragged(); }
function touchEnded(){ return mouseReleased(); }

function ensureSynth(){
  if(soundReady) return;
  const oscillator = new p5.Oscillator("sine");
  const envelope = new p5.Envelope();
  envelope.setADSR(.008, .045, .08, .11);
  envelope.setRange(.16, 0);
  oscillator.amp(0);
  oscillator.start();
  synth = {oscillator, envelope};
  soundReady = true;
}
function playTone(frequency, duration = .13){
  userStartAudio(); ensureSynth();
  synth.oscillator.freq(frequency, .012);
  synth.envelope.setADSR(.008, min(.05, duration * .3), .08, max(.06, duration * .65));
  synth.envelope.play(synth.oscillator, 0, duration);
}

function toggleChart(){
  chartMode = !chartMode;
  const button = document.getElementById("chart-mode");
  button.setAttribute("aria-pressed", String(chartMode));
  button.textContent = chartMode ? "カラー" : "編み図";
  setStatus(chartMode ? "編み図表示：□ ■ ド レ ミ ファ ソ ラ シ" : "カラーマス表示");
}

function resetGrid(){
  stopPlayback();
  cells = Array.from({length: rows}, () => Array(cols).fill("empty"));
  setStatus("すべての目をほどきました");
}

function createMarpan(){
  stopPlayback();
  cells = Array.from({length: rows}, () => Array(cols).fill("empty"));
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const bodyW = cols * .8;
  const bodyH = bodyW * .68;
  const outline = marpanOutline(cx, cy, bodyW, bodyH);
  const inside = Array.from({length: rows}, () => Array(cols).fill(false));

  // shared/marpan-25d.js のボディ輪郭を、1目単位のポリゴンへ変換する。
  for(let r = 0; r < rows; r++) for(let c = 0; c < cols; c++){
    inside[r][c] = pointInPolygon(c, r, outline);
  }
  for(let r = 0; r < rows; r++) for(let c = 0; c < cols; c++){
    if(!inside[r][c]) continue;
    const edge = [[-1,0],[1,0],[0,-1],[0,1]].some(([dc,dr]) =>
      r + dr < 0 || r + dr >= rows || c + dc < 0 || c + dc >= cols || !inside[r + dr][c + dc]
    );
    cells[r][c] = edge ? "black" : "white";
  }

  // 共通マーパンと同じ投影比率で、白目・黒目の三つ目を横一列に置く。
  const longitudes = [-.44, 0, .44];
  longitudes.forEach(longitude => {
    const depth = cos(longitude);
    const ex = cx + sin(longitude) * bodyW * .47;
    const distanceScale = .76 + depth * .24;
    const eyeW = bodyW * .135 * 1.42 * distanceScale * depth;
    const eyeH = bodyW * .135 * 1.42 * 1.08 * distanceScale;
    drawPixelEye(ex, cy, eyeW, eyeH);
  });
  setStatus("共通デザインのマーパンができました");
}

function marpanOutline(cx, cy, bodyW, bodyH){
  const waist = bodyH * .2;
  const segments = [
    [cx,cy-bodyH*.5, cx+bodyW*.27,cy-bodyH*.5, cx+bodyW*.5,cy-bodyH*.25, cx+bodyW*.48,cy+waist],
    [cx+bodyW*.48,cy+waist, cx+bodyW*.46,cy+bodyH*.46, cx+bodyW*.25,cy+bodyH*.5, cx,cy+bodyH*.5],
    [cx,cy+bodyH*.5, cx-bodyW*.25,cy+bodyH*.5, cx-bodyW*.46,cy+bodyH*.46, cx-bodyW*.48,cy+waist],
    [cx-bodyW*.48,cy+waist, cx-bodyW*.5,cy-bodyH*.25, cx-bodyW*.26,cy-bodyH*.5, cx,cy-bodyH*.5]
  ];
  const points = [];
  segments.forEach(s => {
    for(let i = 0; i < 16; i++){
      const t = i / 16;
      points.push({x: bezierPoint(s[0],s[2],s[4],s[6],t), y: bezierPoint(s[1],s[3],s[5],s[7],t)});
    }
  });
  return points;
}

function pointInPolygon(x, y, polygon){
  let inside = false;
  for(let i = 0, j = polygon.length - 1; i < polygon.length; j = i++){
    const a = polygon[i], b = polygon[j];
    if((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

function drawPixelEye(cx, cy, eyeW, eyeH){
  for(let r = 0; r < rows; r++) for(let c = 0; c < cols; c++){
    const d = ((c - cx) / (eyeW * .5)) ** 2 + ((r - cy) / (eyeH * .5)) ** 2;
    if(d <= 1) cells[r][c] = "black";
    if(d <= .48) cells[r][c] = "white";
    const pupilD = ((c - cx) / (eyeW * .19)) ** 2 + ((r - cy) / (eyeW * .19)) ** 2;
    if(pupilD <= 1) cells[r][c] = "black";
  }
}

function buildPlayOrder(){
  const order = [];
  for(let stage = 0; stage < rows; stage++){
    const r = rows - 1 - stage;
    const add = c => {
      if(cells[r][c] !== "empty" && cells[r][c] !== "white") order.push({r, c, stage:stage + 1});
    };
    if(stage % 2 === 0) for(let c = 0; c < cols; c++) add(c);
    else for(let c = cols - 1; c >= 0; c--) add(c);
  }
  return order;
}

function noteForCell(r, c){
  const stage = rows - r;
  return POSITION_SCALE[(stage - 1 + c) % POSITION_SCALE.length];
}

function togglePlayback(){
  if(playTimer){ stopPlayback(); setStatus("演奏を止めました"); return; }
  userStartAudio(); ensureSynth();
  playOrder = buildPlayOrder(); playIndex = -1;
  if(playOrder.length === 0){
    setStatus("白以外の目を描くと、そこから音が生まれます");
    return;
  }
  const button = document.getElementById("play");
  button.textContent = "止める"; button.classList.add("playing");
  const stepMs = 115;
  setStatus("左下から演奏を始めます");
  playTimer = setInterval(() => {
    playIndex++;
    if(playIndex >= playOrder.length){
      stopPlayback(); setStatus("演奏が終わりました"); return;
    }
    const p = playOrder[playIndex], note = noteForCell(p.r, p.c);
    playTone(note.frequency, stepMs / 1000 * .85);
    setStatus(`${p.stage}段目・${p.c + 1}目　${note.name}`);
  }, stepMs);
}

function stopPlayback(){
  if(playTimer) clearInterval(playTimer);
  playTimer = null; playIndex = -1;
  const button = document.getElementById("play");
  if(button){ button.textContent = "演奏してみる"; button.classList.remove("playing"); }
}

function setStatus(message){ document.getElementById("status").textContent = message; }
function windowResized(){ resizeCanvas(windowWidth, windowHeight); calculateGrid(); }

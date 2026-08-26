const EXPRESSIONS = [
  { label: "通常", style: "pupil" },
  { label: "happy", style: "happy" },
  { label: "surprised", style: "surprised" },
  { label: "angry", style: "angry" },
  { label: "worried", style: "worried" },
  { label: "crying", style: "crying" },
  { label: "sleepy", style: "sleepy" }
];

const FAMILY = [
  { id: "mama", name: "マママーパン", scale: 1.06, color: "#fffdf5", kind: "mama", tint: "#9a6245" },
  { id: "papa", name: "パパマーパン", scale: 1.08, color: "#fffdf5", kind: "papa", tint: "#3c78a4" },
  { id: "child", name: "こマーパン", scale: .78, eyeScale: 1.12, color: "#fffdf5", kind: "child", tint: "#9a6245" },
  { id: "baby", name: "あかちゃんマーパン", scale: .53, eyeScale: 1.3, color: "#fffdf5", kind: "baby", tint: "#f0c74d" },
  { id: "grandpa", name: "じいマーパン", scale: .94, color: "#fffdf5", kind: "grandpa", tint: "#a98d78" },
  { id: "grandma", name: "ばあマーパン", scale: .93, color: "#fffdf5", kind: "grandma", tint: "#b09a91" }
];

class MarpanFamilyMember {
  constructor(config) {
    this.config = config;
    this.expression = "pupil";
    this.yaw = 0;
    this.base = new Marpan25D({ maxSize: 300, bodyColor: config.color, eyeScale: config.eyeScale || 1 });
    this.base.enableAutoBlink(2400, 4600);
  }

  setExpression(style) {
    this.expression = style;
    this.base.clearAllEyeSettings();
    this.base.setExpression(style);
    this.base.setEyeScale(this.config.eyeScale || 1);
    if (style === "crying") this.base.setAutoBlinkIndices([0, 1, 2]);
  }

  setYaw(yaw) { this.yaw = yaw; }

  draw(x, y, size, lookX, lookY, animated = true) {
    const bodyW = size * this.config.scale;
    const bodyH = bodyW * .68;
    const wobble = animated ? sin(millis() * .002 + this.config.scale * 8) * .008 : 0;
    this.drawBehind(x, y, bodyW, bodyH);
    this.base.setPosition(x, y);
    this.base.lookAt(lookX, lookY);
    this.base.drawAt(x, y, { bodyWidth: bodyW, bodyHeight: bodyH, yaw: this.yaw, scaleX: 1 + wobble, scaleY: 1 - abs(wobble), expression: this.expression });
    this.drawFront(x, y, bodyW, bodyH);
    if (this.expression === "crying") this.drawTears(x, y, bodyW, bodyH);
  }

  drawBehind(x, y, bodyW, bodyH) {
    push();
    noStroke();
    if (this.config.kind === "mama") {
      fill(this.config.tint);
      ellipse(x - bodyW * .53, y + bodyH * .08, bodyW * .38, bodyH * .36);
      ellipse(x + bodyW * .53, y + bodyH * .08, bodyW * .38, bodyH * .36);
      triangle(x - bodyW * .64, y + bodyH * .02, x - bodyW * .44, y - bodyH * .18, x - bodyW * .48, y + bodyH * .3);
      triangle(x + bodyW * .64, y + bodyH * .02, x + bodyW * .44, y - bodyH * .18, x + bodyW * .48, y + bodyH * .3);
    } else if (this.config.kind === "child") {
      fill(this.config.tint);
      ellipse(x - bodyW * .55, y - bodyH * .28, bodyW * .25, bodyH * .3);
      ellipse(x + bodyW * .55, y - bodyH * .28, bodyW * .25, bodyH * .3);
      ellipse(x - bodyW * .67, y - bodyH * .18, bodyW * .16, bodyH * .22);
      ellipse(x + bodyW * .67, y - bodyH * .18, bodyW * .16, bodyH * .22);
      this.drawFlower(x + bodyW * .48, y - bodyH * .49);
    } else if (this.config.kind === "grandma") {
      fill(this.config.tint);
      for (let i = -5; i <= 5; i++) {
        const curlX = x + i * bodyW * .105;
        const curlY = y - bodyH * .39 + abs(i) * bodyH * .018;
        ellipse(curlX, curlY, bodyW * .2, bodyH * .27);
        ellipse(curlX, curlY - bodyH * .11, bodyW * .15, bodyH * .2);
      }
    }
    pop();
  }

  drawFront(x, y, bodyW, bodyH) {
    push();
    stroke(38); strokeWeight(max(1.5, bodyW * .012)); strokeJoin(ROUND);
    if (this.config.kind === "papa") {
      fill(this.config.tint);
      beginShape();
      vertex(x - bodyW * .055, y + bodyH * .34);
      vertex(x + bodyW * .055, y + bodyH * .34);
      vertex(x + bodyW * .045, y + bodyH * .55);
      vertex(x, y + bodyH * .76);
      vertex(x - bodyW * .045, y + bodyH * .55);
      endShape(CLOSE);
      fill("#e9f1f5");
      triangle(x - bodyW * .055, y + bodyH * .34, x + bodyW * .055, y + bodyH * .34, x, y + bodyH * .47);
      fill(this.config.tint);
      ellipse(x, y + bodyH * .37, bodyW * .12, bodyH * .1);
    } else if (this.config.kind === "baby") {
      fill("#f5d660");
      beginShape();
      vertex(x - bodyW * .39, y + bodyH * .13);
      vertex(x + bodyW * .39, y + bodyH * .13);
      vertex(x + bodyW * .43, y + bodyH * .31);
      for (let index = 0; index <= 6; index++) {
        const scallopX = x + bodyW * (.35 - index * .116);
        const scallopY = y + bodyH * (.31 + (index % 2) * .055);
        vertex(scallopX, scallopY);
      }
      vertex(x - bodyW * .43, y + bodyH * .31);
      endShape(CLOSE);
      noFill(); line(x + bodyW * .33, y + bodyH * .18, x + bodyW * .39, y + bodyH * .08);
    } else if (this.config.kind === "grandpa") {
      noFill(); stroke("#b5a391"); strokeWeight(max(1.2, bodyW * .012));
      arc(x - bodyW * .13, y - bodyH * .31, bodyW * .25, bodyH * .07, PI, TWO_PI);
      arc(x + bodyW * .13, y - bodyH * .31, bodyW * .25, bodyH * .07, PI, TWO_PI);
      line(x - bodyW * .16, y - bodyH * .22, x - bodyW * .03, y - bodyH * .2);
      line(x + bodyW * .03, y - bodyH * .2, x + bodyW * .16, y - bodyH * .22);
    }
    pop();
  }

  drawFlower(x, y) {
    fill("#f48ca6");
    for (let angle = 0; angle < TWO_PI; angle += TWO_PI / 5) ellipse(x + cos(angle) * 5, y + sin(angle) * 5, 7, 7);
    fill("#f2c94c"); ellipse(x, y, 5, 5);
  }

  drawTears(x, y, bodyW, bodyH) {
    push(); fill("#65b8d2"); noStroke();
    for (const offset of [-.16, .16]) ellipse(x + bodyW * offset, y + bodyH * .12, bodyW * .035, bodyH * .12);
    pop();
  }
}

let members = [];
let selectedIndex = 0;
let viewMode = "catalog";
let yaw = 0;

function setup() {
  const canvas = createCanvas(1200, 760);
  canvas.parent("canvas-wrap");
  canvas.style("width", "100%");
  canvas.style("height", "auto");
  pixelDensity(1);
  textFont('"Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif');
  members = FAMILY.map((config) => new MarpanFamilyMember(config));
  setupControls();
  resizeCanvasForViewport();
}

function draw() {
  background("#f8f1e8");
  const pointerX = mouseX;
  const pointerY = mouseY;
  if (viewMode === "size") drawSizeComparison(pointerX, pointerY);
  else drawCatalog(pointerX, pointerY);
}

function drawCatalog(pointerX, pointerY) {
  const columns = width < 700 ? 2 : 3;
  const rows = ceil(FAMILY.length / columns);
  const cardW = width / columns;
  const cardH = height / rows;
  for (let index = 0; index < members.length; index++) {
    const column = index % columns;
    const row = floor(index / columns);
    const x = cardW * (column + .5);
    const y = cardH * row + cardH * .58;
    drawCard(x, y, cardW, cardH, index, pointerX, pointerY);
  }
}

function drawCard(x, y, cardW, cardH, index, pointerX, pointerY) {
  const member = members[index];
  const config = member.config;
  const bodySize = min(cardW * .7, cardH * .58, 265);
  noStroke(); fill(index === selectedIndex ? "#fffaf2" : "#fbf8f3");
  rect(x - cardW / 2 + 7, y - cardH * .48, cardW - 14, cardH - 12, 7);
  stroke("#e2d7ca"); noFill(); rect(x - cardW / 2 + 7, y - cardH * .48, cardW - 14, cardH - 12, 7);
  noStroke(); fill("#514237"); textAlign(CENTER, CENTER); textSize(min(16, cardW * .06)); text(config.name, x, y - cardH * .37);
  fill("#a28b78"); textSize(10); text(EXPRESSIONS.find((item) => item.style === member.expression).label, x, y - cardH * .29);
  stroke("#d7c4b0"); line(x - cardW * .33, y + bodySize * .42, x + cardW * .33, y + bodySize * .42);
  const isSelected = index === selectedIndex;
  member.draw(x, y, bodySize, isSelected ? pointerX : x, isSelected ? pointerY : y);
}

function drawSizeComparison(pointerX, pointerY) {
  const groundY = height * .76;
  noStroke(); fill("#e8d9c9"); rect(0, groundY, width, height - groundY);
  stroke("#cdb9a3"); line(0, groundY, width, groundY);
  const spacing = width / (members.length + 1);
  const maxBody = min(width * .22, height * .48, 280);
  textAlign(CENTER, CENTER); textSize(min(16, width * .018)); fill("#725e4c");
  for (let index = 0; index < members.length; index++) {
    const member = members[index];
    const bodyW = maxBody * member.config.scale;
    const bodyH = bodyW * .68;
    const x = spacing * (index + 1);
    const y = groundY - bodyH * .5;
    const isSelected = index === selectedIndex;
    member.draw(x, y, maxBody, isSelected ? pointerX : x, isSelected ? pointerY : y, false);
    text(member.config.name, x, groundY + 28);
  }
  textAlign(LEFT, TOP); textSize(13); fill("#8d7764"); text("サイズのめやす", 22, 20);
}

function setupControls() {
  const memberSelect = document.querySelector("#member-select");
  FAMILY.forEach((config, index) => {
    const option = document.createElement("option"); option.value = index; option.textContent = config.name; memberSelect.append(option);
  });
  memberSelect.addEventListener("change", () => { selectedIndex = Number(memberSelect.value); syncSelectedControls(); });
  const expressionContainer = document.querySelector("#expression-buttons");
  EXPRESSIONS.forEach((expression) => {
    const button = document.createElement("button"); button.type = "button"; button.textContent = expression.label; button.dataset.style = expression.style;
    button.addEventListener("click", () => { members[selectedIndex].setExpression(expression.style); syncSelectedControls(); });
    expressionContainer.append(button);
  });
  document.querySelectorAll("#yaw-buttons button").forEach((button) => button.addEventListener("click", () => {
    yaw = Number(button.dataset.yaw); members[selectedIndex].setYaw(yaw); syncSelectedControls();
  }));
  document.querySelector("#all-expression").addEventListener("click", () => {
    const style = members[selectedIndex].expression;
    members.forEach((member) => member.setExpression(style));
    syncSelectedControls();
  });
  document.querySelector("#view-mode").addEventListener("change", (event) => { viewMode = event.target.value; });
  syncSelectedControls();
}

function setActiveExpression(style) { document.querySelectorAll("#expression-buttons button").forEach((button) => button.classList.toggle("is-active", button.dataset.style === style)); }
function syncSelectedControls() {
  const member = members[selectedIndex];
  yaw = member.yaw;
  document.querySelector("#current-label").textContent = `${member.config.name} / ${EXPRESSIONS.find((item) => item.style === member.expression).label}`;
  document.querySelector("#member-select").value = selectedIndex;
  setActiveExpression(member.expression);
  document.querySelectorAll("#yaw-buttons button").forEach((button) => button.classList.toggle("is-active", Number(button.dataset.yaw) === member.yaw));
}
function mousePressed() {
  if (viewMode !== "catalog") return;
  const columns = width < 700 ? 2 : 3; const cardW = width / columns; const cardH = height / ceil(FAMILY.length / columns);
  const column = constrain(floor(mouseX / cardW), 0, columns - 1); const row = constrain(floor(mouseY / cardH), 0, ceil(FAMILY.length / columns) - 1); const index = row * columns + column;
  if (index < members.length) { selectedIndex = index; syncSelectedControls(); }
}
function windowResized() { resizeCanvasForViewport(); }
function resizeCanvasForViewport() { resizeCanvas(1200, width < 700 ? 900 : 760); }
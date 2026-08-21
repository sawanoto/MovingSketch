let marpan;
let currentFaceId = "F01";
let currentFaceStyle = "laughing";
let viewYaw = 0;
let targetViewYaw = 0;

const FACES = [
  { id: "F01", label: "大笑い", style: "laughing" },
  { id: "F02", label: "ニコニコ", style: "happy" },
  { id: "F03", label: "キラキラ", style: "diamond" },
  { id: "F04", label: "穏やか", style: "smile" },
  { id: "F05", label: "照れ", style: "shy" },
  { id: "F06", label: "得意げ", style: "smug" },
  { id: "F07", label: "通常", style: "pupil" },
  { id: "F08", label: "驚き", style: "surprised" },
  { id: "F09", label: "ぱちくり", style: "blink" },
  { id: "F10", label: "眠たい", style: "sleepy" },
  { id: "F11", label: "くちばし", style: "beak" },
  { id: "F12", label: "信号", style: "signal" },
  { id: "F13", label: "一文字", style: "flat" },
  { id: "F14", label: "疑い", style: "suspicious" },
  { id: "F15", label: "心配", style: "worried" },
  { id: "F16", label: "焦り", style: "flustered" },
  { id: "F17", label: "混乱", style: "confused" },
  { id: "F18", label: "泣く", style: "crying" },
  { id: "F19", label: "恐怖", style: "fearful" },
  { id: "F20", label: "怒り", style: "angry" }
];

const BODY_COLORS = [
  { label: "白", value: "#ffffff" },
  { label: "クリーム", value: "#fff0bd" },
  { label: "桃", value: "#f5bdca" },
  { label: "橙", value: "#efad67" },
  { label: "黄", value: "#edda62" },
  { label: "緑", value: "#a9d48e" },
  { label: "水色", value: "#9dd7e5" },
  { label: "紫", value: "#c4b3e2" },
  { label: "灰", value: "#b8bdc4" },
  { label: "黒", value: "#292929" }
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont("sans-serif");

  marpan = new Marpan25D({
    maxSize: 500,
    expression: "pupil"
  });
  marpan.enableAutoBlink(2400, 4600);
  setupFaceButtons();
  setupViewButtons();
  setupColorButtons();
  selectFace(FACES[0]);
}

function draw() {
  background(245, 245, 242);

  const cx = width * 0.5;
  const cy = height * (width <= 620 ? 0.36 : 0.39);
  const pointerX = touches.length ? touches[0].x : mouseX;
  const pointerY = touches.length ? touches[0].y : mouseY;

  marpan.maxSize = min(500, width * 0.72, height * (width <= 620 ? 0.42 : 0.48));
  marpan.setPosition(cx, cy);
  marpan.lookAt(pointerX, pointerY);
  viewYaw = lerp(viewYaw, targetViewYaw, 0.12);
  marpan.setYaw(viewYaw);

  drawGroundShadow(cx, cy);
  if (currentFaceStyle === "surprised") drawSurpriseRays(cx, cy);
  if (currentFaceStyle === "laughing") {
    const laugh = sin(millis() * 0.022);
    marpan.draw({
      scaleX: 1 + laugh * 0.012,
      scaleY: 1 - laugh * 0.018,
      pulse: 0.18 + abs(laugh) * 0.16
    });
  } else if (currentFaceStyle === "crying") {
    const tremble = sin(millis() * 0.035);
    marpan.draw({
      scaleX: 1 + tremble * 0.006,
      scaleY: 1 - abs(tremble) * 0.006
    });
    drawCryingTears(cx, cy);
  } else if (currentFaceStyle === "shy") {
    const shyPulse = (sin(millis() * 0.005) + 1) * 0.5;
    marpan.draw({
      scaleX: 1 + shyPulse * 0.006,
      scaleY: 1 - shyPulse * 0.012,
      pulse: shyPulse * 0.04
    });
    drawShyBlush(cx, cy);
  } else if (currentFaceStyle === "suspicious") {
    const doubt = sin(millis() * 0.0024);
    marpan.draw({
      scaleX: 1 + doubt * 0.004,
      scaleY: 1 - abs(doubt) * 0.003,
      yaw: viewYaw + doubt * 0.035
    });
  } else if (currentFaceStyle === "flustered") {
    const hurry = sin(millis() * 0.012);
    marpan.draw({
      scaleX: 1 + hurry * 0.004,
      scaleY: 1 - abs(hurry) * 0.003,
      yaw: viewYaw + hurry * 0.008
    });
  } else if (currentFaceStyle === "smug") {
    const pride = (sin(millis() * 0.003) + 1) * 0.5;
    marpan.draw({
      scaleX: 1.012 + pride * 0.006,
      scaleY: 0.988 - pride * 0.004,
      yaw: viewYaw - 0.055 + pride * 0.018,
      pulse: 0.035 + pride * 0.035
    });
  } else if (currentFaceStyle === "fearful") {
    const fear = sin(millis() * 0.016);
    marpan.draw({
      scaleX: 0.965 + fear * 0.003,
      scaleY: 0.955 - abs(fear) * 0.004,
      yaw: viewYaw + fear * 0.008
    });
    drawFearStress(cx, cy);
  } else if (currentFaceStyle === "confused") {
    const confusion = sin(millis() * 0.0045);
    marpan.draw({
      scaleX: 1 + confusion * 0.005,
      scaleY: 1 - confusion * 0.004,
      yaw: viewYaw + confusion * 0.055
    });
  } else {
    marpan.draw();
  }
  drawHint();
}

function setupFaceButtons() {
  const container = document.querySelector("#face-buttons");
  for (const face of FACES) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "face-button";
    button.textContent = `${face.id} ${face.label}`;
    button.dataset.faceId = face.id;
    button.setAttribute("aria-pressed", face.id === currentFaceId ? "true" : "false");
    button.classList.toggle("is-active", face.id === currentFaceId);
    button.addEventListener("click", () => selectFace(face));
    container.append(button);
  }
}

function setupViewButtons() {
  document.querySelectorAll(".view-button").forEach((button) => {
    button.addEventListener("click", () => {
      targetViewYaw = Number(button.dataset.yaw);
      document.querySelectorAll(".view-button").forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });
    });
  });
}

function setupColorButtons() {
  const container = document.querySelector("#color-buttons");
  for (const [index, bodyColor] of BODY_COLORS.entries()) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "color-button";
    button.style.setProperty("--swatch", bodyColor.value);
    button.setAttribute("aria-label", `${bodyColor.label}のマーパン`);
    button.title = bodyColor.label;
    button.classList.toggle("is-active", index === 0);
    button.addEventListener("click", () => {
      marpan.setBodyColor(bodyColor.value);
      document.querySelectorAll(".color-button").forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });
    });
    container.append(button);
  }
}

function selectFace(face) {
  currentFaceId = face.id;
  currentFaceStyle = face.style;
  marpan.clearAllEyeSettings();
  marpan.setAutoBlinkIndices(face.style === "laughing" || face.style === "smug" || face.style === "fearful" ? [0, 2] : [0, 1, 2]);
  marpan.enableAutoBlink(2400, 4600);
  marpan.setEyeScale(face.style === "surprised" ? 1.14 : face.style === "laughing" ? 1.06 : face.style === "smug" ? 0.96 : face.style === "fearful" ? 1.05 : 1);

  if (face.style === "signal") {
    marpan.setExpression("signal");
    marpan.setEyeColor(0, "#168de2", true, true);
    marpan.setEyeColor(1, "#f2cf22", true, true);
    marpan.setEyeColor(2, "#e53935", true, true);
  } else if (face.style === "beak") {
    marpan.setExpression("pupil");
    marpan.setEyeStyle(1, "beak", "#f6e819");
  } else if (face.style === "blink") {
    marpan.setExpression("pupil");
    marpan.blink([0, 1, 2], 900);
  } else if (face.style === "laughing") {
    marpan.setExpression("happy");
    marpan.setEyeStyle(1, "laugh-mouth", "#121212");
  } else if (face.style === "smug") {
    marpan.setExpression("smug");
    marpan.setEyeStyle(1, "smug-mouth", "#121212");
  } else if (face.style === "fearful") {
    marpan.setExpression("fearful");
    marpan.setEyeStyle(1, "fear-mouth", "#121212");
  } else {
    marpan.setExpression(face.style);
  }

  marpan.bounce(face.style === "surprised" ? 0.75 : face.style === "laughing" ? 0.52 : 0.28);
  document.querySelector("#current-face").textContent = `${face.id}　${face.label}`;
  document.querySelectorAll(".face-button").forEach((button) => {
    const active = button.dataset.faceId === face.id;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function drawGroundShadow(cx, cy) {
  const bodyW = marpan.getBodyWidth();
  const bodyH = marpan.getBodyHeight(bodyW);
  noStroke();
  fill(45, 42, 36, 20);
  ellipse(cx, cy + bodyH * 0.55, bodyW * 0.58, max(10, bodyH * 0.08));
}

function drawSurpriseRays(cx, cy) {
  const bodyW = marpan.getBodyWidth();
  const bodyH = marpan.getBodyHeight(bodyW);
  const top = cy - bodyH * 0.58;
  const rayLength = bodyW * 0.105;
  const pulse = 1 + sin(millis() * 0.006) * 0.035;

  push();
  translate(cx, top);
  scale(pulse);
  stroke(18);
  strokeWeight(max(5, bodyW * 0.018));
  strokeCap(ROUND);
  for (const angle of [-0.62, 0, 0.62]) {
    const inner = bodyW * 0.075;
    line(
      sin(angle) * inner,
      -cos(angle) * inner,
      sin(angle) * (inner + rayLength),
      -cos(angle) * (inner + rayLength)
    );
  }
  pop();
}

function drawCryingTears(cx, cy) {
  const bodyW = marpan.getBodyWidth();
  const bodyH = marpan.getBodyHeight(bodyW);
  const cycle = (millis() * 0.00038) % 1;
  const eyeY = cy + bodyH * 0.02;

  drawCryingDrop(cx - bodyW * 0.17, eyeY + bodyH * (0.12 + cycle * 0.19), bodyW * 0.046, 0.95 - cycle * 0.45);
  drawCryingDrop(cx + bodyW * 0.17, eyeY + bodyH * (0.12 + ((cycle + 0.47) % 1) * 0.19), bodyW * 0.046, 0.9);
}

function drawCryingDrop(x, y, size, alphaValue) {
  push();
  translate(x, y);
  noStroke();
  fill(72, 177, 232, 255 * alphaValue);
  beginShape();
  vertex(0, -size * 0.72);
  bezierVertex(size * 0.58, -size * 0.08, size * 0.48, size * 0.58, 0, size * 0.64);
  bezierVertex(-size * 0.48, size * 0.58, -size * 0.58, -size * 0.08, 0, -size * 0.72);
  endShape(CLOSE);
  fill(255, 205 * alphaValue);
  ellipse(-size * 0.13, -size * 0.08, size * 0.16, size * 0.11);
  pop();
}

function drawShyBlush(cx, cy) {
  const bodyW = marpan.getBodyWidth();
  const bodyH = marpan.getBodyHeight(bodyW);
  const alphaValue = 82 + (sin(millis() * 0.005) + 1) * 18;

  for (const side of [-1, 1]) {
    const x = cx + side * bodyW * 0.285;
    const y = cy + bodyH * 0.16;
    noStroke();
    fill(239, 112, 126, alphaValue * 0.6);
    ellipse(x, y, bodyW * 0.14, bodyH * 0.105);

    stroke(211, 75, 94, alphaValue);
    strokeWeight(max(2, bodyW * 0.006));
    strokeCap(ROUND);
    for (let i = -1; i <= 1; i++) {
      const lineX = x + i * bodyW * 0.03;
      line(lineX - bodyW * 0.012, y + bodyH * 0.018, lineX + bodyW * 0.012, y - bodyH * 0.018);
    }
  }
}

function drawFearStress(cx, cy) {
  const bodyW = marpan.getBodyWidth();
  const bodyH = marpan.getBodyHeight(bodyW);
  const flicker = (sin(millis() * 0.01) + 1) * 0.5;
  const marks = [
    { x: -0.34, y: -0.16, h: 0.085 },
    { x: -0.29, y: -0.24, h: 0.06 },
    { x: 0.29, y: -0.24, h: 0.06 },
    { x: 0.34, y: -0.16, h: 0.085 }
  ];

  stroke(92, 190, 220, 125 + flicker * 35);
  strokeWeight(max(2, bodyW * 0.006));
  strokeCap(ROUND);
  for (const mark of marks) {
    const x = cx + bodyW * mark.x;
    const y = cy + bodyH * mark.y;
    line(x, y, x, y + bodyH * mark.h);
  }
}

function drawHint() {
  noStroke();
  fill(45, 43, 39, 150);
  textAlign(CENTER, TOP);
  textStyle(NORMAL);
  textSize(constrain(width * 0.022, 12, 15));
  text("マウスを動かすと視線が追いかけます", width * 0.5, 20);
}

function surprise() {
  const bounceAmounts = {
    surprised: 0.75,
    laughing: 0.55,
    crying: 0.18,
    shy: 0.12,
    suspicious: 0.08,
    flustered: 0.24,
    smug: 0.2,
    fearful: 0.14,
    confused: 0.3
  };
  marpan.bounce(bounceAmounts[currentFaceStyle] ?? 0.32);
  marpan.openEyes();
  return false;
}

function mousePressed() {
  return surprise();
}

function touchStarted() {
  return surprise();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

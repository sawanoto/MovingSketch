const SETTINGS = Object.freeze({
  daySeconds: 30,
  sunriseX: 0.08,
  sunsetX: 0.92,
  horizonY: 0.61,
  zenithY: 0.105,
  groundY: 0.79,
  marpanX: 0.5,
  maxShadowLength: 0.48,
  minShadowLength: 0.075,
  shadowOpacity: 92
});

let marpan;
let dayProgress = 0;
let paused = false;
let periodNode;
let clockNode;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  strokeCap(ROUND);
  strokeJoin(ROUND);
  marpan = new Marpan25D({ maxSize: 360, bodyColor: "#fffdf4" });
  marpan.enableAutoBlink(2600, 5100);
  periodNode = document.querySelector("#period");
  clockNode = document.querySelector("#clock");
}

function draw() {
  if (!paused) dayProgress = (dayProgress + deltaTime / (SETTINGS.daySeconds * 1000)) % 1;

  const sun = getSun(dayProgress);
  drawAtmosphere(sun);
  drawSun(sun);
  drawDistantLandscape(sun);

  const bodyW = min(360, width * 0.42, height * 0.37);
  const bodyH = bodyW * 0.68;
  const marpanX = width * SETTINGS.marpanX;
  const groundY = height * SETTINGS.groundY;
  const marpanY = groundY - bodyH * 0.5 + sin(frameCount * 0.025) * bodyH * 0.009;

  const shadow = calculateShadow(sun, marpanX, groundY, bodyW, bodyH);
  drawMarpanShadow(shadow, bodyW, bodyH);
  drawGrassForeground(groundY, sun);
  drawLightHalo(marpanX, marpanY, bodyW, bodyH, sun);

  marpan.maxSize = bodyW;
  marpan.setPosition(marpanX, marpanY);
  marpan.lookAt(sun.x, sun.y);
  marpan.setBodyColor(mixHex("#fffdf4", sun.side < 0 ? "#fff2d5" : "#ffe8d4", 0.12));
  marpan.draw({ bodyWidth: bodyW, bodyHeight: bodyH });

  drawLightEdge(marpanX, marpanY, bodyW, bodyH, sun);
  updateClock(dayProgress);
}

function getSun(t) {
  const arc = sin(t * PI);
  return {
    x: lerp(width * SETTINGS.sunriseX, width * SETTINGS.sunsetX, t),
    y: lerp(height * SETTINGS.horizonY, height * SETTINGS.zenithY, arc),
    altitude: arc,
    side: t * 2 - 1,
    progress: t
  };
}

function calculateShadow(sun, objectX, groundY, bodyW, bodyH) {
  const horizontalFromSun = objectX - sun.x;
  const direction = horizontalFromSun < 0 ? -1 : 1;
  const maxLength = min(width * SETTINGS.maxShadowLength, bodyW * 2.25);
  const minLength = max(bodyW * 0.26, width * SETTINGS.minShadowLength);
  const length = lerp(maxLength, minLength, pow(sun.altitude, 0.72));
  const perspectiveY = bodyH * 0.055 * (1 - sun.altitude);
  return {
    x: objectX,
    y: groundY + bodyH * 0.015,
    direction,
    length,
    endX: objectX + direction * length,
    endY: groundY + bodyH * 0.015 + perspectiveY,
    altitude: sun.altitude
  };
}

function drawMarpanShadow(s, bodyW, bodyH) {
  const thickness = lerp(bodyW * 0.34, bodyW * 0.12, s.altitude);
  const alpha = SETTINGS.shadowOpacity * lerp(1, 0.67, s.altitude);
  const centerX = (s.x + s.endX) * 0.5;
  const centerY = (s.y + s.endY) * 0.5;
  const angle = atan2(s.endY - s.y, s.endX - s.x);

  push();
  translate(centerX, centerY);
  rotate(angle);
  noStroke();

  // Soft-edged oval: Marpan's bun-like body makes a simple ellipse the clearest shadow.
  for (let layer = 3; layer >= 0; layer--) {
    const blur = layer * bodyW * 0.018;
    fill(55, 48, 43, alpha / (layer ? 9 : 1.55));
    ellipse(0, 0, s.length + blur * 2, thickness + blur);
  }
  pop();
}

function drawAtmosphere(sun) {
  const morning = color("#f7c998");
  const noon = color("#bfe9f0");
  const evening = color("#ef9d79");
  const sky = sun.progress < 0.5
    ? lerpColor(morning, noon, smoothstep(sun.progress * 2))
    : lerpColor(noon, evening, smoothstep((sun.progress - 0.5) * 2));
  const horizon = sun.progress < 0.5 ? color("#fae2b5") : color("#f5c19c");
  const ctx = drawingContext;
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, sky.toString());
  gradient.addColorStop(0.75, lerpColor(sky, horizon, 0.72).toString());
  gradient.addColorStop(1, "#d8c59c");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawSun(sun) {
  const size = constrain(min(width, height) * 0.09, 45, 88);
  noStroke();
  for (let i = 4; i > 0; i--) {
    fill(255, 220, 113, 10 + i * 5);
    ellipse(sun.x, sun.y, size * (1 + i * 0.5));
  }
  fill(sun.progress > 0.63 ? "#ffad61" : "#ffe477");
  ellipse(sun.x, sun.y, size);
  fill(255, 250, 206, 120);
  ellipse(sun.x - size * 0.14, sun.y - size * 0.14, size * 0.42);
}

function drawDistantLandscape(sun) {
  const groundY = height * SETTINGS.groundY;
  noStroke();
  fill(116, 135, 108, 42);
  beginShape();
  vertex(0, groundY);
  for (let x = 0; x <= width; x += max(30, width / 18)) {
    vertex(x, groundY - height * (0.025 + noise(x * 0.005) * 0.045));
  }
  vertex(width, height); vertex(0, height); endShape(CLOSE);
  const grass = sun.progress < 0.5 ? color("#9dbb87") : color("#a99b70");
  fill(grass);
  rect(0, groundY, width, height - groundY);
}

function drawGrassForeground(groundY, sun) {
  stroke(83, 111, 75, 54);
  strokeWeight(1.2);
  const gap = max(18, width / 64);
  for (let x = (frameCount % 1000) * 0; x < width; x += gap) {
    const h = 5 + noise(x * 0.04) * 10;
    line(x, groundY + 4, x + sin(x) * 2, groundY - h);
  }
}

function drawLightHalo(x, y, bodyW, bodyH, sun) {
  noStroke();
  fill(255, 238, 176, 20);
  ellipse(x - sun.side * bodyW * 0.08, y, bodyW * 1.12, bodyH * 1.28);
}

function drawLightEdge(x, y, bodyW, bodyH, sun) {
  push();
  noFill();
  stroke(255, 240, 192, 95);
  strokeWeight(max(2, bodyW * 0.012));
  const litSide = sun.x < x ? -1 : 1;
  arc(x, y, bodyW * 0.96, bodyH, litSide < 0 ? HALF_PI : -HALF_PI, litSide < 0 ? PI + HALF_PI : HALF_PI);
  pop();
}

function updateClock(t) {
  const totalMinutes = round(6 * 60 + t * 12 * 60);
  const hour = floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  clockNode.textContent = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  periodNode.textContent = t < 0.28 ? "朝" : t < 0.68 ? "昼" : "夕方";
}

function smoothstep(value) {
  const v = constrain(value, 0, 1);
  return v * v * (3 - 2 * v);
}

function mixHex(a, b, amount) {
  return lerpColor(color(a), color(b), amount).toString();
}

function togglePause() { paused = !paused; }
function mousePressed() { togglePause(); return false; }
function touchStarted() { togglePause(); return false; }
function keyPressed() {
  if (key === " ") togglePause();
  if (key === "r" || key === "R") dayProgress = 0;
}
function windowResized() { resizeCanvas(windowWidth, windowHeight); }

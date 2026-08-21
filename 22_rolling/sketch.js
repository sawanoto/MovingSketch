let rollers = [];
let paused = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont("sans-serif");
  createRollers();
}

function createRollers() {
  const upper = new Marpan25D({ maxSize: 245 });
  const lower = new Marpan25D({ maxSize: 245 });
  upper.enableAutoBlink(2200, 4100);
  lower.enableAutoBlink(2500, 4400);

  rollers = [
    {
      marpan: upper,
      x: -150,
      lane: 0,
      velocity: 1,
      angle: 0,
      label: "右へ　・　時計回り"
    },
    {
      marpan: lower,
      x: width + 150,
      lane: 1,
      velocity: -1,
      angle: 0,
      label: "左へ　・　反時計回り"
    }
  ];
}

function draw() {
  drawBackground();
  drawHeading();

  const bodyW = constrain(min(width * 0.25, height * 0.3), 130, 245);
  const bodyH = bodyW * 0.68;
  const speed = constrain(width * 0.0024, 1.8, 3.6);

  for (const roller of rollers) {
    const laneY = roller.lane === 0 ? height * 0.36 : height * 0.72;
    roller.marpan.maxSize = bodyW;

    if (!paused) {
      const movement = speed * roller.velocity;
      roller.x += movement;
      // The effective rolling radius changes as the bun's wide and narrow
      // sides take turns touching the ground.
      const rollingRadius = ellipseSupportRadius(roller.angle, bodyW, bodyH);
      roller.angle += movement / max(bodyH * 0.42, rollingRadius);
      wrapRoller(roller, bodyW);
    }

    const uprightRadius = bodyH * 0.5;
    const supportRadius = ellipseSupportRadius(roller.angle, bodyW, bodyH);
    const rollingY = laneY - (supportRadius - uprightRadius) * 0.68;
    const groundY = laneY + uprightRadius;

    drawLane(laneY, roller.label, roller.velocity);
    drawShadow(roller.x, groundY, bodyW, bodyH, roller.angle);
    drawRollingMarpan(roller, rollingY, bodyW, bodyH);
  }

  drawGuide();
}

function ellipseSupportRadius(angle, bodyW, bodyH) {
  const radiusX = bodyW * 0.48;
  const radiusY = bodyH * 0.5;
  return sqrt(
    sq(radiusX * sin(angle)) +
    sq(radiusY * cos(angle))
  );
}

function wrapRoller(roller, bodyW) {
  const margin = bodyW * 0.72;
  if (roller.velocity > 0 && roller.x > width + margin) {
    roller.x = -margin;
  } else if (roller.velocity < 0 && roller.x < -margin) {
    roller.x = width + margin;
  }
}

function drawRollingMarpan(roller, y, bodyW, bodyH) {
  push();
  translate(roller.x, y);
  rotate(roller.angle);
  roller.marpan.drawAt(0, 0, {
    bodyWidth: bodyW,
    bodyHeight: bodyH,
    lookX: 0,
    lookY: 0
  });
  pop();
}

function drawShadow(x, groundY, bodyW, bodyH, angle) {
  const lift = abs(sin(angle));
  const pulse = 1 - lift * 0.16;
  noStroke();
  fill(52, 67, 61, 29 - lift * 8);
  ellipse(x, groundY + bodyH * 0.05, bodyW * 0.55 * pulse, max(7, bodyH * 0.065));
}

function drawLane(y, label, direction) {
  stroke(86, 112, 101, 45);
  strokeWeight(2);
  line(0, y + height * 0.105, width, y + height * 0.105);

  noStroke();
  fill(57, 76, 68, 112);
  textSize(constrain(width * 0.022, 11, 14));
  textAlign(direction > 0 ? LEFT : RIGHT, CENTER);
  text(label, direction > 0 ? 22 : width - 22, y - height * 0.115);
}

function drawBackground() {
  background(232, 240, 237);
  noStroke();
  fill(198, 218, 209, 70);
  for (let x = -30; x < width + 60; x += 90) {
    circle(x, height * 0.18, 120);
  }
  fill(211, 226, 219, 65);
  rect(0, height * 0.5, width, height * 0.5);
}

function drawHeading() {
  noStroke();
  fill(45, 63, 55, 170);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(constrain(width * 0.032, 17, 24));
  text("ころころマーパン", width * 0.5, 34);
  textStyle(NORMAL);
}

function drawGuide() {
  noStroke();
  fill(45, 63, 55, 120);
  textAlign(CENTER, CENTER);
  textSize(constrain(width * 0.023, 12, 15));
  text(paused ? "クリックで再開" : "クリックで一時停止", width * 0.5, height - 22);
}

function togglePause() {
  paused = !paused;
  return false;
}

function mousePressed() { return togglePause(); }
function touchStarted() { return togglePause(); }
function keyPressed() {
  if (key === " ") return togglePause();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  for (const roller of rollers) {
    roller.x = constrain(roller.x, -180, width + 180);
  }
}

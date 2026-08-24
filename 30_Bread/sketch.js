let marpan;
let viewYaw = 0;
let targetViewYaw = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont("sans-serif");

  marpan = new BreadMarpan({
    maxSize: 500,
    breadType: "burnt",
    expression: "pupil"
  });
  marpan.enableAutoBlink(2400, 4700);
  setupBreadButtons();
  setupViewButtons();
}

function draw() {
  background(246, 235, 213);
  const cx = width * 0.5;
  const cy = height * (width <= 520 ? 0.42 : 0.47);
  const pointerX = touches.length ? touches[0].x : mouseX;
  const pointerY = touches.length ? touches[0].y : mouseY;

  marpan.maxSize = min(500, width * 0.72, height * 0.62);
  marpan.setPosition(cx, cy);
  marpan.lookAt(pointerX, pointerY);
  viewYaw = lerp(viewYaw, targetViewYaw, 0.12);
  marpan.setYaw(viewYaw);

  drawGroundShadow(cx, cy);
  marpan.draw();
  drawGuide();
}

function drawGroundShadow(cx, cy) {
  const bodyW = marpan.getBodyWidth();
  const bodyH = marpan.getBodyHeight(bodyW);
  noStroke();
  fill(58, 38, 26, 28);
  ellipse(cx, cy + bodyH * 0.55, bodyW * 0.58, max(10, bodyH * 0.08));
}

function drawGuide() {
  noStroke();
  fill(60, 45, 35, 145);
  textAlign(CENTER, TOP);
  textSize(constrain(width * 0.022, 12, 15));
  text("マウスを動かすと視線が追いかけます　クリックでぱちくり", width * 0.5, 20);
}

function setupViewButtons() {
  document.querySelectorAll("[data-yaw]").forEach((button) => {
    button.addEventListener("click", () => {
      targetViewYaw = Number(button.dataset.yaw);
      document.querySelectorAll("[data-yaw]").forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });
    });
  });
}

function setupBreadButtons() {
  const names = {
    burnt: "B01 こげマーパン",
    croissant: "B02 クロワッサンマーパン",
    melon: "B03 メロンパンマーパン",
    toast: "B04 食パンマーパン",
    pizza: "B05 ピザマーパン"
  };

  document.querySelectorAll("[data-bread]").forEach((button) => {
    button.addEventListener("click", () => {
      marpan.setBreadType(button.dataset.bread);
      marpan.bounce(0.3);
      document.getElementById("bread-name").textContent = names[button.dataset.bread];
      document.querySelectorAll("[data-bread]").forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });
    });
  });
}

function reactToClick() {
  marpan.bounce(0.32);
  marpan.blink([0, 1, 2], 320);
  return false;
}

function mousePressed() {
  return reactToClick();
}

function touchStarted() {
  return reactToClick();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

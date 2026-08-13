class Marpan {
  constructor(options = {}) {
    this.x = options.x ?? 0;
    this.y = options.y ?? 0;
    this.maxSize = options.maxSize ?? 620;

    this.lookTargetX = this.x;
    this.lookTargetY = this.y;
    this.lookX = 0;
    this.lookY = 0;

    this.activeEye = -1;
    this.activeColor = "#111111";
    this.pulse = 0;
    this.blinkStartedAt = -9999;
    this.blinkDuration = 180;
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  lookAt(x, y) {
    this.lookTargetX = x;
    this.lookTargetY = y;
  }

  blink() {
    this.blinkStartedAt = millis();
  }

  bounce(amount = 1) {
    this.pulse = max(this.pulse, amount);
  }

  lightEye(index, eyeColor = "#111111") {
    this.activeEye = index;
    this.activeColor = eyeColor;
  }

  clearLight() {
    this.activeEye = -1;
  }

  update() {
    this.pulse *= 0.86;

    const bodyW = this.getBodyWidth();
    const bodyH = bodyW * 0.68;
    const lift = this.pulse * bodyH * 0.028;
    const targetX = this.lookTargetX - this.x;
    const targetY = this.lookTargetY - (this.y - lift);

    this.lookX = lerp(this.lookX, targetX, 0.14);
    this.lookY = lerp(this.lookY, targetY, 0.14);
  }

  draw() {
    const bodyW = this.getBodyWidth();
    const bodyH = bodyW * 0.68;
    const lift = this.pulse * bodyH * 0.028;

    push();
    translate(this.x, this.y - lift);
    this.drawBody(bodyW, bodyH);
    this.drawShadow(bodyW, bodyH);
    this.drawEyes(bodyW, bodyH);
    pop();
  }

  getBodyWidth() {
    return min(width * 0.64, height * 0.78, this.maxSize);
  }

  drawBody(bodyW, bodyH) {
    stroke(18);
    strokeWeight(max(5, bodyW * 0.012));
    strokeJoin(ROUND);
    fill(255);
    beginShape();
    vertex(-bodyW * 0.48, bodyH * 0.2);
    bezierVertex(-bodyW * 0.5, -bodyH * 0.25, -bodyW * 0.26, -bodyH * 0.5, 0, -bodyH * 0.5);
    bezierVertex(bodyW * 0.27, -bodyH * 0.5, bodyW * 0.5, -bodyH * 0.25, bodyW * 0.48, bodyH * 0.2);
    bezierVertex(bodyW * 0.46, bodyH * 0.46, bodyW * 0.25, bodyH * 0.5, 0, bodyH * 0.5);
    bezierVertex(-bodyW * 0.25, bodyH * 0.5, -bodyW * 0.46, bodyH * 0.46, -bodyW * 0.48, bodyH * 0.2);
    endShape(CLOSE);
  }

  drawShadow(bodyW, bodyH) {
    noStroke();
    fill(216);
    beginShape();
    vertex(-bodyW * 0.405, bodyH * 0.37);
    bezierVertex(-bodyW * 0.08, bodyH * 0.47, bodyW * 0.29, bodyH * 0.43, bodyW * 0.455, bodyH * 0.14);
    bezierVertex(bodyW * 0.45, bodyH * 0.35, bodyW * 0.25, bodyH * 0.445, 0, bodyH * 0.445);
    bezierVertex(-bodyW * 0.2, bodyH * 0.445, -bodyW * 0.34, bodyH * 0.425, -bodyW * 0.405, bodyH * 0.37);
    endShape(CLOSE);
  }

  drawEyes(bodyW, bodyH) {
    const eyeW = bodyW * 0.135;
    const eyeH = eyeW * 1.08;
    const gap = eyeW * 0.82;
    const eyeY = -bodyH * 0.03;
    const blinkAge = millis() - this.blinkStartedAt;
    const isBlinking = blinkAge >= 0 && blinkAge <= this.blinkDuration;
    const blinkAmount = isBlinking
      ? sin(map(blinkAge, 0, this.blinkDuration, 0, PI))
      : 0;
    const openScale = lerp(1, 0.07, blinkAmount);

    for (let i = 0; i < 3; i++) {
      const isActive = i === this.activeEye;
      const eyePulse = isActive ? 1 + this.pulse * 0.16 : 1;
      const x = (i - 1) * gap;
      const directionX = this.lookX - x;
      const directionY = this.lookY - eyeY;
      const directionLength = max(1, sqrt(directionX * directionX + directionY * directionY));
      const gazeStrength = constrain(directionLength / (bodyW * 0.32), 0, 1);
      const highlightX = directionX / directionLength * eyeW * 0.25 * gazeStrength;
      const highlightY = directionY / directionLength * eyeH * 0.27 * gazeStrength;

      push();
      translate(x, eyeY);
      scale(eyePulse, eyePulse * openScale);
      noStroke();
      fill(isActive ? this.activeColor : "#111111");
      ellipse(0, 0, eyeW, eyeH);

      if (openScale > 0.3) {
        fill(255);
        ellipse(highlightX, highlightY, eyeW * 0.19, eyeW * 0.19);
      }
      pop();
    }
  }
}

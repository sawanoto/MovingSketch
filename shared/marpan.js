class Marpan {
  constructor(options = {}) {
    this.x = options.x ?? 0;
    this.y = options.y ?? 0;
    this.maxSize = options.maxSize ?? 620;
    this.eyeStyle = options.eyeStyle ?? "highlight";
    this.bodyColor = options.bodyColor ?? "#ffffff";
    this.showBodyShadow = options.showBodyShadow ?? true;
    this.eyeScale = options.eyeScale ?? 1;
    this.bodyAspectRatio = options.bodyAspectRatio ?? 0.68;
    this.eyeWidthRatio = options.eyeWidthRatio ?? 0.135;
    this.eyeAspectRatio = options.eyeAspectRatio ?? 1.08;
    this.eyeGapRatio = options.eyeGapRatio ?? null;
    this.eyeYRatio = options.eyeYRatio ?? -0.03;
    this.fixedEyeIndices = options.fixedEyeIndices ?? [];
    this.fixedEyeOffsets = options.fixedEyeOffsets ?? {};
    this.eyeContentStyles = options.eyeContentStyles ?? {};

    this.lookTargetX = this.x;
    this.lookTargetY = this.y;
    this.lookX = 0;
    this.lookY = 0;
    this.rotation = options.rotation ?? 0;
    this.eyeGroupX = 0;
    this.eyeGroupY = 0;
    this.motionAngle = 0;
    this.motionStretch = 0;

    this.activeEye = -1;
    this.activeColor = "#111111";
    this.pulse = 0;
    this.blinkStartedAt = -9999;
    this.blinkDuration = 180;
    this.blinkingEyeIndices = [0, 1, 2];
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  lookAt(x, y) {
    this.lookTargetX = x;
    this.lookTargetY = y;
  }

  faceDirection(vx, vy) {
    const speed = sqrt(vx * vx + vy * vy);
    const targetStretch = constrain(speed / 10, 0, 1) * 0.1;
    this.motionStretch = lerp(this.motionStretch, targetStretch, speed < 0.15 ? 0.08 : 0.14);
    if (speed < 0.15) return;

    const directionX = vx / speed;
    const directionY = vy / speed;
    const targetAngle = atan2(vy, vx);
    const angleDifference = atan2(
      sin(targetAngle - this.motionAngle),
      cos(targetAngle - this.motionAngle)
    );
    this.motionAngle += angleDifference * 0.14;
    const targetRotation = directionX * 0.09;
    this.rotation = lerp(this.rotation, targetRotation, 0.12);
    this.eyeGroupX = lerp(this.eyeGroupX, directionX, 0.16);
    this.eyeGroupY = lerp(this.eyeGroupY, directionY, 0.16);
  }

  blink(indices = [0, 1, 2]) {
    this.blinkingEyeIndices = indices;
    this.blinkStartedAt = millis();
  }

  wink(index) {
    this.blink([index]);
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

  setBodyColor(bodyColor) {
    this.bodyColor = bodyColor;
  }

  setEyeScale(eyeScale) {
    this.eyeScale = max(0.2, eyeScale);
  }

  setFixedEyeOffset(index, x, y) {
    this.fixedEyeOffsets[index] = { x, y };
  }

  setEyeContentStyle(index, style) {
    this.eyeContentStyles[index] = style;
  }

  update() {
    this.pulse *= 0.86;

    const bodyW = this.getBodyWidth();
    const bodyH = this.getBodyHeight(bodyW);
    const lift = this.pulse * bodyH * 0.028;
    const targetX = this.lookTargetX - this.x;
    const targetY = this.lookTargetY - (this.y - lift);

    this.lookX = lerp(this.lookX, targetX, 0.14);
    this.lookY = lerp(this.lookY, targetY, 0.14);
  }

  draw() {
    const bodyW = this.getBodyWidth();
    const bodyH = this.getBodyHeight(bodyW);
    const lift = this.pulse * bodyH * 0.028;

    push();
    translate(this.x, this.y - lift);
    rotate(this.rotation);
    rotate(this.motionAngle - this.rotation);
    scale(1 + this.motionStretch, 1 - this.motionStretch * 0.32);
    rotate(-(this.motionAngle - this.rotation));
    this.drawBody(bodyW, bodyH);
    if (this.showBodyShadow) {
      this.drawShadow(bodyW, bodyH);
    }
    this.drawEyes(bodyW, bodyH);
    pop();
  }

  getBodyWidth() {
    return min(width * 0.64, height * 0.78, this.maxSize);
  }

  getBodyHeight(bodyW = this.getBodyWidth()) {
    return bodyW * this.bodyAspectRatio;
  }

  drawBody(bodyW, bodyH) {
    stroke(18);
    strokeWeight(max(5, bodyW * 0.012));
    strokeJoin(ROUND);
    fill(this.bodyColor);
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
    const bodyShade = lerpColor(color(this.bodyColor), color(48), 0.16);
    fill(bodyShade);
    beginShape();
    vertex(-bodyW * 0.405, bodyH * 0.37);
    bezierVertex(-bodyW * 0.08, bodyH * 0.47, bodyW * 0.29, bodyH * 0.43, bodyW * 0.455, bodyH * 0.14);
    bezierVertex(bodyW * 0.45, bodyH * 0.35, bodyW * 0.25, bodyH * 0.445, 0, bodyH * 0.445);
    bezierVertex(-bodyW * 0.2, bodyH * 0.445, -bodyW * 0.34, bodyH * 0.425, -bodyW * 0.405, bodyH * 0.37);
    endShape(CLOSE);
  }

  drawEyes(bodyW, bodyH) {
    const eyeW = bodyW * this.eyeWidthRatio * this.eyeScale;
    const eyeH = eyeW * this.eyeAspectRatio;
    const defaultGapRatio = this.eyeStyle === "pupil" ? 1.06 : 0.82;
    const gap = eyeW * (this.eyeGapRatio ?? defaultGapRatio);
    const eyeY = bodyH * this.eyeYRatio;
    const groupOffsetX = this.eyeGroupX * bodyW * 0.075;
    const groupOffsetY = this.eyeGroupY * bodyH * 0.055;
    const blinkAge = millis() - this.blinkStartedAt;
    const isBlinking = blinkAge >= 0 && blinkAge <= this.blinkDuration;
    const blinkAmount = isBlinking
      ? sin(map(blinkAge, 0, this.blinkDuration, 0, PI))
      : 0;
    const openScale = lerp(1, 0.07, blinkAmount);

    for (let i = 0; i < 3; i++) {
      const isActive = i === this.activeEye;
      const eyePulse = isActive ? 1 + this.pulse * 0.16 : 1;
      const eyeBlinkAmount = this.blinkingEyeIndices.includes(i) ? blinkAmount : 0;
      const eyeOpenScale = lerp(1, 0.07, eyeBlinkAmount);
      const x = (i - 1) * gap + groupOffsetX;
      const shiftedEyeY = eyeY + groupOffsetY;
      const directionX = this.lookX - x;
      const directionY = this.lookY - shiftedEyeY;
      const directionLength = max(1, sqrt(directionX * directionX + directionY * directionY));
      const gazeStrength = constrain(directionLength / (bodyW * 0.32), 0, 1);
      const highlightX = directionX / directionLength * eyeW * 0.25 * gazeStrength;
      const highlightY = directionY / directionLength * eyeH * 0.27 * gazeStrength;
      const isFixedEye = this.fixedEyeIndices.includes(i);
      const fixedOffset = this.fixedEyeOffsets[i] ?? { x: 0, y: 0 };
      const pupilX = isFixedEye
        ? eyeW * fixedOffset.x
        : directionX / directionLength * eyeW * 0.22 * gazeStrength;
      const pupilY = isFixedEye
        ? eyeH * fixedOffset.y
        : directionY / directionLength * eyeH * 0.2 * gazeStrength;

      push();
      translate(x, shiftedEyeY);
      scale(eyePulse, eyePulse * eyeOpenScale);
      noStroke();
      if (this.eyeStyle === "pupil") {
        stroke(18);
        strokeWeight(max(2, eyeW * 0.045));
        fill(255);
        ellipse(0, 0, eyeW, eyeH);

        if (eyeOpenScale > 0.3) {
          const contentStyle = this.eyeContentStyles[i] ?? "pupil";
          if (contentStyle === "happy") {
            noFill();
            stroke(isActive ? this.activeColor : "#111111");
            strokeWeight(max(3, eyeW * 0.13));
            strokeCap(ROUND);
            arc(0, eyeH * 0.1, eyeW * 0.56, eyeH * 0.44, PI, TWO_PI);
          } else if (contentStyle === "sleepy") {
            noStroke();
            fill(isActive ? this.activeColor : "#111111");
            ellipse(pupilX, pupilY + eyeH * 0.12, eyeW * 0.32, eyeW * 0.28);
            stroke(isActive ? this.activeColor : "#111111");
            strokeWeight(max(3, eyeW * 0.1));
            strokeCap(ROUND);
            line(-eyeW * 0.27, -eyeH * 0.02, eyeW * 0.27, -eyeH * 0.02);
          } else if (contentStyle === "angry") {
            noStroke();
            fill(isActive ? this.activeColor : "#111111");
            ellipse(pupilX, pupilY + eyeH * 0.09, eyeW * 0.32, eyeW * 0.32);

            const browTilt = i === 0 ? 1 : i === 2 ? -1 : 0;
            stroke(isActive ? this.activeColor : "#111111");
            strokeWeight(max(3, eyeW * 0.11));
            strokeCap(ROUND);
            line(
              -eyeW * 0.29,
              -eyeH * (0.08 + browTilt * 0.1),
              eyeW * 0.29,
              -eyeH * (0.08 - browTilt * 0.1)
            );
          } else if (contentStyle === "smile") {
            noFill();
            stroke(isActive ? this.activeColor : "#111111");
            strokeWeight(max(3, eyeW * 0.14));
            strokeCap(ROUND);
            arc(pupilX, pupilY - eyeH * 0.05, eyeW * 0.54, eyeH * 0.5, 0, PI);
          } else if (contentStyle === "flat") {
            stroke(isActive ? this.activeColor : "#111111");
            strokeWeight(max(3, eyeW * 0.11));
            strokeCap(ROUND);
            line(pupilX - eyeW * 0.27, pupilY, pupilX + eyeW * 0.27, pupilY);
          } else {
            noStroke();
            fill(isActive ? this.activeColor : "#111111");
            ellipse(
              pupilX,
              pupilY,
              eyeW * 0.38,
              eyeW * 0.38
            );
          }
        }
      } else {
        fill(isActive ? this.activeColor : "#111111");
        ellipse(0, 0, eyeW, eyeH);

        if (eyeOpenScale > 0.3) {
          fill(255);
          ellipse(highlightX, highlightY, eyeW * 0.19, eyeW * 0.19);
        }
      }
      pop();
    }
  }
}

class Marpan25D {
  constructor(options = {}) {
    this.x = options.x ?? 0;
    this.y = options.y ?? 0;
    this.maxSize = options.maxSize ?? 440;
    this.bodyColor = options.bodyColor ?? "#ffffff";
    this.yaw = options.yaw ?? 0;
    this.lookTargetX = options.lookTargetX ?? this.x;
    this.lookTargetY = options.lookTargetY ?? this.y;
    this.eyeScale = options.eyeScale ?? 1;
    this.expression = options.expression ?? "pupil";
    this.eyeStyles = {};
    this.eyeColors = {};
    this.eyeActive = {};
    this.eyeGlow = {};
    this.fixedEyeOffsets = {};
    this.blinkStartedAt = -9999;
    this.blinkDuration = 190;
    this.blinkingEyeIndices = [0, 1, 2];
    this.pulse = 0;
    this.autoBlinkEnabled = options.autoBlink ?? false;
    this.autoBlinkMin = options.autoBlinkMin ?? 2200;
    this.autoBlinkMax = options.autoBlinkMax ?? 4200;
    this.autoBlinkIndices = options.autoBlinkIndices ?? [0, 1, 2];
    this.nextAutoBlinkAt = 0;
  }

  setPosition(x, y) { this.x = x; this.y = y; }
  setBodyColor(value) { this.bodyColor = value; }
  setYaw(value) { this.yaw = value; }
  lookAt(x, y) { this.lookTargetX = x; this.lookTargetY = y; }
  setEyeScale(value) { this.eyeScale = max(0.2, value); }
  setExpression(value) { this.expression = value; }
  setEyeExpression(index, value) { this.eyeStyles[index] = value; }
  setEyeStyle(index, style, colorValue = null, active = true, glow = false) {
    this.eyeStyles[index] = style;
    if (colorValue !== null) this.setEyeColor(index, colorValue, active, glow);
  }
  setEyeColor(index, value, active = true, glow = false) {
    this.eyeColors[index] = value;
    this.eyeActive[index] = active;
    this.eyeGlow[index] = glow;
  }
  setFixedEyeOffset(index, x, y) { this.fixedEyeOffsets[index] = { x, y }; }
  clearEyeSettings(index) {
    delete this.eyeStyles[index];
    delete this.eyeColors[index];
    delete this.eyeActive[index];
    delete this.eyeGlow[index];
    delete this.fixedEyeOffsets[index];
  }
  clearAllEyeSettings() {
    this.eyeStyles = {};
    this.eyeColors = {};
    this.eyeActive = {};
    this.eyeGlow = {};
    this.fixedEyeOffsets = {};
  }
  blink(indices = [0, 1, 2], duration = 190) {
    this.blinkingEyeIndices = indices;
    this.blinkDuration = duration;
    this.blinkStartedAt = millis();
  }
  wink(index, duration = 220) { this.blink([index], duration); }
  openEyes() { this.blinkStartedAt = -9999; }
  bounce(amount = 1) { this.pulse = max(this.pulse, amount); }
  enableAutoBlink(minDelay = 2200, maxDelay = 4200) {
    this.autoBlinkEnabled = true;
    this.autoBlinkMin = minDelay;
    this.autoBlinkMax = maxDelay;
    this.nextAutoBlinkAt = millis() + random(minDelay, maxDelay);
  }
  setAutoBlinkIndices(indices = [0, 1, 2]) { this.autoBlinkIndices = indices; }
  disableAutoBlink() { this.autoBlinkEnabled = false; }
  lightEye(index, colorValue = "#121212", glow = false) {
    this.setEyeColor(index, colorValue, true, glow);
  }
  clearLight(index) {
    delete this.eyeColors[index];
    delete this.eyeActive[index];
    delete this.eyeGlow[index];
  }

  getBodyWidth() {
    return min(width * 0.56, height * 0.63, this.maxSize);
  }

  getBodyHeight(bodyW = this.getBodyWidth()) {
    return bodyW * 0.68;
  }

  draw(options = {}) {
    this.pulse *= 0.86;
    this.drawAt(this.x, this.y, { yaw: this.yaw, ...options });
  }

  drawAt(cx, cy, options = {}) {
    this.updateAutoBlink();
    const bodyW = options.bodyWidth ?? this.getBodyWidth();
    const bodyH = options.bodyHeight ?? this.getBodyHeight(bodyW);
    const yaw = options.yaw ?? this.yaw;
    const scaleX = options.scaleX ?? 1;
    const scaleY = options.scaleY ?? 1;
    const pinch = options.pinch ?? 0;
    const bodyColor = options.bodyColor ?? this.bodyColor;
    const lookX = options.lookX ?? this.lookTargetX;
    const lookY = options.lookY ?? this.lookTargetY;
    const dentAmount = constrain(options.dentAmount ?? 0, 0, 1);
    const dentDirectionX = options.dentDirectionX ?? 1;
    const dentDirectionY = options.dentDirectionY ?? 0;
    const lift = (options.pulse ?? this.pulse) * bodyH * 0.028;

    push();
    translate(cx, cy - lift);
    scale(scaleX, scaleY);
    if (dentAmount > 0.001) {
      this.drawDentedBody(0, 0, bodyW, bodyH, pinch, bodyColor, dentDirectionX, dentDirectionY, dentAmount);
      this.beginDentedClip(0, 0, bodyW, bodyH, pinch, dentDirectionX, dentDirectionY, dentAmount);
    } else {
      this.drawBody(0, 0, bodyW, bodyH, pinch, bodyColor);
      this.beginClip(0, 0, bodyW, bodyH, pinch);
    }
    this.drawEyes(0, 0, bodyW, bodyH, yaw, lookX - cx, lookY - cy, options);
    drawingContext.restore();
    pop();
  }

  updateAutoBlink() {
    if (!this.autoBlinkEnabled) return;
    if (this.nextAutoBlinkAt <= 0) {
      this.nextAutoBlinkAt = millis() + random(this.autoBlinkMin, this.autoBlinkMax);
    }
    if (millis() >= this.nextAutoBlinkAt) {
      this.blink(this.autoBlinkIndices);
      this.nextAutoBlinkAt = millis() + random(this.autoBlinkMin, this.autoBlinkMax);
    }
  }

  drawBody(cx, cy, bodyW, bodyH, pinch, bodyColor) {
    const waist = bodyH * 0.2 - pinch * bodyH * 0.05;
    stroke(18);
    strokeWeight(max(4, bodyW * 0.012));
    strokeJoin(ROUND);
    if (bodyColor === null) noFill();
    else fill(bodyColor);
    beginShape();
    vertex(cx, cy - bodyH * 0.5);
    bezierVertex(cx + bodyW * 0.27, cy - bodyH * 0.5, cx + bodyW * 0.5, cy - bodyH * 0.25, cx + bodyW * 0.48, cy + waist);
    bezierVertex(cx + bodyW * 0.46, cy + bodyH * 0.46, cx + bodyW * 0.25, cy + bodyH * 0.5, cx, cy + bodyH * 0.5);
    bezierVertex(cx - bodyW * 0.25, cy + bodyH * 0.5, cx - bodyW * 0.46, cy + bodyH * 0.46, cx - bodyW * 0.48, cy + waist);
    bezierVertex(cx - bodyW * 0.5, cy - bodyH * 0.25, cx - bodyW * 0.26, cy - bodyH * 0.5, cx, cy - bodyH * 0.5);
    endShape(CLOSE);
  }

  beginClip(cx, cy, bodyW, bodyH, pinch) {
    const waist = bodyH * 0.2 - pinch * bodyH * 0.05;
    const context = drawingContext;
    context.save();
    context.beginPath();
    context.moveTo(cx - bodyW * 0.48, cy + waist);
    context.bezierCurveTo(cx - bodyW * 0.5, cy - bodyH * 0.25, cx - bodyW * 0.26, cy - bodyH * 0.5, cx, cy - bodyH * 0.5);
    context.bezierCurveTo(cx + bodyW * 0.27, cy - bodyH * 0.5, cx + bodyW * 0.5, cy - bodyH * 0.25, cx + bodyW * 0.48, cy + waist);
    context.bezierCurveTo(cx + bodyW * 0.46, cy + bodyH * 0.46, cx + bodyW * 0.25, cy + bodyH * 0.5, cx, cy + bodyH * 0.5);
    context.bezierCurveTo(cx - bodyW * 0.25, cy + bodyH * 0.5, cx - bodyW * 0.46, cy + bodyH * 0.46, cx - bodyW * 0.48, cy + waist);
    context.closePath();
    context.clip();
  }

  getDentedOutline(cx, cy, bodyW, bodyH, pinch, directionX, directionY, amount) {
    const waist = bodyH * 0.2 - pinch * bodyH * 0.05;
    const segments = [
      [cx, cy - bodyH * 0.5, cx + bodyW * 0.27, cy - bodyH * 0.5, cx + bodyW * 0.5, cy - bodyH * 0.25, cx + bodyW * 0.48, cy + waist],
      [cx + bodyW * 0.48, cy + waist, cx + bodyW * 0.46, cy + bodyH * 0.46, cx + bodyW * 0.25, cy + bodyH * 0.5, cx, cy + bodyH * 0.5],
      [cx, cy + bodyH * 0.5, cx - bodyW * 0.25, cy + bodyH * 0.5, cx - bodyW * 0.46, cy + bodyH * 0.46, cx - bodyW * 0.48, cy + waist],
      [cx - bodyW * 0.48, cy + waist, cx - bodyW * 0.5, cy - bodyH * 0.25, cx - bodyW * 0.26, cy - bodyH * 0.5, cx, cy - bodyH * 0.5]
    ];
    const directionLength = max(0.0001, sqrt(directionX * directionX + directionY * directionY));
    const ux = directionX / directionLength;
    const uy = directionY / directionLength;
    const depth = bodyW * 0.115 * amount;
    const points = [];

    for (const segment of segments) {
      for (let step = 0; step < 14; step++) {
        const t = step / 14;
        let x = bezierPoint(segment[0], segment[2], segment[4], segment[6], t);
        let y = bezierPoint(segment[1], segment[3], segment[5], segment[7], t);
        const rx = (x - cx) / (bodyW * 0.5);
        const ry = (y - cy) / (bodyH * 0.5);
        const radialLength = max(0.0001, sqrt(rx * rx + ry * ry));
        const facing = (rx / radialLength) * ux + (ry / radialLength) * uy;
        const influence = constrain((facing - 0.52) / 0.48, 0, 1);
        const smoothInfluence = influence * influence * (3 - 2 * influence);
        x -= ux * depth * smoothInfluence;
        y -= uy * depth * smoothInfluence;
        points.push({ x, y });
      }
    }
    return points;
  }

  traceSmoothOutline(context, points) {
    const last = points[points.length - 1];
    const first = points[0];
    context.beginPath();
    context.moveTo((last.x + first.x) * 0.5, (last.y + first.y) * 0.5);
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const next = points[(i + 1) % points.length];
      context.quadraticCurveTo(point.x, point.y, (point.x + next.x) * 0.5, (point.y + next.y) * 0.5);
    }
    context.closePath();
  }

  drawDentedBody(cx, cy, bodyW, bodyH, pinch, bodyColor, directionX, directionY, amount) {
    const points = this.getDentedOutline(cx, cy, bodyW, bodyH, pinch, directionX, directionY, amount);
    stroke(18);
    strokeWeight(max(4, bodyW * 0.012));
    strokeJoin(ROUND);
    if (bodyColor === null) noFill();
    else fill(bodyColor);
    this.traceSmoothOutline(drawingContext, points);
    if (bodyColor !== null) drawingContext.fill();
    drawingContext.stroke();
  }

  beginDentedClip(cx, cy, bodyW, bodyH, pinch, directionX, directionY, amount) {
    const context = drawingContext;
    const points = this.getDentedOutline(cx, cy, bodyW, bodyH, pinch, directionX, directionY, amount);
    context.save();
    this.traceSmoothOutline(context, points);
    context.clip();
  }

  drawEyes(cx, cy, bodyW, bodyH, yaw, lookOffsetX, lookOffsetY, options = {}) {
    const eyeScale = options.eyeScale ?? this.eyeScale;
    const eyeGroupOffsetX = options.eyeGroupOffsetX ?? 0;
    const eyeGroupOffsetY = options.eyeGroupOffsetY ?? 0;
    const baseEyeW = bodyW * 0.135 * 1.42 * eyeScale;
    const baseEyeH = baseEyeW * 1.08;
    const gazeX = constrain(lookOffsetX / (bodyW * 0.5), -1, 1);
    const gazeY = constrain(lookOffsetY / (bodyH * 0.5), -1, 1);
    const blinkAge = millis() - this.blinkStartedAt;
    const blinking = blinkAge >= 0 && blinkAge <= this.blinkDuration;
    const blinkAmount = blinking ? sin(map(blinkAge, 0, this.blinkDuration, 0, PI)) : 0;
    const eyes = [];

    for (let i = 0; i < 3; i++) {
      const longitude = yaw + (i - 1) * 0.44;
      const depth = cos(longitude);
      if (depth <= 0.015) continue;
      eyes.push({
        index: i,
        depth,
        x: cx + sin(longitude) * bodyW * 0.47 + eyeGroupOffsetX,
        y: cy + eyeGroupOffsetY,
        projection: max(0.025, depth)
      });
    }

    eyes.sort((a, b) => a.depth - b.depth || a.index - b.index);
    for (const eye of eyes) {
      const distanceScale = 0.76 + eye.depth * 0.24;
      const eyeW = baseEyeW * distanceScale * eye.projection;
      const eyeH = baseEyeH * distanceScale;
      const style = this.eyeStyles[eye.index] ?? options.expression ?? this.expression;
      const eyeColor = this.eyeColors[eye.index] ?? "#121212";
      const active = this.eyeActive[eye.index] ?? true;
      const fixed = this.fixedEyeOffsets[eye.index];
      const pupilX = fixed ? fixed.x * eyeW : gazeX * eyeW * 0.2;
      const pupilY = fixed ? fixed.y * eyeH : gazeY * eyeH * 0.18;
      const closes = this.blinkingEyeIndices.includes(eye.index) ? blinkAmount : 0;
      const openScale = lerp(1, 0.055, closes);

      push();
      translate(eye.x, eye.y);
      scale(1, openScale);
      if (style === "beak") {
        this.drawBeak(eyeW, eyeH, eyeColor);
        pop();
        continue;
      }
      if (this.eyeGlow[eye.index] && active && openScale > 0.2) {
        drawingContext.shadowColor = eyeColor;
        drawingContext.shadowBlur = eyeW * 0.48;
      }
      stroke(18);
      strokeWeight(max(2, eyeW * 0.045));
      fill(style === "signal" ? (active ? eyeColor : "#3b403c") : 255);
      ellipse(0, 0, eyeW, eyeH);
      drawingContext.shadowBlur = 0;

      if (openScale > 0.18 && style !== "signal") {
        this.drawEyeContent(style, eyeW, eyeH, pupilX, pupilY, eyeColor, eye.index);
      } else if (style === "signal" && active && openScale > 0.18) {
        noStroke(); fill(255, 185);
        ellipse(-eyeW * 0.16, -eyeH * 0.18, eyeW * 0.12);
      }
      pop();
    }
  }

  drawBeak(eyeW, eyeH, colorValue = "#f6e819") {
    const beakW = eyeW * 1.18;
    const beakH = eyeH * 1.08;
    stroke(54, 61, 39);
    strokeWeight(max(2, eyeW * 0.045));
    fill(colorValue);
    beginShape();
    vertex(-beakW * 0.38, -beakH * 0.44);
    bezierVertex(-beakW * 0.08, -beakH * 0.6, beakW * 0.39, -beakH * 0.48, beakW * 0.44, -beakH * 0.1);
    bezierVertex(beakW * 0.49, beakH * 0.24, beakW * 0.2, beakH * 0.5, -beakW * 0.13, beakH * 0.44);
    bezierVertex(-beakW * 0.47, beakH * 0.36, -beakW * 0.56, -beakH * 0.18, -beakW * 0.38, -beakH * 0.44);
    endShape(CLOSE);

    noFill();
    bezier(
      -beakW * 0.47, beakH * 0.02,
      -beakW * 0.22, beakH * 0.08,
      beakW * 0.02, beakH * 0.48,
      beakW * 0.38, beakH * 0.2
    );
  }

  drawLaughMouth(eyeW, eyeH, colorValue = "#121212") {
    const openAmount = 0.86 + (sin(millis() * 0.022) + 1) * 0.12;
    const outerH = eyeH * 0.74 * openAmount;
    const innerH = eyeH * 0.62 * openAmount;

    noStroke();
    fill(colorValue);
    ellipse(0, eyeH * 0.08, eyeW * 0.62, outerH);

    fill(255);
    ellipse(0, eyeH * 0.1, eyeW * 0.51, innerH);
  }

  drawSmugMouth(eyeW, eyeH, colorValue = "#121212") {
    noFill();
    stroke(colorValue);
    strokeWeight(max(3, eyeW * 0.095));
    strokeCap(ROUND);
    arc(0, -eyeH * 0.015, eyeW * 0.62, eyeH * 0.42, 0.08, PI - 0.08);
  }

  drawFearMouth(eyeW, eyeH, colorValue = "#121212") {
    stroke(colorValue);
    strokeWeight(max(3, eyeW * 0.075));
    fill(255);
    ellipse(0, eyeH * 0.065, eyeW * 0.5, eyeW * 0.46);
  }

  drawEyeContent(style, eyeW, eyeH, pupilX, pupilY, eyeColor, index) {
    const ink = eyeColor ?? "#121212";
    if (style === "laugh-mouth") {
      this.drawLaughMouth(eyeW, eyeH, ink);
    } else if (style === "smug-mouth") {
      this.drawSmugMouth(eyeW, eyeH, ink);
    } else if (style === "fear-mouth") {
      this.drawFearMouth(eyeW, eyeH, ink);
    } else if (style === "diamond") {
      const shimmer = 0.88 + sin(millis() * 0.008 + index * 1.7) * 0.12;
      const diamondW = eyeW * 0.48 * shimmer;
      const diamondH = eyeH * 0.48 * shimmer;
      noStroke(); fill(ink);
      beginShape();
      vertex(pupilX, pupilY - diamondH * 0.58);
      vertex(pupilX + diamondW * 0.52, pupilY);
      vertex(pupilX, pupilY + diamondH * 0.58);
      vertex(pupilX - diamondW * 0.52, pupilY);
      endShape(CLOSE);
      fill(255, 225);
      circle(pupilX - diamondW * 0.13, pupilY - diamondH * 0.14, max(2, eyeW * 0.075));
      stroke(ink); strokeWeight(max(1.5, eyeW * 0.035)); strokeCap(ROUND);
      const ray = eyeW * (0.34 + 0.04 * sin(millis() * 0.01 + index));
      line(pupilX, pupilY - ray, pupilX, pupilY - ray * 0.72);
      line(pupilX + ray, pupilY, pupilX + ray * 0.72, pupilY);
      line(pupilX, pupilY + ray, pupilX, pupilY + ray * 0.72);
      line(pupilX - ray, pupilY, pupilX - ray * 0.72, pupilY);
    } else if (style === "surprised") {
      noStroke(); fill(ink);
      ellipse(pupilX, pupilY, eyeW * 0.18, eyeW * 0.18);
      fill(255, 220);
      circle(pupilX - eyeW * 0.025, pupilY - eyeW * 0.025, max(1.5, eyeW * 0.035));
    } else if (style === "laughing") {
      noFill(); stroke(ink); strokeWeight(max(4, eyeW * 0.16)); strokeCap(ROUND);
      arc(0, eyeH * 0.14, eyeW * 0.66, eyeH * 0.52, PI, TWO_PI);
      strokeWeight(max(2, eyeW * 0.055));
      arc(0, eyeH * 0.21, eyeW * 0.38, eyeH * 0.18, PI, TWO_PI);
    } else if (style === "happy") {
      noFill(); stroke(ink); strokeWeight(max(3, eyeW * 0.13)); strokeCap(ROUND);
      arc(0, eyeH * 0.1, eyeW * 0.56, eyeH * 0.44, PI, TWO_PI);
    } else if (style === "sleepy") {
      noStroke(); fill(ink); ellipse(pupilX, pupilY + eyeH * 0.12, eyeW * 0.32, eyeW * 0.28);
      stroke(ink); strokeWeight(max(3, eyeW * 0.1)); strokeCap(ROUND);
      line(-eyeW * 0.27, -eyeH * 0.02, eyeW * 0.27, -eyeH * 0.02);
    } else if (style === "angry") {
      noStroke(); fill(ink); ellipse(pupilX, pupilY + eyeH * 0.09, eyeW * 0.32, eyeW * 0.32);
      const tilt = index === 0 ? 1 : index === 2 ? -1 : 0;
      stroke(ink); strokeWeight(max(3, eyeW * 0.11)); strokeCap(ROUND);
      line(-eyeW * 0.29, -eyeH * (0.08 + tilt * 0.1), eyeW * 0.29, -eyeH * (0.08 - tilt * 0.1));
    } else if (style === "smile") {
      noFill(); stroke(ink); strokeWeight(max(3, eyeW * 0.14)); strokeCap(ROUND);
      arc(pupilX, pupilY - eyeH * 0.05, eyeW * 0.54, eyeH * 0.5, 0, PI);
    } else if (style === "flat") {
      stroke(ink); strokeWeight(max(3, eyeW * 0.11)); strokeCap(ROUND);
      line(pupilX - eyeW * 0.27, pupilY, pupilX + eyeW * 0.27, pupilY);
    } else if (style === "worried") {
      noStroke(); fill(ink);
      ellipse(pupilX, pupilY + eyeH * 0.1, eyeW * 0.29, eyeW * 0.29);
      fill(255, 210);
      circle(pupilX - eyeW * 0.055, pupilY + eyeH * 0.045, max(2, eyeW * 0.055));

      noFill(); stroke(ink); strokeWeight(max(2.5, eyeW * 0.075)); strokeCap(ROUND);
      if (index === 0) {
        line(-eyeW * 0.28, -eyeH * 0.16, eyeW * 0.25, -eyeH * 0.25);
      } else if (index === 2) {
        line(-eyeW * 0.25, -eyeH * 0.25, eyeW * 0.28, -eyeH * 0.16);
      } else {
        line(-eyeW * 0.27, -eyeH * 0.2, eyeW * 0.27, -eyeH * 0.2);
      }
    } else if (style === "crying") {
      noFill();
      stroke(ink);
      strokeWeight(max(3, eyeW * 0.105));
      strokeCap(ROUND);
      strokeJoin(ROUND);
      const halfW = eyeW * 0.22;
      const halfH = eyeH * 0.18;
      if (index === 0) {
        // Screen-left eye: ＞, pointing inward.
        line(-halfW, -halfH, halfW, 0);
        line(halfW, 0, -halfW, halfH);
      } else if (index === 2) {
        // Screen-right eye: ＜, pointing inward.
        line(halfW, -halfH, -halfW, 0);
        line(-halfW, 0, halfW, halfH);
      } else {
        // Center eye: への字.
        line(-halfW, halfH * 0.45, 0, -halfH);
        line(0, -halfH, halfW, halfH * 0.45);
      }
    } else if (style === "shy") {
      const shyX = pupilX * 0.52;
      const shyY = pupilY * 0.35 + eyeH * 0.11;
      noStroke();
      fill(ink);
      ellipse(shyX, shyY, eyeW * 0.27, eyeW * 0.27);
      fill(255, 220);
      circle(shyX - eyeW * 0.048, shyY - eyeW * 0.048, max(2, eyeW * 0.052));

      noFill();
      stroke(ink);
      strokeWeight(max(2.5, eyeW * 0.07));
      strokeCap(ROUND);
      arc(0, -eyeH * 0.01, eyeW * 0.58, eyeH * 0.27, PI + 0.08, TWO_PI - 0.08);
    } else if (style === "suspicious") {
      const sideX = eyeW * 0.13 + pupilX * 0.24;
      const sideY = pupilY * 0.18 + eyeH * 0.055;
      noStroke();
      fill(ink);
      ellipse(sideX, sideY, eyeW * 0.27, eyeW * 0.27);
      fill(255, 215);
      circle(sideX - eyeW * 0.045, sideY - eyeW * 0.045, max(2, eyeW * 0.05));

      stroke(ink);
      strokeWeight(max(3, eyeW * 0.095));
      strokeCap(ROUND);
      const tilt = index === 0 ? -0.065 : index === 2 ? 0.065 : 0.015;
      line(-eyeW * 0.29, -eyeH * (0.09 - tilt), eyeW * 0.29, -eyeH * (0.09 + tilt));
    } else if (style === "flustered") {
      const phase = millis() * 0.006 + index * 1.9;
      const offsetX = index === 0 ? -eyeW * 0.095 : index === 2 ? eyeW * 0.095 : eyeW * 0.035;
      const offsetY = index === 1 ? eyeH * 0.08 : -eyeH * 0.015;
      const restlessX = pupilX * 0.38 + offsetX + sin(phase) * eyeW * 0.035;
      const restlessY = pupilY * 0.28 + offsetY + cos(phase * 1.17) * eyeH * 0.025;

      noStroke();
      fill(ink);
      ellipse(restlessX, restlessY, eyeW * 0.29, eyeW * 0.29);
      fill(255, 220);
      circle(restlessX - eyeW * 0.05, restlessY - eyeW * 0.05, max(2, eyeW * 0.052));

      stroke(ink);
      strokeWeight(max(2.5, eyeW * 0.075));
      strokeCap(ROUND);
      if (index === 0) {
        line(-eyeW * 0.27, -eyeH * 0.12, eyeW * 0.25, -eyeH * 0.2);
      } else if (index === 1) {
        line(-eyeW * 0.24, -eyeH * 0.18, eyeW * 0.27, -eyeH * 0.1);
      } else {
        line(-eyeW * 0.25, -eyeH * 0.2, eyeW * 0.27, -eyeH * 0.11);
      }
    } else if (style === "smug") {
      const proudX = pupilX * 0.2 + eyeW * 0.035;
      const proudY = pupilY * 0.12 + eyeH * 0.045;
      noStroke();
      fill(ink);
      ellipse(proudX, proudY, eyeW * 0.24, eyeW * 0.24);
      fill(255, 215);
      circle(proudX - eyeW * 0.043, proudY - eyeW * 0.043, max(2, eyeW * 0.047));

      stroke(ink);
      strokeWeight(max(3.5, eyeW * 0.115));
      strokeCap(ROUND);
      const lidY = eyeH * 0.005;
      const tilt = index === 0 ? 0.045 : index === 2 ? -0.045 : 0;
      line(-eyeW * 0.3, lidY - eyeH * tilt, eyeW * 0.3, lidY + eyeH * tilt);
    } else if (style === "fearful") {
      const fearX = pupilX * 0.12;
      const fearY = pupilY * 0.12 + eyeH * 0.015;
      noStroke();
      fill(ink);
      ellipse(fearX, fearY, eyeW * 0.16, eyeW * 0.16);
      fill(255, 225);
      circle(fearX - eyeW * 0.026, fearY - eyeW * 0.026, max(1.5, eyeW * 0.032));

      noFill();
      stroke(ink);
      strokeWeight(max(2.5, eyeW * 0.07));
      strokeCap(ROUND);
      if (index === 0) {
        arc(eyeW * 0.02, -eyeH * 0.12, eyeW * 0.6, eyeH * 0.28, PI + 0.18, TWO_PI - 0.04);
      } else if (index === 2) {
        arc(-eyeW * 0.02, -eyeH * 0.12, eyeW * 0.6, eyeH * 0.28, PI + 0.04, TWO_PI - 0.18);
      } else {
        arc(0, -eyeH * 0.13, eyeW * 0.58, eyeH * 0.25, PI + 0.1, TWO_PI - 0.1);
      }
    } else if (style === "confused") {
      stroke(ink);
      strokeCap(ROUND);
      if (index === 0 || index === 2) {
        noFill();
        strokeWeight(max(2.5, eyeW * 0.065));
        beginShape();
        for (let angle = 0; angle <= TWO_PI * 2.5; angle += 0.22) {
          const radius = map(angle, 0, TWO_PI * 2.5, eyeW * 0.03, eyeW * 0.27);
          const direction = index === 0 ? 1 : -1;
          vertex(cos(angle) * radius, sin(angle) * radius * direction);
        }
        endShape();
      } else {
        const driftX = sin(millis() * 0.004) * eyeW * 0.12;
        const driftY = -eyeH * 0.11 + cos(millis() * 0.003) * eyeH * 0.04;
        noStroke();
        fill(ink);
        ellipse(driftX, driftY, eyeW * 0.27, eyeW * 0.27);
        fill(255, 215);
        circle(driftX - eyeW * 0.045, driftY - eyeW * 0.045, max(2, eyeW * 0.05));
      }
    } else {
      noStroke(); fill(ink);
      ellipse(pupilX, pupilY, eyeW * 0.38, eyeW * 0.38);
    }
  }
}
const songs = {
  twinkle: {
    title: "きらきら星",
    english: "Twinkle, Twinkle, Little Star",
    notes: ["C4", "C4", "G4", "G4", "A4", "A4", "G4", "F4", "F4", "E4", "E4", "D4", "D4", "C4"]
  },
  frog: {
    title: "かえるのうた",
    english: "The Frog Song",
    notes: ["C4","D4","E4","F4","E4","D4","C4","E4","F4","G4","A4","G4","F4","E4","C4","C4","C4","C4","C4","C4","D4","D4","E4","E4","F4","F4","E4","D4","C4"]
  },
  tulip: {
    title: "チューリップ",
    english: "Tulips",
    notes: ["C4","D4","E4","C4","D4","E4","G4","E4","D4","C4","D4","E4","D4","C4","D4","E4","C4","D4","E4","G4","E4","D4","C4","D4","E4","C4","G4","G4","E4","G4","A4","A4","G4","E4","E4","D4","D4","C4"]
  },
  mary: {
    title: "メリーさんのひつじ",
    english: "Mary Had a Little Lamb",
    notes: ["E4","D4","C4","D4","E4","E4","E4","D4","D4","D4","E4","G4","G4","E4","D4","C4","D4","E4","E4","E4","E4","D4","D4","E4","D4","C4"]
  },
  butterfly: {
    title: "ちょうちょう",
    english: "Butterfly",
    notes: ["G4","E4","E4","F4","D4","D4","C4","D4","E4","F4","G4","G4","G4","G4","E4","E4","E4","F4","D4","D4","D4","C4","E4","G4","G4","C4","C4","C4"]
  },
  buzz: {
    title: "ぶんぶんぶん",
    english: "Buzz, Buzz, Buzz",
    notes: ["G4","F4","E4","D4","E4","F4","D4","C4","E4","F4","G4","E4","D4","E4","F4","D4","E4","F4","G4","E4","D4","E4","F4","D4","G4","F4","E4","D4","E4","F4","D4","C4"]
  },
  hands: {
    title: "むすんでひらいて",
    english: "Close Your Hands, Open Your Hands",
    notes: ["E4","E4","D4","C4","C4","D4","D4","E4","D4","C4","G4","G4","F4","E4","E4","D4","C4","D4","E4","C4"]
  },
  chestnut: {
    title: "大きな栗の木の下で",
    english: "Under the Spreading Chestnut Tree",
    notes: ["C4","C4","D4","E4","E4","G4","E4","E4","D4","D4","C4","E4","E4","F4","G4","C5","A4","C5","G4","C5","C5","B4","G4","A4","A4","A4","A4","G4","C4","C4","D4","E4","E4","G4","E4","E4","D4","D4","C4"]
  }
};

const SONG_ORDER = ["twinkle", "hands", "mary", "butterfly", "frog", "buzz", "tulip", "chestnut"];

const NOTE_LEVEL = { C4: 0, D4: 1, E4: 2, F4: 3, G4: 4, A4: 5, B4: 6, C5: 7 };
const NOTE_JP = { C4: "ド", D4: "レ", E4: "ミ", F4: "ファ", G4: "ソ", A4: "ラ", B4: "シ", C5: "高いド" };
const NOTE_MIDI = { C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69, B4: 71, C5: 72 };
const LEVEL_COLORS = ["#f36f91", "#ff8b67", "#f3b83f", "#78cfa4", "#45b9d2", "#818be6", "#bd6fd0", "#ed5ca8"];

let selectedSongKey = "twinkle";
let song = songs[selectedSongKey];
const NOTE_SPACING = 270;
let noteSpacing = NOTE_SPACING;
const START_X = 250;
const PLAYER_BODY_W = 76;
const PLAYER_BODY_H = PLAYER_BODY_W * 0.68;
let notePoints = [];
let player;
let marpan;
let cameraX = 0;
let held = { left: false, right: false };
let audioContext;
let masterGain;
let currentNoteIndex = -1;
let noteFlashUntil = 0;
let introUntil = 0;
let completed = false;
let finishAt = 0;
let restartBox = null;
let jumpHeld = false;
let jumpBuffer = 0;
let coyoteTime = 0;
let airTime = 0;
let score = 0;
let landingText = "";
let landingTextUntil = 0;
let noteParticles = [];
let melodyCombo = 0;
let lastNoteCollectedAt = -9999;
let lastComboIndex = -1;
let lastPickupInterval = 0;
let comboFlashUntil = 0;
let gameState = "select";
let songCards = [];
let selectBox = null;
let bestScores = loadBestScores();
let clearedSongs = loadClearedSongs();

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(min(devicePixelRatio, 2));
  textFont('"Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif');
  marpan = new Marpan25D({ maxSize: PLAYER_BODY_W, bodyColor: "#fffdf3" });
  marpan.enableAutoBlink(2100, 4100);
  bindTouchControls();
  showControls(false);
}

function buildTerrain() {
  noteSpacing = constrain(295 - song.notes.length * 1.8, 220, NOTE_SPACING);
  notePoints = song.notes.map((note, index) => {
    const level = NOTE_LEVEL[note];
    const previousLevel = index > 0 ? NOTE_LEVEL[song.notes[index - 1]] : level;
    // A rising melody becomes a jump target. Larger intervals float higher.
    const rise = max(0, level - previousLevel);
    return {
      note,
      level,
      x: START_X + index * noteSpacing,
      lift: rise > 0 ? 48 + min(24, (rise - 1) * 8) : 0,
      collected: false,
      collectedAt: 0
    };
  });
}

function resetGame() {
  const x = 110;
  player = { x, y: terrainY(x) - PLAYER_BODY_H * 0.5, vx: 0, vy: 0, angle: 0, grounded: true };
  cameraX = 0;
  currentNoteIndex = -1;
  noteFlashUntil = 0;
  completed = false;
  finishAt = 0;
  introUntil = millis() + 2600;
  restartBox = null;
  selectBox = null;
  jumpHeld = false;
  jumpBuffer = 0;
  coyoteTime = 0;
  airTime = 0;
  score = 0;
  landingText = "";
  landingTextUntil = 0;
  noteParticles = [];
  melodyCombo = 0;
  lastNoteCollectedAt = -9999;
  lastComboIndex = -1;
  lastPickupInterval = 0;
  comboFlashUntil = 0;
  for (const point of notePoints) {
    point.collected = false;
    point.collectedAt = 0;
  }
  marpan.setBodyColor("#fffdf3");
}

function startSong(key) {
  selectedSongKey = key;
  song = songs[key];
  buildTerrain();
  resetGame();
  gameState = "playing";
  showControls(true);
}

function returnToSongSelect() {
  gameState = "select";
  completed = false;
  showControls(false);
}

function showControls(visible) {
  const controls = document.getElementById("controls");
  if (controls) controls.style.visibility = visible ? "visible" : "hidden";
}

function loadBestScores() {
  try { return JSON.parse(localStorage.getItem("melodyHillBestScores") || "{}"); }
  catch (error) { return {}; }
}

function loadClearedSongs() {
  try { return JSON.parse(localStorage.getItem("melodyHillClearedSongs") || "{}"); }
  catch (error) { return {}; }
}

function isSongUnlocked(index) {
  return index === 0 || Boolean(clearedSongs[SONG_ORDER[index - 1]]);
}

function saveBestScore() {
  bestScores[selectedSongKey] = max(Number(bestScores[selectedSongKey]) || 0, score);
  clearedSongs[selectedSongKey] = true;
  try {
    localStorage.setItem("melodyHillBestScores", JSON.stringify(bestScores));
    localStorage.setItem("melodyHillClearedSongs", JSON.stringify(clearedSongs));
  }
  catch (error) { /* The game remains playable when storage is unavailable. */ }
}

function terrainBaseY() {
  return min(height * 0.73, height - 150);
}

function levelStep() {
  return constrain(height * 0.058, 30, 52);
}

function noteY(level) {
  return terrainBaseY() - level * levelStep();
}

function terrainY(x) {
  if (!notePoints.length || x <= notePoints[0].x) return noteY(notePoints[0]?.level || 0);
  const last = notePoints[notePoints.length - 1];
  if (x >= last.x) return noteY(last.level);
  const segment = constrain(floor((x - START_X) / noteSpacing), 0, notePoints.length - 2);
  const a = notePoints[segment];
  const b = notePoints[segment + 1];
  const t = constrain((x - a.x) / (b.x - a.x), 0, 1);
  const smooth = (1 - cos(PI * t)) * 0.5;
  return lerp(noteY(a.level), noteY(b.level), smooth);
}

function terrainSlope(x) {
  return (terrainY(x + 3) - terrainY(x - 3)) / 6;
}

// 22_rolling と同じ、回転した楕円の接地半径。
// マーパンの広い面と狭い面が交互に地面へ触れるため、転がると自然に上下する。
function playerSupportRadius(angle = player.angle) {
  const radiusX = PLAYER_BODY_W * 0.48;
  const radiusY = PLAYER_BODY_H * 0.5;
  return sqrt(sq(radiusX * sin(angle)) + sq(radiusY * cos(angle)));
}

function draw() {
  if (gameState === "select") {
    drawSongSelect();
    return;
  }
  updatePlayer(min(deltaTime / 1000, 0.033));
  updateCamera();
  drawSky();
  push();
  translate(-cameraX, 0);
  drawStaffLines();
  drawTerrain();
  drawNoteMarkers();
  drawNoteParticles();
  drawFinish();
  drawPlayer();
  pop();
  drawUI();
}

function updatePlayer(dt) {
  if (completed) {
    player.vx *= pow(0.95, dt * 60);
  } else if (held.right) {
    player.vx += 300 * dt;
  } else if (held.left) {
    player.vx -= 300 * dt;
  } else {
    player.vx *= pow(0.988, dt * 60);
  }
  player.vx = constrain(player.vx, -390, 390);

  coyoteTime = player.grounded ? 0.11 : max(0, coyoteTime - dt);
  jumpBuffer = max(0, jumpBuffer - dt);
  if (jumpBuffer > 0 && (player.grounded || coyoteTime > 0) && !completed) {
    const launchSlope = terrainSlope(player.x);
    const risingGroundVelocity = max(-115, min(0, player.vx * launchSlope * 0.38));
    player.grounded = false;
    // Inherit the upward motion of a rising hillside, then add the jump impulse.
    // This prevents the terrain from immediately catching the player on steep climbs.
    player.vy = risingGroundVelocity - 315 - min(abs(player.vx) * 0.12, 38);
    player.y -= 7;
    player.vx += max(0, player.vx) * 0.035;
    airTime = 0;
    marpan.bounce(0.4);
    jumpBuffer = 0;
  }

  const oldX = player.x;
  const ground = terrainY(player.x) - playerSupportRadius();
  const slope = terrainSlope(player.x);

  if (player.grounded) {
    player.vx += slope * 175 * dt;
    player.x = max(55, player.x + player.vx * dt);
    const movement = player.x - oldX;
    const rollingRadius = playerSupportRadius();
    player.angle += movement / max(PLAYER_BODY_H * 0.42, rollingRadius);
    const nextGround = terrainY(player.x) - playerSupportRadius();
    const groundVelocity = (nextGround - ground) / max(dt, 0.001);
    if (groundVelocity < -185 && player.vx > 145) {
      player.grounded = false;
      player.vy = groundVelocity * 0.36 - 62;
    } else {
      player.y = nextGround;
      player.vy = groundVelocity;
    }
  } else {
    airTime += dt;
    if (held.right) player.angle += 2.25 * dt;
    if (held.left) player.angle -= 2.55 * dt;
    player.x = max(55, player.x + player.vx * dt);
    player.angle += (player.x - oldX) / max(PLAYER_BODY_H * 0.42, playerSupportRadius());
    player.vy += 590 * dt;
    player.y += player.vy * dt;
    const nextGround = terrainY(player.x) - playerSupportRadius();
    if (player.y >= nextGround && player.vy >= -20) {
      player.y = nextGround;
      player.vy = 0;
      player.grounded = true;
      player.vx *= 0.97;
      if (airTime > 0.28) {
        const upright = abs(atan2(sin(player.angle), cos(player.angle)));
        const clean = upright < 0.72;
        const bonus = round(airTime * (clean ? 180 : 70));
        score += bonus;
        landingText = clean ? `NICE LANDING +${bonus}` : `AIR +${bonus}`;
        landingTextUntil = millis() + 950;
        marpan.bounce(clean ? 0.5 : 0.25);
      }
      airTime = 0;
    }
  }

  updateNotePickups();
  const goalX = notePoints[notePoints.length - 1].x + 100;
  if (!completed && player.x >= goalX) {
    completed = true;
    finishAt = millis();
    saveBestScore();
  }
}

function notePickupY(point) {
  return noteY(point.level) - 50 - point.lift;
}

function updateNotePickups() {
  for (let i = 0; i < notePoints.length; i++) {
    const point = notePoints[i];
    if (point.collected) continue;
    const dx = player.x - point.x;
    const dy = player.y - notePickupY(point);
    const pickupRadius = point.lift > 0 ? 62 : 58;
    if (dx * dx + dy * dy <= pickupRadius * pickupRadius) {
      updateMelodyCombo(i);
      score += 100 * melodyCombo;
      collectNote(point);
      marpan.setBodyColor(LEVEL_COLORS[point.level]);
      currentNoteIndex = i;
      noteFlashUntil = millis() + 760;
      marpan.bounce(0.28);
      playNote(point.note);
    }
  }
}

function updateMelodyCombo(noteIndex) {
  const now = millis();
  const interval = now - lastNoteCollectedAt;
  const sequential = noteIndex === lastComboIndex + 1;
  let rhythmic = false;

  if (sequential && lastComboIndex >= 0) {
    if (lastPickupInterval <= 0) {
      rhythmic = interval >= 400 && interval <= 2200;
    } else {
      const tolerance = max(300, lastPickupInterval * 0.42);
      rhythmic = interval >= 350 && abs(interval - lastPickupInterval) <= tolerance;
    }
  }

  if (sequential && rhythmic) {
    melodyCombo += 1;
    lastPickupInterval = lastPickupInterval <= 0
      ? interval
      : lerp(lastPickupInterval, interval, 0.35);
    comboFlashUntil = now + 1450;
  } else {
    melodyCombo = 1;
    lastPickupInterval = 0;
  }

  lastComboIndex = noteIndex;
  lastNoteCollectedAt = now;
}

function collectNote(point) {
  if (point.collected) return;
  point.collected = true;
  point.collectedAt = millis();
  const y = notePickupY(point);
  for (let i = 0; i < 15; i++) {
    const angle = TWO_PI * i / 15 + random(-0.16, 0.16);
    const speed = random(65, 150);
    noteParticles.push({
      x: point.x,
      y,
      vx: cos(angle) * speed + player.vx * 0.12,
      vy: sin(angle) * speed - 35,
      life: 1,
      size: random(4, 9),
      color: LEVEL_COLORS[point.level]
    });
  }
}

function updateCamera() {
  const target = max(0, player.x - width * (width < 650 ? 0.34 : 0.38));
  cameraX = lerp(cameraX, target, 0.075);
}

function drawSky() {
  background("#eaf4ee");
  noStroke();
  fill(255, 253, 236, 150);
  circle(width * 0.78, height * 0.18, min(width, height) * 0.18);
  fill(91, 137, 124, 28);
  for (let i = 0; i < 5; i++) circle((i * 263 - cameraX * 0.08) % (width + 300), height * 0.25 + sin(i * 3) * 32, 7 + i * 2);
}

function drawStaffLines() {
  stroke(70, 101, 91, 28);
  strokeWeight(1);
  const top = noteY(7);
  for (let i = 0; i < 8; i++) line(cameraX - 40, top + i * levelStep(), cameraX + width + 60, top + i * levelStep());
}

function drawTerrain() {
  noStroke();
  fill("#c9d9a2");
  beginShape();
  vertex(cameraX - 80, height + 20);
  for (let x = cameraX - 80; x <= cameraX + width + 80; x += 8) vertex(x, terrainY(x));
  vertex(cameraX + width + 80, height + 20);
  endShape(CLOSE);
  noFill();
  stroke("#476d5f");
  strokeWeight(5);
  beginShape();
  for (let x = cameraX - 80; x <= cameraX + width + 80; x += 7) vertex(x, terrainY(x));
  endShape();
}

function drawNoteMarkers() {
  textAlign(CENTER, CENTER);
  for (let i = 0; i < notePoints.length; i++) {
    const p = notePoints[i];
    const y = noteY(p.level);
    const pickupY = notePickupY(p);
    const active = i === currentNoteIndex && millis() < noteFlashUntil;
    const collectAge = p.collected ? (millis() - p.collectedAt) / 360 : 0;
    if (!p.collected || collectAge < 1) {
      const appear = p.collected ? max(0, 1 - collectAge) : 1;
      const pickupScale = p.collected ? 1 + sin(min(1, collectAge) * PI) * 0.8 : 1;
      const bob = p.collected ? -collectAge * 34 : sin(frameCount * 0.045 + i * 0.8) * 5;
      push();
      translate(p.x, pickupY + bob);
      scale(pickupScale);
      drawSolidMusicNote(active ? 1.16 : 1, LEVEL_COLORS[p.level], appear);
      pop();
    }
    textStyle(NORMAL);
    noStroke();
    fill(255, 255, 250, 178);
    rectMode(CENTER);
    rect(p.x, y + 27, 62, 24, 9);
    rectMode(CORNER);
    fill("#36584d");
    textSize(12);
    text(`${NOTE_JP[p.note]}  ${p.note.replace(/[0-9]/g, "")}`, p.x, y + 27);
    if (active) {
      noFill(); stroke(255, 255, 255, 190); strokeWeight(3);
      circle(p.x, pickupY, 50 + sin(frameCount * .18) * 5);
    }
    if (!p.collected && p.lift > 0) {
      stroke(71, 109, 95, 45);
      strokeWeight(1.5);
      drawingContext.setLineDash([5, 7]);
      line(p.x, y - 8, p.x, pickupY + 22);
      drawingContext.setLineDash([]);
    }
  }
}

function drawSolidMusicNote(noteScale, colorValue, alphaAmount) {
  push();
  scale(noteScale);
  noStroke();
  // Extruded edge and soft shadow.
  drawMusicNoteShape(7, 8, color(43, 73, 64, 65 * alphaAmount));
  drawMusicNoteShape(4, 5, color(43, 73, 64, 125 * alphaAmount));
  const face = color(colorValue);
  face.setAlpha(255 * alphaAmount);
  drawMusicNoteShape(0, 0, face);
  // Gloss on the round note head, matching the attached toy-like reference.
  fill(255, 244, 240, 205 * alphaAmount);
  ellipse(-12, 16, 11, 6);
  fill(255, 255, 255, 110 * alphaAmount);
  beginShape();
  vertex(2, -33); vertex(8, -34); vertex(8, 9); vertex(4, 8);
  endShape(CLOSE);
  pop();
}

function drawMusicNoteShape(offsetX, offsetY, fillColor) {
  push();
  translate(offsetX, offsetY);
  fill(fillColor);
  // Thick, tilted note head.
  push();
  translate(-7, 18);
  rotate(-0.28);
  ellipse(0, 0, 34, 23);
  pop();
  // Stem.
  beginShape();
  vertex(5, 17); vertex(5, -35); vertex(14, -37); vertex(14, 12);
  bezierVertex(12, 17, 9, 18, 5, 17);
  endShape(CLOSE);
  // Broad waving flag.
  beginShape();
  vertex(12, -37);
  bezierVertex(30, -35, 39, -27, 39, -15);
  bezierVertex(32, -21, 24, -23, 13, -22);
  vertex(13, -10);
  bezierVertex(28, -12, 35, -6, 36, 3);
  bezierVertex(30, -3, 22, -5, 13, -3);
  endShape(CLOSE);
  pop();
}

function drawNoteParticles() {
  const dt = min(deltaTime / 1000, 0.033);
  for (let i = noteParticles.length - 1; i >= 0; i--) {
    const particle = noteParticles[i];
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 170 * dt;
    particle.vx *= pow(0.985, dt * 60);
    particle.life -= dt * 1.55;
    noStroke();
    const particleColor = color(particle.color);
    particleColor.setAlpha(255 * max(0, particle.life));
    fill(particleColor);
    circle(particle.x, particle.y, particle.size * max(0, particle.life));
    fill(255, 255, 240, 180 * max(0, particle.life));
    circle(particle.x - 1, particle.y - 1, particle.size * 0.32);
    if (particle.life <= 0) noteParticles.splice(i, 1);
  }
}

function drawPlayer() {
  marpan.pulse *= 0.86;
  noStroke();
  fill(43, 65, 58, player.grounded ? 28 : 14);
  ellipse(player.x, terrainY(player.x) + 7, PLAYER_BODY_W * 0.58, 10);
  push();
  translate(player.x, player.y);
  rotate(player.angle);
  marpan.drawAt(0, 0, {
    bodyWidth: PLAYER_BODY_W,
    bodyHeight: PLAYER_BODY_H,
    lookX: 0,
    lookY: 0
  });
  pop();
}

function drawFinish() {
  const x = notePoints[notePoints.length - 1].x + 105;
  const y = terrainY(x);
  stroke("#476d5f"); strokeWeight(4); line(x, y, x, y - 105);
  noStroke(); fill("#fff8d0"); rect(x, y - 105, 78, 48, 4);
  fill("#4b6b60"); textAlign(CENTER, CENTER); textSize(22); text("♪", x + 39, y - 81);
}

function drawUI() {
  noStroke(); fill(255, 255, 255, 205); rect(16, 16, min(280, width - 32), 76, 18);
  fill("#29463d"); textAlign(LEFT, CENTER); textStyle(BOLD); textSize(19); text(song.title, 32, 38);
  textStyle(NORMAL); textSize(12); fill(58, 86, 77, 165); text("MELODY HILL", 32, 64);
  const collectedCount = notePoints.filter(point => point.collected).length;
  const progress = collectedCount / notePoints.length;
  fill(70, 109, 95, 35); rect(130, 61, min(130, width - 162), 6, 3);
  fill("#e7b64f"); rect(130, 61, min(130, width - 162) * progress, 6, 3);
  fill("#476d5f"); textAlign(RIGHT, CENTER); textSize(11); text(round(progress * 100) + "%", min(274, width - 24), 64);

  fill(255, 255, 255, 190); rect(16, 100, 116, 34, 12);
  fill("#476d5f"); textAlign(LEFT, CENTER); textStyle(BOLD); textSize(12); text(`SCORE  ${score}`, 30, 117); textStyle(NORMAL);
  if (melodyCombo >= 2 && millis() < comboFlashUntil) {
    fill("#e7b64f"); textAlign(LEFT, CENTER); textStyle(BOLD); textSize(12);
    text(`${melodyCombo} COMBO`, 144, 117); textStyle(NORMAL);
  }

  fill(255, 255, 255, 205); rect(width - 58, 16, 42, 42, 13);
  fill("#29463d"); textAlign(CENTER, CENTER); textSize(21); text("↻", width - 37, 36);

  if (millis() < noteFlashUntil && currentNoteIndex >= 0) {
    const note = notePoints[currentNoteIndex];
    fill(255, 255, 255, 225); rect(width * .5 - 55, 24, 110, 64, 20);
    fill(LEVEL_COLORS[note.level]); textStyle(NORMAL); textSize(25);
    text(`${NOTE_JP[note.note]}  ${note.note.replace(/[0-9]/g, "")}`, width * .5, 55);
  }
  if (millis() < introUntil && currentNoteIndex < 0) {
    fill(41, 70, 61, 218); rect(width * .5 - 118, height * .23 - 27, 236, 54, 20);
    fill(255); textSize(18); textStyle(BOLD); text("音楽の上を走ろう", width * .5, height * .23); textStyle(NORMAL);
  }
  if (!completed && currentNoteIndex < 0) {
    fill(48, 77, 67, 160); textSize(13); text("→ / D で進む　SPACE でジャンプ", width * .5, height - 106);
  }
  if (millis() < landingTextUntil) {
    fill("#fffdf3"); rect(width * .5 - 92, height * .2 - 18, 184, 36, 14);
    fill("#476d5f"); textAlign(CENTER, CENTER); textStyle(BOLD); textSize(13); text(landingText, width * .5, height * .2); textStyle(NORMAL);
  }
  if (melodyCombo >= 2 && millis() < comboFlashUntil) {
    const pulse = 1 + sin((comboFlashUntil - millis()) * 0.018) * 0.045;
    push();
    translate(width * 0.5, height * 0.16);
    scale(pulse);
    fill(255, 255, 250, 225); rectMode(CENTER); rect(0, 0, 190, 62, 20); rectMode(CORNER);
    fill("#ef6f91"); textAlign(CENTER, CENTER); textStyle(BOLD); textSize(25);
    text(`${melodyCombo} COMBO`, 0, -7);
    fill("#58746a"); textStyle(NORMAL); textSize(10); text("KEEP THE RHYTHM", 0, 17);
    pop();
  }
  if (completed && millis() - finishAt > 350) drawComplete();
}

function drawComplete() {
  fill(31, 57, 49, 215); rect(0, 0, width, height);
  fill("#fffdf3"); textAlign(CENTER, CENTER); textStyle(BOLD); textSize(constrain(width * .055, 25, 48));
  text(`♪ ${song.title} COMPLETE`, width * .5, height * .38);
  fill("#fff4bd"); textSize(21); text(`SCORE  ${score}`, width * .5, height * .47);
  fill(230, 239, 232); textStyle(NORMAL); textSize(12); text(`BEST  ${bestScores[selectedSongKey] || score}`, width * .5, height * .525);
  const buttonW = min(152, width * .40);
  restartBox = { x: width * .5 - buttonW - 6, y: height * .59, w: buttonW, h: 54 };
  selectBox = { x: width * .5 + 6, y: height * .59, w: buttonW, h: 54 };
  fill("#fff4bd"); rect(restartBox.x, restartBox.y, restartBox.w, restartBox.h, 18);
  fill("#fffdf3"); rect(selectBox.x, selectBox.y, selectBox.w, selectBox.h, 18);
  fill("#29463d"); textStyle(BOLD); textSize(15);
  text("もう一度", restartBox.x + restartBox.w * .5, restartBox.y + 27);
  text("曲を選ぶ", selectBox.x + selectBox.w * .5, selectBox.y + 27); textStyle(NORMAL);
}

function drawSongSelect() {
  background("#dff3ff");
  noStroke();
  fill(255, 255, 255, 105);
  circle(width * .10, height * .12, 150);
  circle(width * .86, height * .11, 190);
  fill("#365b70"); textAlign(CENTER, CENTER); textStyle(BOLD);
  textSize(constrain(width * .048, 30, 48)); text("MELODY HILL", width * .5, height * .065);
  textStyle(NORMAL); textSize(13); fill(69, 101, 118, 185);
  text("SELECT A SONG  /  曲を選んで、音楽の地形へ", width * .5, height * .12);
  const keys = SONG_ORDER;
  const columns = width >= 760 ? 2 : 1;
  const gap = width >= 760 ? 15 : 7;
  const cardW = min(520, (width - 34 - gap * (columns - 1)) / columns);
  const rows = ceil(keys.length / columns);
  const cardH = constrain((height * .76 - gap * (rows - 1)) / rows, 62, 100);
  const totalW = columns * cardW + (columns - 1) * gap;
  const startX = (width - totalW) * .5;
  const startY = height * .16;
  songCards = [];
  keys.forEach((key, index) => {
    const col = index % columns;
    const row = floor(index / columns);
    const x = startX + col * (cardW + gap);
    const y = startY + row * (cardH + gap);
    const stage = songs[key];
    const unlocked = isSongUnlocked(index);
    songCards.push({ key, x, y, w: cardW, h: cardH, unlocked });
    noStroke(); fill(61, 91, 108, 24); rect(x + 3, y + 5, cardW, cardH, 19);
    stroke(unlocked ? "#7897a7" : "#b7c8cf"); strokeWeight(2);
    fill(unlocked ? color(255, 255, 255, 238) : color(230, 238, 241, 225)); rect(x, y, cardW, cardH, 19);
    noStroke(); fill(unlocked ? "#36566a" : "#879ba5"); textAlign(LEFT, CENTER); textStyle(BOLD); textSize(constrain(cardH * .18, 12, 16));
    text(`♪ ${String(index + 1).padStart(2, "0")}  ${stage.title}`, x + 18, y + cardH * .29);
    textStyle(NORMAL); textSize(constrain(cardH * .13, 9, 12)); fill(unlocked ? color(75, 105, 122, 190) : color(127, 148, 157, 165));
    text(stage.english, x + 18, y + cardH * .56);
    const best = Number(bestScores[key]) || 0;
    textSize(9); fill(best && unlocked ? "#e4a029" : "#8ba0aa");
    text(unlocked ? (best ? `BEST ${best}` : `${stage.notes.length} NOTES`) : "LOCKED", x + 18, y + cardH * .79);
    drawSongPreview(stage.notes, x + cardW * .68, y + cardH * .59, cardW * .30, cardH * .43, unlocked ? 1 : 0.18);
    fill(unlocked ? "#7899aa" : "#aebfc6");
    if (unlocked) triangle(x + cardW - 27, y + cardH * .5 - 11, x + cardW - 27, y + cardH * .5 + 11, x + cardW - 10, y + cardH * .5);
    else {
      rect(x + cardW - 31, y + cardH * .46, 18, 15, 4);
      noFill(); stroke("#aebfc6"); strokeWeight(3); arc(x + cardW - 22, y + cardH * .45, 13, 15, PI, TWO_PI);
    }
  });
  textAlign(CENTER, CENTER); fill(61, 91, 108, 125); textSize(10);
  text("8 SONGS FROM MELODYFLY", width * .5, height - 15);
}

function drawSongPreview(notes, cx, cy, previewW, previewH, opacity = 1) {
  const stride = notes.length > 30 ? 2 : 1;
  const shown = notes.filter((_, i) => i % stride === 0);
  noFill(); stroke(113, 146, 158, 85 * opacity); strokeWeight(2); beginShape();
  shown.forEach((note, index) => {
    const x = shown.length === 1 ? cx : map(index, 0, shown.length - 1, cx - previewW * .5, cx + previewW * .5);
    const y = map(NOTE_LEVEL[note], 0, 7, cy + previewH * .5, cy - previewH * .5);
    vertex(x, y);
  });
  endShape();
  noStroke();
  shown.forEach((note, index) => {
    const x = shown.length === 1 ? cx : map(index, 0, shown.length - 1, cx - previewW * .5, cx + previewW * .5);
    const y = map(NOTE_LEVEL[note], 0, 7, cy + previewH * .5, cy - previewH * .5);
    const previewColor = color(LEVEL_COLORS[NOTE_LEVEL[note]]);
    previewColor.setAlpha(255 * opacity);
    fill(previewColor);
    circle(x, y, constrain(previewW / shown.length * 0.72, 4, 7));
  });
}

function ensureAudio() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextClass();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.24;
    masterGain.connect(audioContext.destination);
  }
  if (audioContext.state === "suspended") audioContext.resume();
}

function playNote(name) {
  ensureAudio();
  const now = audioContext.currentTime;
  const frequency = 440 * pow(2, (NOTE_MIDI[name] - 69) / 12);
  const envelope = audioContext.createGain();
  envelope.gain.setValueAtTime(0.0001, now);
  envelope.gain.exponentialRampToValueAtTime(0.75, now + 0.012);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);
  envelope.connect(masterGain);
  [[1, "sine", 1], [2, "sine", .16], [3, "triangle", .05]].forEach(([ratio, type, level]) => {
    const osc = audioContext.createOscillator(); const gain = audioContext.createGain();
    osc.type = type; osc.frequency.value = frequency * ratio; gain.gain.value = level;
    osc.connect(gain); gain.connect(envelope); osc.start(now); osc.stop(now + .65);
  });
}

function bindTouchControls() {
  [["leftBtn", "left"], ["rightBtn", "right"]].forEach(([id, direction]) => {
    const button = document.getElementById(id);
    const on = e => { e.preventDefault(); ensureAudio(); held[direction] = true; button.classList.add("active"); };
    const off = e => { e.preventDefault(); held[direction] = false; button.classList.remove("active"); };
    button.addEventListener("pointerdown", on); button.addEventListener("pointerup", off);
    button.addEventListener("pointercancel", off); button.addEventListener("pointerleave", off);
  });
  const jumpButton = document.getElementById("jumpBtn");
  jumpButton.addEventListener("pointerdown", e => {
    e.preventDefault();
    ensureAudio();
    requestJump();
    jumpButton.classList.add("active");
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach(type => jumpButton.addEventListener(type, e => {
    e.preventDefault();
    jumpButton.classList.remove("active");
  }));
  window.addEventListener("keydown", e => {
    if (e.code !== "Space") return;
    e.preventDefault();
    if (!e.repeat && !jumpHeld) requestJump();
    jumpHeld = true;
  });
  window.addEventListener("keyup", e => {
    if (e.code !== "Space") return;
    e.preventDefault();
    jumpHeld = false;
  });
}

function requestJump() {
  ensureAudio();
  jumpBuffer = 0.16;
}

function keyPressed() {
  let handled = false;
  if (keyCode === ESCAPE && gameState === "playing") { returnToSongSelect(); handled = true; }
  if (keyCode === RIGHT_ARROW || key === "d" || key === "D") { held.right = true; handled = true; }
  if (keyCode === LEFT_ARROW || key === "a" || key === "A") { held.left = true; handled = true; }
  if (key === "r" || key === "R") { resetGame(); handled = true; }
  if (handled) {
    ensureAudio();
    return false;
  }
}
function keyReleased() {
  let handled = false;
  if (keyCode === RIGHT_ARROW || key === "d" || key === "D") { held.right = false; handled = true; }
  if (keyCode === LEFT_ARROW || key === "a" || key === "A") { held.left = false; handled = true; }
  if (handled) return false;
}
function mousePressed() {
  if (gameState === "select") {
    const card = songCards.find(item => mouseX >= item.x && mouseX <= item.x + item.w && mouseY >= item.y && mouseY <= item.y + item.h);
    if (card?.unlocked) startSong(card.key);
    return;
  }
  if (completed && restartBox && mouseX >= restartBox.x && mouseX <= restartBox.x + restartBox.w && mouseY >= restartBox.y && mouseY <= restartBox.y + restartBox.h) resetGame();
  else if (completed && selectBox && mouseX >= selectBox.x && mouseX <= selectBox.x + selectBox.w && mouseY >= selectBox.y && mouseY <= selectBox.y + selectBox.h) returnToSongSelect();
  else if (mouseX > width - 70 && mouseY < 74) resetGame();
}
function windowResized() { resizeCanvas(windowWidth, windowHeight); }

// Compatibility adapter for sketches written against the original Marpan API.
// Canonical rendering now lives in marpan-25d.js; load it before this file.
class Marpan extends Marpan25D {
  constructor(options = {}) {
    super({
      ...options,
      expression: options.expression ?? (options.eyeStyle === "highlight" ? "highlight" : "pupil")
    });
    this.showBodyShadow = options.showBodyShadow ?? true;
    this.bodyAspectRatio = options.bodyAspectRatio ?? 0.68;
    this.motionAngle = 0;
    this.motionStretch = 0;
    this.velocityX = 0;
    this.velocityY = 0;
  }

  getBodyHeight(bodyW = this.getBodyWidth()) {
    return bodyW * this.bodyAspectRatio;
  }

  faceDirection(vx, vy) {
    const speed = sqrt(vx * vx + vy * vy);
    this.velocityX = vx;
    this.velocityY = vy;
    if (speed < 0.15) {
      this.motionStretch = lerp(this.motionStretch, 0, 0.08);
      return;
    }
    const targetYaw = constrain(vx / speed, -1, 1) * 0.42;
    this.yaw = lerp(this.yaw, targetYaw, 0.14);
    this.motionStretch = lerp(this.motionStretch, constrain(speed / 10, 0, 1) * 0.1, 0.14);
  }

  update() {
    // Marpan25D updates blink and pulse state during draw().
  }

  draw() {
    const speed = sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
    super.draw({
      scaleX: 1 + this.motionStretch,
      scaleY: 1 - this.motionStretch * 0.32,
      yaw: this.yaw,
      lookX: this.lookTargetX,
      lookY: this.lookTargetY,
      pulse: this.pulse + constrain(speed / 40, 0, 0.08)
    });
  }

  setEyeContentStyle(index, style) {
    this.setEyeExpression(index, style);
  }

  clearLight(index = null) {
    if (index === null) this.clearAllEyeSettings();
    else super.clearLight(index);
  }
}

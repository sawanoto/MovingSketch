class BreadMarpan extends Marpan25D {
  constructor(options = {}) {
    super(options);
    this.breadType = options.breadType ?? "burnt";
  }

  setBreadType(type) {
    this.breadType = type;
  }

  getBodyHeight(bodyW = this.getBodyWidth()) {
    if (this.breadType === "croissant") return bodyW * 0.58;
    if (this.breadType === "toast") return bodyW * 0.76;
    if (this.breadType === "pizza") return bodyW * 0.9;
    return bodyW * 0.67;
  }

  drawBody(cx, cy, bodyW, bodyH, pinch, bodyColor) {
    if (this.breadType === "croissant") {
      this.drawCroissantBody(cx, cy, bodyW, bodyH);
      return;
    }

    if (this.breadType === "melon") {
      this.drawMelonBody(cx, cy, bodyW, bodyH, pinch);
      return;
    }

    if (this.breadType === "toast") {
      this.drawToastBody(cx, cy, bodyW, bodyH);
      return;
    }

    if (this.breadType === "pizza") {
      this.drawPizzaBody(cx, cy, bodyW, bodyH, pinch);
      return;
    }

    if (this.breadType !== "burnt") {
      super.drawBody(cx, cy, bodyW, bodyH, pinch, bodyColor);
      return;
    }

    super.drawBody(cx, cy, bodyW, bodyH, pinch, "#e9ad59");
    this.drawBurntGradient(cx, cy, bodyW, bodyH, pinch);
    super.drawBody(cx, cy, bodyW, bodyH, pinch, null);
  }

  drawBurntGradient(cx, cy, bodyW, bodyH, pinch) {
    push();
    this.beginClip(cx, cy, bodyW, bodyH, pinch);

    const context = drawingContext;
    const gradient = context.createLinearGradient(
      cx,
      cy - bodyH * 0.5,
      cx,
      cy + bodyH * 0.48
    );
    gradient.addColorStop(0, "rgba(73, 35, 19, 0.92)");
    gradient.addColorStop(0.2, "rgba(122, 64, 31, 0.78)");
    gradient.addColorStop(0.46, "rgba(180, 101, 43, 0.48)");
    gradient.addColorStop(0.72, "rgba(225, 157, 73, 0.18)");
    gradient.addColorStop(1, "rgba(255, 205, 119, 0)");
    context.fillStyle = gradient;
    context.fillRect(cx - bodyW * 0.55, cy - bodyH * 0.55, bodyW * 1.1, bodyH * 1.1);
    context.restore();
    pop();
  }

  traceCroissantPath(context, cx, cy, bodyW, bodyH) {
    context.beginPath();
    context.moveTo(cx - bodyW * 0.49, cy + bodyH * 0.38);
    context.bezierCurveTo(cx - bodyW * 0.49, cy - bodyH * 0.04, cx - bodyW * 0.31, cy - bodyH * 0.43, cx, cy - bodyH * 0.5);
    context.bezierCurveTo(cx + bodyW * 0.31, cy - bodyH * 0.43, cx + bodyW * 0.49, cy - bodyH * 0.04, cx + bodyW * 0.49, cy + bodyH * 0.38);
    context.bezierCurveTo(cx + bodyW * 0.43, cy + bodyH * 0.46, cx + bodyW * 0.35, cy + bodyH * 0.38, cx + bodyW * 0.25, cy + bodyH * 0.36);
    context.bezierCurveTo(cx + bodyW * 0.12, cy + bodyH * 0.32, cx - bodyW * 0.12, cy + bodyH * 0.32, cx - bodyW * 0.25, cy + bodyH * 0.36);
    context.bezierCurveTo(cx - bodyW * 0.35, cy + bodyH * 0.38, cx - bodyW * 0.43, cy + bodyH * 0.46, cx - bodyW * 0.49, cy + bodyH * 0.38);
    context.closePath();
  }

  beginClip(cx, cy, bodyW, bodyH, pinch) {
    if (this.breadType !== "croissant" && this.breadType !== "toast" && this.breadType !== "pizza") {
      super.beginClip(cx, cy, bodyW, bodyH, pinch);
      return;
    }
    const context = drawingContext;
    context.save();
    if (this.breadType === "toast") this.traceToastPath(context, cx, cy, bodyW, bodyH);
    else if (this.breadType === "pizza") this.tracePizzaPath(context, cx, cy, bodyW, bodyH);
    else this.traceCroissantPath(context, cx, cy, bodyW, bodyH);
    context.clip();
  }

  drawCroissantBody(cx, cy, bodyW, bodyH) {
    const context = drawingContext;
    push();
    this.traceCroissantPath(context, cx, cy, bodyW, bodyH);
    const gradient = context.createLinearGradient(cx, cy - bodyH * 0.52, cx, cy + bodyH * 0.5);
    gradient.addColorStop(0, "#c86f27");
    gradient.addColorStop(0.3, "#e69432");
    gradient.addColorStop(0.7, "#f7bd57");
    gradient.addColorStop(1, "#ffda7b");
    context.fillStyle = gradient;
    context.strokeStyle = "#121212";
    context.lineWidth = max(4, bodyW * 0.012);
    context.lineJoin = "round";
    context.fill();
    context.stroke();

    noFill();
    stroke(145, 75, 29, 175);
    strokeWeight(max(3, bodyW * 0.008));
    strokeCap(ROUND);
    bezier(cx - bodyW * 0.34, cy - bodyH * 0.23, cx - bodyW * 0.31, cy - bodyH * 0.1, cx - bodyW * 0.29, cy + bodyH * 0.02, cx - bodyW * 0.27, cy + bodyH * 0.13);
    bezier(cx - bodyW * 0.16, cy - bodyH * 0.42, cx - bodyW * 0.14, cy - bodyH * 0.26, cx - bodyW * 0.13, cy - bodyH * 0.08, cx - bodyW * 0.12, cy + bodyH * 0.1);
    bezier(cx + bodyW * 0.16, cy - bodyH * 0.42, cx + bodyW * 0.14, cy - bodyH * 0.26, cx + bodyW * 0.13, cy - bodyH * 0.08, cx + bodyW * 0.12, cy + bodyH * 0.1);
    bezier(cx + bodyW * 0.34, cy - bodyH * 0.23, cx + bodyW * 0.31, cy - bodyH * 0.1, cx + bodyW * 0.29, cy + bodyH * 0.02, cx + bodyW * 0.27, cy + bodyH * 0.13);
    pop();
  }

  drawMelonBody(cx, cy, bodyW, bodyH, pinch) {
    super.drawBody(cx, cy, bodyW, bodyH, pinch, "#f6ca4f");

    push();
    this.beginClip(cx, cy, bodyW, bodyH, pinch);
    const context = drawingContext;
    const gradient = context.createRadialGradient(
      cx - bodyW * 0.13, cy - bodyH * 0.2, bodyW * 0.04,
      cx, cy, bodyW * 0.55
    );
    gradient.addColorStop(0, "#fff49a");
    gradient.addColorStop(0.52, "#f7d45d");
    gradient.addColorStop(1, "#dea12f");
    context.fillStyle = gradient;
    context.fillRect(cx - bodyW * 0.52, cy - bodyH * 0.55, bodyW * 1.04, bodyH * 1.1);

    this.drawMelonGrooves(cx, cy, bodyW, bodyH);
    this.drawMelonHighlights(cx, cy, bodyW, bodyH);
    context.restore();
    pop();

    super.drawBody(cx, cy, bodyW, bodyH, pinch, null);
  }

  drawMelonGrooves(cx, cy, bodyW, bodyH) {
    stroke(211, 139, 37, 190);
    strokeWeight(max(4, bodyW * 0.011));
    strokeCap(ROUND);
    noFill();

    bezier(cx - bodyW * 0.31, cy - bodyH * 0.45, cx - bodyW * 0.2, cy - bodyH * 0.22, cx - bodyW * 0.16, cy + bodyH * 0.2, cx - bodyW * 0.2, cy + bodyH * 0.47);
    bezier(cx - bodyW * 0.09, cy - bodyH * 0.5, cx + bodyW * 0.01, cy - bodyH * 0.19, cx + bodyW * 0.03, cy + bodyH * 0.18, cx - bodyW * 0.01, cy + bodyH * 0.49);
    bezier(cx + bodyW * 0.14, cy - bodyH * 0.47, cx + bodyW * 0.23, cy - bodyH * 0.18, cx + bodyW * 0.22, cy + bodyH * 0.2, cx + bodyW * 0.16, cy + bodyH * 0.46);
    bezier(cx + bodyW * 0.34, cy - bodyH * 0.38, cx + bodyW * 0.41, cy - bodyH * 0.12, cx + bodyW * 0.4, cy + bodyH * 0.14, cx + bodyW * 0.34, cy + bodyH * 0.37);

    bezier(cx - bodyW * 0.46, cy - bodyH * 0.25, cx - bodyW * 0.19, cy - bodyH * 0.13, cx + bodyW * 0.2, cy - bodyH * 0.16, cx + bodyW * 0.45, cy - bodyH * 0.27);
    bezier(cx - bodyW * 0.49, cy + bodyH * 0.02, cx - bodyW * 0.21, cy + bodyH * 0.13, cx + bodyW * 0.19, cy + bodyH * 0.08, cx + bodyW * 0.48, cy - bodyH * 0.01);
    bezier(cx - bodyW * 0.43, cy + bodyH * 0.29, cx - bodyW * 0.16, cy + bodyH * 0.38, cx + bodyW * 0.19, cy + bodyH * 0.33, cx + bodyW * 0.43, cy + bodyH * 0.23);
  }

  drawMelonHighlights(cx, cy, bodyW, bodyH) {
    noFill();
    stroke(255, 249, 184, 135);
    strokeWeight(max(3, bodyW * 0.008));
    strokeCap(ROUND);
    bezier(cx - bodyW * 0.39, cy - bodyH * 0.12, cx - bodyW * 0.35, cy - bodyH * 0.2, cx - bodyW * 0.3, cy - bodyH * 0.22, cx - bodyW * 0.25, cy - bodyH * 0.2);
    bezier(cx + bodyW * 0.05, cy - bodyH * 0.32, cx + bodyW * 0.1, cy - bodyH * 0.38, cx + bodyW * 0.15, cy - bodyH * 0.38, cx + bodyW * 0.19, cy - bodyH * 0.34);
    bezier(cx - bodyW * 0.34, cy + bodyH * 0.18, cx - bodyW * 0.29, cy + bodyH * 0.11, cx - bodyW * 0.24, cy + bodyH * 0.1, cx - bodyW * 0.2, cy + bodyH * 0.13);
    bezier(cx + bodyW * 0.24, cy + bodyH * 0.2, cx + bodyW * 0.28, cy + bodyH * 0.14, cx + bodyW * 0.33, cy + bodyH * 0.13, cx + bodyW * 0.37, cy + bodyH * 0.16);
  }

  traceToastPath(context, cx, cy, bodyW, bodyH, inset = 0) {
    const left = cx - bodyW * (0.43 - inset);
    const right = cx + bodyW * (0.43 - inset);
    const top = cy - bodyH * (0.48 - inset);
    const bottom = cy + bodyH * (0.47 - inset);
    const shoulderY = cy - bodyH * (0.26 - inset * 0.5);

    context.beginPath();
    context.moveTo(left, bottom - bodyH * 0.07);
    context.lineTo(left, shoulderY);
    context.bezierCurveTo(left, top + bodyH * 0.08, cx - bodyW * 0.27, top, cx - bodyW * 0.12, top + bodyH * 0.015);
    context.bezierCurveTo(cx - bodyW * 0.055, top - bodyH * 0.005, cx + bodyW * 0.055, top - bodyH * 0.005, cx + bodyW * 0.12, top + bodyH * 0.015);
    context.bezierCurveTo(cx + bodyW * 0.27, top, right, top + bodyH * 0.08, right, shoulderY);
    context.lineTo(right, bottom - bodyH * 0.07);
    context.quadraticCurveTo(right, bottom, right - bodyW * 0.07, bottom);
    context.lineTo(left + bodyW * 0.07, bottom);
    context.quadraticCurveTo(left, bottom, left, bottom - bodyH * 0.07);
    context.closePath();
  }

  drawToastBody(cx, cy, bodyW, bodyH) {
    const context = drawingContext;
    push();

    this.traceToastPath(context, cx, cy, bodyW, bodyH);
    const crustGradient = context.createLinearGradient(cx, cy - bodyH * 0.5, cx, cy + bodyH * 0.5);
    crustGradient.addColorStop(0, "#c8752f");
    crustGradient.addColorStop(0.5, "#df9647");
    crustGradient.addColorStop(1, "#b9662c");
    context.fillStyle = crustGradient;
    context.fill();
    context.strokeStyle = "#121212";
    context.lineWidth = max(4, bodyW * 0.012);
    context.lineJoin = "round";
    context.stroke();

    this.traceToastPath(context, cx, cy + bodyH * 0.005, bodyW, bodyH, 0.045);
    const crumbGradient = context.createRadialGradient(
      cx - bodyW * 0.1, cy - bodyH * 0.16, bodyW * 0.03,
      cx, cy, bodyW * 0.48
    );
    crumbGradient.addColorStop(0, "#fff9cc");
    crumbGradient.addColorStop(0.65, "#f8e8a6");
    crumbGradient.addColorStop(1, "#edcb78");
    context.fillStyle = crumbGradient;
    context.fill();
    context.strokeStyle = "rgba(151, 82, 33, 0.72)";
    context.lineWidth = max(3, bodyW * 0.007);
    context.stroke();
    pop();
  }

  drawPizzaBody(cx, cy, bodyW, bodyH, pinch) {
    const context = drawingContext;
    push();
    this.tracePizzaPath(context, cx, cy, bodyW, bodyH);
    const crustGradient = context.createRadialGradient(
      cx - bodyW * 0.1, cy - bodyH * 0.13, bodyW * 0.04,
      cx, cy, bodyW * 0.53
    );
    crustGradient.addColorStop(0, "#ffd078");
    crustGradient.addColorStop(0.7, "#efa24e");
    crustGradient.addColorStop(1, "#c97832");
    context.fillStyle = crustGradient;
    context.fill();
    context.strokeStyle = "#121212";
    context.lineWidth = max(4, bodyW * 0.012);
    context.stroke();

    noStroke();
    fill("#c9362d");
    ellipse(cx, cy, bodyW * 0.8, bodyH * 0.82);
    fill("#fff0a8");
    ellipse(cx, cy, bodyW * 0.69, bodyH * 0.71);

    fill("#f7d98e");
    circle(cx - bodyW * 0.2, cy - bodyH * 0.23, bodyW * 0.075);
    circle(cx + bodyW * 0.2, cy + bodyH * 0.04, bodyW * 0.07);
    circle(cx - bodyW * 0.05, cy + bodyH * 0.28, bodyW * 0.065);

    this.drawPepperoni(cx - bodyW * 0.27, cy - bodyH * 0.2, bodyW * 0.095);
    this.drawPepperoni(cx + bodyW * 0.27, cy - bodyH * 0.18, bodyW * 0.09);
    this.drawPepperoni(cx - bodyW * 0.3, cy + bodyH * 0.2, bodyW * 0.09);
    this.drawPepperoni(cx + bodyW * 0.28, cy + bodyH * 0.23, bodyW * 0.095);
    this.drawPepperoni(cx, cy + bodyH * 0.33, bodyW * 0.085);

    noFill();
    stroke("#27a94f");
    strokeWeight(max(5, bodyW * 0.014));
    strokeCap(ROUND);
    arc(cx - bodyW * 0.18, cy - bodyH * 0.34, bodyW * 0.12, bodyH * 0.1, -0.35, PI + 0.45);
    arc(cx + bodyW * 0.18, cy - bodyH * 0.32, bodyW * 0.12, bodyH * 0.1, -0.25, PI + 0.55);
    arc(cx - bodyW * 0.18, cy + bodyH * 0.3, bodyW * 0.12, bodyH * 0.1, PI - 0.5, TWO_PI + 0.25);
    arc(cx + bodyW * 0.17, cy + bodyH * 0.31, bodyW * 0.12, bodyH * 0.1, PI - 0.4, TWO_PI + 0.35);
    pop();
  }

  tracePizzaPath(context, cx, cy, bodyW, bodyH) {
    context.beginPath();
    context.ellipse(cx, cy, bodyW * 0.47, bodyH * 0.48, 0, 0, TWO_PI);
    context.closePath();
  }

  drawPepperoni(x, y, diameter) {
    noStroke();
    fill("#d94146");
    circle(x, y, diameter);
    fill(255, 137, 115, 190);
    circle(x - diameter * 0.18, y - diameter * 0.14, diameter * 0.12);
    circle(x + diameter * 0.2, y + diameter * 0.08, diameter * 0.1);
    circle(x - diameter * 0.02, y + diameter * 0.24, diameter * 0.09);
  }
}

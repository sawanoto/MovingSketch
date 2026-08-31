class FamilyMarpan extends Marpan25D {
  constructor(options = {}) {
    super(options);
    this.familyRole = options.familyRole ?? "mama";
    this.accessoryColor = options.accessoryColor ?? "#8e5b40";
    this.bodyScale = options.bodyScale ?? 1;
    this.baseEyeScale = options.eyeScale ?? 1;
  }
  setFamilyRole(role) { this.familyRole = role; }
  drawFamilyAt(cx, cy, baseSize, options = {}) {
    const bodyW = baseSize * this.bodyScale;
    const bodyH = bodyW * 0.68;
    const wobble = (options.animated ?? true) ? sin(millis() * 0.002 + this.bodyScale * 8) * 0.008 : 0;
    this.drawAccessoriesBehind(cx, cy, bodyW, bodyH);
    super.drawAt(cx, cy, { ...options, bodyWidth: bodyW, bodyHeight: bodyH,
      scaleX: (options.scaleX ?? 1) * (1 + wobble), scaleY: (options.scaleY ?? 1) * (1 - abs(wobble)), eyeScale: options.eyeScale ?? this.baseEyeScale });
    this.drawAccessoriesFront(cx, cy, bodyW, bodyH);
  }
  drawAccessoriesBehind(x, y, w, h) {
    push(); stroke("#332820"); strokeWeight(max(2, w * 0.01)); strokeJoin(ROUND); fill(this.accessoryColor);
    if (this.familyRole === "mama") this.drawMamaHair(x, y, w, h);
    else if (this.familyRole === "child") this.drawChildHair(x, y, w, h);
    else if (this.familyRole === "grandma") this.drawGrandmaHair(x, y, w, h);
    pop();
  }
  drawMamaHair(x, y, w, h) {
    for (const side of [-1, 1]) {
      beginShape(); vertex(x + side*w*.42, y-h*.18);
      bezierVertex(x + side*w*.58, y-h*.16, x + side*w*.73, y-h*.03, x + side*w*.72, y+h*.13);
      bezierVertex(x + side*w*.7, y+h*.28, x + side*w*.55, y+h*.33, x + side*w*.46, y+h*.26);
      bezierVertex(x + side*w*.5, y+h*.1, x + side*w*.48, y-h*.05, x + side*w*.42, y-h*.18); endShape(CLOSE);
      noFill(); stroke(255,255,255,65); bezier(x + side*w*.5,y-h*.08,x + side*w*.59,y,x + side*w*.6,y+h*.14,x + side*w*.54,y+h*.23);
      fill(this.accessoryColor); stroke("#332820");
    }
  }
  drawChildHair(x, y, w, h) {
    for (const side of [-1, 1]) { ellipse(x + side*w*.54,y-h*.26,w*.23,h*.25); ellipse(x + side*w*.65,y-h*.17,w*.18,h*.2); }
    this.drawFlower(x+w*.46,y-h*.44,w*.035);
  }
  drawGrandmaHair(x, y, w, h) {
    for (let i=-5;i<=5;i++) { const cx=x+i*w*.095, cy=y-h*.38+abs(i)*h*.025; circle(cx,cy,w*.17); if(abs(i)>=4) circle(cx,cy+h*.17,w*.16); }
  }
  drawFlower(x,y,r) { push(); noStroke(); fill("#f48ca6"); for(let a=0;a<TWO_PI;a+=TWO_PI/5) circle(x+cos(a)*r,y+sin(a)*r,r*1.25); fill("#f2c94c"); circle(x,y,r*1.05); pop(); }
  drawAccessoriesFront(x,y,w,h) {
    push(); stroke("#332820"); strokeWeight(max(2,w*.01)); strokeJoin(ROUND);
    if(this.familyRole==="papa") this.drawTie(x,y,w,h); else if(this.familyRole==="baby") this.drawBabyTuft(x,y,w,h); else if(this.familyRole==="grandpa") this.drawWrinkles(x,y,w,h); pop();
  }
  drawTie(x,y,w,h) { fill(this.accessoryColor); beginShape(); vertex(x-w*.045,y+h*.34);vertex(x+w*.045,y+h*.34);vertex(x+w*.065,y+h*.43);vertex(x,y+h*.7);vertex(x-w*.065,y+h*.43);endShape(CLOSE); fill("#dbeaf3");triangle(x-w*.045,y+h*.34,x+w*.045,y+h*.34,x,y+h*.43); }
  drawBabyTuft(x,y,w,h) { noFill();stroke(this.accessoryColor);strokeCap(ROUND);arc(x-w*.02,y-h*.5,w*.16,h*.22,PI+.1,TWO_PI-.2);arc(x+w*.04,y-h*.48,w*.13,h*.18,PI+.2,TWO_PI); }
  drawWrinkles(x,y,w,h) { noFill();stroke(this.accessoryColor);strokeCap(ROUND);arc(x-w*.1,y-h*.27,w*.2,h*.08,PI+.15,TWO_PI-.15);arc(x+w*.1,y-h*.27,w*.2,h*.08,PI+.15,TWO_PI-.15); }
}

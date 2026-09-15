const designs = [
  {
    name: "笹船", short: "SASA", type: "sled", color: "#65b8c7",
    copy: "笹の葉を折って作ったような、小さく素朴な船。音の流れにそっと浮かび、競争より旅を感じさせます。",
    ride: "葉の中央の浅いくぼみに上半身を出して座る", sound: "船尾から五線のような柔らかい軌跡", visibility: "笹色の横長シルエットと白いマーパンが一体で読める"
  },
  {
    name: "しずく舟", short: "DROP", type: "drop", color: "#7899d2",
    copy: "水滴を横に寝かせた形。音の波に押されて自然に向きが生まれる、静かな移動体です。",
    ride: "中央の丸い窪みに包まれる", sound: "小さな音粒が水滴のように残る", visibility: "一筆書きの輪郭で小さくても判別しやすい"
  },
  {
    name: "ハミング・ポッド", short: "POD", type: "pod", color: "#e49a68",
    copy: "豆のさやのようなカプセル型。乗り物というより、声を遠くへ運ぶ共鳴器に近い形です。",
    ride: "柔らかな縁に腰掛ける", sound: "船体全体が呼吸するように伸縮", visibility: "丸い塊として混雑した画面でも見失いにくい"
  },
  {
    name: "リズム・リング", short: "RING", type: "ring", color: "#d4aa45",
    copy: "浮き輪のような輪に乗る案。上下も前後もなく、敵味方を感じさせない最も抽象的な形です。",
    ride: "輪の中央から顔と上半身を出す", sound: "拍に合わせて同心円が広がる", visibility: "輪の穴が記号になり遠目でも区別できる"
  },
  {
    name: "こもれび艇", short: "LEAF", type: "leaf", color: "#75ad77",
    copy: "葉っぱを器にしたような左右対称の舟。速さではなく、音の流れに運ばれる印象を強くしました。",
    ride: "葉の中央にちょこんと座る", sound: "葉脈が音階に合わせて淡く光る", visibility: "両端の丸い反りが穏やかな方向性を示す"
  },
  {
    name: "サウンド・ボブ", short: "BOB", type: "morph", color: "#48aeb8", recommended: true,
    copy: "ボブスレーを基礎にした、マーパン専用の硬質な移動形態。左右対称のボディ、パネルライン、コックピットを明確にしました。",
    ride: "三つ目のマーパンが低いコックピットへ収まる", sound: "後部スリットから三本の光る音波が流れる", visibility: "青緑の船体、濃紺のコックピット、白い顔の三層で識別する"
  },
  {
    name: "2.5D サウンド・スレッド", short: "2.5D", type: "render25d", color: "#63d4df",
    copy: "参考画像の立体モデルを、ゲーム用の2.5D描画に整理した案。丸い機首と硬質な外装を両立しています。",
    ride: "マーパンの三つ目を機首へ一体化した専用艇", sound: "後部フィンの間から細い光の帯を残す", visibility: "水色・白・黒の三段配色と大きな三つ目で小さくても明瞭"
  },
  {
    name: "トップビュー・スレッド", short: "TOP", type: "topview", color: "#63d4df",
    copy: "07と同じ機体を真上から見たゲーム用デザイン。完全な左右対称と、前後方向の読みやすさを優先しています。",
    ride: "船体中央にマーパンが収まり、三つ目だけが前方に見える", sound: "二本の後部フィンの間から音のラインが流れる", visibility: "丸い機首と三角配置の三つ目が進行方向を明確に示す"
  },
  {
    name: "イカ型マーパン", short: "SQUID", type: "squid", color: "#f3a6c6",
    copy: "手描きスケッチの丸い胴体と二股のシルエットを活かした、音の海を泳ぐイカ型のマーパンです。",
    ride: "乗り物を使わず、胴体と二本の触腕で滑るように進む", sound: "触腕の間から泡のような音粒が連なって流れる", visibility: "大きな三つ目、丸い胴体、二本の触腕で小さくても判別しやすい"
  },
  {
    name: "ハードシェル・スクイッド", short: "H-SQ", type: "squidTop", color: "#69d7df",
    copy: "ChatGPTIMGsquidTop.pngを基にした、真上から見る硬質なイカ型マーパン。左右対称の機体が画面下から上へ進みます。",
    ride: "三つ目を備えたマーパン自身が硬質な移動形態になる", sound: "後方の二本のランナー間から、下方向へ音の航跡を残す", visibility: "上向きの丸い機首、横一列の三つ目、左右対称の長い脚で識別する"
  }
];

let selected = 0;
let vehicle = { x: 0, y: 0, tx: 0, ty: 0, vx: 0, vy: 0 };
let trails = [];
let buttons = [];

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(document.querySelector("main"));
  canvas.id("vehicleCanvas");
  pixelDensity(1);
  strokeCap(ROUND);
  strokeJoin(ROUND);
  vehicle.x = vehicle.tx = width * 0.43;
  vehicle.y = vehicle.ty = height * 0.55;
  buildSelector();
  updateDetails();
}

function draw() {
  drawWorld();
  updateVehicle();
  drawTrails();
  const scaleValue = constrain(min(width, height) / 650, 0.72, 1.25);
  drawVehicle(vehicle.x, vehicle.y, 210 * scaleValue, designs[selected], vehicle.vx * 0.012);
  drawMiniFleet();
}

function drawWorld() {
  background("#eaf8f6");
  noFill();
  for (let i = 0; i < 9; i++) {
    const y = height * (0.22 + i * 0.085) + sin(frameCount * 0.009 + i) * 12;
    stroke(i % 3 === 0 ? 101 : 80, i % 3 === 0 ? 174 : 143, 168, 18);
    strokeWeight(i % 3 === 0 ? 2 : 1);
    beginShape();
    for (let x = -40; x < width + 50; x += 35) vertex(x, y + sin(x * 0.008 + frameCount * 0.012 + i) * 17);
    endShape();
  }
  noStroke();
  const noteColors = ["#ef6a67", "#f2a05a", "#e5c64f", "#63b875", "#4da9c9", "#798bd2", "#a177c5"];
  for (let i = 0; i < 22; i++) {
    const x = (i * 167 + frameCount * (0.12 + i % 3 * 0.05)) % (width + 100) - 50;
    const y = (i * 83) % height;
    fill(noteColors[i % noteColors.length] + "22");
    circle(x, y, 5 + i % 4 * 3);
  }
}

function updateVehicle() {
  const oldX = vehicle.x;
  const oldY = vehicle.y;
  vehicle.x = lerp(vehicle.x, vehicle.tx, 0.065);
  vehicle.y = lerp(vehicle.y, vehicle.ty, 0.065);
  vehicle.vx = lerp(vehicle.vx, vehicle.x - oldX, 0.3);
  vehicle.vy = lerp(vehicle.vy, vehicle.y - oldY, 0.3);
  if (designs[selected].type !== "squidTop" && frameCount % 3 === 0) {
    trails.push({ x: vehicle.x - 88, y: vehicle.y + 25, life: 1, color: designs[selected].color });
  }
  for (const t of trails) { t.x -= 0.35; t.life -= 0.018; }
  trails = trails.filter(t => t.life > 0);
}

function drawTrails() {
  noFill();
  for (let band = 0; band < 3; band++) {
    beginShape();
    for (const t of trails) {
      const c = color(t.color); c.setAlpha(95 * t.life);
      stroke(c); strokeWeight(1.3 + band * .35);
      vertex(t.x, t.y + (band - 1) * 9 + sin(t.x * .025 + frameCount * .04 + band) * 4);
    }
    endShape();
  }
  for (let i = 0; i < trails.length; i += 11) {
    const t = trails[i]; const c = color(t.color); c.setAlpha(130 * t.life); fill(c); noStroke(); circle(t.x, t.y - 14, 3 + t.life * 4);
  }
}

function drawVehicle(x, y, size, design, tilt = 0, mini = false) {
  push(); translate(x, y);
  rotate(design.type === "squidTop" ? 0 : constrain(tilt, -.12, .12));
  const bob = sin(frameCount * .035 + x * .01) * (mini ? 1 : 3);
  translate(0, bob);
  drawVehicleShadow(size);
  if (design.type === "morph") {
    drawMovingMarpan(size, mini);
    pop();
    return;
  }
  if (design.type === "render25d") {
    drawSoundSled25D(size, mini);
    pop();
    return;
  }
  if (design.type === "topview") {
    drawSoundSledTop(size, mini);
    pop();
    return;
  }
  if (design.type === "squid") {
    drawSquidMarpan(size, mini);
    pop();
    return;
  }
  if (design.type === "squidTop") {
    drawHardShellSquidTop(size, mini);
    pop();
    return;
  }
  drawHull(size, design);
  drawMarpan(0, -size * .16, size * .48, mini);
  pop();
}

function drawVehicleShadow(s) { noStroke(); fill(36, 68, 84, 18); ellipse(0, s * .29, s * .98, s * .13); }

function drawHull(s, design) {
  const c = color(design.color);
  stroke("#294755"); strokeWeight(max(2, s * .014)); fill(c);
  if (design.type === "sled") {
    beginShape(); vertex(-s*.5,s*.04); bezierVertex(-s*.48,s*.25,-s*.3,s*.33,0,s*.34); bezierVertex(s*.32,s*.35,s*.49,s*.26,s*.53,s*.02); bezierVertex(s*.3,s*.15,-s*.25,s*.16,-s*.5,s*.04); endShape(CLOSE);
    noFill(); stroke(255,170); strokeWeight(s*.018); bezier(-s*.36,s*.11,-s*.12,s*.22,s*.28,s*.21,s*.43,s*.08);
  } else if (design.type === "drop") {
    beginShape(); vertex(-s*.5,s*.15); bezierVertex(-s*.28,-s*.02,s*.26,-s*.01,s*.55,s*.15); bezierVertex(s*.29,s*.4,-s*.27,s*.4,-s*.5,s*.15); endShape(CLOSE);
    fill(255,100); noStroke(); ellipse(s*.25,s*.12,s*.16,s*.07);
  } else if (design.type === "pod") {
    ellipse(0,s*.17,s*1.02,s*.42); fill("#eaf8f6"); ellipse(0,s*.08,s*.46,s*.2);
    noFill(); stroke(255,150); arc(0,s*.12,s*.82,s*.27,PI+.25,TWO_PI-.25);
  } else if (design.type === "ring") {
    ellipse(0,s*.17,s*.9,s*.44); fill("#eaf8f6"); ellipse(0,s*.17,s*.48,s*.2);
    noFill(); stroke(255,160); arc(0,s*.13,s*.72,s*.31,PI+.3,TWO_PI-.3);
  } else {
    beginShape(); vertex(-s*.53,s*.17); bezierVertex(-s*.28,-s*.01,-s*.14,s*.07,0,s*.1); bezierVertex(s*.17,s*.06,s*.31,-s*.01,s*.53,s*.17); bezierVertex(s*.25,s*.4,-s*.28,s*.4,-s*.53,s*.17); endShape(CLOSE);
    stroke(255,145); strokeWeight(s*.009); line(-s*.35,s*.17,s*.35,s*.17); line(0,s*.12,0,s*.3);
  }
}

function drawMarpan(x, y, s, mini) {
  push(); translate(x,y); const h=s*.68;
  stroke("#20282c"); strokeWeight(max(2,s*.025)); fill("#fffaf0");
  beginShape(); vertex(0,-h*.5); bezierVertex(s*.3,-h*.5,s*.49,-h*.22,s*.46,h*.18); bezierVertex(s*.43,h*.5,-s*.43,h*.5,-s*.46,h*.18); bezierVertex(-s*.49,-h*.22,-s*.3,-h*.5,0,-h*.5); endShape(CLOSE);
  const blink = !mini && frameCount % 210 > 198;
  const eyes=[-.24,0,.24];
  for(let i=0;i<3;i++){
    const ex=eyes[i]*s; fill(255); ellipse(ex,0,s*.19,blink?s*.018:s*.22);
    if(!blink){ noStroke(); fill("#20282c"); circle(ex+s*.018,-s*.005,s*.07); stroke("#20282c"); strokeWeight(max(2,s*.025)); }
  }
  pop();
}

function drawMovingMarpan(s, mini) {
  const outline = "#183947";
  const hull = "#48aeb8";
  const hullDark = "#287c8a";
  const cockpit = "#173846";

  // Parallel runners make the silhouette read as a constructed vehicle.
  stroke(outline);
  strokeWeight(max(2, s * .014));
  fill("#d9e5e5");
  rectMode(CENTER);
  rect(-s * .04, -s * .275, s * .86, s * .055, s * .025);
  rect(-s * .04, s * .275, s * .86, s * .055, s * .025);

  // Precisely mirrored hard shell with a rounded, non-aggressive nose.
  fill(hull);
  beginShape();
  vertex(s * .59, 0);
  bezierVertex(s * .57, -s * .18, s * .43, -s * .25, s * .18, -s * .265);
  line(-s * .56, -s * .235);
  line(-s * .61, -s * .135);
  line(-s * .35, -s * .12);
  line(-s * .25, 0);
  line(-s * .35, s * .12);
  line(-s * .61, s * .135);
  line(-s * .56, s * .235);
  line(s * .18, s * .265);
  bezierVertex(s * .43, s * .25, s * .57, s * .18, s * .59, 0);
  endShape(CLOSE);

  // Dark side insets add depth without resembling weapons.
  noStroke();
  fill(hullDark);
  beginShape();
  vertex(s * .12, -s * .23); vertex(s * .39, -s * .18); vertex(s * .48, -s * .08); vertex(s * .2, -s * .12); endShape(CLOSE);
  beginShape();
  vertex(s * .12, s * .23); vertex(s * .39, s * .18); vertex(s * .48, s * .08); vertex(s * .2, s * .12); endShape(CLOSE);

  // Cockpit recess and a separate white Ma-pan face module.
  stroke(outline);
  strokeWeight(max(1.5, s * .01));
  fill(cockpit);
  beginShape();
  vertex(-s * .43, -s * .1);
  bezierVertex(-s * .29, -s * .19, -s * .02, -s * .18, s * .1, -s * .09);
  line(s * .1, s * .09);
  bezierVertex(-s * .02, s * .18, -s * .29, s * .19, -s * .43, s * .1);
  endShape(CLOSE);

  fill("#fffaf0");
  rect(-s * .13, 0, s * .43, s * .19, s * .085);

  const blink = !mini && frameCount % 220 > 208;
  const eyeSize = s * .105;
  const eyeY = 0;
  const eyeXs = [-s * .27, -s * .13, s * .01];
  for (let i = 0; i < 3; i++) {
    stroke(outline);
    strokeWeight(max(2, s * .01));
    fill(255);
    ellipse(eyeXs[i], eyeY, eyeSize, blink ? s * .014 : eyeSize * 1.08);
    if (!blink) {
      noStroke();
      fill(outline);
      circle(eyeXs[i] + s * .014, eyeY, eyeSize * .32);
    }
  }

  // Crisp panel breaks reinforce manufactured scale and structure.
  noFill();
  stroke(outline);
  strokeWeight(max(1, s * .006));
  line(s * .17, -s * .255, s * .17, s * .255);
  line(s * .39, -s * .17, s * .39, s * .17);
  stroke(255, 195);
  strokeWeight(max(1.5, s * .008));
  bezier(s * .2, -s * .21, s * .37, -s * .2, s * .49, -s * .13, s * .52, -s * .04);

  // Luminous sound waves replace exhaust, flame, or a weapon system.
  noFill();
  stroke("#85e7db");
  strokeWeight(max(1.5, s * .01));
  for (let i = 0; i < 3; i++) {
    const offset = i * s * .07;
    arc(-s * .47 - offset, 0, s * (.13 + i * .04), s * (.14 + i * .04), HALF_PI, PI + HALF_PI);
  }
  rectMode(CORNER);
}

function drawSoundSled25D(s, mini) {
  const ink = "#263740";
  const cyan = "#63d4df";
  const cyanSide = "#3caab8";
  const cyanLight = "#b9f4f3";
  const runner = "#283238";

  // Rear fins sit behind the body and define the vehicle at game scale.
  stroke(ink); strokeWeight(max(2, s * .012)); fill(cyanSide);
  beginShape();
  vertex(-s*.39,-s*.19); vertex(-s*.51,-s*.43); vertex(-s*.42,-s*.46);
  vertex(-s*.22,-s*.2); endShape(CLOSE);
  fill(cyan);
  beginShape();
  vertex(-s*.15,-s*.23); vertex(-s*.25,-s*.47); vertex(-s*.16,-s*.49);
  vertex(s*.03,-s*.22); endShape(CLOSE);
  fill(runner);
  quad(-s*.51,-s*.43,-s*.42,-s*.46,-s*.39,-s*.41,-s*.47,-s*.38);
  quad(-s*.25,-s*.47,-s*.16,-s*.49,-s*.14,-s*.44,-s*.22,-s*.42);

  // Black runners and compact suspension blocks.
  rectMode(CENTER);
  fill(runner);
  rect(-s*.13,s*.29,s*.78,s*.055,s*.025);
  rect(-s*.02,s*.18,s*.67,s*.045,s*.02);
  fill("#526068");
  rect(-s*.39,s*.2,s*.07,s*.13,s*.018);
  rect(s*.29,s*.16,s*.065,s*.11,s*.018);

  // White lower shell remains visible beneath the cyan upper fairing.
  fill("#f5f7f3");
  beginShape();
  vertex(-s*.46,-s*.105);
  bezierVertex(-s*.18,-s*.2,s*.34,-s*.15,s*.52,-s*.015);
  bezierVertex(s*.48,s*.2,s*.13,s*.28,-s*.33,s*.23);
  bezierVertex(-s*.48,s*.2,-s*.52,s*.04,-s*.46,-s*.105);
  endShape(CLOSE);

  // Main fairing: long cabin tapering into a large round nose.
  fill(cyan);
  beginShape();
  vertex(-s*.45,-s*.18);
  bezierVertex(-s*.2,-s*.3,s*.24,-s*.24,s*.48,-s*.09);
  bezierVertex(s*.62,0,s*.55,s*.14,s*.38,s*.19);
  bezierVertex(s*.08,s*.27,-s*.24,s*.2,-s*.45,s*.09);
  bezierVertex(-s*.52,s*.01,-s*.51,-s*.11,-s*.45,-s*.18);
  endShape(CLOSE);

  // Side pod adds the near-side 2.5D layer.
  fill(cyanSide);
  beginShape();
  vertex(-s*.28,s*.11); bezierVertex(-s*.12,s*.09,s*.04,s*.12,s*.12,s*.18);
  line(s*.08,s*.27); bezierVertex(-s*.08,s*.31,-s*.27,s*.28,-s*.36,s*.2); endShape(CLOSE);
  noFill(); stroke(cyanLight); strokeWeight(max(1.5,s*.008));
  bezier(-s*.25,s*.135,-s*.13,s*.12,-s*.01,s*.15,s*.06,s*.19);

  // Crisp seams and restrained highlights suggest a manufactured shell.
  noFill(); stroke(ink); strokeWeight(max(1,s*.006));
  bezier(s*.08,-s*.25,s*.12,-s*.12,s*.15,s*.02,s*.12,s*.21);
  stroke(255,185); strokeWeight(max(1.5,s*.009));
  bezier(-s*.28,-s*.2,-s*.03,-s*.29,s*.27,-s*.19,s*.4,-s*.1);

  // Three inset eyes wrap around the rounded front.
  const blink = !mini && frameCount % 225 > 212;
  const eyes = [
    { x:s*.26, y:-s*.085, k:.9 },
    { x:s*.39, y:-s*.045, k:1 },
    { x:s*.5, y:s*.005, k:.82 }
  ];
  for (const eye of eyes) {
    stroke("#58656b"); strokeWeight(max(2,s*.011)); fill(255);
    ellipse(eye.x,eye.y,s*.13*eye.k,blink?s*.014:s*.145*eye.k);
    if (!blink) {
      noStroke(); fill("#162229");
      circle(eye.x+s*.012,eye.y+s*.008,s*.052*eye.k);
      fill(255,220); circle(eye.x,eye.y-s*.01,s*.014*eye.k);
    }
  }

  // Luminous sound bands replace exhaust, flame, or weapons.
  noFill(); stroke(99,212,223,145); strokeWeight(max(1.5,s*.008));
  for(let i=0;i<3;i++) {
    const yy=(-1+i)*s*.07;
    line(-s*.53,yy,-s*(.68+i*.055),yy);
  }
}

function drawSoundSledTop(s, mini) {
  const ink = "#263740";
  const cyan = "#63d4df";
  const cyanDark = "#3695a5";
  const cyanLight = "#b9f4f3";
  const runner = "#283238";

  // Twin runners and rear supports are visible around the hull from above.
  rectMode(CENTER);
  stroke(ink); strokeWeight(max(2,s*.011)); fill(runner);
  rect(-s*.08,-s*.32,s*.79,s*.045,s*.02);
  rect(-s*.08,s*.32,s*.79,s*.045,s*.02);
  fill("#526068");
  rect(-s*.39,-s*.29,s*.065,s*.12,s*.015);
  rect(-s*.39,s*.29,s*.065,s*.12,s*.015);
  rect(s*.25,-s*.28,s*.06,s*.1,s*.015);
  rect(s*.25,s*.28,s*.06,s*.1,s*.015);

  // Two upright tail fins, flattened into a clean top-view silhouette.
  fill(cyanDark);
  beginShape();
  vertex(-s*.55,-s*.25); vertex(-s*.59,-s*.43); vertex(-s*.5,-s*.44); vertex(-s*.31,-s*.25); endShape(CLOSE);
  beginShape();
  vertex(-s*.55,s*.25); vertex(-s*.59,s*.43); vertex(-s*.5,s*.44); vertex(-s*.31,s*.25); endShape(CLOSE);
  fill(runner);
  quad(-s*.59,-s*.43,-s*.5,-s*.44,-s*.47,-s*.39,-s*.56,-s*.38);
  quad(-s*.59,s*.43,-s*.5,s*.44,-s*.47,s*.39,-s*.56,s*.38);

  // Symmetrical planform: narrow rear, broad shoulders, rounded nose.
  fill(cyan);
  beginShape();
  vertex(s*.59,0);
  bezierVertex(s*.57,-s*.2,s*.39,-s*.29,s*.12,-s*.3);
  bezierVertex(-s*.16,-s*.31,-s*.39,-s*.27,-s*.52,-s*.2);
  line(-s*.52,s*.2);
  bezierVertex(-s*.39,s*.27,-s*.16,s*.31,s*.12,s*.3);
  bezierVertex(s*.39,s*.29,s*.57,s*.2,s*.59,0);
  endShape(CLOSE);

  // White lower lip is exposed only around the front edge.
  noFill(); stroke("#f5f7f3"); strokeWeight(max(4,s*.045));
  arc(s*.39,0,s*.36,s*.41,-HALF_PI,HALF_PI);
  stroke(ink); strokeWeight(max(1.5,s*.008));
  arc(s*.39,0,s*.4,s*.45,-HALF_PI,HALF_PI);

  // Mirrored side pods keep the silhouette readable at small sizes.
  for (const side of [-1,1]) {
    fill(cyanDark); stroke(ink); strokeWeight(max(1.5,s*.008));
    beginShape();
    vertex(-s*.25,side*s*.245);
    bezierVertex(-s*.08,side*s*.25,s*.08,side*s*.27,s*.17,side*s*.31);
    line(s*.1,side*s*.38);
    bezierVertex(-s*.08,side*s*.37,-s*.28,side*s*.34,-s*.35,side*s*.28);
    endShape(CLOSE);
  }

  // Central spine and panel seams establish the manufactured construction.
  noFill(); stroke(ink); strokeWeight(max(1,s*.006));
  line(-s*.47,0,s*.43,0);
  bezier(-s*.03,-s*.29,s*.02,-s*.14,s*.02,s*.14,-s*.03,s*.29);
  stroke(cyanLight); strokeWeight(max(1.5,s*.008));
  bezier(-s*.34,-s*.19,-s*.1,-s*.26,s*.2,-s*.22,s*.38,-s*.12);

  // Three forward-facing eyes follow the curvature of the nose.
  const blink = !mini && frameCount % 225 > 212;
  const eyes = [
    { x:s*.38, y:-s*.13, k:.88 },
    { x:s*.46, y:0, k:1 },
    { x:s*.38, y:s*.13, k:.88 }
  ];
  for (const eye of eyes) {
    stroke("#58656b"); strokeWeight(max(2,s*.01)); fill(255);
    ellipse(eye.x,eye.y,s*.135*eye.k,blink?s*.014:s*.125*eye.k);
    if (!blink) {
      noStroke(); fill("#162229"); circle(eye.x+s*.012,eye.y,s*.048*eye.k);
      fill(255,220); circle(eye.x+s*.002,eye.y-s*.012,s*.013*eye.k);
    }
  }

  // Three centered sound lanes leave the open rear.
  noFill(); stroke(99,212,223,145); strokeWeight(max(1.5,s*.008));
  for (let i=0;i<3;i++) {
    const yy=(-1+i)*s*.065;
    line(-s*.53,yy,-s*(.69+i*.055),yy);
  }
}

function drawSquidMarpan(s, mini) {
  const ink = "#352f3d";
  const pink = "#f3a6c6";
  const pinkDark = "#d97da8";
  const pinkLight = "#ffd9e8";
  const wave = sin(frameCount * .07) * s * .025;

  // Two broad tentacles trail behind the mantle like the pencil sketch.
  stroke(ink);
  strokeWeight(max(2,s*.013));
  fill(pinkDark);
  beginShape();
  vertex(-s*.23,-s*.19);
  bezierVertex(-s*.37,-s*.26,-s*.49,-s*.36,-s*.62,-s*.46+wave);
  bezierVertex(-s*.59,-s*.27,-s*.51,-s*.08,-s*.32,-s*.015);
  bezierVertex(-s*.25,-s*.05,-s*.2,-s*.12,-s*.23,-s*.19);
  endShape(CLOSE);
  beginShape();
  vertex(-s*.32,s*.015);
  bezierVertex(-s*.51,s*.08,-s*.59,s*.27,-s*.62,s*.46-wave);
  bezierVertex(-s*.49,s*.36,-s*.37,s*.26,-s*.23,s*.19);
  bezierVertex(-s*.2,s*.12,-s*.25,s*.05,-s*.32,s*.015);
  endShape(CLOSE);

  // Rounded mantle: one clean silhouette, wider at the eye end.
  fill(pink);
  beginShape();
  vertex(-s*.31,-s*.2);
  bezierVertex(-s*.14,-s*.34,s*.2,-s*.34,s*.43,-s*.2);
  bezierVertex(s*.62,-s*.09,s*.62,s*.11,s*.45,s*.23);
  bezierVertex(s*.23,s*.38,-s*.12,s*.34,-s*.31,s*.2);
  bezierVertex(-s*.43,s*.1,-s*.43,-s*.1,-s*.31,-s*.2);
  endShape(CLOSE);

  // A firm inner rim keeps the organic design readable beside the vehicles.
  noFill();
  stroke(pinkLight);
  strokeWeight(max(1.5,s*.009));
  bezier(-s*.22,-s*.22,s*.03,-s*.31,s*.34,-s*.22,s*.46,-s*.1);
  stroke(ink); strokeWeight(max(1,s*.006));
  bezier(-s*.25,s*.2,-s*.05,s*.29,s*.24,s*.27,s*.42,s*.17);

  // Three eyes sit across the leading face, slightly following its curve.
  const blink = !mini && frameCount % 205 > 192;
  const eyes = [
    { x:s*.18, y:-s*.13, k:.86 },
    { x:s*.34, y:-s*.045, k:1 },
    { x:s*.43, y:s*.095, k:.88 }
  ];
  for (const eye of eyes) {
    stroke(ink); strokeWeight(max(2,s*.011)); fill("#fffdf8");
    ellipse(eye.x,eye.y,s*.145*eye.k,blink?s*.014:s*.16*eye.k);
    if (!blink) {
      noStroke(); fill(ink);
      ellipse(eye.x+s*.014,eye.y+s*.006,s*.052*eye.k,s*.068*eye.k);
      fill(255,220); circle(eye.x+s*.002,eye.y-s*.012,s*.014*eye.k);
    }
  }

  // Bubbles are notes in this world, not exhaust.
  noFill(); stroke(217,125,168,145); strokeWeight(max(1.5,s*.008));
  for (let i=0;i<4;i++) {
    const bx=-s*(.48+i*.095);
    const by=sin(frameCount*.055+i*1.7)*s*.045;
    circle(bx,by,s*(.035+i*.009));
  }
}

function drawHardShellSquidTop(s, mini) {
  const ink = "#253943";
  const cyan = "#69d7df";
  const cyanDark = "#3da8b5";
  const cyanLight = "#c7f7f5";
  const metal = "#394a52";

  push();
  // Equal X coordinates on both sides preserve strict bilateral symmetry.
  scale(.82);

  // The dark inner rails remain visible beneath the long cyan side blades.
  rectMode(CENTER);
  stroke(ink); strokeWeight(max(2,s*.011)); fill(metal);
  rect(-s*.28,s*.42,s*.105,s*.82,s*.045);
  rect(s*.28,s*.42,s*.105,s*.82,s*.045);

  // Long symmetrical blades create the characteristic squid silhouette.
  fill(cyanDark);
  beginShape();
  vertex(-s*.32,s*.02);
  bezierVertex(-s*.42,s*.22,-s*.4,s*.58,-s*.31,s*.79);
  bezierVertex(-s*.27,s*.87,-s*.22,s*.8,-s*.2,s*.65);
  line(-s*.13,s*.05);
  endShape(CLOSE);
  beginShape();
  vertex(s*.32,s*.02);
  bezierVertex(s*.42,s*.22,s*.4,s*.58,s*.31,s*.79);
  bezierVertex(s*.27,s*.87,s*.22,s*.8,s*.2,s*.65);
  line(s*.13,s*.05);
  endShape(CLOSE);

  // Rounded central shell with its nose at the top of the screen.
  fill(cyan);
  beginShape();
  vertex(0,s*.45);
  bezierVertex(-s*.26,s*.45,-s*.35,s*.24,-s*.34,-s*.05);
  line(-s*.31,-s*.38);
  bezierVertex(-s*.28,-s*.63,-s*.16,-s*.72,0,-s*.73);
  bezierVertex(s*.16,-s*.72,s*.28,-s*.63,s*.31,-s*.38);
  line(s*.34,-s*.05);
  bezierVertex(s*.35,s*.24,s*.26,s*.45,0,s*.45);
  endShape(CLOSE);

  // Crossbar at the rear/bottom, including dark symmetrical end caps.
  stroke(ink); strokeWeight(max(2,s*.01)); fill(cyan);
  rect(0,s*.48,s*.82,s*.16,s*.035);
  fill(metal);
  rect(-s*.44,s*.48,s*.075,s*.17,s*.025);
  rect(s*.44,s*.48,s*.075,s*.17,s*.025);

  // Manufactured seams and highlights make the shell feel rigid.
  noFill(); stroke(cyanLight); strokeWeight(max(1.5,s*.008));
  line(-s*.31,-s*.52,s*.31,-s*.52);
  for (const side of [-1,1]) {
    bezier(side*s*.22,-s*.34,side*s*.29,-s*.05,side*s*.25,s*.32,side*s*.16,s*.4);
  }
  stroke(ink); strokeWeight(max(1,s*.005));
  arc(0,-s*.28,s*.58,s*.25,PI,TWO_PI);

  // Three equal eyes form one precise horizontal instrument-like row.
  const blink = !mini && frameCount % 220 > 207;
  const eyeY = -s*.1;
  const eyeXs = [-s*.145,0,s*.145];
  for (const ex of eyeXs) {
    stroke(ink); strokeWeight(max(2,s*.009)); fill("#fffdf8");
    ellipse(ex,eyeY,s*.145,blink?s*.014:s*.16);
    if (!blink) {
      noStroke(); fill("#172329"); circle(ex,eyeY+s*.006,s*.06);
      fill(255,220); circle(ex-s*.012,eyeY-s*.012,s*.015);
    }
  }

  // The wake trails downward while the rounded nose advances upward.
  noFill(); stroke(105,215,224,135); strokeWeight(max(1.5,s*.007));
  for (let i=0;i<3;i++) {
    const x=(-1+i)*s*.075;
    line(x,s*.77,x,s*(.93+i*.045));
  }
  pop();
}

function drawMiniFleet() {
  if (width < 820) return;
  for (let i=0;i<3;i++) {
    const d=designs[(selected+i+2)%designs.length];
    const x=width*.1+i*120; const y=height*.84+sin(frameCount*.02+i)*7;
    drawVehicle(x,y,65,d,0,true);
  }
}

function buildSelector() {
  const root=document.getElementById("selector"); root.innerHTML=""; buttons=[];
  designs.forEach((design,i)=>{
    const button=document.createElement("button");
    button.type="button"; button.textContent=`${String(i+1).padStart(2,"0")} ${design.short}`;
    button.addEventListener("click",()=>selectDesign(i)); root.appendChild(button); buttons.push(button);
  });
}

function selectDesign(index) {
  selected=(index+designs.length)%designs.length; trails=[]; updateDetails();
}

function updateDetails() {
  const d=designs[selected]; buttons.forEach((b,i)=>b.classList.toggle("active",i===selected));
  document.getElementById("designNumber").textContent=String(selected+1).padStart(2,"0");
  document.getElementById("designName").textContent=d.name;
  document.getElementById("recommendation").hidden=!d.recommended;
  document.getElementById("designCopy").textContent=d.copy;
  document.getElementById("rideCopy").textContent=d.ride;
  document.getElementById("soundCopy").textContent=d.sound;
  document.getElementById("visibilityCopy").textContent=d.visibility;
}

function setTarget(x,y){ vehicle.tx=constrain(x,90,width-90); vehicle.ty=constrain(y,height*.28,height*.76); }
function mouseMoved(){ setTarget(mouseX,mouseY); }
function mouseDragged(){ setTarget(mouseX,mouseY); return false; }
function touchMoved(){ setTarget(mouseX,mouseY); return false; }
function mousePressed(){ if(mouseY<height-85) setTarget(mouseX,mouseY); }
function keyPressed(){ if(keyCode===RIGHT_ARROW) selectDesign(selected+1); if(keyCode===LEFT_ARROW) selectDesign(selected-1); }
function windowResized(){ resizeCanvas(windowWidth,windowHeight); setTarget(vehicle.tx,vehicle.ty); }

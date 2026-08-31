const BREAK_TAPS = 7;
const SAVE_KEY = "ice-crash-pictures-v1";
const FAMILY_PRIZES = ["mama","papa","child","baby","grandpa","grandma"].map(type=>({kind:"family",type}));
const PICTURE_CHANCE = .82;
const FAMILY_OPTIONS = {
  mama:{scale:1.06,eyeScale:1,color:"#986246"}, papa:{scale:1.08,eyeScale:1,color:"#3977a5"},
  child:{scale:.78,eyeScale:1.12,color:"#8e5a42"}, baby:{scale:.53,eyeScale:1.28,color:"#5d4738"},
  grandpa:{scale:.94,eyeScale:.98,color:"#a68f7c"}, grandma:{scale:.93,eyeScale:.98,color:"#b4a69b"}
};
let activeCharacter, hitCount = 0, state = "ice", shake = 0, revealStarted = 0;
let cracks = [], particles = [], sparkles = [], slabs = [], savedImages = [], activePicture = null;
let audioCtx, masterGain, againButton, hint;
let roundId = 0;

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("canvas-wrap");
  pixelDensity(min(2, window.devicePixelRatio || 1));
  strokeCap(ROUND); strokeJoin(ROUND);
  againButton = document.querySelector("#again-button");
  hint = document.querySelector("#tap-hint");
  wireControls();
  loadPictures();
  resetRound();
}

function draw() {
  drawBackground();
  const box = iceBox();
  const progress = hitCount / BREAK_TAPS;
  const wobble = state === "ice" ? shake * sin(frameCount * 2.45) : 0;
  shake *= .78;

  push();
  translate(wobble, abs(wobble) * -.15);
  drawPrize(box, progress);
  if (state === "ice") drawIce(box, progress);
  pop();

  updateAndDrawSlabs();
  updateAndDrawParticles();
  if (state === "revealed") drawCelebration(box);
}

function drawBackground() {
  const ctx = drawingContext;
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, "#effcff"); grad.addColorStop(.62, "#d6f3fb"); grad.addColorStop(1, "#c4eaf4");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, width, height);
  noStroke(); fill(255, 255, 255, 70);
  ellipse(width * .12, height * .2, min(width, height) * .26);
  ellipse(width * .87, height * .72, min(width, height) * .33);
  fill(90, 176, 200, 20);
  for (let i = 0; i < 7; i++) circle((i * 197 + 31) % width, (i * 163 + 80) % height, 10 + i * 4);
}

function iceBox() {
  const w = min(width * .82, height * .56, 560);
  return { x: width / 2, y: height * (height > width ? .45 : .49), w, h: w * 1.05 };
}

function drawPrize(box, progress) {
  const revealAge = state === "revealed" ? millis() - revealStarted : 0;
  const popAmount = state === "revealed" ? min(1, revealAge / 520) : 1;
  const bounce = state === "revealed" ? 1 + sin(popAmount * PI * 3) * .12 * (1 - popAmount) : 1;
  const size = box.w * (state === "revealed" ? lerp(.62, .88, easeOutBack(popAmount)) : .62);
  push(); translate(box.x, box.y + (state === "revealed" ? lerp(28, -8, popAmount) : 0)); scale(max(.02, bounce));
  if (activePicture) {
    imageMode(CENTER);
    const ratio = min(size / activePicture.width, (size * .78) / activePicture.height);
    drawingContext.save();
    drawingContext.beginPath(); drawingContext.roundRect(-size*.48, -size*.4, size*.96, size*.8, size*.1); drawingContext.clip();
    image(activePicture, 0, 0, activePicture.width * ratio, activePicture.height * ratio);
    drawingContext.restore();
  } else if (activeCharacter instanceof FamilyMarpan) {
    activeCharacter.lookAt(mouseX - box.x, mouseY - box.y);
    activeCharacter.setExpression(state === "revealed" ? "happy" : "pupil");
    activeCharacter.drawFamilyAt(0, 0, size / activeCharacter.bodyScale, { bodyWidth:size, bodyHeight:size*.68 });
  } else if (activeCharacter) {
    activeCharacter.maxSize = size;
    activeCharacter.setPosition(0, 0);
    activeCharacter.lookAt(mouseX - box.x, mouseY - box.y);
    activeCharacter.setExpression(state === "revealed" ? "happy" : "pupil");
    activeCharacter.draw({ bodyWidth: size, bodyHeight: activeCharacter.getBodyHeight(size) });
  }
  pop();
}

function drawIce(box, progress) {
  push(); translate(box.x, box.y);
  const ctx = drawingContext;
  ctx.save(); roundedIcePath(ctx, box.w, box.h); ctx.clip();
  const fog = map(progress, 0, 1, 235, 35);
  const grad = ctx.createLinearGradient(-box.w*.45, -box.h*.5, box.w*.42, box.h*.5);
  grad.addColorStop(0, `rgba(240,253,255,${fog/255})`);
  grad.addColorStop(.52, `rgba(150,224,243,${min(235,fog+18)/255})`);
  grad.addColorStop(1, `rgba(83,184,216,${min(220,fog+5)/255})`);
  ctx.fillStyle = grad; ctx.fillRect(-box.w/2, -box.h/2, box.w, box.h);
  noStroke(); fill(255, 255, 255, map(progress, 0, 1, 155, 25));
  ellipse(-box.w*.18, -box.h*.15, box.w*.34, box.h*.56);
  ellipse(box.w*.21, box.h*.16, box.w*.24, box.h*.34);
  if (progress < .58) { fill(255, 255, 255, map(progress, 0, .58, 105, 12)); rect(-box.w/2, -box.h/2, box.w, box.h); }
  drawCracks();
  ctx.restore();
  noFill(); stroke(255, 245); strokeWeight(max(5, box.w*.018)); roundedIceShape(box.w, box.h);
  stroke(77, 174, 207, 135); strokeWeight(max(3, box.w*.009)); roundedIceShape(box.w, box.h);
  stroke(255, 245); strokeWeight(max(3, box.w*.008)); arc(-box.w*.05, -box.h*.06, box.w*.72, box.h*.82, PI*1.08, PI*1.72);
  pop();
}

function roundedIcePath(ctx, w, h) {
  const r = w * .15; ctx.beginPath(); ctx.roundRect(-w/2, -h/2, w, h, r); ctx.closePath();
}
function roundedIceShape(w, h) { rectMode(CENTER); rect(0, 0, w, h, w*.15); rectMode(CORNER); }

function drawCracks() {
  noFill();
  cracks.forEach((crack, index) => {
    stroke(255, 245); strokeWeight(index > 3 ? 4 : 3);
    crack.branches.forEach(branch => { beginShape(); branch.forEach(p => vertex(p.x, p.y)); endShape(); });
    stroke(55, 144, 180, 170); strokeWeight(index > 3 ? 2.2 : 1.4);
    crack.branches.forEach(branch => { beginShape(); branch.forEach(p => vertex(p.x, p.y)); endShape(); });
  });
}

function makeCrack(box) {
  const origin = { x: random(-box.w*.2, box.w*.2), y: random(-box.h*.2, box.h*.2) };
  const branches = [];
  const count = floor(random(3, 6));
  for (let b = 0; b < count; b++) {
    const points = [origin]; let x = origin.x, y = origin.y, a = random(TWO_PI), len = random(box.w*.13, box.w*.28);
    for (let s = 0; s < 4; s++) { a += random(-.38,.38); x += cos(a)*len/4; y += sin(a)*len/4; points.push({x,y}); }
    branches.push(points);
  }
  cracks.push({ branches });
}

function hitIce(x, y) {
  if (state !== "ice") return;
  ensureAudio();
  const box = iceBox();
  hitCount = min(BREAK_TAPS, hitCount + 1);
  shake = 9 + hitCount * 1.6;
  makeCrack(box); spawnChips(x, y, hitCount >= BREAK_TAPS ? 34 : 7 + hitCount);
  playHitSound(hitCount);
  hint.classList.add("hide");
  if (hitCount >= BREAK_TAPS) breakIce(box);
}

function spawnChips(x, y, count) {
  for (let i=0; i<count; i++) particles.push({ x, y, vx:random(-5,5), vy:random(-7,-1), gravity:random(.12,.24), life:random(28,55), size:random(5,17), rot:random(TWO_PI), spin:random(-.2,.2), sparkle:false });
}

function breakIce(box) {
  state = "revealed"; revealStarted = millis(); if(activeCharacter){activeCharacter.bounce(1.6);activeCharacter.blink([0,1,2],240);}
  const cols=3, rows=4;
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) {
    const x=(c+.5)*box.w/cols-box.w/2, y=(r+.5)*box.h/rows-box.h/2, angle=atan2(y,x);
    slabs.push({x:box.x+x,y:box.y+y,w:box.w/cols+3,h:box.h/rows+3,vx:cos(angle)*random(3,7),vy:sin(angle)*random(2,6)-3,rot:0,spin:random(-.1,.1),life:75});
  }
  setTimeout(()=>againButton.classList.add("show"), 1700);
}

function updateAndDrawSlabs() {
  slabs.forEach(s=>{s.x+=s.vx;s.y+=s.vy;s.vy+=.16;s.rot+=s.spin;s.life--;push();translate(s.x,s.y);rotate(s.rot);noStroke();fill(151,224,243,map(s.life,0,75,0,205));rectMode(CENTER);rect(0,0,s.w,s.h,9);stroke(255,180);strokeWeight(2);line(-s.w*.35,-s.h*.3,s.w*.25,s.h*.3);pop();});
  slabs=slabs.filter(s=>s.life>0);
}

function updateAndDrawParticles() {
  particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=p.gravity;p.rot+=p.spin;p.life--;push();translate(p.x,p.y);rotate(p.rot);noStroke();fill(220,248,255,map(p.life,0,55,0,235));triangle(-p.size/2,p.size/2,0,-p.size/2,p.size/2,p.size/2);pop();});
  particles=particles.filter(p=>p.life>0);
}

function drawCelebration(box) {
  const age=millis()-revealStarted;
  if(age<1500 && frameCount%5===0) sparkles.push({a:random(TWO_PI),r:random(box.w*.25,box.w*.55),life:50,size:random(6,14)});
  sparkles.forEach(s=>{s.life--;s.r+=.35;const alpha=map(s.life,0,50,0,255);push();translate(box.x+cos(s.a)*s.r,box.y+sin(s.a)*s.r*.72);rotate(frameCount*.04+s.a);stroke(255,255,190,alpha);strokeWeight(3);line(-s.size,0,s.size,0);line(0,-s.size,0,s.size);pop();});
  sparkles=sparkles.filter(s=>s.life>0);
}

function ensureAudio() {
  if (!audioCtx) { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); masterGain=audioCtx.createGain(); masterGain.gain.value=.22; masterGain.connect(audioCtx.destination); }
  if(audioCtx.state === "suspended") audioCtx.resume();
}

function playHitSound(step) {
  if(!audioCtx) return;
  const now=audioCtx.currentTime, osc=audioCtx.createOscillator(), gain=audioCtx.createGain(), filter=audioCtx.createBiquadFilter();
  osc.type=step<3?"sine":step<BREAK_TAPS?"triangle":"square"; osc.frequency.setValueAtTime(240+step*58,now); osc.frequency.exponentialRampToValueAtTime(step===BREAK_TAPS?95:150,now+.13);
  filter.type="lowpass";filter.frequency.value=step===BREAK_TAPS?1700:1100;gain.gain.setValueAtTime(.001,now);gain.gain.exponentialRampToValueAtTime(step===BREAK_TAPS?.7:.38,now+.008);gain.gain.exponentialRampToValueAtTime(.001,now+(step===BREAK_TAPS?.45:.14));
  osc.connect(filter);filter.connect(gain);gain.connect(masterGain);osc.start(now);osc.stop(now+.5);
  if(step===BREAK_TAPS) for(let i=0;i<3;i++) chime(660+i*165,now+.14+i*.09);
}
function chime(freq, when){const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type="sine";o.frequency.value=freq;g.gain.setValueAtTime(.001,when);g.gain.exponentialRampToValueAtTime(.3,when+.015);g.gain.exponentialRampToValueAtTime(.001,when+.35);o.connect(g);g.connect(masterGain);o.start(when);o.stop(when+.38);}

function resetRound(forcedPicture = null) {
  const thisRound = ++roundId;
  hitCount=0;state="ice";shake=0;cracks=[];particles=[];sparkles=[];slabs=[];againButton.classList.remove("show");hint.classList.remove("hide");
  activePicture=null; activeCharacter=null;
  if(forcedPicture){chooseDefaultCharacter();loadPrizePicture(forcedPicture,thisRound);return;}
  const usePicture=savedImages.length>0&&random()<PICTURE_CHANCE;
  const prize=usePicture?{kind:"picture",src:random(savedImages)}:random(FAMILY_PRIZES);
  if(prize.kind==="picture"){chooseDefaultCharacter();loadPrizePicture(prize.src,thisRound);}
  else chooseCharacter(prize);
}

function loadPrizePicture(src, expectedRound){
  loadImage(src,img=>{if(roundId!==expectedRound)return;activePicture=img;activeCharacter=null;},()=>{if(roundId===expectedRound&&!activeCharacter)chooseDefaultCharacter();});
}

function chooseDefaultCharacter(){chooseCharacter(random(FAMILY_PRIZES));}
function chooseCharacter(prize){
  const o=FAMILY_OPTIONS[prize.type];
  activeCharacter=new FamilyMarpan({familyRole:prize.type,bodyScale:o.scale,eyeScale:o.eyeScale,accessoryColor:o.color,bodyColor:"#fff9ea"});
  activeCharacter.enableAutoBlink(2100,4200);
}

function wireControls() {
  againButton.addEventListener("click", e=>{e.stopPropagation();ensureAudio();chime(523.25,audioCtx.currentTime);resetRound();});
  document.querySelector("#image-input").addEventListener("change", importImages);
  document.querySelector("#photo-button").addEventListener("click",e=>e.stopPropagation());
  document.querySelector("#reset-photos").addEventListener("click",resetPictures);
}

function resetPictures(event){
  event.stopPropagation();
  if(!savedImages.length)return;
  if(!window.confirm("追加した写真をすべて消しますか？"))return;
  savedImages=[];
  try{localStorage.removeItem(SAVE_KEY);}catch(e){}
  syncResetButton();
  resetRound();
}

function importImages(event) {
  const files=[...event.target.files].slice(0,8); let pending=files.length, newest=null;
  if(!pending)return;
  files.forEach(file=>{if(!file.type.startsWith("image/")){if(!--pending&&newest)showNewPicture(newest);return;}const reader=new FileReader();reader.onload=()=>compressPicture(reader.result,data=>{savedImages.push(data);savedImages=savedImages.slice(-12);newest=data;if(!--pending){persistPictures();syncResetButton();showNewPicture(newest);}});reader.readAsDataURL(file);});
  event.target.value="";
}
function showNewPicture(src){resetRound(src);}
function compressPicture(src, done) {const img=new Image();img.onload=()=>{const scale=min(1,700/max(img.width,img.height)),c=document.createElement("canvas");c.width=max(1,round(img.width*scale));c.height=max(1,round(img.height*scale));c.getContext("2d").drawImage(img,0,0,c.width,c.height);done(c.toDataURL("image/jpeg",.82));};img.src=src;}
function loadPictures(){try{savedImages=JSON.parse(localStorage.getItem(SAVE_KEY))||[];}catch(e){savedImages=[];}syncResetButton();}
function persistPictures(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(savedImages));}catch(e){savedImages=savedImages.slice(-4);try{localStorage.setItem(SAVE_KEY,JSON.stringify(savedImages));}catch(_){} }}
function syncResetButton(){const button=document.querySelector("#reset-photos");if(button)button.disabled=savedImages.length===0;}
function isGamePointer(event) { return !event?.target?.closest?.("button, label, input"); }
function mousePressed(event) { if(isGamePointer(event) && !againButton.classList.contains("show")) hitIce(mouseX,mouseY); return false; }
function touchStarted(event) { if(isGamePointer(event) && !againButton.classList.contains("show")) hitIce(mouseX,mouseY); return false; }
function keyPressed(){if(key===' '||keyCode===ENTER)hitIce(width/2,height/2);if((key==='r'||key==='R')&&state==='revealed')resetRound();}
function windowResized(){resizeCanvas(windowWidth,windowHeight);}
function easeOutBack(x){const c=1.70158;return 1+(c+1)*pow(x-1,3)+c*pow(x-1,2);}

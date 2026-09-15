const TYPES = [
  { key: "counter", color: "#ef8d78", dark: "#a7554a", mark: "dots" },
  { key: "stove", color: "#e8b957", dark: "#986f26", mark: "stripe" },
  { key: "hands", color: "#79b8aa", dark: "#397a70", mark: "cross" },
  { key: "dishes", color: "#7fa9d8", dark: "#496f9b", mark: "wave" }
];

let towels = [], zones = {}, marpans = [], held = null, audio = null;
let cycleCount = 0, firstMove = false, nextDeliveryAt = 0, nextTowelId = 0;
const WASH_MS = 4200, DRY_MS = 5200, USE_MIN = 5200, USE_MAX = 9000;
const INITIAL_PER_TYPE = 7, DELIVERY_MS = 3600, MAX_TOWELS = 72, PILE_SLOTS = 30;

function setup() {
  const c = createCanvas(windowWidth, windowHeight); c.parent("sketch");
  pixelDensity(min(window.devicePixelRatio || 1, 2)); frameRate(60);
  layoutScene(); createTowels(); createMarpans(); nextDeliveryAt=millis()+DELIVERY_MS;
}

function layoutScene() {
  const sx = width / 1200, sy = height / 760;
  zones = {
    counter: makeBox(70, 112, 280, 155, sx, sy),
    stove: makeBox(420, 105, 220, 165, sx, sy),
    hands: makeBox(730, 105, 190, 170, sx, sy),
    dishes: makeBox(965, 110, 170, 165, sx, sy),
    washer: makeBox(72, 490, 210, 205, sx, sy),
    pile: makeBox(430, 355, 235, 170, sx, sy),
    line: makeBox(725, 350, 400, 160, sx, sy),
    shelf: makeBox(785, 565, 300, 120, sx, sy)
  };
  if (towels.length && !held) snapAllToHomes();
}

function makeBox(x,y,w,h,sx,sy) { return { x:x*sx, y:y*sy, w:w*sx, h:h*sy }; }

function createTowels() {
  towels = [];
  for (let type = 0; type < 4; type++) for (let n = 0; n < INITIAL_PER_TYPE; n++) {
    const towel=makeTowel(type); towel.queueSlot=firstOpenSlot(); towels.push(towel);
  }
  snapAllToHomes();
}

function makeTowel(type){return {id:nextTowelId++,type,state:"clean",x:0,y:0,angle:random(-.22,.22),placedAt:0,stateAt:millis(),queueSlot:null};}
function firstOpenSlot(){
  const occupied=new Set(towels.filter(t=>t.state==="clean"&&t.queueSlot!==null).map(t=>t.queueSlot));
  for(let i=0;i<PILE_SLOTS;i++)if(!occupied.has(i))return i;
  return null;
}
function fillOpenSlots(){
  const waiting=towels.filter(t=>t.state==="backlog").sort((a,b)=>a.stateAt-b.stateAt);
  while(waiting.length){const slot=firstOpenSlot();if(slot===null)break;const t=waiting.shift();t.state="clean";t.queueSlot=slot;t.stateAt=millis();snapTowel(t);playTon();}
}
function isCongested(){return towels.some(t=>t.state==="backlog");}

function createMarpans() {
  marpans = [
    { actor:new Marpan25D({maxSize:68, bodyColor:"#f5edd7", autoBlink:true}), phase:0, speed:.000075 },
    { actor:new Marpan25D({maxSize:58, bodyColor:"#e6d8bc", autoBlink:true}), phase:.43, speed:.000061 },
    { actor:new Marpan25D({maxSize:52, bodyColor:"#f1e7cd", autoBlink:true}), phase:.77, speed:.000083 }
  ];
}

function draw() {
  updateStates();
  drawRoom(); drawZones(); drawMarpans(); drawTowels(); drawInventory();
}

function drawRoom() {
  background("#f2ead9");
  noStroke(); fill("#e9dfca"); rect(0,0,width,height*.34);
  fill("#d8cbb2"); rect(0,height*.32,width,9);
  fill("#efe7d5"); rect(0,height*.34,width,height*.66);
  stroke(126,112,88,18); strokeWeight(1);
  const tile = max(46,min(width,height)*.09);
  for(let x=0;x<width;x+=tile) line(x,height*.34,x,height);
  for(let y=height*.34;y<height;y+=tile) line(0,y,width,y);
  noStroke(); fill(255,255,250,35); ellipse(width*.52,height*.56,width*.72,height*.52);
}

function drawZones() {
  drawCounter(zones.counter); drawStove(zones.stove); drawSink(zones.hands);
  drawDishes(zones.dishes); drawWasher(zones.washer); drawPile(zones.pile);
  drawLine(zones.line); drawShelf(zones.shelf);
}

function drawCounter(z){ furniture(z,TYPES[0].color); noStroke(); fill(255,205); rect(z.x+8,z.y+8,z.w-16,z.h*.42,8); symbolAt("dots",z.x+z.w*.5,z.y+z.h*.28,12); }
function drawStove(z){ furniture(z,TYPES[1].color); fill("#4d5552"); noStroke(); rect(z.x+8,z.y+8,z.w-16,z.h*.48,7); fill("#77807c"); for(let i=0;i<2;i++){circle(z.x+z.w*(.3+i*.4),z.y+z.h*.3,z.w*.22); fill("#343a38"); circle(z.x+z.w*(.3+i*.4),z.y+z.h*.3,z.w*.13); fill("#77807c");} symbolAt("stripe",z.x+z.w*.5,z.y+z.h*.77,12); }
function drawSink(z){ furniture(z,TYPES[2].color); noStroke(); fill("#dce5df"); ellipse(z.x+z.w*.5,z.y+z.h*.32,z.w*.72,z.h*.35); fill("#eef4f0"); ellipse(z.x+z.w*.5,z.y+z.h*.3,z.w*.58,z.h*.24); stroke("#778b83");strokeWeight(5);noFill();arc(z.x+z.w*.5,z.y+z.h*.12,z.w*.26,z.h*.26,PI,TWO_PI); noStroke(); symbolAt("cross",z.x+z.w*.5,z.y+z.h*.77,12); }
function drawDishes(z){ furniture(z,TYPES[3].color); stroke("#8e9c95");strokeWeight(3); for(let i=0;i<4;i++){fill("#f8f5e9");ellipse(z.x+z.w*(.28+i*.14),z.y+z.h*.32,z.w*.28,z.h*.35);} noStroke(); symbolAt("wave",z.x+z.w*.5,z.y+z.h*.78,12); }
function furniture(z,c){ noStroke(); fill(65,58,46,25); rect(z.x+5,z.y+8,z.w,z.h,10); fill(c); rect(z.x,z.y,z.w,z.h,10); fill(255,75); rect(z.x+7,z.y+7,z.w-14,5,3); }

function drawWasher(z){
  noStroke(); fill(58,55,48,22); rect(z.x+6,z.y+8,z.w,z.h,14); fill("#dfded6"); rect(z.x,z.y,z.w,z.h,14);
  fill("#b9bdb8"); rect(z.x+10,z.y+10,z.w-20,z.h*.18,6); fill("#fbf9ef");circle(z.x+z.w*.78,z.y+z.h*.095,8);
  const washing=towels.some(t=>t.state==="washing"); fill("#66736f"); circle(z.x+z.w*.5,z.y+z.h*.57,min(z.w,z.h)*.58); fill("#b8d1cd"); circle(z.x+z.w*.5,z.y+z.h*.57,min(z.w,z.h)*.43);
  if(washing){ push();translate(z.x+z.w*.5,z.y+z.h*.57);rotate(millis()*.004);noFill();stroke(255,180);strokeWeight(3);arc(0,0,z.w*.25,z.w*.18,0,PI*1.4);pop(); }
  tinyLabel("WASH",z.x+z.w*.5,z.y+z.h*.91);
}
function drawPile(z){ noStroke(); fill(105,80,54,16); ellipse(z.x+z.w*.5,z.y+z.h*.78,z.w*.8,z.h*.34); }
function drawLine(z){
  stroke("#8b7963");strokeWeight(4);line(z.x,z.y+z.h*.15,z.x,z.y+z.h);line(z.x+z.w,z.y+z.h*.15,z.x+z.w,z.y+z.h);strokeWeight(2);line(z.x,z.y+z.h*.25,z.x+z.w,z.y+z.h*.25);
  noStroke(); tinyLabel("AIR",z.x+z.w*.5,z.y+z.h*.92);
}
function drawShelf(z){
  noStroke(); fill("#b89970"); rect(z.x,z.y,z.w,z.h,8); fill("#ead9b8");rect(z.x+8,z.y+8,z.w-16,z.h-16,5);
  stroke("#b89970");strokeWeight(3); for(let i=1;i<4;i++) line(z.x+z.w*i/4,z.y+8,z.x+z.w*i/4,z.y+z.h-8);
  noStroke(); for(let i=0;i<4;i++) symbolAt(TYPES[i].mark,z.x+z.w*(i+.5)/4,z.y+z.h*.23,8);
}
function tinyLabel(s,x,y){ push();textAlign(CENTER,CENTER);textSize(constrain(width*.009,8,11));textStyle(BOLD);fill(80,77,68,115);noStroke();text(s,x,y);pop(); }

function drawTowels(){
  const sorted=towels.slice().sort((a,b)=>(a===held?1:0)-(b===held?1:0));
  for(const t of sorted){ if(t.state==="washing"||t.state==="backlog") continue; drawTowel(t); }
  drawBacklog();
}
function drawBacklog(){
  const waiting=towels.filter(t=>t.state==="backlog"), z=zones.pile;if(!waiting.length)return;
  const shown=waiting.slice(-8);shown.forEach((t,i)=>{const oldX=t.x,oldY=t.y;t.x=z.x+z.w*(.91+(i%2)*.035);t.y=z.y+z.h*(.26+i*.055);drawTowel(t);t.x=oldX;t.y=oldY;});
  push();textAlign(CENTER,CENTER);textFont("monospace");textStyle(BOLD);textSize(constrain(width*.013,11,15));fill(92,74,58,190);noStroke();text("WAIT +"+waiting.length,z.x+z.w*.94,z.y+z.h*.91);pop();
}
function drawTowel(t){
  const s=constrain(min(width,height)*.057,28,47), hanging=t.state==="drying";
  const flutter=hanging?sin(millis()*.003+t.id)*3:0;
  push();translate(t.x,t.y);rotate(held===t?sin(millis()*.012)*.04:t.angle*.35);
  noStroke();fill(55,45,36,25);rect(-s*.44+3,-s*.34+5,s*.88,s*.7,5);
  const c=color(TYPES[t.type].color); if(t.state==="dirty"){ c.setRed(red(c)*.72);c.setGreen(green(c)*.72);c.setBlue(blue(c)*.72); }
  fill(c); beginShape();vertex(-s*.45,-s*.36);vertex(s*.45,-s*.34);vertex(s*.43+flutter,s*.36);vertex(-s*.44+flutter*.35,s*.34);endShape(CLOSE);
  stroke(TYPES[t.type].dark);strokeWeight(max(1.5,s*.035));noFill();rect(-s*.45,-s*.36,s*.9,s*.7,4); drawMark(TYPES[t.type].mark,s);
  if(t.state==="dirty"){noStroke();fill(91,64,43,130);circle(s*.18,-s*.05,s*.11);circle(-s*.15,s*.18,s*.075);fill(190,222,218,180);ellipse(-s*.25,-s*.11,s*.10,s*.16);}
  if(t.state==="wet"){noStroke();fill(255,120);ellipse(-s*.2,-s*.1,s*.09,s*.16);ellipse(s*.2,s*.12,s*.07,s*.13);}
  if(held===t){noFill();stroke(255,210);strokeWeight(2);rect(-s*.5,-s*.41,s,s*.8,6);}
  pop();
}
function drawMark(mark,s){ push();stroke(TYPES.find(v=>v.mark===mark).dark);strokeWeight(max(1,s*.035));
  if(mark==="dots"){noStroke();fill(TYPES[0].dark);circle(-s*.14,0,s*.09);circle(s*.14,0,s*.09);}
  if(mark==="stripe") for(let x=-s*.22;x<=s*.22;x+=s*.18) line(x,-s*.24,x,s*.24);
  if(mark==="cross"){line(-s*.18,0,s*.18,0);line(0,-s*.18,0,s*.18);}
  if(mark==="wave"){noFill();beginShape();for(let x=-s*.3;x<=s*.3;x+=s*.04)vertex(x,sin(x/s*TWO_PI*2)*s*.07);endShape();} pop(); }
function symbolAt(mark,x,y,s){push();translate(x,y);drawMark(mark,s*2);pop();}

function updateStates(){
  const now=millis();
  let changed=false;
  for(const t of towels){
    if(t.state==="using"&&now-t.stateAt>t.useFor){t.state="dirty";t.stateAt=now;playWet();changed=true;}
    else if(t.state==="dirty"&&now-t.stateAt>1200){t.state="washing";t.stateAt=now;playWash();changed=true;}
    else if(t.state==="washing"&&now-t.stateAt>WASH_MS){t.state="drying";t.stateAt=now;playBell();changed=true;}
    else if(t.state==="drying"&&now-t.stateAt>DRY_MS){t.state="shelf";t.stateAt=now;playDry();changed=true;}
    else if(t.state==="shelf"&&now-t.stateAt>1900){const slot=firstOpenSlot();t.state=slot===null?"backlog":"clean";t.queueSlot=slot;t.stateAt=now;cycleCount++;playTon();changed=true;}
  }
  if(now>=nextDeliveryAt&&towels.length<MAX_TOWELS){
    const type=floor(random(4)), amount=towels.length<40?2:1;
    for(let i=0;i<amount&&towels.length<MAX_TOWELS;i++){const t=makeTowel((type+i)%4),slot=firstOpenSlot();t.queueSlot=slot;if(slot===null)t.state="backlog";towels.push(t);}
    nextDeliveryAt=now+DELIVERY_MS; changed=true; playPasa();
  }
  if(changed)snapAllToHomes();
}

function snapAllToHomes(){ for(const t of towels) if(t!==held) snapTowel(t); }
function snapTowel(t){
  let z=zones.pile;
  if(t.state==="using"||t.state==="dirty") z=zones[TYPES[t.type].key];
  else if(t.state==="drying"||t.state==="dry") z=zones.line;
  else if(t.state==="shelf") z=zones.shelf;
  else if(t.state==="wet") z=zones.washer;
  const peers=towels.filter(o=>o!==t && o.state===t.state && (t.state!=="using"&&t.state!=="dirty"||o.type===t.type));
  const i=peers.filter(o=>o.id<t.id).length;
  if(t.state==="clean"){
    const slot=t.queueSlot===null?0:t.queueSlot;
    t.x=z.x+z.w*(.12+(slot%6)*.152);t.y=z.y+z.h*(.20+floor(slot/6)*.16);t.angle=sin(t.id*2.1)*.13;
  }
  else if(t.state==="drying"||t.state==="dry"){ t.x=z.x+z.w*(.12+(i%6)*.15);t.y=z.y+z.h*.46+(i>5?z.h*.25:0);t.angle=0; }
  else if(t.state==="shelf"){t.x=z.x+z.w*(t.type+.5)/4;t.y=z.y+z.h*(.48+(i%3)*.16);t.angle=0;}
  else { t.x=z.x+z.w*(.32+(i%3)*.18)+sin(t.id)*5;t.y=z.y+z.h*(.46+(floor(i/3)%2)*.18)+cos(t.id)*4; }
}
function arrangeWet(){ }

function drawMarpans(){
  const path=[zones.shelf,zones.counter,zones.washer,zones.line,zones.pile];
  const clock=millis();
  marpans.forEach((m,i)=>{
    const p=(clock*m.speed+m.phase)%1, seg=floor(p*path.length), u=(p*path.length)%1;
    const a=path[seg],b=path[(seg+1)%path.length]; let x=lerp(a.x+a.w*.5,b.x+b.w*.5,u),y=lerp(a.y+a.h+32,b.y+b.h+32,u);
    y+=abs(sin(millis()*.008+i))*4; m.actor.maxSize=constrain(min(width,height)*(.07-i*.006),38,66);m.actor.setPosition(x,y);m.actor.lookAt(b.x+b.w*.5,b.y+b.h*.5);
    noStroke();fill(65,50,35,20);ellipse(x+4,y+m.actor.maxSize*.35,m.actor.maxSize*.72,10);m.actor.draw({bodyWidth:m.actor.maxSize,scaleX:1+sin(millis()*.01+i)*.025});
    if(i<2){push();translate(x,y-m.actor.maxSize*.38);rotate(sin(clock*.009+i)*.08);const fake={type:(i+floor(clock/7000))%4,state:"clean",x:0,y:0,angle:0,id:i};drawTowel(fake);pop();}
  });
}

function drawInventory(){
  const counts={CLEAN:0,USING:0,DIRTY:0,WASHING:0,DRYING:0};
  towels.forEach(t=>{ if(t.state==="clean"||t.state==="backlog"||t.state==="shelf"||t.state==="dry")counts.CLEAN++; else if(t.state==="using")counts.USING++; else if(t.state==="dirty")counts.DIRTY++; else if(t.state==="washing"||t.state==="wet")counts.WASHING++; else if(t.state==="drying")counts.DRYING++; });
  const x=width-132,y=18,w=114,h=112; noStroke();fill(255,252,243,205);rect(x,y,w,h,8);stroke(75,72,65,25);noFill();rect(x,y,w,h,8);
  noStroke();textFont("monospace");textSize(10);textAlign(LEFT,CENTER);let row=0;
  Object.entries(counts).forEach(([k,v])=>{fill(75,78,71,140);text(k,x+12,y+19+row*19);fill(62,65,59,205);textAlign(RIGHT,CENTER);text(nf(v,2),x+w-12,y+19+row*19);textAlign(LEFT,CENTER);row++;});
}

function pick(px,py){
  startAudio();
  for(let i=towels.length-1;i>=0;i--){const t=towels[i];if(t.state==="clean"&&dist(px,py,t.x,t.y)<45){held=t;playSoft(220,.06,.13);if(!firstMove){firstMove=true;document.getElementById("hint").classList.add("hidden");}return false;}}
  return false;
}
function release(px,py){
  if(!held)return false; const t=held;held=null;let accepted=false;
  const useZone=zones[TYPES[t.type].key];
  if(t.state==="clean"&&inside(px,py,useZone)){t.state="using";t.queueSlot=null;t.stateAt=millis();t.useFor=random(USE_MIN,USE_MAX);accepted=true;playFusa();fillOpenSlots();}
  if(!accepted)playSoft(90,.09,.08,"triangle");snapTowel(t);return false;
}
function inside(x,y,z){return x>z.x&&x<z.x+z.w&&y>z.y&&y<z.y+z.h;}
function mousePressed(){return pick(mouseX,mouseY);} function mouseDragged(){if(held){held.x=mouseX;held.y=mouseY;}return false;} function mouseReleased(){return release(mouseX,mouseY);}
function touchStarted(){return pick(mouseX,mouseY);} function touchMoved(){if(held){held.x=mouseX;held.y=mouseY;}return false;} function touchEnded(){return release(mouseX,mouseY);}

function startAudio(){if(audio){if(audio.state==="suspended")audio.resume();return;}const AC=window.AudioContext||window.webkitAudioContext;if(audio===null&&AC)audio=new AC();}
function playSoft(freq,dur,vol,type="sine",end=freq){if(!audio)return;const n=audio.currentTime,o=audio.createOscillator(),g=audio.createGain(),f=audio.createBiquadFilter();o.type=type;o.frequency.setValueAtTime(freq,n);o.frequency.exponentialRampToValueAtTime(max(1,end),n+dur);f.type="lowpass";f.frequency.value=900;g.gain.setValueAtTime(vol,n);g.gain.exponentialRampToValueAtTime(.0001,n+dur);o.connect(f);f.connect(g);g.connect(audio.destination);o.start(n);o.stop(n+dur);}
function playFusa(){playSoft(150,.13,.11,"triangle",72);} function playWet(){playSoft(105,.16,.12,"sine",55);} function playPasa(){playSoft(310,.11,.08,"triangle",190);} function playTon(){playSoft(230,.08,.10,"triangle",150);} function playDry(){playSoft(720,.16,.055,"sine",980);} function playBell(){playSoft(660,.2,.08);setTimeout(()=>playSoft(990,.25,.06),100);} function playWash(){playSoft(58,.7,.06,"sawtooth",44);setTimeout(()=>playSoft(74,.65,.05,"sawtooth",50),350);}
function windowResized(){resizeCanvas(windowWidth,windowHeight);layoutScene();marpans.forEach(m=>m.actor.maxSize=60);}

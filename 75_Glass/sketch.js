"use strict";

const PAPER = "#eee9df", INK = "#202522", LIQUID = "#f2dfa0";
let host, canvasEl, marpan, holding=false, liquid=0, ice=[], falling=[], spills=[], puddles=[];
let wave=0, wavePhase=0, lastIceAt=0, lastDropAt=0, overflow=0, audio=null, blinkAt=1800;
let G={};

function setup(){
  host=document.getElementById("sketch");
  const c=createCanvas(host.clientWidth,host.clientHeight); c.parent(host); canvasEl=c.elt;
  pixelDensity(min(devicePixelRatio||1,2)); frameRate(60); strokeJoin(ROUND); strokeCap(ROUND);
  c.elt.setAttribute("role","application"); c.elt.setAttribute("aria-label","押している間、マーパンの頭へ液体と氷を注ぎます");
  marpan={blink:0}; layout(); bind();
}

function layout(){
  const compact=width<600, bw=min(width*(compact?.74:.46),height*(compact?.58:.62),560);
  G={cx:width/2,cy:height*(compact?.57:.59),bw,bh:bw*.76};
  G.top=G.cy-G.bh*.5; G.bottom=G.cy+G.bh*.5; G.openW=bw*.34; G.openH=bw*.062;
  G.innerTop=G.top+G.openH*.15; G.innerBottom=G.bottom-bw*.038; G.floor=min(height-10,G.bottom+bw*.21);
  ice.forEach(i=>{i.x=constrain(i.x,G.cx-G.bw*.38,G.cx+G.bw*.38);i.y=min(i.y,G.innerBottom-i.r)});
}

function bind(){
  const down=e=>{if(e.target.id==="reset")return; holding=true; document.body.classList.add("pouring"); startAudio(); burst(); e.preventDefault()};
  const up=()=>{holding=false;document.body.classList.remove("pouring")};
  canvasEl.addEventListener("pointerdown",down,{passive:false}); window.addEventListener("pointerup",up);window.addEventListener("pointercancel",up);window.addEventListener("blur",up);
  document.getElementById("reset").onclick=resetWork;
}

function draw(){
  background(PAPER); updateScene(); drawBackdrop(); drawStream(); drawGlass(); drawOutsideIce(); drawSpill(); drawForegroundGlass();
}

function updateScene(){
  const dt=min(deltaTime,34)/16.67;
  if(holding){
    liquid+=0.0032*dt;
    if(millis()-lastIceAt>random(160,300)){spawnIce();lastIceAt=millis()}
    if(millis()-lastDropAt>40){wave=min(1.8,wave+.025);lastDropAt=millis()}
  }
  wave*=pow(.968,dt);wavePhase+=.075*dt;
  updateFalling(dt); settleIce(dt);
  const fill=fillRatio(); overflow=max(0,fill-1);
  if(overflow>0){
    liquid=max(0,liquid-.00082*dt);
    const count=overflow>.18?2:frameCount%3===0?1:0;
    for(let n=0;n<count;n++)makeSpill(overflow);
    if(frameCount%18===0&&ice.length>16) ejectIce();
  }
  spills.forEach(s=>{s.vy+=.18*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;if(s.y>G.floor){puddles.push({x:s.x,y:G.floor,w:random(12,34)*(1+overflow*2),a:170});s.life=0;softPlop()}});
  spills=spills.filter(s=>s.life>0&&s.y<height+40); puddles.forEach(p=>{p.w+=.08*dt;p.a=max(24,p.a-.045*dt)}); if(puddles.length>120)puddles.splice(0,2);
  if(millis()>blinkAt){marpan.blink=1;blinkAt=millis()+random(1800,3800)} marpan.blink*=.84;
}

function fillRatio(){
  const displaced=ice.reduce((sum,i)=>sum+(i.inside?i.volume:0),0);
  return liquid+displaced;
}
function surfaceY(){return lerp(G.innerBottom,G.innerTop,constrain(fillRatio(),0,1))}

function spawnIce(){
  const types=["square","circle","triangle","bar","poly"],type=random(types),size=random()<.18?random(.065,.095):random(.032,.065);
  falling.push({type,r:G.bw*size,x:G.cx+random(-G.openW*.26,G.openW*.26),y:-G.bw*.08,vy:random(2.2,4),vx:random(-.35,.35),rot:random(TWO_PI),spin:random(-.055,.055),inside:false,hit:false,points:floor(random(5,8)),volume:size*size*4});
  tink();
}

function updateFalling(dt){
  const sy=surfaceY();
  falling.forEach(i=>{
    i.vy+=.16*dt;i.x+=i.vx*dt;i.y+=i.vy*dt;i.rot+=i.spin*dt;
    if(!i.hit&&i.y+i.r>sy&&i.y>G.innerTop){i.hit=true;wave=min(2,wave+.5+i.r/G.bw*4);i.vy*=.32;splash(i.x,sy,i.r);plop(i.r)}
    if(i.y>G.innerBottom-i.r){i.y=G.innerBottom-i.r;i.vy*=-.14;i.vx*=.75;i.inside=true;ice.push(i)}
  });
  falling=falling.filter(i=>!i.inside&&i.y<height+80);
}

function settleIce(dt){
  const sy=surfaceY(),left=G.cx-G.bw*.40,right=G.cx+G.bw*.40;
  ice.forEach((a,idx)=>{
    const buoyant=a.y>sy+a.r*.15; a.vy+=(buoyant?-.055:.085)*dt; a.vy*=.91; a.vx*=.94;
    a.y+=a.vy*dt;a.x+=a.vx*dt;a.rot+=a.spin*.25*dt;
    if(a.y+a.r>G.innerBottom){a.y=G.innerBottom-a.r;a.vy*=-.12}
    if(a.x-a.r<left){a.x=left+a.r;a.vx=abs(a.vx)*.35}if(a.x+a.r>right){a.x=right-a.r;a.vx=-abs(a.vx)*.35}
    for(let j=idx+1;j<ice.length;j++){const b=ice[j],dx=b.x-a.x,dy=b.y-a.y,d=sqrt(dx*dx+dy*dy),minD=(a.r+b.r)*.72;if(d>0&&d<minD){const push=(minD-d)*.055;a.vx-=dx/d*push;b.vx+=dx/d*push;a.vy-=dy/d*push;b.vy+=dy/d*push}}
  });
}

function burst(){liquid+=.012;wave=1.1;if(millis()-lastIceAt>120){spawnIce();lastIceAt=millis()}}
function splash(x,y,r){for(let n=0;n<4;n++)spills.push({x:x+random(-r,r),y, vx:random(-1.7,1.7),vy:random(-3.4,-1.1),life:random(20,40),tiny:true})}
function makeSpill(power){const side=random()<.5?-1:1,edge=G.cx+side*G.openW*.43;spills.push({x:edge+random(-7,7),y:G.top+random(0,6),vx:side*random(.35,1.2)*(1+power*3),vy:random(.3,1.8),life:180,tiny:false})}
function ejectIce(){const i=ice.shift();if(!i)return;i.inside=false;i.x=G.cx+random([-1,1])*G.openW*.43;i.y=G.top;i.vx=(i.x<G.cx?-1:1)*random(1.4,3);i.vy=random(-4,-1);i.life=220;falling.push(i);tink()}

function drawBackdrop(){
  noStroke();fill(32,37,34,12);ellipse(G.cx,G.floor+4,G.bw*.92,G.bw*.09);
  stroke(32,37,34,22);strokeWeight(1);line(width*.08,G.floor,width*.92,G.floor);
}

function bodyPath(closeTop=true){
  const lip=G.openW*.48,lipY=G.top+G.openH*.06;
  beginShape();vertex(G.cx+lip,lipY);bezierVertex(G.cx+G.bw*.34,G.top+G.openH*.35,G.cx+G.bw*.5,G.cy-G.bh*.25,G.cx+G.bw*.48,G.cy+G.bh*.2);bezierVertex(G.cx+G.bw*.46,G.bottom-G.bh*.04,G.cx+G.bw*.25,G.bottom,G.cx,G.bottom);bezierVertex(G.cx-G.bw*.25,G.bottom,G.cx-G.bw*.46,G.bottom-G.bh*.04,G.cx-G.bw*.48,G.cy+G.bh*.2);bezierVertex(G.cx-G.bw*.5,G.cy-G.bh*.25,G.cx-G.bw*.34,G.top+G.openH*.35,G.cx-lip,lipY);if(closeTop)endShape(CLOSE);else endShape();
}
function clipBody(){const c=drawingContext,lip=G.openW*.48,lipY=G.top+G.openH*.06;c.save();c.beginPath();c.moveTo(G.cx+lip,lipY);c.bezierCurveTo(G.cx+G.bw*.34,G.top+G.openH*.35,G.cx+G.bw*.5,G.cy-G.bh*.25,G.cx+G.bw*.48,G.cy+G.bh*.2);c.bezierCurveTo(G.cx+G.bw*.46,G.bottom-G.bh*.04,G.cx+G.bw*.25,G.bottom,G.cx,G.bottom);c.bezierCurveTo(G.cx-G.bw*.25,G.bottom,G.cx-G.bw*.46,G.bottom-G.bh*.04,G.cx-G.bw*.48,G.cy+G.bh*.2);c.bezierCurveTo(G.cx-G.bw*.5,G.cy-G.bh*.25,G.cx-G.bw*.34,G.top+G.openH*.35,G.cx-lip,lipY);c.closePath();c.clip()}

function drawGlass(){
  noStroke();fill(255,255,255,62);bodyPath();clipBody();
  const sy=surfaceY(),amp=G.bw*.008*wave;
  if(fillRatio()>.002){noStroke();fill(255,235,150,92);beginShape();vertex(G.cx-G.bw*.55,G.bottom+5);vertex(G.cx-G.bw*.55,sy);for(let x=G.cx-G.bw*.55;x<=G.cx+G.bw*.55;x+=9)vertex(x,sy+sin(x*.033+wavePhase)*amp+sin(x*.071-wavePhase*.7)*amp*.4);vertex(G.cx+G.bw*.55,G.bottom+5);endShape(CLOSE);fill(255,255,242,120);ellipse(G.cx,sy,G.bw*.88,max(3,G.openH*.22+amp));noFill();stroke(220,191,105,105);strokeWeight(max(1.2,G.bw*.003));arc(G.cx,sy,G.bw*.86,max(4,G.openH*.2+amp),0,PI)}
  [...ice,...falling.filter(i=>i.y>G.innerTop)].forEach(drawIce);
  drawingContext.restore();
}

function drawForegroundGlass(){
  noFill();stroke(INK);strokeWeight(max(4,G.bw*.011));bodyPath(false);
  noStroke();fill(255,255,255,34);beginShape();vertex(G.cx-G.bw*.37,G.cy-G.bh*.26);bezierVertex(G.cx-G.bw*.44,G.cy,G.cx-G.bw*.4,G.cy+G.bh*.25,G.cx-G.bw*.27,G.bottom-G.bh*.08);vertex(G.cx-G.bw*.21,G.bottom-G.bh*.105);bezierVertex(G.cx-G.bw*.34,G.cy+G.bh*.15,G.cx-G.bw*.35,G.cy-G.bh*.08,G.cx-G.bw*.28,G.cy-G.bh*.3);endShape(CLOSE);
  drawEyes();
  noFill();stroke(INK);strokeWeight(max(4,G.bw*.009));ellipse(G.cx,G.top+G.openH*.07,G.openW,G.openH);
  stroke(255,255,255,185);strokeWeight(max(1.5,G.bw*.004));arc(G.cx,G.top+G.openH*.045,G.openW*.88,G.openH*.55,PI+.14,TWO_PI-.14);
}

function drawEyes(){
  const ey=G.cy-G.bh*.015,ew=G.bw*.145,eh=ew*1.08,gap=G.bw*.19;
  const fullness=constrain(fillRatio(),0,1.35),lookY=map(fullness,0,1.35,-eh*.08,eh*.16),close=marpan.blink>0.08?sin(marpan.blink*PI):0;
  [-1,0,1].forEach((q,k)=>{push();translate(G.cx+q*gap,ey);scale(1,lerp(1,.06,close));stroke(INK);strokeWeight(max(2,ew*.045));fill(255,245);ellipse(0,0,ew,eh);if(close<.72){const uneasy=max(0,(fullness-.62)/.55),px=sin(millis()*.002+k)*ew*.035*uneasy;noStroke();fill(INK);ellipse(px,lookY,ew*lerp(.34,.22,uneasy),ew*lerp(.34,.22,uneasy));fill(255,210);circle(px-ew*.045,lookY-ew*.045,max(2,ew*.055))}pop()});
}

function drawIce(i){push();translate(i.x,i.y);rotate(i.rot);stroke(103,145,154,190);strokeWeight(max(1.4,i.r*.07));fill(220,243,244,190);if(i.type==="circle")ellipse(0,0,i.r*1.7,i.r*1.7);else if(i.type==="triangle")triangle(0,-i.r,i.r*.92,i.r*.75,-i.r*.92,i.r*.75);else if(i.type==="bar")rectMode(CENTER),rect(0,0,i.r*.75,i.r*2.3,i.r*.2),rectMode(CORNER);else if(i.type==="poly"){beginShape();for(let n=0;n<i.points;n++){const a=TWO_PI*n/i.points,rr=i.r*(.7+.28*sin(n*4.7+i.rot));vertex(cos(a)*rr,sin(a)*rr)}endShape(CLOSE)}else{rectMode(CENTER);rect(0,0,i.r*1.65,i.r*1.65,i.r*.17);rectMode(CORNER)}noFill();stroke(255,255,255,165);strokeWeight(max(1,i.r*.055));line(-i.r*.45,-i.r*.42,i.r*.1,-i.r*.58);pop()}
function drawOutsideIce(){falling.filter(i=>i.y<G.innerTop||i.x<G.cx-G.bw*.48||i.x>G.cx+G.bw*.48).forEach(drawIce)}

function drawStream(){
  if(!holding)return;const streamW=constrain(G.bw*.052,16,30),top=-20,bottom=G.top-G.openH*.12;
  noStroke();fill(255,235,150,125);beginShape();vertex(G.cx-streamW*.35,top);vertex(G.cx+streamW*.5,top);vertex(G.cx+streamW*.37+sin(millis()*.012)*2,bottom);vertex(G.cx-streamW*.5+sin(millis()*.009)*2,bottom);endShape(CLOSE);
  stroke(255,255,247,210);strokeWeight(2.5);line(G.cx-streamW*.12,0,G.cx-streamW*.18,bottom);
}
function drawSpill(){
  noStroke();spills.forEach(s=>{fill(255,235,150,s.tiny?95:125);if(s.tiny)circle(s.x,s.y,s.tiny?4:7);else ellipse(s.x,s.y,constrain(5+abs(s.vy)*1.2,5,13),constrain(9+abs(s.vy)*2,10,24))});
  puddles.forEach(p=>{fill(255,235,150,min(92,p.a));ellipse(p.x,p.y,p.w,p.w*.18)});
  if(overflow>0){const amt=constrain(overflow*3,0,1);fill(255,235,150,120);const w=G.openW*(.58+amt*.32);arc(G.cx,G.top+G.openH*.08,w,G.openH*.7,0,PI,CHORD)}
}

function startAudio(){if(audio){audio.ctx.resume();return}const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const ctx=new AC(),gain=ctx.createGain();gain.gain.value=.22;gain.connect(ctx.destination);audio={ctx,gain}}
function tone(f,d=.08,v=.05,type="sine"){if(!audio)return;const o=audio.ctx.createOscillator(),g=audio.ctx.createGain(),t=audio.ctx.currentTime;o.type=type;o.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(audio.gain);o.start(t);o.stop(t+d+.02)}
function tink(){tone(random(850,1350),.13,.055,"triangle")}function plop(r){tone(map(r,8,45,330,105),.11,.06,"sine")}function softPlop(){if(frameCount%8===0)tone(random(90,150),.07,.025,"sine")}
function resetWork(){holding=false;liquid=0;ice=[];falling=[];spills=[];puddles=[];wave=0;overflow=0;document.body.classList.remove("pouring")}
function windowResized(){resizeCanvas(host.clientWidth,host.clientHeight);layout()}

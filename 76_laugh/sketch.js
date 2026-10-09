"use strict";

const PAPER="#f7f6f2", INK="#20211f", RED="#e43b35";
const START_LEVELS=[.67,.50,.31,.07];
let host, canvasElement, beings=[], graph={}, pulse=null, reducedMotion=false;
let roller={started:-9999,direction:1};

function setup(){
  host=document.getElementById("sketch");
  const c=createCanvas(host.clientWidth,host.clientHeight); c.parent(host); canvasElement=c.elt;
  pixelDensity(min(devicePixelRatio||1,2)); frameRate(60); strokeCap(ROUND); strokeJoin(ROUND);
  reducedMotion=matchMedia("(prefers-reduced-motion: reduce)").matches;
  canvasElement.setAttribute("role","application");
  canvasElement.setAttribute("aria-label","異なる感情の高さにいる4体のマーパン。画面を押すと全員が同じ量だけ上昇し、赤い線を越えたマーパンが笑います。");
  makeScene();
  canvasElement.addEventListener("pointerdown",stimulate,{passive:false});
  document.getElementById("reset").addEventListener("click",e=>{e.stopPropagation();makeScene();});
  addEventListener("keydown",e=>{if(e.code==="Space"||e.code==="Enter"){e.preventDefault();stimulate(e)}});
}

function computeGraph(){
  const mobile=width<620;
  const left=mobile?52:max(76,width*.105), right=mobile?width-22:width*.92;
  const top=mobile?constrain(height*.23,132,178):constrain(height*.245,150,215);
  const bottom=mobile?height-54:height*.91;
  graph={left,right,top,bottom,w:right-left,h:bottom-top,threshold:.72};
  graph.thresholdY=levelY(graph.threshold);
}

function makeScene(){
  computeGraph(); pulse=null; roller={started:-9999,direction:1};
  const xs=width<620?[.16,.43,.69,.9]:[.16,.42,.67,.89];
  beings=START_LEVELS.map((level,i)=>({
    xNorm:xs[i], level, target:level, shown:level, velocity:0,
    crossed:level>=graph.threshold, crossAt:level>=graph.threshold?millis()-3000:-1,
    phase:i*1.71+.4, blink:0, nextBlink:millis()+1200+i*520
  }));
}

function draw(){
  background(PAPER); drawGraph(); updatePulse(); drawRoller();
  beings.forEach((b,i)=>{updateBeing(b);drawGuide(b);drawMarpan(b,i)});
  drawGestureHint();
}

function drawGraph(){
  const sw=max(1.35,min(width,height)*.0022);
  stroke(INK); strokeWeight(sw); noFill();
  line(graph.left,graph.top,graph.left,graph.bottom);
  line(graph.left,graph.bottom,graph.right,graph.bottom);
  const a=min(8,graph.h*.018);
  line(graph.left,graph.top,graph.left-a*.55,graph.top+a); line(graph.left,graph.top,graph.left+a*.55,graph.top+a);
  line(graph.right,graph.bottom,graph.right-a,graph.bottom-a*.55); line(graph.right,graph.bottom,graph.right-a,graph.bottom+a*.55);
  stroke(RED); strokeWeight(max(2,sw*1.25));
  line(graph.left,graph.thresholdY,graph.right,graph.thresholdY);
  noStroke(); fill(INK); circle(graph.left,graph.bottom,4);
  for(let i=1;i<5;i++){const y=lerp(graph.bottom,graph.top,i/5);fill(32,33,31,45);rect(graph.left-3,y-.5,6,1)}
}

function stimulate(event){
  if(event&&event.target&&event.target.id==="reset")return;
  if(event&&event.preventDefault)event.preventDefault();
  const amount=.115;
  beings.forEach(b=>{
    b.target=min(1.04,b.target+amount);
    b.velocity-=reducedMotion?0:.0035;
  });
  roller.direction*=-1;
  roller.started=millis();
  pulse={started:millis(),amount};
}

function drawRoller(){
  const duration=reducedMotion?500:1050;
  const age=millis()-roller.started, active=age>=0&&age<duration;
  const t=active?constrain(age/duration,0,1):0;
  const outAndBack=.5-.5*cos(TWO_PI*t);
  const size=constrain(min(graph.w*.105,graph.top*.42),48,78);
  const travel=min(graph.w*.105,105)*roller.direction;
  const cx=(graph.left+graph.right)*.5+(active?travel*outAndBack:0);
  const floorY=graph.top-size*.42-18;
  const hop=active?sin(PI*t)*size*.1:0;
  const rotation=active?roller.direction*TWO_PI*t:0;

  noStroke();fill(32,33,31,18);
  ellipse(cx,floorY+size*.37,size*(active?1.05:.86),size*.1);
  stroke(32,33,31,38);strokeWeight(1);
  line(cx-size*.72,floorY+size*.34,cx+size*.72,floorY+size*.34);

  push();translate(cx,floorY-hop);rotate(rotation);
  if(active){const squash=sin(PI*t)*.055;scale(1+squash,1-squash);}
  drawBody(size,size*.69,false,false,{blink:0},0,"#f2c94c");
  pop();

  if(active){
    const fade=sin(PI*t), tail=cx-roller.direction*size*.7;
    noFill();stroke(242,201,76,120*fade);strokeWeight(max(1.2,size*.018));
    arc(tail,floorY-size*.05,size*.28,size*.28,-HALF_PI,HALF_PI);
    arc(tail-roller.direction*size*.15,floorY+size*.08,size*.17,size*.17,-HALF_PI,HALF_PI);
  }
}

function updateBeing(b){
  if(reducedMotion){b.shown=lerp(b.shown,b.target,.22);}
  else{
    const force=(b.target-b.shown)*.055;
    b.velocity=(b.velocity+force)*.8;
    b.shown+=b.velocity;
  }
  if(!b.crossed&&b.shown>=graph.threshold){b.crossed=true;b.crossAt=millis();}
  if(millis()>b.nextBlink){b.blink=1;b.nextBlink=millis()+random(2300,4300);}
  b.blink*=.82;
}

function updatePulse(){
  if(!pulse)return;
  const age=millis()-pulse.started, t=constrain(age/850,0,1), e=1-pow(1-t,3);
  const y=lerp(graph.bottom,graph.top,e*.88);
  noFill(); stroke(228,59,53,55*(1-t)); strokeWeight(1.5);
  line(graph.left+2,y,graph.right,y);
  if(t>=1)pulse=null;
}

function drawGuide(b){
  const x=graph.left+graph.w*b.xNorm, y=levelY(b.shown), targetY=levelY(b.target);
  if(abs(targetY-y)>1){
    stroke(228,59,53,55);strokeWeight(1);line(x,targetY,x,y);
  }
  noStroke();fill(32,33,31,24);circle(x,graph.bottom,4);
}

function drawMarpan(b,index){
  const baseSize=constrain(min(graph.w*.14,graph.h*.145),54,105);
  const now=millis(), laughing=b.crossed&&now-b.crossAt<6800;
  const calmHappy=b.crossed&&!laughing;
  const energy=laughing?constrain((now-b.crossAt)/420,0,1):0;
  const tempo=now*.013+b.phase;
  const bounce=laughing?abs(sin(tempo))*baseSize*.075*energy:sin(now*.001+b.phase)*.7;
  const sway=laughing?sin(tempo*.73)*.075*energy:0;
  const x=graph.left+graph.w*b.xNorm;
  const rawY=levelY(b.shown), y=constrain(rawY,graph.top+baseSize*.55,graph.bottom-baseSize*.42)-bounce;
  push();translate(x,y);rotate(sway);
  drawBody(baseSize,baseSize*.69,laughing,calmHappy,b,tempo,"#ffffff");
  pop();
  if(laughing&&energy>.35)drawJoyMarks(x,y,baseSize,tempo,energy);
}

function drawBody(w,h,laughing,happy,b,tempo,bodyColor="#ffffff"){
  const squash=laughing?sin(tempo*2)*.035:0;
  push();scale(1+squash,1-squash);
  stroke(INK);strokeWeight(max(2.4,w*.034));fill(bodyColor);strokeJoin(ROUND);
  beginShape();
  vertex(0,-h*.5);bezierVertex(w*.27,-h*.5,w*.5,-h*.24,w*.48,h*.18);
  bezierVertex(w*.46,h*.46,w*.25,h*.5,0,h*.5);
  bezierVertex(-w*.25,h*.5,-w*.46,h*.46,-w*.48,h*.18);
  bezierVertex(-w*.5,-h*.24,-w*.27,-h*.5,0,-h*.5);endShape(CLOSE);
  drawEyes(w,h,laughing,happy,b,tempo);pop();
}

function drawEyes(w,h,laughing,happy,b,tempo){
  const eyeW=w*.185, eyeH=eyeW*1.05, gap=w*.225, y=-h*.035;
  [-1,0,1].forEach((p,i)=>{
    const ex=p*gap, joy=laughing||happy;
    stroke(INK);strokeWeight(max(1.7,w*.022));noFill();
    if(joy){
      const bob=laughing?sin(tempo+i*.55)*eyeH*.025:0;
      arc(ex,y+eyeH*.1+bob,eyeW,eyeH*.62,PI+.2,TWO_PI-.2);
    }else{
      const blink=sin(b.blink*PI), sy=lerp(1,.08,blink);
      push();translate(ex,y);scale(1,sy);fill(255);ellipse(0,0,eyeW,eyeH);
      noStroke();fill(INK);circle(0,eyeH*.08,eyeW*.3);pop();
    }
  });
}

function drawJoyMarks(x,y,s,t,e){
  push();translate(x,y);stroke(RED);strokeWeight(max(1.2,s*.014));noFill();
  const a=110+70*sin(t*.8);
  drawingContext.globalAlpha=.18+.12*e;
  arc(-s*.52,-s*.2,s*.2,s*.22,HALF_PI,PI+HALF_PI);
  arc(s*.52,-s*.2,s*.2,s*.22,-HALF_PI,HALF_PI);
  drawingContext.globalAlpha=1;pop();
}

function drawGestureHint(){
  if(frameCount>300||pulse||beings.some(b=>b.target>b.level))return;
  const t=millis()*.004,a=map(sin(t),-1,1,22,48),r=7+map(sin(t),-1,1,0,6);
  noFill();stroke(32,33,31,a);strokeWeight(1);circle(graph.right-18,graph.top+17,r);
}

function levelY(level){return lerp(graph.bottom,graph.top,level);}

function windowResized(){
  const old=beings.map(b=>({level:b.level,target:b.target,shown:b.shown,velocity:b.velocity,crossed:b.crossed,crossAt:b.crossAt,phase:b.phase,blink:b.blink,nextBlink:b.nextBlink}));
  resizeCanvas(host.clientWidth,host.clientHeight);computeGraph();
  beings.forEach((b,i)=>Object.assign(b,old[i]));
}

"use strict";

const TYPES={
  beam:{label:"桁橋",tag:"まっすぐ、じっと支える",capacity:11.5,stiff:1.15,color:"#4f6f79"},
  truss:{label:"トラス橋",tag:"三角形へ力を分ける",capacity:16.5,stiff:.68,color:"#d36e4b"},
  arch:{label:"アーチ橋",tag:"弧を通って両岸へ",capacity:18,stiff:.6,color:"#a45e49"},
  cable:{label:"斜張橋",tag:"ケーブルから塔へ",capacity:15.5,stiff:.72,color:"#486f72"},
  throughArch:{label:"スルーアーチ橋",tag:"上の弧から両岸へ",capacity:17.2,stiff:.56,color:"#93634e"},
  warren:{label:"ワーレントラス橋",tag:"連続する三角形へ",capacity:18.5,stiff:.5,color:"#c76949"},
  frame:{label:"ラーメン橋",tag:"桁と橋脚が一体で抵抗",capacity:14.5,stiff:.78,color:"#597078"},
  cantilever:{label:"カンチレバー橋",tag:"両側から中央へ張り出す",capacity:14,stiff:1.02,color:"#6f6257"}
};
const SIZES=[
  {key:"small",label:"ちいさい",w:42,h:31,weight:1,color:"#fffdf7"},
  {key:"normal",label:"ふつう",w:58,h:42,weight:2.2,color:"#fff9ed"},
  {key:"large",label:"おおきい",w:78,h:55,weight:4.2,color:"#f8edda"},
  {key:"giant",label:"きょだい",w:108,h:74,weight:7.4,color:"#efe0c7"}
];
let bridgeType="beam",bridge,buns=[],dragging=null,dragDX=0,dragDY=0,nextId=1;
let stress=0,targetStress=0,wobble=0,flow=null,collapsed=false,collapseAt=0,shake=0,audioCtx=null,statusTimer=0;

function setup(){
  const c=createCanvas(windowWidth,windowHeight);c.parent("sketch");pixelDensity(min(devicePixelRatio||1,2));
  document.querySelectorAll(".bridge-button").forEach(b=>b.onclick=()=>switchBridge(b.dataset.bridge));
  document.getElementById("reset").onclick=()=>{unlockAudio();resetAll()};layout();makeTray();
}
function layout(){
  const w=min(width*.78,920),y=constrain(height*.43,220,height*.53);
  bridge={x:(width-w)/2,y,w,left:(width-w)/2,right:(width+w)/2,deckH:16,bankY:y+min(155,height*.24)};
}
function makeBun(size,x,y,tray=true){
  const s=SIZES.find(q=>q.key===size)||SIZES[1];
  return{id:nextId++,size:s.key,s,actor:new Marpan25D({maxSize:s.w,bodyColor:s.color,autoBlink:true}),x,y,homeX:x,homeY:y,onBridge:!tray,tray,falling:false,vx:0,vy:0,rot:0,landed:0};
}
function makeTray(){
  buns=[];const items=width<620?["small","normal","large","giant"]:["small","small","normal","normal","large","large","giant"];
  const span=min(width*.76,700),start=width/2-span/2,gap=span/max(1,items.length-1),base=height-max(54,height*.075);
  items.forEach((key,i)=>{const s=SIZES.find(q=>q.key===key),x=items.length===1?width/2:start+i*gap;buns.push(makeBun(key,x,base-s.h*.5,true))});
}
function resetAll(){collapsed=false;stress=targetStress=wobble=shake=0;flow=null;makeTray();setStatus("新しい橋です",800)}
function switchBridge(type){
  if(type===bridgeType)return;bridgeType=type;collapsed=false;stress=targetStress=wobble=shake=0;flow=null;
  buns.filter(b=>b.onBridge).forEach(b=>{b.falling=false;b.vx=b.vy=b.rot=0});
  document.querySelectorAll(".bridge-button").forEach(b=>b.classList.toggle("active",b.dataset.bridge===type));
  document.getElementById("bridge-name").innerHTML=`${TYPES[type].label} <span>${TYPES[type].tag}</span>`;
  setStatus("同じ配置で、くらべてみよう",1500);recalculate();
}
function localInfluence(nx,type=bridgeType){
  const center=1-abs(nx-.5)*2;
  if(type==="beam")return .55+1.05*pow(max(0,center),1.8);
  if(type==="truss")return .7+.43*center;
  if(type==="arch")return .63+.35*center+.22*abs(nx-.5)*2;
  if(type==="cable")return .68+.62*min(abs(nx-.25),abs(nx-.75))*2.2;
  if(type==="throughArch")return .72+.25*center+.28*abs(nx-.5)*2;
  if(type==="warren")return .72+.22*center;
  if(type==="frame")return .58+.62*pow(center,1.5);
  return .58+1.12*pow(center,2.1)+.18*min(abs(nx-.28),abs(nx-.72))*3;
}
function recalculate(){
  if(collapsed){targetStress=0;return}const placed=buns.filter(b=>b.onBridge&&!b.falling);
  let load=0,moment=0;placed.forEach(b=>{const nx=constrain((b.x-bridge.left)/bridge.w,0,1),v=b.s.weight*localInfluence(nx);load+=v;moment+=v*(nx-.5)*2});
  const imbalance=load?abs(moment)/load:0,cluster=clusterPenalty(placed),spread=loadSpread(placed);
  let modifier=1;if(bridgeType==="beam")modifier+=cluster*.32;if(bridgeType==="truss")modifier+=imbalance*.13;
  if(bridgeType==="arch")modifier+=imbalance*.28;if(bridgeType==="cable")modifier+=imbalance*.37;
  if(bridgeType==="throughArch")modifier+=imbalance*.32+cluster*.1;
  if(bridgeType==="warren")modifier+=imbalance*.08+cluster*.13-spread*.12;
  if(bridgeType==="frame")modifier+=imbalance*.16+cluster*.23-spread*.05;
  if(bridgeType==="cantilever")modifier+=imbalance*.42+cluster*.3;
  targetStress=load*modifier/TYPES[bridgeType].capacity;
}
function clusterPenalty(list){if(list.length<2)return 0;let p=0;for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){const d=abs(list[i].x-list[j].x)/bridge.w;p+=max(0,.18-d)*2.2}return min(1,p/max(1,list.length-1))}
function loadSpread(list){if(list.length<2)return 0;const xs=list.map(b=>(b.x-bridge.left)/bridge.w),range=max(...xs)-min(...xs);return constrain(range/.72,0,1)}
function deckDeflection(x){
  if(collapsed)return 0;const nx=constrain((x-bridge.left)/bridge.w,0,1),shape=sin(PI*nx),asym=buns.filter(b=>b.onBridge).reduce((n,b)=>n+b.s.weight*((b.x<width/2)?-1:1),0)*.16;
  let d=pow(constrain(stress,0,1.3),1.55)*38*TYPES[bridgeType].stiff*shape;
  if(bridgeType==="arch")d*=.76;if(bridgeType==="cable")d*=.82+.18*sin(PI*nx*2);
  if(bridgeType==="throughArch")d*=.62+.18*abs(nx-.5)*2;
  if(bridgeType==="warren")d*=.62+.1*sin(nx*PI*6);
  if(bridgeType==="frame")d*=.72+.3*pow(abs(nx-.5)*2,2);
  if(bridgeType==="cantilever")d*=.55+1.05*pow(1-abs(nx-.5)*2,2.4);
  return d+asym*(nx-.5)*shape+sin(millis()*.021+x*.035)*wobble*shape;
}
function updateWorld(){
  const dt=min(.035,deltaTime/1000);stress=lerp(stress,targetStress,min(1,dt*4));wobble=lerp(wobble,stress>.72?(stress-.68)*8:0,dt*5);shake*=pow(.045,dt);
  if(flow&&millis()-flow.time>1250)flow=null;
  if(!collapsed&&targetStress>1.08){collapseBridge()}else if(!collapsed&&targetStress>.83&&random()<dt*.8){creak();shake=max(shake,2.2)}
  buns.forEach(b=>{
    if(b.onBridge&&!b.falling&&b!==dragging)b.y=bridge.y+deckDeflection(b.x)-b.s.h*.5-4+sin(millis()*.016+b.id)*wobble*.18;
    if(b.falling&&b!==dragging){b.vy+=760*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.rot+=b.vx*dt*.006;if(b.y>height+120){b.falling=false;b.tray=true;b.onBridge=false;b.x=b.homeX;b.y=b.homeY;b.rot=0}}
  });
  if(collapsed&&millis()-collapseAt>2600)recover();
}
function collapseBridge(){collapsed=true;collapseAt=millis();flow=null;shake=9;sound("break");setStatus("橋が耐えきれませんでした",2200);buns.filter(b=>b.onBridge).forEach(b=>{b.onBridge=false;b.falling=true;b.vx=random(-55,55);b.vy=random(20,90)});targetStress=0}
function recover(){collapsed=false;stress=wobble=shake=0;setStatus("橋がもどりました",900)}
function draw(){updateWorld();drawBackground();push();translate(random(-shake,shake),random(-shake,shake)*.4);drawStructure(false);drawFlow();drawDeck();pop();drawBuns();drawTrayLabels()}
function drawBackground(){
  background("#f5efe2");noStroke();fill("#e7d8bd");rect(0,bridge.bankY,width,height-bridge.bankY);
  fill("#bfd7d5");beginShape();vertex(bridge.left-10,bridge.bankY);vertex(bridge.right+10,bridge.bankY);vertex(bridge.right+80,height);vertex(bridge.left-80,height);endShape(CLOSE);
  stroke(255,255,255,95);strokeWeight(2);for(let i=0;i<5;i++){const yy=bridge.bankY+22+i*27,lineW=bridge.w*(.2+i*.035);line(width/2-lineW/2+sin(millis()*.0008+i)*18,yy,width/2+lineW/2,yy)}
  noStroke();fill("#bca583");rect(0,bridge.y-4,bridge.left,bridge.bankY-bridge.y+16);rect(bridge.right,bridge.y-4,width-bridge.right,bridge.bankY-bridge.y+16)
}
function materialStroke(alpha=255,weight=7){stroke(red(color(TYPES[bridgeType].color)),green(color(TYPES[bridgeType].color)),blue(color(TYPES[bridgeType].color)),alpha);strokeWeight(weight);strokeCap(ROUND);strokeJoin(ROUND);noFill()}
function drawStructure(){
  const {left:l,right:r,y,w}=bridge,d=deckDeflection(width/2);materialStroke(255,7);
  if(collapsed){drawBroken();return}
  if(bridgeType==="beam"){line(l,y+8,l,y+85);line(r,y+8,r,y+85);strokeWeight(4);for(let x=l+35;x<r;x+=52)line(x,y+13,x,y+30+deckDeflection(x))}
  if(bridgeType==="truss"){const base=y+92;line(l,base,r,base);const n=10,step=w/n;for(let i=0;i<n;i++){const x=l+i*step,x2=x+step,top1=y+deckDeflection(x),top2=y+deckDeflection(x2);line(x,top1,x,base);line(x,base,x2,top2)}line(r,y,r,base)}
  if(bridgeType==="arch"){beginShape();for(let i=0;i<=40;i++){const nx=i/40,x=lerp(l,r,nx),yy=y+105*sin(PI*nx);vertex(x,yy)}endShape();strokeWeight(4);for(let i=1;i<10;i++){const x=lerp(l,r,i/10);line(x,y+deckDeflection(x),x,y+105*sin(PI*i/10))}}
  if(bridgeType==="cable"){const t1=l+w*.28,t2=l+w*.72,top=y-145;strokeWeight(10);line(t1,y+12,t1,top);line(t2,y+12,t2,top);strokeWeight(3);for(let i=0;i<=5;i++){const x=lerp(l,t1,i/5);line(t1,top,x,y+deckDeflection(x));const x2=lerp(t1,width/2,i/5);line(t1,top,x2,y+deckDeflection(x2));const x3=lerp(width/2,t2,i/5);line(t2,top,x3,y+deckDeflection(x3));const x4=lerp(t2,r,i/5);line(t2,top,x4,y+deckDeflection(x4))}}
  if(bridgeType==="throughArch"){
    beginShape();for(let i=0;i<=40;i++){const nx=i/40,x=lerp(l,r,nx);vertex(x,y-128*sin(PI*nx))}endShape();
    strokeWeight(3);for(let i=1;i<10;i++){const x=lerp(l,r,i/10);line(x,y+deckDeflection(x),x,y-128*sin(PI*i/10))}
    strokeWeight(2);line(l,y,r,y)
  }
  if(bridgeType==="warren"){
    const top=y-92,n=10,step=w/n;line(l,top,r,top);strokeWeight(5);
    for(let i=0;i<n;i++){const x=l+i*step,x2=x+step,apex=i%2===0?top:y+deckDeflection(x);line(x,i%2===0?y+deckDeflection(x):top,x2,i%2===0?top:y+deckDeflection(x2))}
    line(l,y,l,top);line(r,y,r,top)
  }
  if(bridgeType==="frame"){
    const p1=l+w*.22,p2=l+w*.78,foot=y+118,sway=stress*asymmetry()*7;strokeWeight(12);
    beginShape();vertex(p1+sway,foot);vertex(p1,y+22);quadraticVertex(p1,y+4,p1+20,y+4);endShape();
    beginShape();vertex(p2+sway,foot);vertex(p2,y+22);quadraticVertex(p2,y+4,p2-20,y+4);endShape();
    strokeWeight(4);line(p1-18,foot,p1+18,foot);line(p2-18,foot,p2+18,foot)
  }
  if(bridgeType==="cantilever"){
    const p1=l+w*.27,p2=l+w*.73,foot=y+120,lower=y+58;strokeWeight(11);line(p1,y+5,p1,foot);line(p2,y+5,p2,foot);strokeWeight(6);
    line(l,y+4,p1,lower);line(p1,lower,width/2-24,y+deckDeflection(width/2)-2);line(r,y+4,p2,lower);line(p2,lower,width/2+24,y+deckDeflection(width/2)-2);
    strokeWeight(3);line(p1,y,p1-w*.18,lower);line(p2,y,p2+w*.18,lower);line(width/2-24,y+deckDeflection(width/2),width/2+24,y+deckDeflection(width/2))
  }
  noStroke();fill("#3e3933");ellipse(l,y+9,24,13);ellipse(r,y+9,24,13)
}
function drawDeck(){
  if(collapsed)return;const danger=constrain((stress-.65)/.4,0,1),c=lerpColor(color("#44413c"),color("#b44e3e"),danger);fill(c);noStroke();beginShape();
  for(let i=0;i<=48;i++){const x=lerp(bridge.left,bridge.right,i/48);vertex(x,bridge.y+deckDeflection(x)-5)}
  for(let i=48;i>=0;i--){const x=lerp(bridge.left,bridge.right,i/48);vertex(x,bridge.y+deckDeflection(x)+bridge.deckH)}endShape(CLOSE)
}
function asymmetry(){const placed=buns.filter(b=>b.onBridge);if(!placed.length)return 0;const sum=placed.reduce((n,b)=>n+b.s.weight,0);return placed.reduce((n,b)=>n+b.s.weight*(b.x<width/2?-1:1),0)/sum}
function drawBroken(){
  materialStroke(255,7);const mid=width/2,l=bridge.left,r=bridge.right,y=bridge.y,w=bridge.w;
  if(bridgeType==="cantilever"){line(l,y,l+w*.27,y+18);line(l+w*.27,y+18,mid-20,y+92);line(r,y,r-w*.27,y+18);line(r-w*.27,y+18,mid+20,y+92);line(l+w*.27,y+18,l+w*.27,y+120);line(r-w*.27,y+18,r-w*.27,y+120);return}
  line(l,y,mid-20,y+72);line(mid+20,y+72,r,y);
  if(bridgeType==="truss"||bridgeType==="arch"||bridgeType==="warren")arc(mid,y+100,w*.65,100,0,PI);
  if(bridgeType==="cable"){line(l+w*.28,y-140,mid-10,y+65);line(l+w*.72,y-140,mid+10,y+65)}
  if(bridgeType==="throughArch"){arc(mid,y+5,w*.78,170,PI,0);line(l+w*.25,y-80,mid-12,y+70)}
  if(bridgeType==="frame"){line(l+w*.22,y+10,l+w*.25,y+118);line(l+w*.78,y+10,l+w*.74,y+118)}
}
function drawFlow(){
  if(!flow||collapsed)return;const age=(millis()-flow.time)/1250,ease=constrain(age,0,1),a=255*sin(PI*ease),x=flow.x,y=bridge.y+deckDeflection(x);stroke("#f3bd49");strokeWeight(5);noFill();drawingContext.globalAlpha=a/255;
  if(bridgeType==="beam"){line(x,y,lerp(x,bridge.left,ease),y+55*ease);line(x,y,lerp(x,bridge.right,ease),y+55*ease)}
  if(bridgeType==="truss"){const step=bridge.w/10,k=round((x-bridge.left)/step),node=bridge.left+constrain(k,0,10)*step;line(x,y,node,bridge.y+92);line(node,bridge.y+92,bridge.left,bridge.y+92);line(node,bridge.y+92,bridge.right,bridge.y+92)}
  if(bridgeType==="arch"){beginShape();for(let i=0;i<=30;i++){const nx=lerp((x-bridge.left)/bridge.w,0,i/30),xx=lerp(bridge.left,bridge.right,nx);vertex(xx,bridge.y+105*sin(PI*nx))}endShape();beginShape();for(let i=0;i<=30;i++){const nx=lerp((x-bridge.left)/bridge.w,1,i/30),xx=lerp(bridge.left,bridge.right,nx);vertex(xx,bridge.y+105*sin(PI*nx))}endShape()}
  if(bridgeType==="cable"){const tower=x<width/2?bridge.left+bridge.w*.28:bridge.left+bridge.w*.72;line(x,y,tower,bridge.y-145);line(tower,bridge.y-145,tower,bridge.y+20)}
  if(bridgeType==="throughArch"){const nx=(x-bridge.left)/bridge.w;line(x,y,x,bridge.y-128*sin(PI*nx));beginShape();for(let i=0;i<=36;i++){const t=i/36,xx=lerp(x,bridge.left,t),q=(xx-bridge.left)/bridge.w;vertex(xx,bridge.y-128*sin(PI*q))}endShape();beginShape();for(let i=0;i<=36;i++){const t=i/36,xx=lerp(x,bridge.right,t),q=(xx-bridge.left)/bridge.w;vertex(xx,bridge.y-128*sin(PI*q))}endShape()}
  if(bridgeType==="warren"){const step=bridge.w/10,k=constrain(floor((x-bridge.left)/step),0,9),start=bridge.left+k*step;for(let j=max(0,k-2);j<=min(9,k+2);j++){const x1=bridge.left+j*step,x2=x1+step;line(x1,j%2===0?bridge.y:bridge.y-92,x2,j%2===0?bridge.y-92:bridge.y)}}
  if(bridgeType==="frame"){const pier=x<width/2?bridge.left+bridge.w*.22:bridge.left+bridge.w*.78;line(x,y,pier,bridge.y+5);line(pier,bridge.y+5,pier,bridge.y+118)}
  if(bridgeType==="cantilever"){const pier=x<width/2?bridge.left+bridge.w*.27:bridge.left+bridge.w*.73;line(x,y,pier,bridge.y+58);line(pier,bridge.y+58,pier,bridge.y+120)}drawingContext.globalAlpha=1
}
function drawBuns(){buns.filter(b=>b!==dragging).forEach(drawBun);if(dragging)drawBun(dragging)}
function drawBun(b){const bob=b.tray&&!b.falling?sin(millis()*.002+b.id)*1.2:0;push();translate(b.x,b.y+bob);rotate(b.rot);b.actor.lookAt(mouseX,mouseY);b.actor.drawAt(0,0,{bodyWidth:b.s.w,bodyHeight:b.s.h,bodyColor:b.s.color,scaleY:b===dragging?.94:1,scaleX:b===dragging?1.05:1});pop()}
function drawTrayLabels(){noStroke();fill(70,63,55,115);textAlign(CENTER,CENTER);textSize(9);buns.filter(b=>b.tray&&!b.falling).forEach(b=>text(b.s.label,b.x,height-17))}
function pick(x,y){return buns.slice().reverse().find(b=>!b.falling&&abs(x-b.x)<b.s.w*.62&&abs(y-b.y)<b.s.h*.7)}
function mousePressed(){unlockAudio();const b=pick(mouseX,mouseY);if(!b)return false;dragging=b;dragDX=mouseX-b.x;dragDY=mouseY-b.y;b.onBridge=false;b.tray=false;b.falling=false;recalculate();document.querySelector("canvas").classList.add("dragging");return false}
function mouseDragged(){if(!dragging)return false;dragging.x=mouseX-dragDX;dragging.y=mouseY-dragDY;dragging.rot=lerp(dragging.rot,0,.2);return false}
function mouseReleased(){
  if(!dragging)return false;const b=dragging;dragging=null;document.querySelector("canvas").classList.remove("dragging");
  if(!collapsed&&b.x>bridge.left-20&&b.x<bridge.right+20&&b.y>bridge.y-150&&b.y<bridge.y+65){b.x=constrain(b.x,bridge.left+8,bridge.right-8);b.onBridge=true;b.tray=false;b.falling=false;b.rot=0;b.y=bridge.y-b.s.h*.5-4;flow={x:b.x,time:millis()};wobble=max(wobble,b.s.weight*.65);shake=max(shake,b.s.weight*.22);sound("land",b.s.weight);document.getElementById("hint").classList.add("hidden");recalculate()}
  else{b.onBridge=false;b.falling=true;b.vy=30;b.vx=0}return false
}
function unlockAudio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==="suspended")audioCtx.resume()}
function sound(kind,weight=2){unlockAudio();const now=audioCtx.currentTime,g=audioCtx.createGain(),o=audioCtx.createOscillator();o.type=kind==="break"?"sawtooth":"sine";o.frequency.setValueAtTime(kind==="break"?92:190-weight*12,now);o.frequency.exponentialRampToValueAtTime(kind==="break"?38:78,now+(kind==="break"?.55:.18));g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(kind==="break"?.12:.045,now+.012);g.gain.exponentialRampToValueAtTime(.0001,now+(kind==="break"?.6:.22));o.connect(g).connect(audioCtx.destination);o.start();o.stop(now+.65)}
function creak(){if(!audioCtx)return;const now=audioCtx.currentTime,o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type="triangle";o.frequency.setValueAtTime(random(70,105),now);o.frequency.linearRampToValueAtTime(random(45,65),now+.12);g.gain.setValueAtTime(.018,now);g.gain.linearRampToValueAtTime(0,now+.14);o.connect(g).connect(audioCtx.destination);o.start();o.stop(now+.15)}
function setStatus(msg,duration){const el=document.getElementById("status");el.textContent=msg;el.classList.add("show");clearTimeout(statusTimer);statusTimer=setTimeout(()=>el.classList.remove("show"),duration)}
function touchStarted(){return mousePressed()}function touchMoved(){return mouseDragged()}function touchEnded(){return mouseReleased()}
function windowResized(){const placed=buns.filter(b=>b.onBridge).map(b=>({size:b.size,nx:constrain((b.x-bridge.left)/bridge.w,0,1)}));resizeCanvas(windowWidth,windowHeight);layout();makeTray();placed.forEach(p=>{const b=makeBun(p.size,lerp(bridge.left,bridge.right,p.nx),bridge.y,false);b.onBridge=true;b.tray=false;buns.push(b)});recalculate()}

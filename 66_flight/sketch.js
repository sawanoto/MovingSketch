"use strict";

const WINGS={
  wright:{label:"WRIGHT 1903",tag:"ライト兄弟の薄い反り翼",color:"#9a7759",base:.43,slope:.075,stall:11,post:.055,drag:.73},
  clarkY:{label:"CLARK Y",tag:"下面が平らな古典翼型",color:"#8b8468",base:.56,slope:.084,stall:14,post:.046,drag:.84},
  naca2412:{label:"NACA 2412",tag:"標準化された高効率翼型",color:"#d67754",base:.64,slope:.094,stall:16,post:.039,drag:.96},
  supercritical:{label:"SUPERCRITICAL",tag:"高速域の衝撃波を抑える翼型",color:"#688495",base:.48,slope:.101,stall:18,post:.034,drag:1.04},
  nasaW:{label:"NASA W",tag:"新しい波形コンセプト",color:"#747082",base:.58,slope:.108,stall:20,post:.029,drag:1.12}
};
let wingKey="wright",angle=6,wind=40,count=1,craftY=0,craftV=0,lift=0,weight=0,ratio=0,stalling=false,wasAirborne=false,reaction=0,stallWobble=0,separation=0,turbulence=0,particles=[],vortices=[],actors=[],rig,flash=0;

function setup(){
  const c=createCanvas(windowWidth,windowHeight);c.parent("sketch");pixelDensity(min(devicePixelRatio||1,2));
  const picker=document.getElementById("wing-picker");
  Object.entries(WINGS).forEach(([key,w])=>{const b=document.createElement("button");b.className="wing-btn"+(key===wingKey?" active":"");b.dataset.wing=key;b.textContent=w.label;b.title=w.tag;b.onclick=()=>selectWing(key);picker.appendChild(b)});
  document.getElementById("angle").oninput=e=>{angle=+e.target.value;document.getElementById("angle-value").textContent=angle+"°"};
  document.getElementById("wind").oninput=e=>{wind=+e.target.value;document.getElementById("wind-value").textContent=wind};
  document.getElementById("plus").onclick=()=>setCount(min(6,count+1));document.getElementById("minus").onclick=()=>setCount(max(1,count-1));
  document.getElementById("reset").onclick=resetLab;makeActors();layout();for(let i=0;i<100;i++)particles.push(makeParticle(random(width)));for(let i=0;i<24;i++)vortices.push(makeVortex(i/24));
}
function layout(){rig={x:width*.55,ground:height-min(155,max(105,height*.19)),minY:max(150,height*.25),wingW:min(310,width*.39),wingH:min(95,width*.12)};if(!craftY)craftY=rig.ground-53;craftY=min(craftY,rig.ground-53)}
function makeActors(){actors=[];for(let i=0;i<6;i++)actors.push(new Marpan25D({maxSize:55,bodyColor:i%2?"#fff8e9":"#fffdf7",autoBlink:true}))}
function selectWing(key){wingKey=key;document.querySelectorAll(".wing-btn").forEach(b=>b.classList.toggle("active",b.dataset.wing===key));flash=1}
function setCount(n){count=n;document.getElementById("count-value").textContent=n;reaction=.5}
function resetLab(){wingKey="wright";angle=6;wind=40;count=1;craftV=0;craftY=rig.ground-53;wasAirborne=false;separation=stallWobble=0;document.getElementById("angle").value=angle;document.getElementById("wind").value=wind;document.getElementById("angle-value").textContent="6°";document.getElementById("wind-value").textContent="40";document.getElementById("count-value").textContent="1";selectWing(wingKey)}
function makeParticle(x=-20){return{x,y:random(120,height-120),speed:random(.7,1.35),len:random(12,38),phase:random(TWO_PI),alpha:random(45,125)}}
function makeVortex(progress=0){return{progress,side:random()<.5?-1:1,size:random(7,20),speed:random(.55,1.25),phase:random(TWO_PI),alpha:random(70,150)}}
function physics(){
  const dt=min(.035,deltaTime/1000),w=WINGS[wingKey],a=angle;
  let cl=w.base+w.slope*a;stalling=a>w.stall;
  const sepTarget=stalling?constrain((a-w.stall)/7,0,1):0;separation=lerp(separation,sepTarget,dt*(stalling?4:6));
  turbulence=noise(millis()*.006)-.5;
  if(stalling){cl=(w.base+w.slope*w.stall)-pow(a-w.stall,1.18)*w.post;cl*=1-separation*.42+turbulence*separation*.22;stallWobble=lerp(stallWobble,1,dt*3.5)}else stallWobble=lerp(stallWobble,0,dt*5);
  cl=max(-.22,cl);lift=pow(wind/100,2)*cl*w.drag*820;weight=145+count*88;ratio=lift/weight;
  const floorY=rig.ground-53,ceiling=rig.minY;
  let accel=(weight-lift)*.014;
  if(craftY>=floorY&&accel<0)accel*=1.18;if(abs(ratio-1)<.10)accel+=sin(millis()*.004)*.32;
  if(stalling&&craftY<floorY-4)accel+=abs(sin(millis()*.013))*2.4+separation*(2.2+turbulence*5);
  craftV+=accel*dt*60;craftV*=pow(.24,dt);craftY+=craftV*dt*60;
  if(craftY>floorY){craftY=floorY;craftV=min(0,craftV)*.15}if(craftY<ceiling){craftY=ceiling;craftV=max(0,craftV)*.2}
  const airborne=craftY<floorY-9;if(airborne&&!wasAirborne){reaction=1;flash=1}wasAirborne=airborne;reaction=max(0,reaction-dt*.8);flash=max(0,flash-dt*1.8);
  updateMessage(airborne);
}
let lastMessage="";function updateMessage(airborne){let msg="風を強くして、浮かせてみよう";if(stalling&&angle>WINGS[wingKey].stall)msg="ふらふら… 角度をつけすぎたみたい";else if(airborne&&ratio>1.18)msg="浮いた！ 風が翼を持ち上げている";else if(abs(ratio-1)<.11)msg="LIFT と WEIGHT がつり合っている";else if(count>=5&&wind>88&&ratio<1)msg="重い…！ マーパンたちがプルプルしている";else if(wind<14)msg="まだ風がほとんどない";else if(ratio<1)msg="もう少し揚力が必要";if(msg!==lastMessage){document.getElementById("message").textContent=msg;lastMessage=msg}}
function draw(){physics();background("#f3eddf");drawTunnel();drawParticles();drawSeparatedFlow();drawStand();drawCraft();drawForces();drawMeters()}
function drawTunnel(){noStroke();fill("#e9dfce");rect(0,rig.ground,width,height-rig.ground);stroke("#d2c4ae");strokeWeight(1);for(let x=25;x<width;x+=42)line(x,rig.ground,x+18,rig.ground+12);fill("#d8c9b3");noStroke();rect(0,rig.ground,rig.x-rig.wingW*.65,4);rect(rig.x+rig.wingW*.65,rig.ground,width,4);fill(80,73,64,75);textAlign(LEFT,CENTER);textSize(9);text("WIND TUNNEL  66",22,rig.ground+27)}
function flowY(p,x){const dx=(x-rig.x)/(rig.wingW*.75),near=exp(-dx*dx*2.1)*exp(-pow((p.y-craftY)/110,2));return p.y+near*(-sin(radians(angle))*28+(p.y<craftY?-17:15))*sin((dx+1.4)*PI*.42)}
function drawParticles(){const v=wind/100;particles.forEach(p=>{p.x+=v*v*12*p.speed+.18;if(p.x>width+50){Object.assign(p,makeParticle(-50));p.y=random(105,rig.ground-20)}const yy=flowY(p,p.x),x2=p.x-p.len*(.3+v);stroke(72,132,149,p.alpha*(.2+.8*v));strokeWeight(1.2);line(x2,flowY(p,x2),p.x,yy)});if(wind>3){noStroke();fill("#4b8794");textAlign(LEFT,CENTER);textSize(10);text("WIND  →",22,height*.45)}}
function drawSeparatedFlow(){
  if(separation<.03||wind<8)return;const strength=separation*(wind/100),startX=rig.x-rig.wingW*.08,startY=craftY-rig.wingH*.22;
  vortices.forEach(v=>{v.progress+=.0065*v.speed*(.35+wind/70);if(v.progress>1)Object.assign(v,makeVortex(0));const t=v.progress,x=startX+t*rig.wingW*(.45+separation*.85),spread=(18+t*70)*separation,y=startY-v.side*spread*sin(t*PI+v.phase)*.46+t*26;const radius=v.size*(.5+t)*separation;noFill();stroke(74,126,143,v.alpha*strength);strokeWeight(1.35);arc(x,y,radius*2,radius*1.2,v.phase+t*8,v.phase+t*8+PI*1.45)});
  noStroke();fill(223,112,83,175*separation);textAlign(CENTER,CENTER);textSize(9);text("FLOW SEPARATION",rig.x+rig.wingW*.28,craftY-rig.wingH*.72-separation*12);
}
function drawStand(){stroke("#9b8c77");strokeWeight(4);line(rig.x,rig.ground,rig.x,craftY+35);noStroke();fill("#ab9c87");ellipse(rig.x,rig.ground+2,75,13);stroke("#9b8c77");strokeWeight(2);line(rig.x-26,craftY+38,rig.x+26,craftY+38)}
function wingPoints(type,w,h){
  if(type==="wright")return [[-w/2,1],[-w*.32,-h*.16],[w*.08,-h*.18],[w/2,0],[w*.12,h*.03],[-w*.34,h*.06]];
  if(type==="clarkY")return [[-w/2,1],[-w*.3,-h*.31],[w*.08,-h*.25],[w/2,0],[w*.22,h*.08],[-w*.38,h*.08]];
  if(type==="naca2412")return [[-w/2,1],[-w*.28,-h*.36],[w*.1,-h*.27],[w/2,0],[w*.14,h*.12],[-w*.3,h*.18]];
  if(type==="supercritical")return [[-w/2,1],[-w*.3,-h*.30],[w*.18,-h*.24],[w/2,-h*.04],[w*.27,h*.17],[-w*.2,h*.22],[-w*.43,h*.11]];
  return [[-w/2,1],[-w*.34,-h*.32],[-w*.02,-h*.23],[w*.18,-h*.29],[w/2,-h*.03],[w*.3,h*.15],[w*.03,h*.21],[-w*.2,h*.17],[-w*.42,h*.08]];
}
function drawCraft(){const w=WINGS[wingKey],over=count>=5&&wind>85&&ratio<1?sin(millis()*.055)*2.2:0,sw=stallWobble*(sin(millis()*.013)*4+turbulence*separation*9);push();translate(rig.x+over,craftY);rotate(radians(angle+sw));
  noStroke();fill("#4e4a44");rect(-rig.wingW*.34,-7,rig.wingW*.68,14,7);fill("#675f55");rect(-rig.wingW*.06,-36,rig.wingW*.12,33,7);fill(w.color);stroke("#37342f");strokeWeight(2);beginShape();wingPoints(wingKey,rig.wingW,rig.wingH).forEach(p=>vertex(p[0],p[1]));endShape(CLOSE);stroke(255,255,255,100);strokeWeight(1);line(-rig.wingW*.39,-2,rig.wingW*.34,-2);pop();
  drawMarpans(over,sw);if(flash>0){noFill();stroke(223,112,83,flash*150);strokeWeight(3);ellipse(rig.x,craftY,rig.wingW+flash*45,120+flash*25)}
}
function drawMarpans(over,sw){const size=count<=3?52:count<=5?45:40,gap=size*.78,total=(count-1)*gap;for(let i=0;i<count;i++){const x=rig.x-total/2+i*gap+over,y=craftY-48+(i%2)*-2;const actor=actors[i];actor.lookAt(mouseX,mouseY-(reaction?45:0));push();translate(x,y);rotate(radians(sw*.22));if(reaction>0)scale(1+reaction*.055,1-reaction*.035);actor.drawAt(0,0,{bodyWidth:size,bodyHeight:size*.72,bodyColor:i%2?"#fff8e9":"#fffdf7",pulse:reaction*.35});pop()}}
function arrow(x,y,len,up,label,colorValue){const dir=up?-1:1,l=constrain(len,20,150);stroke(colorValue);strokeWeight(3);line(x,y,x,y+dir*l);line(x,y+dir*l,x-7,y+dir*(l-11));line(x,y+dir*l,x+7,y+dir*(l-11));noStroke();fill(colorValue);textAlign(CENTER,CENTER);textSize(10);textStyle(BOLD);text(label,x,y+dir*(l+14));textStyle(NORMAL)}
function drawForces(){const x=rig.x+rig.wingW*.58;arrow(x,craftY-5,lift*.18,true,"LIFT","#df7053");arrow(x+45,craftY+5,weight*.18,false,"WEIGHT","#4d6068")}
function drawMeters(){const x=25,y=height*.57,h=120;noStroke();fill(255,250,240,185);rect(x,y,12,h,8);const lv=constrain(ratio/1.6,0,1);fill(ratio>=1?"#df7053":"#91a5a4");rect(x,y+h*(1-lv),12,h*lv,8);fill("#81796e");textAlign(LEFT,CENTER);textSize(9);text("浮く",x+20,y+8);text("とどまる",x+20,y+h-5);stroke("#81796e");strokeWeight(1);line(x-4,y+h*.375,x+17,y+h*.375)}
function windowResized(){resizeCanvas(windowWidth,windowHeight);layout()}

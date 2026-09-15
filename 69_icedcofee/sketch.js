"use strict";

const ORIGINS=[
  {name:"コロンビア",en:"COLOMBIA",flag:["#f7cf38","#2464aa","#bd3038"],flagType:"bars",bean:"#76452c"},
  {name:"ブラジル",en:"BRAZIL",flag:["#26904f","#f1cc35","#2857a2"],flagType:"brazil",bean:"#8a5030"},
  {name:"インドネシア",en:"INDONESIA",flag:["#c83e3c","#eee8db"],bean:"#5f3525"}
];
let L,eyes,state="choose",poured=[false,false,false],falling=[],hopper=[],grounds=[],drops=[],ice=[];
let handle=.65,drag=false,pressing=false,pid=null,prevA=0,turns=0,lastMove=0,extractStart=0,fillLevel=0,audio=null,shake=0,lastBeanTurn=-1,pourStarted=false,canvasEl=null,lastPointer=null;

function setup(){
  const c=createCanvas(windowWidth,windowHeight);c.parent("sketch");canvasEl=c.elt;pixelDensity(Math.min(devicePixelRatio||1,2));
  c.elt.setAttribute("role","application");c.elt.setAttribute("aria-label","コーヒーミルのハンドルを回すと、3つの産地の豆が混ざりアイスコーヒーになります");
  c.elt.addEventListener("pointerdown",down,{passive:false});window.addEventListener("pointermove",move,{passive:false});window.addEventListener("pointerup",up,{passive:false});window.addEventListener("pointercancel",up,{passive:false});
  eyes=new Marpan25D({autoBlink:true,eyeScale:1});eyes.enableAutoBlink(2600,5100);document.getElementById("again").onclick=resetWork;layout();resetIce();
}
function layout(){
  const s=Math.min(width/900,height/820);const compact=width<580;
  L={s,compact,cx:width/2,bottleY:compact?88:96,bottleW:compact?width*.245:135,bottleH:compact?132:155,millY:compact?height*.51:height*.515,millW:Math.min(compact?220:245,width*.52,height*.34)};
  L.bottleXs=compact?[width*.18,width*.5,width*.82]:[width/2-172,width/2,width/2+172];L.pivot={x:L.cx,y:L.millY+L.millW*.15};L.arm=L.millW*.34;
}
function draw(){
  background("#24150f");drawRoom();update();drawBottles();drawFalling();drawBrewer();if((state==="grind"&&turns>.7)||state==="complete")drawExtraction();if(state==="complete")drawFinish();
}
function drawRoom(){
  noStroke();for(let x=0;x<width;x+=42){fill(x%84?"#2c1b13":"#302017");rect(x,0,43,height*.69)}
  fill("#5a3520");rect(0,height*.69,width,height*.31);stroke(48,26,16,90);strokeWeight(2);for(let y=height*.69;y<height;y+=36)line(0,y,width,y);
  noStroke();fill(8,4,2,75);ellipse(L.cx,height*.91,L.millW*2.1,L.millW*.24);
}
function drawBottles(){
  ORIGINS.forEach((o,i)=>{const x=L.bottleXs[i],w=L.bottleW,h=L.bottleH,y=L.bottleY;push();translate(x,y);
    const active=state!=="complete";if(active){noFill();stroke(205,171,110,22+12*sin(millis()*.004+i));strokeWeight(4);rect(-w*.42,-5,w*.84,h*.92,12)}
    stroke("#2a1710");strokeWeight(5);fill("#bea172");rect(-w*.31,-8,w*.62,18,3);fill(211,224,210,38);rect(-w*.4,5,w*.8,h*.82,10);
    for(let n=0;n<28;n++){const bx=((n*37)%83/82-.5)*w*.68,by=h*.72-Math.floor(n/7)*h*.105+sin(n*4)*2;bean(bx,by,w*.055,o.bean,n*.8)}
    noStroke();fill(239,224,194,235);rect(-w*.36,h*.47,w*.72,h*.25,4);fill("#302019");textAlign(CENTER,CENTER);textStyle(BOLD);textSize(Math.max(10,w*.09));text(o.name,0,h*.55);textStyle(NORMAL);textSize(Math.max(7,w*.055));text(o.en,0,h*.65);flag(o.flag,o.flagType,-w*.13,h*.76,w*.26,w*.13);pop();
  });
}
function flag(cols,type,x,y,w,h){noStroke();if(cols.length===2){cols.forEach((c,i)=>{fill(c);rect(x,y+i*h/2,w,h/2)})}else if(type==="bars"){fill(cols[0]);rect(x,y,w,h*.5);fill(cols[1]);rect(x,y+h*.5,w,h*.25);fill(cols[2]);rect(x,y+h*.75,w,h*.25)}else{fill(cols[0]);rect(x,y,w,h);fill(cols[1]);quad(x+w*.5,y+h*.16,x+w*.82,y+h*.5,x+w*.5,y+h*.84,x+w*.18,y+h*.5);fill(cols[2]);circle(x+w*.5,y+h*.5,h*.35)}}
function bean(x,y,s,c,a=0){push();translate(x,y);rotate(a);stroke("#2b180f");strokeWeight(max(1,s*.08));fill(c);ellipse(0,0,s*1.55,s);noFill();arc(0,0,s*.42,s*.75,-HALF_PI,HALF_PI);pop()}
function feedBeans(i,count=5){startAudio();poured[i]=true;lastMove=millis();for(let n=0;n<count;n++)falling.push({i,t:-n*.045,x:L.bottleXs[i]+random(-L.bottleW*.2,L.bottleW*.2),spin:random(TWO_PI),v:random(.9,1.3)});rattle()}
function drawFalling(){falling.forEach(b=>{if(b.t<0)return;const sx=b.x,sy=L.bottleY+L.bottleH*.56,ex=L.cx,ey=L.millY-L.millW*.51;const t=min(1,b.t);const x=lerp(sx,ex,t),y=lerp(sy,ey,t)+sin(t*PI)*-45;bean(x,y,10*L.s,ORIGINS[b.i].bean,b.spin+b.t*8)})}
function drawBrewer(){const w=L.millW,x=L.cx,y=L.millY;drawGlass(x,y+w*.65,w);drawMill(x,y,w);drawHandle();}
function drawMill(x,y,w){
  stroke("#2b170f");strokeWeight(max(3,w*.014));strokeJoin(ROUND);fill("#7d4a2d");rect(x-w*.37,y-w*.16,w*.74,w*.55,10);fill("#a56a40");rect(x-w*.31,y-w*.1,w*.62,w*.42,7);
  fill("#342016");beginShape();vertex(x-w*.32,y-w*.5);vertex(x+w*.32,y-w*.5);vertex(x+w*.2,y-w*.18);vertex(x-w*.2,y-w*.18);endShape(CLOSE);fill("#56331f");ellipse(x,y-w*.5,w*.64,w*.12);
  hopper.forEach((b,n)=>bean(x+b.x*w,y-w*.51+b.y*w,w*.038,ORIGINS[b.i].bean,b.a));
  fill("#663b24");rect(x-w*.4,y+w*.33,w*.8,w*.13,4);fill("#3a2116");rect(x-w*.31,y+w*.07,w*.62,w*.2,4);noStroke();fill("#5b3420");const gh=min(1,turns/6)*w*.13;rect(x-w*.28,y+w*.24-gh,w*.56,gh);
  let lx=0,ly=-w*.03;if(falling.length){const b=falling[falling.length-1];lx=b.x-x;ly=-w*.45}else if(drag||pressing){const k=knob();lx=k.x-x;ly=k.y-y;}
  if(shake){lx+=sin(millis()*.05)*w*.04;ly+=cos(millis()*.057)*w*.025}
  eyes.drawEyes(x,y-w*.01,w*.78,w*.5,0,lx,ly,{eyeScale:.82});
}
function drawHandle(){const p=L.pivot,k=knob(),w=L.millW;stroke("#28170f");strokeWeight(w*.028);strokeCap(ROUND);line(p.x,p.y,k.x,k.y);stroke("#b27b48");strokeWeight(w*.017);line(p.x,p.y,k.x,k.y);stroke("#291810");strokeWeight(3);fill("#b98450");circle(p.x,p.y,w*.09);fill("#57341f");ellipse(k.x,k.y,w*.13,w*.17)}
function knob(){return{x:L.pivot.x+cos(handle)*L.arm,y:L.pivot.y+sin(handle)*L.arm*.72}}
function drawGlass(x,y,w){const gy=y+w*.52,gw=w*.46,gh=w*.48;push();translate(x,gy);stroke(210,225,218,145);strokeWeight(3);fill(190,214,210,18);beginShape();vertex(-gw*.48,-gh*.5);vertex(gw*.48,-gh*.5);vertex(gw*.4,gh*.5);vertex(-gw*.4,gh*.5);endShape(CLOSE);
  if(fillLevel>0){noStroke();fill(47,22,12,230);const top=gh*.46-fillLevel*gh*.85;beginShape();vertex(-gw*.45,top);vertex(gw*.45,top);vertex(gw*.4,gh*.47);vertex(-gw*.4,gh*.47);endShape(CLOSE)}
  ice.forEach(ic=>{push();translate(ic.x*gw,ic.y*gh+(shake?sin(millis()*.02+ic.a)*3:0));rotate(ic.a+shake*.04);stroke(225,241,238,140);fill(211,233,232,fillLevel>ic.y+.5?55:120);rect(-ic.s*gw/2,-ic.s*gh/2,ic.s*gw,ic.s*gh,5);pop()});pop();
}
function update(){
  falling.forEach(b=>{b.t+=deltaTime*.001*b.v;if(b.t>=1&&!b.done){b.done=true;hopper.push({i:b.i,x:random(-.22,.22),y:random(-.03,.015),a:random(TWO_PI)});tick()}});falling=falling.filter(b=>b.t<1.08);
  if(pressing&&(state==="choose"||state==="grind"))rotateBy(deltaTime*.0055);shake=max(0,shake-.025);
  if(state==="grind"&&turns>.35){fillLevel=constrain((turns-.35)/2.65,0,1);if(frameCount%5===0)drops.push({y:L.millY+L.millW*.39,v:2+random(2)});if(!pourStarted){pourStarted=true;pourSound();setHint("そのまま、ゆっくり回してください")}if(fillLevel>.08&&!ice[0].hit){ice[0].hit=true;shake=.9;clink()}}
  if(state==="grind"&&turns>=3){state="complete";fillLevel=1;pressing=drag=false;document.body.classList.add("complete");setHint("");finishTone()}
  drops.forEach(d=>{d.y+=d.v;d.v+=.09});drops=drops.filter(d=>d.y<L.millY+L.millW*.57);
}
function drawExtraction(){stroke(57,25,12,210);strokeWeight(4);strokeCap(ROUND);drops.forEach(d=>line(L.cx,d.y,L.cx,d.y+8));}
function drawFinish(){const y=L.compact?height*.82:L.millY+L.millW*.86;noStroke();fill(242,222,185);textAlign(CENTER,CENTER);textStyle(BOLD);textSize(constrain(L.millW*.075,17,25));text("アイスコーヒー専用ブレンド",L.cx,y);textStyle(NORMAL);fill(194,164,117);textSize(constrain(L.millW*.035,9,12));text("COLOMBIA × BRAZIL × INDONESIA",L.cx,y+29)}
function down(e){
  startAudio();if(state!=="choose"&&state!=="grind")return;
  const p=point(e);drag=true;pressing=true;pid=e.pointerId;lastPointer=p;prevA=atan2(p.y-L.pivot.y,p.x-L.pivot.x);
  canvasEl?.setPointerCapture?.(pid);canvasEl?.classList.add("turning");rotateBy(.025);e.preventDefault();
}
function move(e){
  if(!drag||e.pointerId!==pid)return;const p=point(e),a=atan2(p.y-L.pivot.y,p.x-L.pivot.x);let d=a-prevA;if(d>PI)d-=TWO_PI;if(d<-PI)d+=TWO_PI;
  if(abs(d)<1.1&&abs(d)>.002)rotateBy(d);else if(lastPointer){const travel=dist(p.x,p.y,lastPointer.x,lastPointer.y);if(travel>2)rotateBy(travel*.008)}
  prevA=a;lastPointer=p;e.preventDefault();
}
function up(e){if(e.pointerId!==undefined&&pid!==null&&e.pointerId!==pid)return;drag=pressing=false;pid=null;lastPointer=null;canvasEl?.classList.remove("turning")}
function rotateBy(d){if(state!=="choose"&&state!=="grind")return;if(state==="choose"){state="grind";setHint("回すほど、3つの産地が一杯へ")}handle+=d;turns+=abs(d)/TWO_PI;lastMove=millis();shake=min(1,shake+.15);hopper.splice(0,Math.floor(abs(d)*1.4));const beanStep=Math.floor(turns*5);if(beanStep>lastBeanTurn){lastBeanTurn=beanStep;feedBeans(beanStep%3,4)}grind(abs(d));}
function point(e){const r=canvasEl.getBoundingClientRect();return{x:(e.clientX-r.left)*width/r.width,y:(e.clientY-r.top)*height/r.height}}
function resetIce(){ice=[{x:-.16,y:.08,s:.28,a:-.15},{x:.15,y:.05,s:.3,a:.12},{x:-.1,y:-.2,s:.27,a:.2},{x:.16,y:-.22,s:.25,a:-.22}]}
function resetWork(){state="choose";poured=[false,false,false];falling=[];hopper=[];grounds=[];drops=[];turns=0;fillLevel=0;handle=.65;lastBeanTurn=-1;pourStarted=false;resetIce();document.body.classList.remove("complete");setHint("ハンドルを回してください")}
function setHint(s){document.getElementById("hint").textContent=s}

function startAudio(){if(audio){audio.ctx.resume();return}const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const ctx=new AC(),master=ctx.createGain();master.gain.value=.38;master.connect(ctx.destination);audio={ctx,master};document.getElementById("sound").style.opacity=1}
function tone(f,d=.08,v=.08,type="sine",delay=0){if(!audio)return;const t=audio.ctx.currentTime+delay,o=audio.ctx.createOscillator(),g=audio.ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(audio.master);o.start(t);o.stop(t+d+.02)}
function tick(){tone(420+random(180),.035,.035,"triangle")}
function rattle(){for(let i=0;i<3;i++)tone(260+random(300),.025,.022,"triangle",i*.035)}
function grind(v){const n=min(3,max(1,ceil(v*5)));for(let i=0;i<n;i++)tone(80+random(40),.055,.055,"sawtooth",i*.025)}
function clink(){tone(1250,.45,.15,"sine");tone(1840,.3,.055,"sine",.025)}
function pourSound(){for(let i=0;i<18;i++)tone(140+random(70),.16,.018,"sine",i*.18)}
function finishTone(){[392,494,587].forEach((f,i)=>tone(f,.7,.07,"sine",i*.12))}
function windowResized(){resizeCanvas(windowWidth,windowHeight);layout()}
window.addEventListener("blur",()=>{drag=pressing=false;pid=null});

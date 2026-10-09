"use strict";
const TYPES={
  mass:{name:"厚い石壁",vault:false,base:.84,lateral:.18,support:0,windows:"small"},
  vault:{name:"アーチ＋ヴォールト",vault:true,base:1.75,lateral:1.0,support:0,windows:"small"},
  buttress:{name:"バットレス",vault:true,base:.72,lateral:1.0,support:.72,windows:"medium"},
  flying:{name:"フライングバットレス",vault:true,base:.7,lateral:1.0,support:1.12,windows:"large"}
};
const SIZES=[
  {key:"light",label:"軽い",w:38,h:29,weight:.8,color:"#fffdf6"},
  {key:"heavy",label:"重い",w:68,h:48,weight:4.2,color:"#f7e8cf"},
  {key:"giant",label:"巨大",w:112,h:76,weight:70,color:"#e9d2ad"}
];
let type="mass",supportOn=true,showForce=false,buns=[],dragging=null,dx=0,dy=0,nextId=1;
let damage=0,lean=0,strain=0,shake=0,last=0,collapseAt=0,debris=[],particles=[],audioCtx=null,messageTimer=0;
let geom={};
function setup(){const c=createCanvas(windowWidth,windowHeight);c.parent("sketch");pixelDensity(min(devicePixelRatio||1,2));bindUI();syncSupport();resetAll()}
function bindUI(){
  document.querySelectorAll(".type").forEach(b=>b.onclick=()=>switchType(b.dataset.type));
  ["height","span","thickness"].forEach(id=>document.getElementById(id).addEventListener("input",()=>{damage=max(0,damage-.015);collapseAt=0}));
  document.getElementById("support").onclick=()=>{supportOn=!supportOn;syncSupport();say(supportOn?"横の力が外側の支柱へ流れます":"高い壁が横の力を受け始めました",1600)};
  document.getElementById("force").onclick=()=>{showForce=!showForce;document.getElementById("force").setAttribute("aria-pressed",showForce);document.querySelector("#force span").textContent=showForce?"力を表示中":"力を見る"};
  document.getElementById("reset").onclick=resetAll;
}
function val(id){return Number(document.getElementById(id).value)/100}
function building(){
  const mobile=width<700,ground=height-(mobile?118:103),H=map(val("height"),0,1,height*.28,height*.62),cx=width*.56;
  const outerW=map(val("span"),0,1,min(220,width*.34),min(610,width*.56));
  const heightNeed=map(val("height"),0,1,0,1),rawWall=map(val("thickness"),0,1,14,min(105,outerW*.39));
  const taper=type==="mass"?.42:.15,baseWall=min(outerW*.44,rawWall*(1+heightNeed*taper)),topWall=min(outerW*.38,rawWall*(type==="mass"?.72:.84));
  const left=cx-outerW/2,right=cx+outerW/2,innerBaseL=left+baseWall,innerBaseR=right-baseWall,innerTopL=left+topWall,innerTopR=right-topWall;
  return{cx,ground,H,outerW,left,right,wall:baseWall,topWall,innerBaseL,innerBaseR,innerTopL,innerTopR,innerL:innerTopL,innerR:innerTopR,span:max(12,innerTopR-innerTopL),usableWidth:max(0,innerBaseR-innerBaseL),roofY:ground-H};
}
function makeBun(s,x,y){return{id:nextId++,s,actor:new Marpan25D({maxSize:s.w,bodyColor:s.color,autoBlink:true}),x,y,homeX:x,homeY:y,onRoof:false,tray:true,vx:0,vy:0,rot:0,falling:false}}
function makeTray(){buns=[];const list=[SIZES[0],SIZES[1],SIZES[2]],start=width*.34,end=width*.78,y=height-42;list.forEach((s,i)=>buns.push(makeBun(s,lerp(start,end,i/max(1,list.length-1)),y-s.h/2)))}
function resetAll(){damage=lean=strain=shake=collapseAt=0;debris=[];particles=[];makeTray();document.getElementById("hint").classList.remove("hidden")}
function switchType(next){type=next;supportOn=next==="buttress"||next==="flying";document.querySelectorAll(".type").forEach(b=>b.classList.toggle("active",b.dataset.type===type));syncSupport();damage=lean=strain=collapseAt=0;debris=[];buns.forEach(b=>{b.onRoof=false;b.tray=true;b.falling=false;b.x=b.homeX;b.y=b.homeY});say(TYPES[type].name,900)}
function syncSupport(){const el=document.getElementById("support"),usable=type==="buttress"||type==="flying";el.style.display=usable?"flex":"none";el.setAttribute("aria-pressed",supportOn);el.querySelector("span").textContent=type==="flying"?(supportOn?"飛梁 ON":"飛梁 OFF"):(supportOn?"控え壁 ON":"控え壁 OFF")}
function load(){return buns.filter(b=>b.onRoof&&!b.falling).reduce((n,b)=>n+b.s.weight,0)}
function physics(dt){
  geom=building();const t=TYPES[type],L=load(),heightFactor=map(val("height"),0,1,.68,1.62);
  const spanFactor=constrain(map(geom.span,40,min(width*.5,520),.48,1.85),.38,1.95),thick=constrain(map(geom.wall/geom.outerW,.04,.44,.34,1.7),.3,1.75);
  const roofDead=(t.vault?1.5:1.15)*spanFactor*(.82+geom.outerW/min(width*.56,610)*.3);
  const masonryWeight=heightFactor*(.38+geom.wall/geom.outerW*1.25),vertical=L+roofDead+masonryWeight;
  const openingLoss=type==="flying"&&supportOn?.04:type==="buttress"&&supportOn?.1:type==="vault"?.16:.06+(1-val("thickness"))*.16;
  const thrust=vertical*t.lateral*spanFactor*heightFactor,wallResistance=t.base*thick*thick*7.6*(1-openingLoss)/(heightFactor*.78),activeSupport=supportOn?t.support*(type==="flying"?heightFactor*1.34:1):0;
  const demand=(thrust/(wallResistance+activeSupport*3.3)+vertical/(wallResistance*4.9));strain=lerp(strain,demand,min(1,dt*3));
  if(strain>.78)damage+=dt*pow((strain-.7)*1.45,1.25);else if(strain<.68&&!collapseAt)damage=max(0,damage-dt*(supportOn?.07:.025));damage=constrain(damage,0,1.18);
  const targetLean=t.vault?pow(max(0,strain-.35),1.3)*(10+22*damage)*(supportOn?.42:1):pow(max(0,strain-.7),1.2)*8;
  lean=lerp(lean,targetLean,min(1,dt*(supportOn?1.6:.65)));if(damage>.74&&random()<dt*3)dropStone();
  if(damage>=1&&!collapseAt){collapseAt=millis();shake=9;noise();say("力の流れが切れ、壁が崩れました",2400);buns.filter(b=>b.onRoof).forEach(b=>{b.onRoof=false;b.falling=true;b.vx=random(-90,90);b.vy=random(-40,30)})}
  buns.forEach(b=>{if(b.onRoof&&!b.falling&&b!==dragging){const nx=(b.x-geom.cx)/geom.outerW;b.y=roofSurface(b.x)-b.s.h/2-6+sin(millis()*.012+b.id)*strain*1.3;b.rot=nx*lean*.015}if(b.falling&&b!==dragging){b.vy+=620*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.rot+=b.vx*dt*.008;if(b.y>height+90){b.falling=false;b.tray=true;b.x=b.homeX;b.y=b.homeY;b.vx=b.vy=b.rot=0}}});
  debris.forEach(d=>{d.vy+=510*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.rot+=d.vr*dt});debris=debris.filter(d=>d.y<height+60);shake*=pow(.04,dt);
}
function roofSurface(x){const nx=constrain((x-geom.cx)/(geom.outerW/2),-1,1),sag=strain*5*(1-nx*nx);return geom.roofY+sag+abs(nx)*lean*.42}
function draw(){const now=millis(),dt=min(.04,(now-last)/1000||.016);last=now;physics(dt);background("#eee9dc");drawScene();push();translate(random(-shake,shake),random(-shake,shake)*.45);drawBuilding();drawForce();pop();drawDebris();drawBuns();drawTray()}
function drawScene(){noStroke();fill("#d9e4dc");rect(0,0,width,geom.ground);fill("#c8b992");rect(0,geom.ground,width,height-geom.ground);stroke("#ad9d79");strokeWeight(1);line(0,geom.ground,width,geom.ground);noStroke();fill(255,80);for(let i=0;i<4;i++)ellipse(width*(.17+i*.24),height*.15+(i%2)*22,80,18)}
function wallPoly(side){const dir=side<0?-1:1,outer=side<0?geom.left:geom.right,innerTop=side<0?geom.innerTopL:geom.innerTopR,innerBase=side<0?geom.innerBaseL:geom.innerBaseR,top=geom.roofY,bottom=geom.ground,move=dir*lean*(damage>.98?2.5:1);beginShape();vertex(outer,bottom);vertex(outer+move,top);vertex(innerTop+move*.72,top);vertex(innerBase,bottom);endShape(CLOSE)}
function stoneFill(){fill("#b5a486");stroke("#726a5c");strokeWeight(2);strokeJoin(ROUND)}
function drawBuilding(){
  const t=TYPES[type],collapse=damage>=1;drawInterior();stoneFill();wallPoly(-1);wallPoly(1);
  if(t.vault)drawVault();else drawFlatRoof();drawWindows();
  if((type==="buttress"||type==="flying")&&supportOn)drawSupports();
  drawMasonry();if(damage>.34)drawCracks();if(collapse)drawCollapseGap();
}
function drawInterior(){const narrow=geom.usableWidth<55;noStroke();fill(narrow?"#cbbba0":"#f8f1df");quad(geom.innerBaseL,geom.ground,geom.innerTopL,geom.roofY,geom.innerTopR,geom.roofY,geom.innerBaseR,geom.ground);if(geom.usableWidth>28){fill("#7d7466");textAlign(CENTER,CENTER);textSize(9);text("室内",geom.cx,geom.ground-22);stroke("#9b8d76");strokeWeight(1);line(geom.innerBaseL+4,geom.ground-38,geom.innerBaseR-4,geom.ground-38);line(geom.innerBaseL+4,geom.ground-42,geom.innerBaseL+4,geom.ground-34);line(geom.innerBaseR-4,geom.ground-42,geom.innerBaseR-4,geom.ground-34)}}
function drawFlatRoof(){stoneFill();const y=geom.roofY,over=geom.wall*.2;quad(geom.left-over,y+lean*.42,geom.right+over,y+lean*.42,geom.right+over,y+18+lean*.2,geom.left-over,y+18+lean*.2)}
function drawVault(){const spring=geom.roofY+geom.H*.18,rise=min(geom.span*.3,geom.H*.18),sl=lean*.7;stoneFill();beginShape();vertex(geom.left-sl,geom.roofY+sl*.2);quadraticVertex(geom.cx,spring-rise+strain*7,geom.right+sl,geom.roofY+sl*.2);vertex(geom.innerTopR+sl*.7,spring);quadraticVertex(geom.cx,spring-rise+22+strain*10,geom.innerTopL-sl*.7,spring);endShape(CLOSE);stroke("#796e5c");strokeWeight(2);noFill();arc(geom.cx,spring+rise*.05,geom.span*.88,rise*2.1,PI,TWO_PI)}
function drawSupports(){stoneFill();for(const side of[-1,1]){const wallX=side<0?geom.left:geom.right,dir=side,footX=wallX+dir*(type==="flying"?geom.wall*2.4:geom.wall*.75);if(type==="buttress"){beginShape();vertex(wallX,geom.ground);vertex(wallX+dir*4,geom.roofY+geom.H*.28);vertex(footX,geom.ground);endShape(CLOSE)}else{const pierW=max(18,geom.wall*.45),pierTop=geom.roofY+geom.H*.46,joinY=geom.roofY+geom.H*.18;rectMode(CORNERS);rect(footX-pierW/2,geom.ground,footX+pierW/2,pierTop);rectMode(CORNER);noFill();stroke("#726a5c");strokeWeight(max(10,geom.wall*.3));strokeCap(SQUARE);bezier(wallX,joinY,wallX+dir*geom.wall*.7,joinY+geom.H*.02,footX-dir*geom.wall*.5,pierTop-geom.H*.13,footX,pierTop);strokeCap(ROUND)}}}
function drawWindows(){const big=type==="flying"&&supportOn,rows=big?2:3,avgWall=(geom.wall+geom.topWall)/2;for(const side of[-1,1]){const outer=side<0?geom.left:geom.right,inner=side<0?(geom.innerBaseL+geom.innerTopL)/2:(geom.innerBaseR+geom.innerTopR)/2,x=(outer+inner)/2;for(let i=0;i<rows;i++){const yy=lerp(geom.roofY+geom.H*.33,geom.ground-geom.H*.18,(i+.5)/rows),ww=big?avgWall*.64:avgWall*.24,hh=big?geom.H*.18:geom.H*.065;fill(big?(i%2?"#80a9a2":"#bf765e"):"#4d554f");stroke("#726a5c");strokeWeight(2);beginShape();vertex(x-ww/2,yy+hh/2);vertex(x-ww/2,yy-hh*.25);quadraticVertex(x,yy-hh*.75,x+ww/2,yy-hh*.25);vertex(x+ww/2,yy+hh/2);endShape(CLOSE);if(big){stroke("#ead283");line(x,yy-hh*.58,x,yy+hh*.45)}}}}
function drawMasonry(){stroke(255,65);strokeWeight(1);for(const side of[-1,1])for(let y=geom.roofY+32;y<geom.ground;y+=25){const q=constrain((y-geom.roofY)/geom.H,0,1),inner=side<0?lerp(geom.innerTopL,geom.innerBaseL,q):lerp(geom.innerTopR,geom.innerBaseR,q),outer=side<0?geom.left:geom.right;line(min(outer,inner),y,max(outer,inner),y)}}
function drawCracks(){const amount=constrain((damage-.3)/.7,0,1);stroke("#514c44");strokeWeight(2);noFill();for(const side of[-1,1]){const x=(side<0?geom.left:geom.right)-side*geom.wall*.35,y=geom.roofY+geom.H*.22;beginShape();vertex(x,y);for(let i=1;i<7;i++)vertex(x+sin(i*4.7+side)*8*amount,y+i*geom.H*.075*amount);endShape()}}
function drawCollapseGap(){noStroke();fill("#eee9dc");triangle(geom.cx-geom.span*.24,geom.roofY,geom.cx,geom.roofY+geom.H*.32,geom.cx+geom.span*.2,geom.roofY)}
function drawForce(){if(!showForce||damage>=1)return;const paths=[];const top=geom.roofY+8,spring=geom.roofY+geom.H*.18;if(type==="mass"){paths.push([[geom.cx,top],[geom.cx,top+30],[geom.innerL-geom.wall/2,geom.ground]],[[geom.cx,top],[geom.cx,top+30],[geom.innerR+geom.wall/2,geom.ground]])}else{paths.push([[geom.cx,top],[geom.cx,spring-20],[geom.innerL,spring],[geom.left-lean,geom.ground]],[[geom.cx,top],[geom.cx,spring-20],[geom.innerR,spring],[geom.right+lean,geom.ground]]);if(supportOn&&(type==="buttress"||type==="flying")){for(const side of[-1,1]){const wx=side<0?geom.left:geom.right,fx=wx+side*(type==="flying"?geom.wall*2.4:geom.wall*.75);paths.push([[geom.cx,top],[wx,spring],[fx,geom.roofY+geom.H*.46],[fx,geom.ground]])}}}
  drawingContext.globalCompositeOperation="screen";for(let k=0;k<paths.length;k++){const p=paths[k];noFill();stroke(238,173,57,85);strokeWeight(7);beginShape();p.forEach(q=>vertex(q[0],q[1]));endShape();for(let j=0;j<3;j++){const u=(millis()*.00028+j/3+k*.11)%1,q=along(p,u);noStroke();fill(255,221,112,210);circle(q.x,q.y,6+strain*3)}}drawingContext.globalCompositeOperation="source-over";
}
function along(points,u){const lens=[];let total=0;for(let i=1;i<points.length;i++){const d=dist(...points[i-1],...points[i]);lens.push(d);total+=d}let target=u*total;for(let i=0;i<lens.length;i++){if(target<=lens[i])return{x:lerp(points[i][0],points[i+1][0],target/lens[i]),y:lerp(points[i][1],points[i+1][1],target/lens[i])};target-=lens[i]}return{x:points.at(-1)[0],y:points.at(-1)[1]}}
function dropStone(){const side=random()<.5?-1:1;debris.push({x:(side<0?geom.left:geom.right)+side*random(2,geom.wall),y:random(geom.roofY+40,geom.ground-60),vx:side*random(18,70),vy:random(-30,20),s:random(6,15),rot:0,vr:random(-3,3)});shake=max(shake,1.5)}
function drawDebris(){stoneFill();debris.forEach(d=>{push();translate(d.x,d.y);rotate(d.rot);rect(-d.s/2,-d.s/3,d.s,d.s*.66);pop()})}
function drawBuns(){buns.filter(b=>b!==dragging).forEach(drawBun);if(dragging)drawBun(dragging)}
function drawBun(b){push();translate(b.x,b.y+(b.tray?sin(millis()*.002+b.id)*1.2:0));rotate(b.rot);b.actor.lookAt(mouseX,mouseY);b.actor.drawAt(0,0,{bodyWidth:b.s.w,bodyHeight:b.s.h,bodyColor:b.s.color,scaleX:b===dragging?1.05:1,scaleY:b===dragging?.94:1});pop()}
function drawTray(){noStroke();fill(54,62,57,110);textAlign(CENTER);textSize(8);buns.filter(b=>b.tray&&!b.falling).forEach(b=>text(b.s.label,b.x,height-13))}
function pick(x,y){return buns.slice().reverse().find(b=>!b.falling&&abs(x-b.x)<b.s.w*.65&&abs(y-b.y)<b.s.h*.75)}
function mousePressed(){unlock();const b=pick(mouseX,mouseY);if(!b)return false;dragging=b;dx=mouseX-b.x;dy=mouseY-b.y;b.onRoof=false;b.tray=false;document.querySelector("canvas").classList.add("dragging");return false}
function mouseDragged(){if(dragging){dragging.x=mouseX-dx;dragging.y=mouseY-dy}return false}
function mouseReleased(){if(!dragging)return false;const b=dragging;dragging=null;document.querySelector("canvas").classList.remove("dragging");if(!collapseAt&&b.x>geom.left-30&&b.x<geom.right+30&&b.y>geom.roofY-120&&b.y<geom.roofY+80){b.x=constrain(b.x,geom.left+8,geom.right-8);b.onRoof=true;b.tray=false;b.falling=false;b.y=roofSurface(b.x)-b.s.h/2-6;b.rot=0;shake=max(shake,b.s.weight*.25);tone(210-b.s.weight*25);document.getElementById("hint").classList.add("hidden")}else{b.falling=true;b.vy=30;b.vx=0}return false}
function touchStarted(){return mousePressed()}function touchMoved(){return mouseDragged()}function touchEnded(){return mouseReleased()}
function windowResized(){resizeCanvas(windowWidth,windowHeight);makeTray()}
function say(text,duration){const el=document.getElementById("message");el.textContent=text;el.classList.add("show");clearTimeout(messageTimer);messageTimer=setTimeout(()=>el.classList.remove("show"),duration)}
function unlock(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==="suspended")audioCtx.resume()}
function tone(f){if(!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain(),n=audioCtx.currentTime;o.frequency.setValueAtTime(f,n);o.frequency.exponentialRampToValueAtTime(80,n+.18);g.gain.setValueAtTime(.04,n);g.gain.exponentialRampToValueAtTime(.0001,n+.2);o.connect(g).connect(audioCtx.destination);o.start();o.stop(n+.21)}
function noise(){unlock();if(!audioCtx)return;for(let i=0;i<4;i++)setTimeout(()=>tone(80-i*9),i*70)}

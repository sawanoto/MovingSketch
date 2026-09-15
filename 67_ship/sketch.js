"use strict";

const SHIPS={
  dugout:{label:"丸木舟",note:"細身でも、軽さを活かして浮かぶ",capacity:12,baseDraft:.36,draftRange:.38,stability:.62,length:.48,depth:.62,color:"#8b603f",deck:"#b88455",super:"none"},
  sail:{label:"木造帆船",note:"ふくらんだ船体が、多くの水を押しのける",capacity:30,baseDraft:.42,draftRange:.34,stability:.76,length:.62,depth:.77,color:"#76533c",deck:"#c39461",super:"sail"},
  steam:{label:"蒸気船",note:"広い船体と機関を、浮力で支える",capacity:56,baseDraft:.48,draftRange:.3,stability:.84,length:.72,depth:.82,color:"#425861",deck:"#d5c6a5",super:"steam"},
  cargo:{label:"貨物船",note:"大きな船倉へ、重さを低く均等に",capacity:105,baseDraft:.45,draftRange:.29,stability:.9,length:.82,depth:.9,color:"#b64f3f",deck:"#e1d3b6",super:"cargo"},
  container:{label:"コンテナ船",note:"巨大な排水量が、大量の積荷を支える",capacity:180,baseDraft:.43,draftRange:.28,stability:.94,length:.94,depth:1,color:"#2e6672",deck:"#d8d2bd",super:"container"}
};
const SIZES=[
  {key:"small",label:"1 t",w:30,h:23,weight:1,color:"#fffef7"},
  {key:"medium",label:"3 t",w:43,h:31,weight:3,color:"#fff8e9"},
  {key:"large",label:"8 t",w:55,h:39,weight:8,color:"#f2dfc3"},
  {key:"heavy",label:"20 t",w:68,h:47,weight:20,color:"#d9b985"},
  {key:"super",label:"50 t",w:82,h:56,weight:50,color:"#a97b55"}
];
let shipKey="dugout",ship,buns=[],dragging=null,dragDX=0,dragDY=0,nextId=1;
let draft=0,targetDraft=0,trim=0,targetTrim=0,roll=0,targetRoll=0,impact=0,flood=0,sink=0,sinking=false,messageTimer=0,audioCtx=null;

function setup(){
  const c=createCanvas(windowWidth,windowHeight);c.parent("sketch");pixelDensity(min(devicePixelRatio||1,2));
  const picker=document.getElementById("ship-picker");
  Object.entries(SHIPS).forEach(([key,s])=>{const b=document.createElement("button");b.className="ship-btn"+(key===shipKey?" active":"");b.textContent=s.label;b.onclick=()=>switchShip(key);picker.appendChild(b)});
  document.getElementById("reset").onclick=resetAll;layout();makeTray();recalculate();
}
function layout(){
  const s=SHIPS[shipKey],len=min(width*.82,980)*s.length,depth=min(150,height*.22)*s.depth;
  ship={cx:width*.53,waterY:height*.57,len,depth,left:width*.53-len/2,right:width*.53+len/2,deckY:height*.57-depth*(1-s.baseDraft)};
}
function makeBun(size,x,y,tray=true){const s=SIZES.find(q=>q.key===size)||SIZES[1];return{id:nextId++,s,size:s.key,actor:new Marpan25D({maxSize:s.w,bodyColor:s.color,autoBlink:true}),x,y,homeX:x,homeY:y,tray,onShip:!tray,side:0,vx:0,vy:0,rot:0,falling:false}}
function makeTray(){buns=[];const keys=["small","medium","large","heavy","super"],span=min(width*.58,610),start=width*.53-span/2,gap=span/(keys.length-1),y=height-max(47,height*.063);keys.forEach((k,i)=>{const s=SIZES.find(q=>q.key===k);buns.push(makeBun(k,start+i*gap,y-s.h*.5,true))})}
function resetAll(){sinking=false;flood=sink=impact=0;draft=targetDraft=trim=targetTrim=roll=targetRoll=0;makeTray();recalculate();setMessage("空荷の喫水へ戻りました",1000)}
function switchShip(key){if(key===shipKey)return;shipKey=key;document.querySelectorAll(".ship-btn").forEach((b,i)=>b.classList.toggle("active",Object.keys(SHIPS)[i]===key));document.getElementById("ship-note").textContent=SHIPS[key].note;sinking=false;flood=sink=impact=0;draft=targetDraft=trim=targetTrim=roll=targetRoll=0;layout();makeTray();recalculate();setMessage("同じ荷物でも、沈み方が変わります",1500)}
function recalculate(){
  const s=SHIPS[shipKey],cargo=buns.filter(b=>b.onShip&&!b.falling),load=cargo.reduce((n,b)=>n+b.s.weight,0);
  const ratio=load/s.capacity;let fore=0,side=0;cargo.forEach(b=>{const nx=(b.x-ship.cx)/(ship.len*.5);fore+=b.s.weight*nx;side+=b.s.weight*b.side});
  targetDraft=ratio*s.draftRange;targetTrim=load?constrain(fore/s.capacity*14,-11,11):0;targetRoll=load?constrain(side/s.capacity*18/s.stability,-14,14):0;
  if(!sinking&&ratio>1.04){sinking=true;setMessage("積載限界を超えました — 浸水が始まります",2500);sound("alarm")}
  updateReadout(load,ratio);
}
function updateReadout(load,ratio){const s=SHIPS[shipKey];document.getElementById("load-value").textContent=`${load} / ${s.capacity} t`;document.getElementById("draft-value").textContent=(.5+(s.baseDraft+targetDraft)*s.depth*2.7).toFixed(1)+" m";let state="安定";if(sinking)state="浸水中";else if(abs(targetTrim)>7||abs(targetRoll)>8)state="偏りあり";else if(ratio>.82)state="限界に近い";document.getElementById("stability-value").textContent=state}
function updateWorld(){
  const dt=min(.035,deltaTime/1000);draft=lerp(draft,targetDraft,min(1,dt*2.4));trim=lerp(trim,targetTrim,min(1,dt*2.2));roll=lerp(roll,targetRoll,min(1,dt*2.5));impact*=pow(.025,dt);
  if(sinking){flood=min(1,flood+dt*.12);if(flood>.22)targetRoll+=sin(millis()*.0011)*dt*5;if(flood>.46)sink+=dt*(7+flood*19);if(flood>.78)targetTrim=lerp(targetTrim,targetTrim>=0?18:-18,dt*.3)}
  buns.forEach(b=>{if(b.falling&&b!==dragging){b.vy+=560*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.rot+=b.vx*dt*.007;if(b.y>height+80){b.falling=false;b.tray=true;b.x=b.homeX;b.y=b.homeY;b.rot=0}}});
}
function waveY(x){return ship.waterY+sin(x*.018+millis()*.00135)*3+sin(x*.006-millis()*.0008)*2}
function hullPoseY(){return ship.deckY+draft*ship.depth+sink+sin(millis()*.0014)*1.6+impact*sin(millis()*.024)}
function draw(){updateWorld();drawSky();drawShip();drawWaterOverlay();drawBuns();drawTopView();drawTrayLabels()}
function drawSky(){background("#e8f1f0");noStroke();fill("#d9e9e7");ellipse(width*.14,height*.22,180,180);fill("#edf5f3");ellipse(width*.87,height*.28,250,250);stroke(68,111,120,45);strokeWeight(1);line(0,ship.waterY,width,ship.waterY)}
function transformShip(fn){push();translate(ship.cx,hullPoseY());rotate(radians(trim+roll*.34));fn();pop()}
function hullPoints(){const L=ship.len,D=ship.depth;return[[-L*.49,0],[-L*.43,D*.52],[-L*.22,D*.78],[L*.31,D*.78],[L*.48,D*.28],[L*.5,0]]}
function drawShip(){
  const s=SHIPS[shipKey];transformShip(()=>{const pts=hullPoints();stroke("#25383d");strokeWeight(2);fill(s.color);beginShape();pts.forEach(p=>vertex(p[0],p[1]));endShape(CLOSE);fill(s.deck);noStroke();rect(-ship.len*.47,-7,ship.len*.94,10,3);
    if(s.super==="sail"){stroke("#4b3b2e");strokeWeight(5);line(-ship.len*.08,-6,-ship.len*.08,-ship.depth*1.25);noStroke();fill("#faf0d6");triangle(-ship.len*.07,-ship.depth*1.18,-ship.len*.07,-14,ship.len*.18,-20);fill("#e9d2ad");triangle(-ship.len*.1,-ship.depth*1.08,-ship.len*.1,-20,-ship.len*.28,-28)}
    if(s.super==="steam"){noStroke();fill("#eef0e6");rect(-ship.len*.17,-ship.depth*.42,ship.len*.35,ship.depth*.39,4);fill("#33494e");rect(-ship.len*.1,-ship.depth*.78,ship.len*.08,ship.depth*.4,3);fill("#d6a251");rect(-ship.len*.095,-ship.depth*.77,ship.len*.07,7)}
    if(s.super==="cargo"||s.super==="container"){noStroke();fill("#edf0e7");rect(ship.len*.23,-ship.depth*.44,ship.len*.16,ship.depth*.42,3);fill("#53717a");for(let i=0;i<3;i++)rect(ship.len*(.255+i*.035),-ship.depth*.37,ship.len*.022,6)}
    if(s.super==="container"){const colors=["#d95f45","#d8a348","#628b80"];noStroke();for(let r=0;r<2;r++)for(let i=0;i<5;i++){fill(colors[(i+r)%3]);rect(-ship.len*.35+i*ship.len*.105,-15-r*18,ship.len*.095,15,2)}}
    drawDraftMarks();if(flood>0){fill(76,147,161,170);noStroke();rect(-ship.len*.39,-2,ship.len*.78,flood*ship.depth*.38)}
  })
}
function drawDraftMarks(){stroke(255,255,255,115);strokeWeight(1);for(let i=1;i<=5;i++){const y=i*ship.depth*.12;line(ship.len*.34,y,ship.len*(.34+(i%2?.035:.055)),y)}}
function drawWaterOverlay(){noStroke();fill(64,139,157,205);beginShape();vertex(0,height);for(let x=0;x<=width+12;x+=12)vertex(x,waveY(x));vertex(width,height);endShape(CLOSE);stroke(239,250,246,165);strokeWeight(2);noFill();beginShape();for(let x=0;x<=width+10;x+=10)vertex(x,waveY(x));endShape();if(impact>.15){noFill();stroke(235,250,246,140*impact);for(let i=0;i<3;i++)ellipse(ship.cx,ship.waterY,impact*(80+i*70),impact*(10+i*7))}}
function cargoScreenPos(b){const a=radians(trim+roll*.34),lx=b.x-ship.cx,base=hullPoseY()-b.s.h*.5-9-abs(b.side)*5;return{x:ship.cx+lx*cos(a),y:base+lx*sin(a)}}
function drawBuns(){buns.filter(b=>b!==dragging).forEach(drawBun);if(dragging)drawBun(dragging)}
function drawBun(b){let x=b.x,y=b.y;if(b.onShip&&!b.falling&&b!==dragging){const p=cargoScreenPos(b);x=p.x;y=p.y}const bob=b.tray?sin(millis()*.002+b.id)*1.2:0;push();translate(x,y+bob);rotate(b.rot);b.actor.lookAt(mouseX,mouseY);b.actor.drawAt(0,0,{bodyWidth:b.s.w,bodyHeight:b.s.h,bodyColor:b.s.color,scaleX:b===dragging?1.05:1,scaleY:b===dragging?.94:1});pop()}
function drawTopView(){const x=width-105,y=height-78;if(width<520||height<520)return;push();translate(x,y);noStroke();fill(248,251,244,190);rect(-75,-47,150,94,13);fill(75,103,107,130);textAlign(CENTER);textSize(9);text("重量バランス",0,-32);stroke(75,103,107,75);line(-53,3,53,3);line(0,-20,0,26);noFill();strokeWeight(2);ellipse(0,3,96,33);const cargo=buns.filter(b=>b.onShip);cargo.forEach(b=>{fill("#e06e4f");noStroke();circle(constrain((b.x-ship.cx)/(ship.len*.5)*42,-42,42),3+b.side*11,3+b.s.weight*.65)});noStroke();fill(75,103,107,100);textSize(8);text("船首",57,6);text("左舷",0,-20);text("右舷",0,34);pop()}
function drawTrayLabels(){noStroke();fill(55,77,79,135);textAlign(CENTER,CENTER);textSize(9);buns.filter(b=>b.tray&&!b.falling).forEach(b=>text(b.s.label,b.x,height-14))}
function pick(x,y){return buns.slice().reverse().find(b=>{const p=b.onShip?cargoScreenPos(b):b;return !b.falling&&abs(x-p.x)<b.s.w*.68&&abs(y-p.y)<b.s.h*.75})}
function mousePressed(){unlockAudio();const b=pick(mouseX,mouseY);if(!b)return false;const p=b.onShip?cargoScreenPos(b):b;dragging=b;dragDX=mouseX-p.x;dragDY=mouseY-p.y;if(b.tray){const replacement=makeBun(b.size,b.homeX,b.homeY,true);buns.unshift(replacement)}b.onShip=false;b.tray=false;recalculate();document.querySelector("canvas").classList.add("dragging");return false}
function mouseDragged(){if(!dragging)return false;dragging.x=mouseX-dragDX;dragging.y=mouseY-dragDY;return false}
function mouseReleased(){if(!dragging)return false;const b=dragging;dragging=null;document.querySelector("canvas").classList.remove("dragging");const deck=hullPoseY();if(!sinking&&b.x>ship.left-25&&b.x<ship.right+25&&b.y>deck-ship.depth*1.5&&b.y<ship.waterY+35){b.x=constrain(b.x,ship.left+18,ship.right-18);b.side=constrain((b.y-(deck-45))/65,-1,1);b.onShip=true;b.tray=false;b.falling=false;impact=min(1,impact+.32+b.s.weight*.055);sound("land",b.s.weight);document.getElementById("hint").classList.add("hidden");recalculate()}else{b.falling=true;b.vx=0;b.vy=20}return false}
function setMessage(text,duration){const el=document.getElementById("message");el.textContent=text;el.classList.add("show");clearTimeout(messageTimer);messageTimer=setTimeout(()=>el.classList.remove("show"),duration)}
function unlockAudio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==="suspended")audioCtx.resume()}
function sound(kind,w=2){if(!audioCtx)return;const now=audioCtx.currentTime,o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=kind==="alarm"?"triangle":"sine";o.frequency.setValueAtTime(kind==="alarm"?130:180-w*9,now);o.frequency.exponentialRampToValueAtTime(kind==="alarm"?58:72,now+(kind==="alarm"?.7:.22));g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(kind==="alarm"?.08:.035,now+.01);g.gain.exponentialRampToValueAtTime(.0001,now+(kind==="alarm"?.75:.25));o.connect(g).connect(audioCtx.destination);o.start();o.stop(now+.8)}
function touchStarted(){return mousePressed()}function touchMoved(){return mouseDragged()}function touchEnded(){return mouseReleased()}
function windowResized(){const cargo=buns.filter(b=>b.onShip).map(b=>({size:b.size,nx:(b.x-ship.left)/ship.len,side:b.side}));resizeCanvas(windowWidth,windowHeight);layout();makeTray();cargo.forEach(c=>{const b=makeBun(c.size,lerp(ship.left,ship.right,c.nx),ship.deckY,false);b.onShip=true;b.tray=false;b.side=c.side;buns.push(b)});recalculate()}

"use strict";

const PALETTE=["#fff8e8","#f4b9a8","#f2ce69","#9bcbb8","#92bada","#c5acd7"];
const NOTES=[261.63,293.66,329.63,349.23,392,440,493.88,523.25];
const GENESIS="00000000";
let blocks=[],selected=-1,scrollX=0,targetScroll=0,worldW=0;
let dragStart=null,dragging=false,pressTimer=0,audioCtx=null,propagation=null,repairing=null;
let hint,statusEl,repairBtn;

function setup(){
  const c=createCanvas(windowWidth,windowHeight);c.parent("sketch");pixelDensity(min(devicePixelRatio||1,2));
  hint=document.getElementById("hint");statusEl=document.getElementById("status");repairBtn=document.getElementById("repair");
  document.getElementById("add").onclick=addBlock;document.getElementById("reset").onclick=resetChain;repairBtn.onclick=repairChain;
  resetChain();
}

function resetChain(){
  unlockAudio();blocks=[];selected=-1;scrollX=targetScroll=0;propagation=repairing=null;
  for(let i=0;i<5;i++)createBlock(i===0?0:-(4-i)*90,true);
  updateStatus();hint.textContent="マーパンをさわると、記録が見える";hint.style.opacity=1;
}

function tinyHash(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16).toUpperCase().padStart(8,"0")}
function stamp(){return new Date().toISOString()}
function computeHash(b){return tinyHash(`${b.blockNumber}|${b.timestamp}|${b.data.color}|${b.data.note}|${b.previousHash}`)}
function createBlock(delay=0,initial=false){
  const i=blocks.length,prev=i?blocks[i-1].hash:GENESIS,b={blockNumber:i+1,timestamp:stamp(),data:{color:PALETTE[i%PALETTE.length],note:i%NOTES.length},previousHash:prev,hash:"",actor:null,born:millis()+delay,phase:initial?3:0,invalid:false,alarmAt:0,repairAt:0};
  b.hash=computeHash(b);b.actor=new Marpan25D({bodyColor:b.data.color,maxSize:140,autoBlink:true});blocks.push(b);return b;
}
function addBlock(){
  if(propagation||repairing)return;unlockAudio();const b=createBlock();selected=-1;worldMetrics();targetScroll=max(0,worldW-width+55);
  setTimeout(()=>{if(blocks.includes(b)){b.phase=1;softTick(NOTES[(b.blockNumber-1)%8]*.5,.055)}},280);
  setTimeout(()=>{if(blocks.includes(b)){b.phase=2;softTick(NOTES[(b.blockNumber-1)%8]*.75,.05)}},620);
  setTimeout(()=>{if(blocks.includes(b)){b.phase=3;b.actor.bounce(1.5);chime(NOTES[(b.blockNumber-1)%8]);}},900);
  hint.style.opacity=0;
}

function tamper(index,colorIndex=null){
  if(propagation||repairing||index<0)return;unlockAudio();const b=blocks[index],old=b.hash;
  const ci=colorIndex===null?(PALETTE.indexOf(b.data.color)+1)%PALETTE.length:colorIndex;
  if(PALETTE[ci]===b.data.color)return;b.data.color=PALETTE[ci];b.data.note=(b.data.note+1)%NOTES.length;b.actor.setBodyColor(b.data.color);b.hash=computeHash(b);b.actor.bounce(1.8);selected=index;
  wobbleSound();
  if(index<blocks.length-1&&old!==b.hash){propagation={next:index+1,at:millis()+520};hint.textContent="…うしろの子が気づきはじめた";hint.style.opacity=1}
  updateStatus();
}
function advanceEvents(){
  const now=millis();
  if(propagation&&now>=propagation.at){const i=propagation.next,b=blocks[i];b.invalid=true;b.alarmAt=now;b.actor.blink([0,2],260);brokenTick(i);propagation.next++;propagation.at=now+430;if(propagation.next>=blocks.length){propagation=null;updateStatus();hint.textContent="記録のつながりが、ここからずれた"}}
  if(repairing&&now>=repairing.at){const i=repairing.next,b=blocks[i];b.previousHash=i?blocks[i-1].hash:GENESIS;b.hash=computeHash(b);b.invalid=false;b.repairAt=now;b.actor.bounce(1.15);softTick(NOTES[i%8],.065);repairing.next++;repairing.at=now+330;if(repairing.next>=blocks.length){repairing=null;updateStatus();hint.textContent="ぜんぶ、もう一度つながった";setTimeout(()=>hint.style.opacity=0,1800)}}
}
function repairChain(){
  if(propagation||repairing)return;const first=blocks.findIndex(b=>b.invalid);if(first<0)return;unlockAudio();repairing={next:first,at:millis()+120};statusEl.textContent="つなぎなおし中";statusEl.className="fix";repairBtn.hidden=true;
}
function updateStatus(){const bad=blocks.some(b=>b.invalid)||propagation;statusEl.textContent=bad?"つながりが変":"つながってる";statusEl.className=bad?"bad":"";repairBtn.hidden=!blocks.some(b=>b.invalid)||!!propagation}

function worldMetrics(){const gap=170,margin=max(90,width*.18);worldW=margin*2+max(0,blocks.length-1)*gap;return{gap,margin}}
function blockPos(i){const {gap,margin}=worldMetrics();return{x:margin+i*gap-scrollX,y:height*.5+(i%2?5:-5)}}
function draw(){
  advanceEvents();scrollX=lerp(scrollX,targetScroll,.12);background("#f3ead8");drawBackdrop();drawLinks();for(let i=0;i<blocks.length;i++)drawBlock(blocks[i],i);if(selected>=0)drawInfo(selected);
}
function drawBackdrop(){noStroke();for(let i=0;i<8;i++){fill(255,250,239,42);ellipse((i*233-scrollX*.08)% (width+260)-80,height*.2+(i%3)*height*.25,220,220)}stroke(88,68,48,22);strokeWeight(1);line(0,height*.67,width,height*.67)}
function drawLinks(){
  for(let i=1;i<blocks.length;i++){const a=blockPos(i-1),b=blockPos(i),bad=blocks[i].invalid,t=constrain((millis()-blocks[i].alarmAt)/330,0,1),fixed=constrain((millis()-blocks[i].repairAt)/260,0,1);let drop=bad?18*t:blocks[i].repairAt?18*(1-fixed):0;
    push();strokeCap(ROUND);strokeWeight(8);if(bad){stroke("#d56a5a");drawingContext.setLineDash([5,10])}else stroke("#776c5f");line(a.x+61,a.y+4,b.x-61,b.y+4+drop);drawingContext.setLineDash([]);noStroke();fill(bad?"#d56a5a":"#776c5f");circle(a.x+62,a.y+4,13);circle(b.x-62,b.y+4+drop,13);pop();
  }
}
function drawBlock(b,i){
  const p=blockPos(i),age=millis()-b.born;if(age<0)return;let s=1,y=p.y,rot=0;
  if(b.phase<3){s=b.phase===0?easeOutBack(constrain(age/280,0,1)):.98;if(b.phase===1){b.actor.lookAt(blockPos(i-1).x,p.y);rot=-.07}else if(b.phase===2){rot=.05}}
  if(b.invalid){const q=millis()-b.alarmAt;rot=sin(q*.055)*.035*(q<650?1:.25);y+=sin(q*.09)*3*(q<650?1:.25);const eye=floor(q/100)%2?.26:-.26;b.actor.setFixedEyeOffset(0,eye,-.04);b.actor.setFixedEyeOffset(1,-eye*.6,.05);b.actor.setFixedEyeOffset(2,eye,-.04)}else{b.actor.clearAllEyeSettings();b.actor.lookAt(mouseX,mouseY)}
  push();translate(p.x,y);rotate(rot);scale(s);if(b.invalid){noStroke();fill(216,93,76,25);circle(0,0,150)}if(selected===i){noFill();stroke(54,47,40,90);strokeWeight(2);circle(0,0,151)}b.actor.drawAt(0,0,{bodyWidth:122,bodyHeight:91,bodyColor:b.data.color});pop();
}
function easeOutBack(x){const c=1.70158;return 1+(c+1)*pow(x-1,3)+c*pow(x-1,2)}
function drawInfo(i){
  const b=blocks[i],p=blockPos(i);if(p.x<-100||p.x>width+100)return;const above=p.y>170,y=above?p.y-105:p.y+83;
  push();textAlign(CENTER,CENTER);noStroke();fill(48,43,39,205);textFont("monospace");textSize(10);text(`#${String(b.blockNumber).padStart(4,"0")}   ${b.timestamp.slice(11,19)}\nHASH: ${b.hash.slice(0,4)}…   PREV: ${b.previousHash.slice(0,4)}…`,p.x,y);const py=y+35;for(let c=0;c<PALETTE.length;c++){fill(PALETTE[c]);stroke(c===PALETTE.indexOf(b.data.color)?48:255,180);strokeWeight(c===PALETTE.indexOf(b.data.color)?3:1);circle(p.x+(c-2.5)*24,py,16)}noStroke();fill(92,82,72,160);textFont("sans-serif");textSize(9);text("色を変えると、記録も変わる",p.x,py+24);pop();
}
function pickBlock(x,y){for(let i=blocks.length-1;i>=0;i--){const p=blockPos(i);if(dist(x,y,p.x,p.y)<70)return i}return-1}
function palettePick(x,y){if(selected<0)return-1;const p=blockPos(selected),infoY=(p.y>170?p.y-105:p.y+83)+35;for(let c=0;c<PALETTE.length;c++)if(dist(x,y,p.x+(c-2.5)*24,infoY)<13)return c;return-1}
function mousePressed(){unlockAudio();const c=palettePick(mouseX,mouseY);if(c>=0){tamper(selected,c);return false}dragStart={x:mouseX,y:mouseY,scroll:targetScroll,index:pickBlock(mouseX,mouseY),time:millis()};dragging=false;pressTimer=millis();return false}
function mouseDragged(){if(!dragStart)return false;if(abs(mouseX-dragStart.x)>5){dragging=true;targetScroll=constrain(dragStart.scroll-(mouseX-dragStart.x),0,max(0,worldW-width));document.querySelector("canvas").classList.add("dragging")}return false}
function mouseReleased(){if(!dragStart)return false;document.querySelector("canvas").classList.remove("dragging");if(!dragging){const i=dragStart.index;if(i>=0){if(selected===i&&millis()-pressTimer>520)tamper(i);else{selected=i;hint.style.opacity=0}}else selected=-1}dragStart=null;return false}
function mouseWheel(e){targetScroll=constrain(targetScroll+e.deltaY+e.deltaX,0,max(0,worldW-width));return false}
function touchStarted(){return mousePressed()}function touchMoved(){return mouseDragged()}function touchEnded(){return mouseReleased()}
function windowResized(){resizeCanvas(windowWidth,windowHeight);targetScroll=constrain(targetScroll,0,max(0,worldW-width))}

function unlockAudio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==="suspended")audioCtx.resume()}
function tone(freq,when,dur,gain,type="sine"){const o=audioCtx.createOscillator(),v=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,when);v.gain.setValueAtTime(.0001,when);v.gain.exponentialRampToValueAtTime(gain,when+.012);v.gain.exponentialRampToValueAtTime(.0001,when+dur);o.connect(v).connect(audioCtx.destination);o.start(when);o.stop(when+dur+.03)}
function chime(freq){const n=audioCtx.currentTime;tone(freq,n,.24,.065);tone(freq*2,n+.04,.17,.025)}
function softTick(freq,g=.05){if(!audioCtx)return;tone(freq,audioCtx.currentTime,.1,g,"triangle")}
function wobbleSound(){const n=audioCtx.currentTime;tone(185,n,.22,.035,"triangle");tone(196,n+.015,.2,.025,"sine")}
function brokenTick(i){const n=audioCtx.currentTime;tone(155-i*3,n,.13,.025,"square");tone(218+i*5,n+.02,.12,.018,"triangle")}

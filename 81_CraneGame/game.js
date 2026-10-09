"use strict";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const NOTE_NAMES = ["ド","レ","ミ","ファ","ソ","ラ","シ","ド"];
const LETTERS = ["A","S","D","F","G","H","J","K"];
const COLORS = ["#df7468","#e5a04b","#d5bd4b","#77b66e","#55a5a8","#6f91c1","#9c7ac0","#c97691"];
const FREQ = [261.63,293.66,329.63,349.23,392,440,493.88,523.25];
const BEAT_MS = 560;
const SONG = [0,0,4,4,5,5,4,3,3,2,2,1,1,0];
const SONG_BEATS = [0,1,2,3,4,5,6,8,9,10,11,12,13,14];
const SONG_END_BEAT = 16;
let audio, master, state = "idle", selected = 0, startAt = 0, beatIndex = -1, inputIndex = -1, guideIndex = -1, songPerfect = true;
let depth = 0.08, targetDepth = .08, craneX = .5, targetX = .5, phaseAt = 0, held = null;
let playNo = 1, gets = 0, particles = [], shake = 0, last = performance.now();
let history = [], collection = [];

const prizes = [];
const variants = ["small","normal","bread","family","big","normal","small","bread"];
for(let col=0;col<8;col++) for(let row=0;row<3;row++) prizes.push({
  id:`${col}-${row}`, col, depth:[.19,.51,.82][row] + ((col%3)-1)*.018,
  variant:variants[(col+row*3)%variants.length], tilt:((col*17+row*23)%15-7)*.018,
  seed:col*31+row*19, captured:false, falling:false, fallY:0, eyeX:0, eyeY:0
});

const pulseTrack=document.querySelector("#pulseTrack");
SONG.forEach((note,i)=>{const p=document.createElement("i");p.className=`pulse${i===6?' bar':''}`;p.style.setProperty("--note",COLORS[note]);p.textContent=NOTE_NAMES[note];pulseTrack.append(p)});
const keys=document.querySelector("#keys");
NOTE_NAMES.forEach((n,i)=>{const b=document.createElement("button");b.className="key";b.style.setProperty("--note",COLORS[i]);b.innerHTML=`${n}<small>${LETTERS[i]}</small>`;b.addEventListener("pointerdown",()=>press(i));keys.append(b)});
document.querySelector("#reset").onclick=resetGame;
window.addEventListener("keydown",e=>{const i=LETTERS.indexOf(e.key.toUpperCase());if(i>=0&&!e.repeat){e.preventDefault();press(i)}});

function audioReady(){if(!audio){audio=new(window.AudioContext||window.webkitAudioContext)();master=audio.createGain();master.gain.value=.18;master.connect(audio.destination)}if(audio.state==="suspended")audio.resume()}
function tone(i,quality=1){audioReady();const t=audio.currentTime,o=audio.createOscillator(),g=audio.createGain(),f=FREQ[i];o.type="sine";o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(.4*quality+.08,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+.28);o.connect(g);g.connect(master);o.start(t);o.stop(t+.3);const o2=audio.createOscillator(),g2=audio.createGain();o2.type="triangle";o2.frequency.value=f*2;g2.gain.value=.055*quality;o2.connect(g2);g2.connect(g);o2.start(t);o2.stop(t+.18)}
function tick(accent=false){if(!audio)return;const t=audio.currentTime,o=audio.createOscillator(),g=audio.createGain();o.frequency.value=accent?900:620;o.type="sine";g.gain.setValueAtTime(.08,t);g.gain.exponentialRampToValueAtTime(.001,t+.055);o.connect(g);g.connect(master);o.start(t);o.stop(t+.06)}
function guideTone(i){if(!audio)return;const t=audio.currentTime,o=audio.createOscillator(),g=audio.createGain();o.type="sine";o.frequency.value=FREQ[i]*2;g.gain.setValueAtTime(.045,t);g.gain.exponentialRampToValueAtTime(.001,t+.22);o.connect(g);g.connect(master);o.start(t);o.stop(t+.24)}

function press(i){
  if(["drop","grab","lift","return","release","fall"].includes(state))return;
  document.querySelectorAll(".key")[i].classList.add("active");setTimeout(()=>document.querySelectorAll(".key")[i].classList.remove("active"),120);
  tone(i);
  if(state==="idle"||state==="result"){
    startSong();
  }
  if(state!=="rhythm")return;
  selected=i;targetX=(i+.5)/8;updateKeys();
  const elapsed=performance.now()-startAt;
  let nearest=0,best=Infinity;
  SONG_BEATS.forEach((b,n)=>{const d=Math.abs(elapsed-b*BEAT_MS);if(d<best){best=d;nearest=n}});
  const delta=best;
  if(nearest<=inputIndex||nearest>=SONG.length){depth=Math.min(.9,depth+.008);targetDepth=depth;showJudge("MISS","miss");addHistory(i,false);songPerfect=false;return}
  if(nearest!==inputIndex+1)songPerfect=false;
  inputIndex=nearest;
  let label,score;
  if(delta<=55){label="PERFECT";score=.0615}
  else if(delta<=115){label="GREAT";score=.052}
  else if(delta<=185){label="GOOD";score=.034}
  else{label="MISS";score=.012}
  if(label!=="PERFECT")songPerfect=false;
  depth=Math.min(.9,depth+score);targetDepth=depth;
  showJudge(label,label==="MISS"?"miss":"");addHistory(i,label!=="MISS");
  const dot=pulseTrack.children[nearest];if(dot)dot.className=`pulse${nearest===6?' bar':''} ${label!=="MISS"?'hit':'missed'}`;
}
function startSong(){
  state="rhythm";startAt=performance.now();phaseAt=startAt;beatIndex=-1;guideIndex=-1;inputIndex=-1;songPerfect=true;depth=.08;targetDepth=.08;
  setInstruction("♪ 好きな音をビートに合わせて演奏しよう","同じ音ならまっすぐ、メロディーなら左右に揺れて進みます");
  document.querySelector("#beatTitle").textContent="PLAY 0 / 14";document.querySelector("#beatHint").textContent="きらきら星はお手本。音は自由です";
}
function addHistory(i,good){history.push({i,good});history=history.slice(-48);document.querySelector("#history").innerHTML=history.map(x=>`<i class="${x.good?'':'bad'}" style="background:${COLORS[x.i]}"></i>`).join("")}
function updateKeys(){document.querySelectorAll(".key").forEach((k,i)=>{k.classList.toggle("selected",state==="rhythm"&&i===selected);k.classList.remove("locked")})}
function setInstruction(a,b){const el=document.querySelector("#instruction");el.innerHTML=`<b>${a}</b><span>${b}</span>`}
function showJudge(text,cls=""){const j=document.querySelector("#judge");j.textContent=text;j.className=`judge ${cls}`;void j.offsetWidth;j.classList.add("show")}
function beginDrop(){state="drop";phaseAt=performance.now();setInstruction("③ アームが自動でおります","うまくつかめるかな？");document.querySelector("#beatTitle").textContent="位置を決定！";document.querySelector("#beatHint").textContent="アームが下降します"}

function update(now){
  const dt=Math.min(40,now-last)/16.67;last=now;craneX+=(targetX-craneX)*.09*dt;
  if(state==="rhythm"){
    const elapsed=now-startAt,bi=Math.floor(elapsed/BEAT_MS);
    if(bi!==beatIndex&&bi<=SONG_END_BEAT){beatIndex=bi;tick(bi===0)}
    let gi=-1;for(let n=0;n<SONG_BEATS.length;n++)if(elapsed>=SONG_BEATS[n]*BEAT_MS)gi=n;
    if(gi!==guideIndex&&gi<SONG.length){guideIndex=gi;if(gi>=0)guideTone(SONG[gi]);[...pulseTrack.children].forEach((p,n)=>p.classList.toggle("current",n===gi));document.querySelector("#beatTitle").textContent=`PLAY ${Math.max(0,gi+1)} / 14`;updateKeys()}
    if(elapsed>BEAT_MS*(SONG_END_BEAT+.3))beginDrop();
  }
  const t=(now-phaseAt)/1000;
  if(state==="drop"&&t>1.55){state="grab";phaseAt=now;attemptGrab()}
  else if(state==="grab"&&t>.75){state="lift";phaseAt=now}
  else if(state==="lift"&&t>1.35){if(held){state="return";phaseAt=now;targetX=.065}else finish(false)}
  else if(state==="return"){
    if(held&&held.slipAt&&t>held.slipAt){dropHeld(false);state="fall";phaseAt=now}
    else if(t>2.25){state="release";phaseAt=now}
  } else if(state==="release"&&t>.62){if(held)dropHeld(true);state="fall";phaseAt=now}
  else if(state==="fall"&&t>1.0)finish(!!document.querySelector("#judge").classList.contains("get"));
  particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.12*dt;p.life-=dt});particles=particles.filter(p=>p.life>0);shake*=.9;
}
function attemptGrab(){
  const shadow=project(craneX*8-.5,depth);
  const candidates=prizes.filter(p=>!p.captured&&!p.won).map(p=>{
    const q=project(p.col,p.depth),variantScale=p.variant==="small"?.72:p.variant==="big"?1.25:1;
    const prizeW=86*q.scale*variantScale,prizeH=prizeW*.68;
    const dx=(q.x+Math.sin(p.seed)*11*q.scale)-shadow.x,dy=q.y-(shadow.y+18);
    const contact=Math.sqrt((dx/(54+prizeW*.5))**2+(dy/(18+prizeH*.5))**2);
    return{p,contact};
  }).filter(item=>item.contact<=1).sort((a,b)=>a.contact-b.contact);
  if(!candidates.length){held=null;showJudge("からぶり","miss");return}
  held=candidates[0].p;held.captured=true;held.slipAt=0;
}
function dropHeld(success){
  if(!held)return;held.falling=true;held.fallY=0;if(success){held.won=true;held.slipAt=0;showJudge("GET!","get");gets++;collection.push(held.variant);burst(95,600,COLORS[held.col]);updateCollection()}else{held.captured=false;held.depth=Math.max(.12,Math.min(.9,held.depth+(Math.random()-.5)*.18));held.tilt+=(Math.random()-.5)*.5;showJudge("おしい！","miss");shake=7}held=null
}
function finish(){state="result";selected=0;targetX=.5;depth=.08;targetDepth=.08;playNo++;document.querySelector("#plays").textContent=`PLAY ${String(playNo).padStart(2,"0")}`;updateKeys();setInstruction("おてほん ♪ ド ド ソ ソ ラ ラ ソ｜ファ ファ ミ ミ レ レ ド","同じ音の連続でも、自由なメロディーでもOK");document.querySelector("#beatTitle").textContent="好きな音からスタート";document.querySelector("#beatHint").textContent="ビートに合わせると大きく奥へ";[...pulseTrack.children].forEach((p,n)=>p.className=`pulse${n===6?' bar':''}`)}
function updateCollection(){document.querySelector("#getCount").textContent=`GET ${gets}`;document.querySelector("#collectionItems").innerHTML=collection.map(v=>`<b class="mini ${v}"></b>`).join("")}
function resetGame(){prizes.forEach(p=>{p.captured=false;p.won=false;p.falling=false});history=[];collection=[];gets=0;playNo=0;document.querySelector("#history").innerHTML="";updateCollection();finish()}
function burst(x,y,c){for(let i=0;i<28;i++)particles.push({x,y,vx:(Math.random()-.5)*8,vy:-2-Math.random()*6,life:35+Math.random()*30,c})}

function geom(){const w=canvas.width,h=canvas.height;return{w,h,left:118,right:w-70,top:75,floorTop:160,floorBottom:625,frontY:632}}
function project(col,d){const g=geom(),farW=(g.right-g.left)*.72,nearW=g.right-g.left;const y=g.floorTop+(g.floorBottom-g.floorTop)*d;const width=farW+(nearW-farW)*d;const center=(g.left+g.right)/2;return{x:center-width/2+width*(col+.5)/8,y,scale:.63+d*.42}}
function roundRect(x,y,w,h,r,fill,stroke,lw=1){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke()}}
function draw(){const g=geom();ctx.clearRect(0,0,g.w,g.h);ctx.save();if(shake)ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);drawMachine(g);const sorted=prizes.filter(p=>!p.won&&!p.captured).sort((a,b)=>a.depth-b.depth);sorted.forEach(drawPrize);drawCrane(g);particles.forEach(p=>{ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,3,0,7);ctx.fill()});ctx.restore()}
function drawMachine(g){
  const grad=ctx.createLinearGradient(0,0,0,g.h);grad.addColorStop(0,"#d9ede7");grad.addColorStop(1,"#a9cfc4");ctx.fillStyle=grad;ctx.fillRect(0,0,g.w,g.h);
  ctx.fillStyle="#b5d6cc";ctx.beginPath();ctx.moveTo(g.left+130,g.floorTop);ctx.lineTo(g.right-85,g.floorTop);ctx.lineTo(g.right,g.floorBottom);ctx.lineTo(g.left,g.floorBottom);ctx.closePath();ctx.fill();
  for(let i=0;i<8;i++){const a=project(i,0),b=project(i,1);ctx.strokeStyle=COLORS[i]+"35";ctx.lineWidth=15;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.fillStyle=COLORS[i]+"99";ctx.font="800 15px sans-serif";ctx.textAlign="center";ctx.fillText(NOTE_NAMES[i],a.x,a.y+22)}
  ctx.fillStyle="#769f9566";ctx.beginPath();ctx.moveTo(g.left,g.floorBottom);ctx.lineTo(g.right,g.floorBottom);ctx.lineTo(g.right-25,g.frontY+55);ctx.lineTo(g.left+20,g.frontY+55);ctx.closePath();ctx.fill();
  roundRect(33,29,g.w-66,g.h-43,25,null,"#426762",10);roundRect(47,43,g.w-94,g.h-70,18,null,"#effff9aa",4);
  ctx.fillStyle="#315d57";ctx.fillRect(0,0,g.w,35);ctx.fillRect(0,g.h-38,g.w,38);ctx.fillRect(34,0,18,g.h);ctx.fillRect(g.w-52,0,18,g.h);
  roundRect(58,523,150,137,13,"#294e49","#effbf4",4);roundRect(78,545,110,79,8,"#162d2a");ctx.fillStyle="#d8c86c";ctx.font="800 13px sans-serif";ctx.textAlign="center";ctx.fillText("PRIZE OUT",133,646);
  const glass=ctx.createLinearGradient(0,0,g.w,0);glass.addColorStop(0,"#ffffff2b");glass.addColorStop(.18,"#ffffff05");glass.addColorStop(.78,"#ffffff17");glass.addColorStop(1,"#ffffff42");ctx.fillStyle=glass;ctx.fillRect(53,38,g.w-106,g.h-80);
}
function drawPrize(p){const q=project(p.col,p.depth);let x=q.x+Math.sin(p.seed)*11*q.scale,y=q.y;drawMarpan(x,y,q.scale,p.variant,p.tilt,p)}
function drawMarpan(x,y,s,variant,tilt,p){ctx.save();ctx.translate(x,y);ctx.rotate(tilt);let w=86*s,h=w*.68,color="#fff";if(variant==="small"){w*=.72;h*=.72}if(variant==="big"){w*=1.25;h*=1.25}if(variant==="bread")color="#e3ad61";if(variant==="family")w*=1.12;ctx.shadowColor="#34554b42";ctx.shadowBlur=8;ctx.shadowOffsetY=6;ctx.fillStyle=color;ctx.strokeStyle="#121212";ctx.lineWidth=Math.max(2, w*.012);ctx.lineJoin="round";ctx.beginPath();ctx.moveTo(0,-h*.5);ctx.bezierCurveTo(w*.27,-h*.5,w*.5,-h*.25,w*.48,h*.2);ctx.bezierCurveTo(w*.46,h*.46,w*.25,h*.5,0,h*.5);ctx.bezierCurveTo(-w*.25,h*.5,-w*.46,h*.46,-w*.48,h*.2);ctx.bezierCurveTo(-w*.5,-h*.25,-w*.26,-h*.5,0,-h*.5);ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowColor="transparent";if(variant==="bread"){ctx.strokeStyle="#ba763e";ctx.lineWidth=Math.max(2,3*s);[-.2,.1,.4].forEach(k=>{ctx.beginPath();ctx.moveTo(k*w-12*s,-h*.33);ctx.lineTo(k*w-2*s,-h*.12);ctx.stroke()})}const gaze=held===p?Math.sin(performance.now()*.012)*w*.025:Math.max(-w*.035,Math.min(w*.035,(craneX-(p.col+.5)/8)*w*.18));[-.44,0,.44].forEach((longitude,j)=>{const projection=Math.cos(longitude),distanceScale=.76+projection*.24,eyeW=w*.135*1.42*distanceScale*projection,eyeH=w*.135*1.42*1.08*distanceScale,eyeX=Math.sin(longitude)*w*.47;ctx.strokeStyle="#121212";ctx.lineWidth=Math.max(1.5,eyeW*.045);ctx.fillStyle="#fff";ctx.beginPath();ctx.ellipse(eyeX,0,eyeW/2,eyeH/2,0,0,Math.PI*2);ctx.fill();ctx.stroke();const pupilY=held===p?Math.sin(performance.now()*.02+j)*eyeH*.08:0;ctx.fillStyle="#121212";ctx.beginPath();ctx.arc(eyeX+gaze,pupilY,eyeW*.19,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(eyeX+gaze-eyeW*.055,pupilY-eyeW*.055,Math.max(1,eyeW*.055),0,Math.PI*2);ctx.fill()});if(variant==="family"){drawBaby(-w*.28,-h*.34,s*.42);drawBaby(w*.26,-h*.31,s*.35)}ctx.restore()}
function drawBaby(x,y,s){ctx.save();ctx.translate(x,y);ctx.fillStyle="#f7e8ce";ctx.strokeStyle="#314944";ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(0,0,35*s,26*s,0,0,7);ctx.fill();ctx.stroke();[-8,0,8].forEach(ex=>{ctx.fillStyle="#263b38";ctx.beginPath();ctx.arc(ex*s,-1,2.8,0,7);ctx.fill()});ctx.restore()}
function cranePose(){const q=project(craneX*8-.5,depth);let drop=0,open=.7;if(state==="drop"){const t=Math.min(1,(performance.now()-phaseAt)/1200);drop=t;open=1}else if(state==="grab"){drop=1;open=Math.max(.18,1-(performance.now()-phaseAt)/700)}else if(state==="lift"){drop=Math.max(0,1-(performance.now()-phaseAt)/1200);open=.2}else if(state==="return"||state==="release"){drop=0;open=.2}return{x:q.x,y:92+(q.y-92)*.16,groundY:q.y,drop,open}}
function drawCrane(g){const c=cranePose(),headY=c.y+(c.groundY-c.y-45)*c.drop;ctx.save();ctx.globalAlpha=.12+c.drop*.16;ctx.fillStyle="#183d37";ctx.beginPath();ctx.ellipse(c.x,c.groundY+18,54-c.drop*14,18-c.drop*4,0,0,Math.PI*2);ctx.fill();ctx.restore();ctx.strokeStyle="#36534e";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(c.x,35);ctx.lineTo(c.x,c.y-9);ctx.stroke();roundRect(c.x-39,c.y-18,78,36,10,"#f7d369","#36534e",4);ctx.fillStyle="#36534e";ctx.beginPath();ctx.arc(c.x,c.y,8,0,7);ctx.fill();ctx.strokeStyle="#526e68";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(c.x,c.y+9);ctx.lineTo(c.x,headY);ctx.stroke();ctx.save();ctx.translate(c.x,headY);ctx.strokeStyle="#324e49";ctx.lineWidth=7;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(-12,20,-29*c.open,54);ctx.lineTo(-20*c.open,72);ctx.moveTo(0,0);ctx.quadraticCurveTo(12,20,29*c.open,54);ctx.lineTo(20*c.open,72);ctx.stroke();ctx.restore();if(held){const sway=Math.sin(performance.now()*.009)*8;drawMarpan(c.x+sway,headY+83,project(held.col,held.depth).scale,held.variant,held.tilt+Math.sin(performance.now()*.01)*.09,held)}}

function loop(now){update(now);draw();requestAnimationFrame(loop)}requestAnimationFrame(loop);

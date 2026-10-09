"use strict";

const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d");
const live = document.getElementById("live");
const soundButton = document.getElementById("sound");
const TAU = Math.PI * 2;
const NOTES = [
  { ja:"ド", label:"♪", freq:261.63, color:"#e87567" },
  { ja:"レ", label:"♩", freq:293.66, color:"#e6a24e" },
  { ja:"ミ", label:"♫", freq:329.63, color:"#d5bd4b" },
  { ja:"ファ",label:"♪", freq:349.23, color:"#77b66e" },
  { ja:"ソ", label:"♩", freq:392.00, color:"#55a5a8" },
  { ja:"ラ", label:"♫", freq:440.00, color:"#6f91c1" },
  { ja:"シ", label:"♪", freq:493.88, color:"#9c7ac0" },
  { ja:"ド", label:"♫", freq:523.25, color:"#f07d7c" }
];

let w=0, h=0, dpr=1, size=220, cx=0, cy=0;
let candies=[], stored=[], sparks=[], floaters=[], flight=null;
let state="idle", stateAt=0, mouth=0, glow=0, pointer={x:0,y:0};
let releaseAfter=920;
let audio=null, master=null, soundOn=true, reduced=false, last=0;

function resize(){
  dpr=Math.min(devicePixelRatio||1,2); w=innerWidth; h=innerHeight;
  canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr);
  canvas.style.width=w+"px"; canvas.style.height=h+"px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
  size=Math.min(w*.29,h*.34,260); if(w<600) size=Math.min(w*.39,h*.26,205);
  cx=w*.5; cy=h*(w<600?.54:.56);
  if(!candies.length) createCandies(); else placeCandies();
}

function createCandies(){ candies=NOTES.map((_,i)=>({ note:i, eaten:false, phase:Math.random()*TAU, spin:(Math.random()-.5)*.25, x:0,y:0 })); placeCandies(); }
function placeCandies(){
  const portrait=h>w*1.05, rx=Math.min(w*.41,size*(portrait?1.28:1.75)), ry=Math.min(h*.34,size*1.12);
  candies.forEach((c,i)=>{ const a=-Math.PI*.86+i/7*Math.PI*1.72; c.x=cx+Math.cos(a)*rx; c.y=cy+Math.sin(a)*ry+(portrait&&i>2&&i<5?size*.13:0); });
}

function roundedRect(x,y,ww,hh,r){ctx.beginPath();ctx.roundRect(x,y,ww,hh,r);}
function star(x,y,r,alpha=1){ ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.globalAlpha=alpha;ctx.fillStyle="#f8e7b0";ctx.fillRect(-r/2,-r*2,r,r*4);ctx.fillRect(-r*2,-r/2,r*4,r);ctx.restore(); }
function drawBackground(t){
  const g=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(w,h)*.75);g.addColorStop(0,"#25204a");g.addColorStop(.43,"#11152f");g.addColorStop(1,"#060817");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  for(let i=0;i<34;i++){ const x=(i*149.3)%w,y=70+(i*83.7)%(h*.67), tw=.3+.7*Math.sin(t*.001+i); star(x,y,1+(i%3)*.45,.12+tw*.28); }
  ctx.save();ctx.globalAlpha=.22;ctx.fillStyle="#ebe4c8";ctx.beginPath();ctx.arc(w*.12,h*.2,Math.min(w,h)*.065,0,TAU);ctx.fill();ctx.fillStyle="#11152f";ctx.beginPath();ctx.arc(w*.14,h*.18,Math.min(w,h)*.062,0,TAU);ctx.fill();ctx.restore();
  ctx.fillStyle="#080b18";ctx.beginPath();ctx.moveTo(0,h);ctx.lineTo(0,h*.88);for(let x=0;x<=w;x+=50)ctx.lineTo(x,h*.87-Math.sin(x*.019)*12);ctx.lineTo(w,h);ctx.fill();
}

function pumpkinTransform(t){
  let shake=0, squash=0;
  if(state==="rumble"){const q=Math.min(1,(t-stateAt)/850);shake=Math.sin(t*.08)*size*.025*q;squash=Math.sin(t*.045)*.035;}
  if(state==="pop"){const q=Math.min(1,(t-stateAt)/250);squash=Math.sin(q*Math.PI)*-.1;}
  ctx.translate(cx+shake,cy);ctx.scale(1+squash,1-squash);
}
function pumpkinPath(scale=1){
  const s=size*scale;ctx.beginPath();ctx.moveTo(0,-s*.67);ctx.bezierCurveTo(s*.56,-s*.72,s*.78,-s*.35,s*.72,s*.08);ctx.bezierCurveTo(s*.68,s*.58,s*.35,s*.73,0,s*.71);ctx.bezierCurveTo(-s*.35,s*.73,-s*.68,s*.58,-s*.72,s*.08);ctx.bezierCurveTo(-s*.78,-s*.35,-s*.56,-s*.72,0,-s*.67);ctx.closePath();
}
function drawPumpkin(t){
  ctx.save();pumpkinTransform(t);
  ctx.shadowColor=`rgba(255,116,25,${.32+glow*.42})`;ctx.shadowBlur=size*(.2+glow*.25);pumpkinPath();const body=ctx.createRadialGradient(0,size*.08,size*.08,0,0,size);body.addColorStop(0,glow>.2?"#ffb436":"#f58424");body.addColorStop(.6,"#db5a16");body.addColorStop(1,"#7d2617");ctx.fillStyle=body;ctx.fill();ctx.shadowBlur=0;
  [-.48,-.25,0,.25,.48].forEach((n,i)=>{ctx.strokeStyle=i===2?"rgba(255,183,59,.27)":"rgba(91,24,20,.3)";ctx.lineWidth=Math.max(2,size*.025);ctx.beginPath();ctx.moveTo(n*size,-size*.58);ctx.bezierCurveTo(n*size*1.45,-size*.18,n*size*1.45,size*.34,n*size,size*.62);ctx.stroke();});
  ctx.fillStyle="#42311c";ctx.beginPath();ctx.moveTo(-size*.09,-size*.66);ctx.lineTo(-size*.03,-size*.9);ctx.quadraticCurveTo(size*.18,-size*.91,size*.19,-size*.72);ctx.lineTo(size*.09,-size*.62);ctx.fill();
  drawInnerNotes(t); drawFace(t);
  ctx.restore();
}
function drawFace(t){
  // 共通マーパンと同じ、横一列の白い楕円眼＋丸い瞳。
  // marpan-25d.js の bodyW 比率、経度投影、瞳比率をCanvas用に移植している。
  const bodyW=size*1.44,bodyH=size*1.38,baseEyeW=bodyW*.135*1.42,baseEyeH=baseEyeW*1.08;
  const gazeX=Math.max(-1,Math.min(1,(pointer.x-cx)/(bodyW*.5)));
  const gazeY=Math.max(-1,Math.min(1,(pointer.y-cy)/(bodyH*.5)));
  const cycle=t%3600,blink=cycle>3380?Math.max(.055,Math.abs((cycle-3490)/110)):1;
  [-1,0,1].forEach((index)=>{
    const longitude=index*.44,depth=Math.cos(longitude),distance=.76+depth*.24;
    const eyeW=baseEyeW*distance*depth,eyeH=baseEyeH*distance;
    const x=Math.sin(longitude)*bodyW*.47,y=-size*.2;
    const pupilX=gazeX*eyeW*.2,pupilY=gazeY*eyeH*.18;
    ctx.save();ctx.translate(x,y);ctx.scale(1,blink);
    ctx.shadowColor=`rgba(255,190,55,${.46+glow*.28})`;ctx.shadowBlur=size*(.07+glow*.04);
    ctx.fillStyle="#fffdf5";ctx.strokeStyle="#121212";ctx.lineWidth=Math.max(2,eyeW*.045);
    ctx.beginPath();ctx.ellipse(0,0,eyeW*.5,eyeH*.5,0,0,TAU);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    if(blink>.18){ctx.fillStyle="#121212";ctx.beginPath();ctx.ellipse(pupilX,pupilY,eyeW*.19,eyeW*.19,0,0,TAU);ctx.fill();ctx.fillStyle="rgba(255,255,255,.8)";ctx.beginPath();ctx.arc(pupilX-eyeW*.055,pupilY-eyeW*.055,Math.max(1.5,eyeW*.035),0,TAU);ctx.fill();}
    ctx.restore();
  });
  const open=.03+mouth*.21;ctx.fillStyle="#2d1220";ctx.beginPath();ctx.moveTo(-size*.39,size*.17);ctx.quadraticCurveTo(0,size*(.27+open),size*.39,size*.17);ctx.quadraticCurveTo(0,size*(.42+open),-size*.39,size*.17);ctx.fill();
  ctx.save();ctx.shadowColor="#ffbd35";ctx.shadowBlur=size*(.1+glow*.13);ctx.fillStyle=`rgba(255,190,48,${.7+glow*.25})`;ctx.beginPath();ctx.moveTo(-size*.32,size*.2);ctx.quadraticCurveTo(0,size*(.26+open),size*.32,size*.2);ctx.quadraticCurveTo(0,size*(.34+open),-size*.32,size*.2);ctx.fill();ctx.restore();
  [[-.25,.2],[-.08,.25],[.11,.24],[.28,.19]].forEach(([x,y],i)=>{ctx.fillStyle="#ffe49a";ctx.beginPath();ctx.moveTo(size*x,size*y);ctx.lineTo(size*(x+.07),size*(y+.01));ctx.lineTo(size*(x+.035),size*(y+.085*(i%2?1:-1)));ctx.fill();});
}
function drawInnerNotes(t){
  stored.forEach((n,i)=>{const a=i*2.4+t*.00035, r=size*(.08+.055*i);ctx.save();ctx.globalAlpha=.42+.25*Math.sin(t*.004+i);ctx.fillStyle=NOTES[n].color;ctx.font=`700 ${size*.1}px Georgia`;ctx.textAlign="center";ctx.fillText(i%2?"♪":"·",Math.cos(a)*r,size*.48+Math.sin(a)*r*.28);ctx.restore();});
}

function candyRadius(){return Math.max(24,Math.min(34,size*.16));}
function drawCandy(c,t){ if(c.eaten)return; const bob=Math.sin(t*.0025+c.phase)*5,r=candyRadius();ctx.save();ctx.translate(c.x,c.y+bob);ctx.rotate(c.spin+Math.sin(t*.001+c.phase)*.08);ctx.shadowColor=c.note===2?"rgba(255,225,90,.35)":c.color+"55";ctx.shadowBlur=14;ctx.fillStyle=c.color;roundedRect(-r*.78,-r*.61,r*1.56,r*1.22,r*.38);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle="rgba(255,255,255,.24)";roundedRect(-r*.55,-r*.44,r*.7,r*.18,r*.09);ctx.fill();ctx.fillStyle="#fff7dc";ctx.font=`700 ${r*.88}px Georgia`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(NOTES[c.note].label,0,-1);ctx.fillStyle=c.color;ctx.beginPath();ctx.moveTo(-r*.76,-r*.25);ctx.lineTo(-r*1.18,-r*.62);ctx.lineTo(-r*1.14,r*.35);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(r*.76,-r*.25);ctx.lineTo(r*1.18,-r*.62);ctx.lineTo(r*1.14,r*.35);ctx.closePath();ctx.fill();ctx.restore(); }
function drawFlight(t){if(!flight)return;const n=NOTES[flight.note],r=candyRadius(),q=flight.q,x=quad(flight.x,cx+(flight.x<cx?size:-size)*.5,cx,q),y=quad(flight.y,Math.min(flight.y,cy)-size*.75,cy+size*.23,q);ctx.save();ctx.translate(x,y);ctx.rotate(q*TAU*1.25);ctx.scale(1-q*.62,1-q*.62);ctx.fillStyle=n.color;roundedRect(-r*.7,-r*.52,r*1.4,r*1.04,r*.3);ctx.fill();ctx.fillStyle="#fff5d5";ctx.font=`700 ${r*.8}px Georgia`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(n.label,0,0);ctx.restore();}
function quad(a,b,c,t){return (1-t)*(1-t)*a+2*(1-t)*t*b+t*t*c;}
function drawEffects(t){
  sparks.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life/55);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,TAU);ctx.fill();});ctx.globalAlpha=1;
  floaters.forEach(p=>{ctx.save();ctx.globalAlpha=Math.max(0,p.life/120);ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.color;ctx.font=`700 ${p.size}px Georgia`;ctx.textAlign="center";ctx.fillText(p.label,0,0);ctx.restore();});
}

function update(dt,t){
  glow*=Math.pow(.91,dt/16.7);mouth*=Math.pow(.88,dt/16.7);
  sparks.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.0008*dt;p.life-=dt/16.7;});sparks=sparks.filter(p=>p.life>0);
  floaters.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy-=.00003*dt;p.rot+=p.vr*dt;p.life-=dt/16.7;});floaters=floaters.filter(p=>p.life>0);
  if(flight){flight.q=Math.min(1,flight.q+dt/620);mouth=Math.max(mouth,Math.sin(flight.q*Math.PI)*.9);if(flight.q>=1)eat(t);}
  if(state==="rumble"&&t-stateAt>releaseAfter)releaseMelody(t);
  if(state==="pop"&&t-stateAt>Math.max(1700,stored.length*230+450)){
    stored=[];state="idle";
    candies.forEach((c,i)=>{c.eaten=false;c.note=i;c.phase=Math.random()*TAU;});
    placeCandies();announce("もう一度、音符のお菓子を選べます");
  }
}
function eat(t){
  const n=flight.note;flight=null;stored.push(n);mouth=1;glow=1;playNote(n,.28);burst(cx,cy+size*.18,NOTES[n].color,12);announce(`${NOTES[n].ja}を食べました。音が${stored.length}つたまりました`);
  if(stored.length>=8){beginRelease(t,920);}else {state="idle";setTimeout(respawn,720);}
}
function beginRelease(t,delay=920){state="rumble";stateAt=t;releaseAfter=delay;setTimeout(()=>{if(state==="rumble")playPop();},Math.max(80,delay-160));}
function respawn(){const empty=candies.find(c=>c.eaten);if(!empty||state!=="idle")return;empty.note=Math.floor(Math.random()*NOTES.length);empty.phase=Math.random()*TAU;empty.eaten=false;placeCandies();}
function releaseMelody(t){
  state="pop";stateAt=t;mouth=1;glow=1;
  stored.forEach((n,i)=>{const spread=stored.length===1?.5:i/(stored.length-1),a=-Math.PI*.82+spread*Math.PI*.64;floaters.push({x:cx+(i-stored.length/2)*3,y:cy+size*.16,vx:Math.cos(a)*(.045+Math.random()*.025),vy:-.055-Math.random()*.035,vr:(Math.random()-.5)*.002,rot:0,life:115+Math.random()*30,size:size*(.13+Math.random()*.07),color:NOTES[n].color,label:i%3===1?"♫":"♪"});setTimeout(()=>playNote(n,.4),i*230);});
  announce("ポン！ 作ったメロディーを再生します");
}
function burst(x,y,color,count){for(let i=0;i<count;i++){const a=Math.random()*TAU,s=.03+Math.random()*.07;sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-.03,r:1+Math.random()*3,life:35+Math.random()*25,color});}}

function ensureAudio(){if(!audio){audio=new (window.AudioContext||window.webkitAudioContext)();master=audio.createGain();master.gain.value=.35;master.connect(audio.destination);}if(audio.state==="suspended")audio.resume();}
function playNote(index,duration){if(!soundOn)return;ensureAudio();const now=audio.currentTime+.015,n=NOTES[index],osc=audio.createOscillator(),harm=audio.createOscillator(),gain=audio.createGain(),hg=audio.createGain();osc.type="sine";harm.type="triangle";osc.frequency.value=n.freq;harm.frequency.value=n.freq*2;gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.24,now+.018);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);hg.gain.setValueAtTime(.055,now);hg.gain.exponentialRampToValueAtTime(.0001,now+duration*.65);osc.connect(gain).connect(master);harm.connect(hg).connect(master);osc.start(now);harm.start(now);osc.stop(now+duration+.05);harm.stop(now+duration+.05);}
function playPop(){if(!soundOn)return;ensureAudio();const now=audio.currentTime+.01,o=audio.createOscillator(),g=audio.createGain();o.type="sine";o.frequency.setValueAtTime(130,now);o.frequency.exponentialRampToValueAtTime(260,now+.09);g.gain.setValueAtTime(.18,now);g.gain.exponentialRampToValueAtTime(.0001,now+.16);o.connect(g).connect(master);o.start(now);o.stop(now+.18);}

function activate(e){e.preventDefault();ensureAudio();if(state!=="idle"||flight)return;const rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top,r=candyRadius()*1.35;let best=null,bd=Infinity;candies.forEach(c=>{if(c.eaten)return;const d=Math.hypot(x-c.x,y-c.y);if(d<r&&d<bd){best=c;bd=d;}});if(best){best.eaten=true;flight={note:best.note,x:best.x,y:best.y,q:0};state="feeding";burst(best.x,best.y,NOTES[best.note].color,7);return;}const onMarpan=Math.pow((x-cx)/(size*.74),2)+Math.pow((y-cy)/(size*.76),2)<=1;if(onMarpan&&stored.length){beginRelease(performance.now(),380);announce(`${stored.length}つの音を放出します`);}}
function announce(s){live.textContent="";requestAnimationFrame(()=>live.textContent=s);}
function frame(t){const dt=Math.min(34,t-(last||t));last=t;update(dt,t);drawBackground(t);candies.forEach(c=>drawCandy(c,t));drawPumpkin(t);drawFlight(t);drawEffects(t);requestAnimationFrame(frame);}

canvas.addEventListener("pointerdown",activate,{passive:false});
canvas.addEventListener("pointermove",e=>{const r=canvas.getBoundingClientRect();pointer.x=e.clientX-r.left;pointer.y=e.clientY-r.top;},{passive:true});
soundButton.addEventListener("click",()=>{soundOn=!soundOn;soundButton.setAttribute("aria-pressed",String(soundOn));soundButton.textContent=soundOn?"♪":"×";if(soundOn){ensureAudio();playNote(7,.18);}});
addEventListener("resize",resize);reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;resize();requestAnimationFrame(frame);

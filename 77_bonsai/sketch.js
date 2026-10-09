"use strict";

// One node is one connected branch segment. A live tip lengthens its segment;
// a cut retires that tip and later activates two lateral buds below the cut.
const canvas = document.getElementById("bonsai");
const ctx = canvas.getContext("2d");
const STORAGE = "marpan-bonsai-77-v1";
const TAU = Math.PI * 2;
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const rand = (a,b) => a + Math.random()*(b-a);
const mix = (a,b,t) => a+(b-a)*t;
let nodes=[], nextId=1, elapsed=0, cuts=0, particles=[], flashes=[];
let view={scale:1,x:0,y:0}, size={w:0,h:0,dpr:1}, last=performance.now();
let hover=null, audio=null, saveClock=0, cameraScale=1, lastCutAt=-100;

function node(parent,x,y,angle,speed,initialLength=0){
  const n={id:nextId++,parent:parent?.id??null,children:[],x,y,
    angle,length:initialLength,age:0,speed,alive:true,wait:0,
    width:1,wood:0,prunes:0,curve:rand(-.13,.13),seed:rand(0,TAU)};
  nodes.push(n); if(parent) parent.children.push(n.id); return n;
}
function fresh(){
  nodes=[];nextId=1;elapsed=0;cuts=0;particles=[];flashes=[];cameraScale=1;
  lastCutAt=-100;
  const trunk=node(null,0,0,-Math.PI/2,5.8,24);
  trunk.age=5;trunk.alive=false;
  const p=endOf(trunk);
  node(trunk,p.x,p.y,-Math.PI/2-.54,6.0,8);
  node(trunk,p.x,p.y,-Math.PI/2+.48,5.4,7);
  try{localStorage.removeItem(STORAGE)}catch{}
}
function endOf(n){
  const a=n.angle+n.curve*Math.min(n.length/110,1);
  return{x:n.x+Math.cos(a)*n.length,y:n.y+Math.sin(a)*n.length};
}
function byId(){return new Map(nodes.map(n=>[n.id,n]));}
function descendants(n,map,output=[]){
  for(const id of n.children){const c=map.get(id);if(c){output.push(c);descendants(c,map,output)}}
  return output;
}
function update(dt){
  elapsed+=dt;
  const map=byId();
  const activeTips=nodes.reduce((count,n)=>count+(n.alive?1:0),0);
  // Keep the lively opening, then give an established tree room to be pruned.
  const ageTempo=.24+.76*Math.exp(-Math.max(0,elapsed-8)/75);
  const canopyTempo=1/Math.sqrt(Math.max(1,activeTips/3));
  const cutTempo=elapsed-lastCutAt<1.5?.35:1;
  const growthTempo=ageTempo*canopyTempo*cutTempo;
  for(const n of nodes){
    n.age+=dt;
    if(n.wait>0){n.wait-=dt;if(n.wait<=0) sprout(n);continue}
    if(!n.alive)continue;
    const tip=endOf(n);
    const envelope=Math.max(Math.abs(tip.x)*.68,-tip.y*.30);
    const slow=clamp(1-envelope/1550,.22,1);
    n.length+=n.speed*dt*slow*growthTempo;
    // Gentle, bounded curvature gives each specimen its own silhouette.
    n.angle+=Math.sin(elapsed*.12+n.seed)*.0007*dt;
    if(n.length>130 && n.parent!==null){n.speed*=.998**dt}
  }
  // Sapwood thickens according to the living and woody structure it supports.
  const memo=new Map();
  function load(n){
    if(memo.has(n.id))return memo.get(n.id);
    let supported=n.alive?1.5:0, active=n.alive?1:0, foliage=n.alive?Math.min(n.age/9,1):0;
    for(const id of n.children){const c=map.get(id);if(!c)continue;const v=load(c);supported+=v.supported;active+=v.active;foliage+=v.foliage}
    const v={supported,active,foliage};memo.set(n.id,v);return v;
  }
  if(nodes[0])load(nodes[0]);
  for(const n of nodes){
    const v=memo.get(n.id)||{supported:0,active:0,foliage:0};
    const base=1.15+Math.sqrt(v.supported)*.95+Math.log1p(v.foliage)*.47;
    const maturity=(1-Math.exp(-n.age/65))*2.1;
    const history=Math.log1p(cuts)*.38*(n.parent===null?1:.4);
    const target=base+maturity+history+Math.sqrt(v.active)*.19;
    n.width+=Math.max(0,target-n.width)*Math.min(1,dt*.032);
    n.wood=clamp(n.age/22,0,1);
  }
  particles=particles.filter(p=>p.life>0);
  for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=32*dt;p.rotation+=p.spin*dt;p.life-=dt}
  flashes=flashes.filter(f=>f.life>0);for(const f of flashes)f.life-=dt;
  saveClock+=dt;if(saveClock>5){saveClock=0;save()}
}
function sprout(n){
  const tip=endOf(n), base=n.angle;
  const lean=clamp((base+Math.PI/2)*.22,-.24,.24);
  for(const sign of [-1,1]){
    const angle=clamp(base+sign*rand(.38,.68)-lean,-Math.PI+.13,-.13);
    const child=node(n,tip.x,tip.y,angle,rand(4.8,7.8));
    child.seed=rand(0,TAU);
  }
}
function prune(n,t=1){
  if(n.wait>0)return;
  const tip=endOf(n);
  const oldLength=n.length;
  // A cut through established wood removes the entire crown beyond it.
  const removedIds=new Set(descendants(n,byId()).map(child=>child.id));
  if(removedIds.size)nodes=nodes.filter(branch=>!removedIds.has(branch.id));
  n.children=[];
  n.length=Math.max(7,oldLength*clamp(t,.08,1)-Math.min(3,oldLength*.04));
  n.alive=false;n.wait=rand(.65,1.35);n.prunes++;cuts++;
  lastCutAt=elapsed;
  const cut=endOf(n);
  flashes.push({x:cut.x,y:cut.y,life:.35});
  for(let i=0;i<9;i++)particles.push({x:tip.x+rand(-3,3),y:tip.y,
    vx:rand(-16,16),vy:rand(-25,-5),rotation:rand(0,TAU),spin:rand(-4,4),life:rand(.6,1.15)});
  snap();document.getElementById("hint").classList.add("hidden");save();
}
function snap(){
  try{
    audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();
    const t=audio.currentTime;
    const noise=audio.createBuffer(1,Math.floor(audio.sampleRate*.085),audio.sampleRate);
    const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/data.length*8);
    const source=audio.createBufferSource();source.buffer=noise;
    const filter=audio.createBiquadFilter();filter.type="highpass";filter.frequency.value=1250;
    const gain=audio.createGain();gain.gain.setValueAtTime(.32,t);gain.gain.exponentialRampToValueAtTime(.001,t+.085);
    source.connect(filter).connect(gain).connect(audio.destination);source.start(t);source.stop(t+.09);
  }catch{}
}
function resize(){
  size.w=innerWidth;size.h=innerHeight;size.dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(size.w*size.dpr);canvas.height=Math.round(size.h*size.dpr);
  canvas.style.width=size.w+"px";canvas.style.height=size.h+"px";
}
function camera(){
  const ends=nodes.map(endOf);
  const minX=Math.min(-95,...ends.map(p=>p.x)),maxX=Math.max(95,...ends.map(p=>p.x));
  const minY=Math.min(-155,...ends.map(p=>p.y));
  const availableW=size.w*.80,availableH=size.h*.69;
  const fit=Math.min(2.1,availableW/(maxX-minX+45),availableH/(-minY+45));
  cameraScale=mix(cameraScale,fit,.025);
  view.scale=cameraScale;
  view.x=size.w/2-(minX+maxX)*.5*cameraScale;
  view.y=size.h*.79;
}
function screen(p){return{x:view.x+p.x*view.scale,y:view.y+p.y*view.scale}}
function draw(){
  ctx.setTransform(size.dpr,0,0,size.dpr,0,0);
  ctx.fillStyle="#f7f6f2";ctx.fillRect(0,0,size.w,size.h);
  camera();
  ctx.save();ctx.translate(view.x,view.y);ctx.scale(view.scale,view.scale);
  drawPotBack();
  // Parents first, children later; thicker old wood remains visible beneath growth.
  for(const n of nodes)drawBranch(n);
  for(const n of nodes)if(n.alive)drawNeedles(n);
  for(const n of nodes)if(n.alive)drawBud(n);
  drawParticles();drawPotFront();
  ctx.restore();
  if(hover){const p=screen(hover.point);ctx.strokeStyle="rgba(109,146,67,.52)";ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(p.x,p.y,15+Math.sin(elapsed*5)*2,0,TAU);ctx.stroke()}
}
function drawBranch(n){
  const p=endOf(n),young=clamp(1-n.age/22,0,1);
  const width=Math.max(1.2,n.width*(n.parent===null?1.25:1));
  const bark=[65,57,43], green=[97,137,77];
  const color=bark.map((v,i)=>Math.round(mix(v,green[i],young)));
  ctx.strokeStyle=`rgb(${color.join(",")})`;ctx.lineCap="round";ctx.lineJoin="round";
  ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(n.x,n.y);
  const cx=(n.x+p.x)/2+Math.sin(n.seed)*Math.min(n.length*.075,7);
  const cy=(n.y+p.y)/2;
  ctx.quadraticCurveTo(cx,cy,p.x,p.y);ctx.stroke();
  if(width>5&&n.age>30){ctx.strokeStyle="rgba(193,163,113,.24)";ctx.lineWidth=Math.max(.7,width*.11);
    ctx.beginPath();ctx.moveTo(n.x-width*.17,n.y);ctx.quadraticCurveTo(cx-width*.2,cy,p.x,p.y);ctx.stroke()}
}
function drawNeedles(n){
  if(n.length<9)return;
  const p=endOf(n),a=n.angle,age=clamp(n.age/4,0,1);
  const count=clamp(Math.floor(3+n.length/13),3,10);
  ctx.lineCap="round";
  for(let i=0;i<count;i++){
    const t=.52+i/(count*1.9),x=mix(n.x,p.x,t),y=mix(n.y,p.y,t);
    const span=(6+age*6)*(1-t*.2);
    for(const side of [-1,1]){
      ctx.strokeStyle=i%3===0?"#416b43":"#547c4a";ctx.lineWidth=1.15;
      ctx.beginPath();ctx.moveTo(x,y);
      ctx.lineTo(x+Math.cos(a+side*.9)*span,y+Math.sin(a+side*.9)*span);
      ctx.stroke();
    }
  }
}
function drawBud(n){
  const p=endOf(n),pulse=1+Math.sin(elapsed*3+n.seed)*.1;
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(n.angle+Math.PI/2);
  ctx.fillStyle="#b5d875";ctx.beginPath();ctx.ellipse(0,-3,3.2*pulse,6.4*pulse,0,0,TAU);ctx.fill();
  ctx.fillStyle="#6c9d50";ctx.beginPath();ctx.ellipse(0,0,2.2,3.6,0,0,TAU);ctx.fill();ctx.restore();
}
function drawPotBack(){
  ctx.fillStyle="#b86b53";ctx.beginPath();ctx.moveTo(-59,8);ctx.lineTo(59,8);ctx.lineTo(48,53);ctx.quadraticCurveTo(0,61,-48,53);ctx.closePath();ctx.fill();
  ctx.fillStyle="#51483a";ctx.beginPath();ctx.ellipse(0,7,60,10,0,0,TAU);ctx.fill();
  ctx.fillStyle="#574e3c";ctx.beginPath();ctx.ellipse(0,5,49,5,0,0,TAU);ctx.fill();
}
function drawPotFront(){
  ctx.fillStyle="#ca8166";ctx.beginPath();ctx.moveTo(-60,10);ctx.quadraticCurveTo(0,21,60,10);
  ctx.lineTo(48,53);ctx.quadraticCurveTo(0,61,-48,53);ctx.closePath();ctx.fill();
  ctx.strokeStyle="#905645";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-60,10);ctx.quadraticCurveTo(0,21,60,10);ctx.stroke();
  ctx.fillStyle="#e6ae88";ctx.fillRect(-44,53,15,5);ctx.fillRect(29,53,15,5);
  // The familiar three white eyes are glazed onto the front of the pot.
  for(const x of [-12,0,12]){
    ctx.fillStyle="#fffaf0";ctx.strokeStyle="#493e34";ctx.lineWidth=1.5;
    ctx.beginPath();ctx.ellipse(x,35,4.1,5,0,0,TAU);ctx.fill();ctx.stroke();
    ctx.fillStyle="#493e34";ctx.beginPath();ctx.arc(x,35.6,1.35,0,TAU);ctx.fill();
  }
}
function drawParticles(){
  for(const p of particles){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rotation);
    ctx.globalAlpha=clamp(p.life,0,1);ctx.strokeStyle="#5b7d48";ctx.lineWidth=1.4;
    ctx.beginPath();ctx.moveTo(-4,0);ctx.lineTo(4,0);ctx.stroke();ctx.restore()}
  for(const f of flashes){ctx.strokeStyle=`rgba(226,145,88,${f.life*2})`;ctx.lineWidth=1.3;
    ctx.beginPath();ctx.arc(f.x,f.y,(.35-f.life)*22+2,0,TAU);ctx.stroke()}
}
function nearest(clientX,clientY){
  let chosen=null,best=Infinity;
  for(const n of nodes){if(n.wait>0)continue;
    const a=screen({x:n.x,y:n.y}),b=screen(endOf(n));
    const dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy||1;
    const t=clamp(((clientX-a.x)*dx+(clientY-a.y)*dy)/den,.08,1);
    const d=Math.hypot(clientX-(a.x+dx*t),clientY-(a.y+dy*t));
    const limit=n.alive?22:Math.max(13,n.width*view.scale*.5+8);
    if(d<limit&&d<best){best=d;chosen={node:n,t,point:{x:mix(n.x,endOf(n).x,t),y:mix(n.y,endOf(n).y,t)}}}
  }
  return chosen;
}
canvas.addEventListener("pointermove",e=>{hover=nearest(e.clientX,e.clientY);canvas.style.cursor=hover?"pointer":"crosshair"});
canvas.addEventListener("pointerleave",()=>{hover=null});
canvas.addEventListener("pointerdown",e=>{e.preventDefault();const hit=nearest(e.clientX,e.clientY);if(hit){prune(hit.node,hit.t);hover=null}});
document.getElementById("reset").addEventListener("click",()=>{fresh();document.getElementById("hint").classList.remove("hidden")});
function save(){try{localStorage.setItem(STORAGE,JSON.stringify({nodes,nextId,elapsed,cuts}))}catch{}}
function restore(){
  try{const s=JSON.parse(localStorage.getItem(STORAGE));if(!s||!Array.isArray(s.nodes)||s.nodes.length>2500)return false;
    nodes=s.nodes;nextId=s.nextId;elapsed=s.elapsed;cuts=s.cuts;
    if(cuts)document.getElementById("hint").classList.add("hidden");return true}
  catch{return false}
}
function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;update(dt);draw();requestAnimationFrame(frame)}
addEventListener("resize",resize);resize();if(!restore())fresh();requestAnimationFrame(frame);

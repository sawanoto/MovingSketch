"use strict";

const canvas = document.querySelector("#snow");
const ctx = canvas.getContext("2d");
const statusEl = document.querySelector("#status");
const nav = document.querySelector("#patterns");
const soundButton = document.querySelector("#sound");
const languageButton = document.querySelector("#language");

const PATTERNS = [
  {name:"六角板", key:"plate", length:.62, speed:54, forks:[[.38,55,.18],[.7,58,.14]], rings:[.34,.62], nested:0},
  {name:"扇", key:"fan", length:.76, speed:49, forks:[[.3,48,.2],[.46,42,.29],[.62,36,.32],[.78,31,.27]], rings:[], nested:0},
  {name:"星", key:"star", length:.82, speed:57, forks:[[.35,42,.22],[.6,39,.27],[.8,36,.22]], rings:[.2], nested:0},
  {name:"樹枝", key:"dendrite", length:.88, speed:43, forks:[[.28,52,.2],[.46,48,.25],[.64,43,.27],[.8,38,.22]], rings:[], nested:1},
  {name:"羊歯", key:"fern", length:.9, speed:40, forks:[[.22,57,.17],[.34,53,.2],[.46,49,.22],[.58,45,.23],[.7,41,.22],[.81,37,.18]], rings:[], nested:1},
  {name:"針", key:"needle", length:.92, speed:67, forks:[[.57,24,.12],[.78,20,.11]], rings:[], nested:0},
  {name:"角柱", key:"column", length:.69, speed:51, forks:[[.28,67,.12],[.72,67,.12]], rings:[.26,.48,.69], nested:0},
  {name:"複合", key:"complex", length:.88, speed:38, forks:[[.2,62,.16],[.34,56,.2],[.49,50,.25],[.63,44,.26],[.76,38,.22],[.86,32,.16]], rings:[.16,.34], nested:2}
];
const SCALE = [261.63,293.66,329.63,349.23,392,440,493.88,523.25];
const TEXT = {
  ja:{title:"雪花",subtitle:"SNOW CRYSTAL",idle:"結晶核にふれてください",growing:n=>`${n}の結晶が成長しています`,done:n=>`${n} — 完成`,rule:"枝が生まれるほど、音は高くなる",patterns:"結晶の形を選ぶ",canvas:"成長する雪の結晶",soundOff:"音を消す",soundOn:"音を出す",switch:"Switch to English",names:["六角板","扇","星","樹枝","羊歯","針","角柱","複合"]},
  en:{title:"SNOW BLOOM",subtitle:"SNOW CRYSTAL",idle:"Touch the crystal seed",growing:n=>`${n} crystal is growing`,done:n=>`${n} — COMPLETE`,rule:"As branches emerge, the notes rise",patterns:"Choose a crystal form",canvas:"A growing snow crystal",soundOff:"Mute sound",soundOn:"Turn sound on",switch:"日本語に切り替え",names:["Plate","Fan","Star","Dendrite","Fern","Needle","Column","Compound"]}
};
let language="ja"; try{language=localStorage.getItem("marpan-snow-language")==="en"?"en":"ja"}catch(_){}
const tr=key=>TEXT[language][key];
let W=0,H=0,DPR=1,cx=0,cy=0,radius=200;
let selected=3, segments=[], sparks=[], state="idle", startedAt=0, finishedAt=0, endTime=0, raf=0;
let audio=null, master=null, soundOn=true, fired=new Set(), blinkAt=0;

function resize(){
  DPR=Math.min(devicePixelRatio||1,2); W=innerWidth; H=innerHeight;
  canvas.width=W*DPR; canvas.height=H*DPR; canvas.style.width=W+"px"; canvas.style.height=H+"px";
  ctx.setTransform(DPR,0,0,DPR,0,0); cx=W/2; cy=H*.45;
  radius=Math.min(W*.36,Math.max(100,(H-235)*.46),310);
}

function iconSvg(p){
  let lines="";
  for(let a=0;a<6;a++){
    const q=a*Math.PI/3, x2=20+Math.cos(q)*16, y2=20+Math.sin(q)*16;
    lines+=`<path d="M20 20L${x2.toFixed(1)} ${y2.toFixed(1)}"/>`;
    p.forks.slice(0,Math.min(3,p.forks.length)).forEach(f=>{
      const bx=20+Math.cos(q)*16*f[0],by=20+Math.sin(q)*16*f[0],len=16*f[2]*.75,aa=f[1]*Math.PI/180;
      [-1,1].forEach(s=>lines+=`<path d="M${bx.toFixed(1)} ${by.toFixed(1)}l${(Math.cos(q+s*aa)*len).toFixed(1)} ${(Math.sin(q+s*aa)*len).toFixed(1)}"/>`);
    });
  }
  return `<svg viewBox="0 0 40 40" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width=".7" stroke-linecap="round">${lines}</g><circle cx="20" cy="20" r="1.5" fill="currentColor"/></svg>`;
}

PATTERNS.forEach((p,i)=>{
  const b=document.createElement("button"); b.className="pattern"; b.type="button"; b.title=p.name; b.setAttribute("aria-label",`${p.name}の結晶`);
  b.innerHTML=iconSvg(p)+`<span>${p.name}</span>`; b.onclick=()=>selectPattern(i); nav.appendChild(b);
});

function selectPattern(i){
  selected=i; state="idle"; segments=[]; sparks=[]; fired.clear(); blinkAt=0;
  document.querySelectorAll(".pattern").forEach((b,n)=>b.classList.toggle("selected",n===i));
  statusEl.textContent=tr("idle");
}

function addSeg(x1,y1,x2,y2,start,duration,depth,arm,parent=""){
  const id=segments.length;
  segments.push({id,x1,y1,x2,y2,start,duration,depth,arm,parent,width:depth===0?1.35:Math.max(.42,1.05-depth*.16),glow:.72+((arm*17+id*7)%9)/30});
  endTime=Math.max(endTime,start+duration); return segments[id];
}

function buildCrystal(){
  segments=[]; sparks=[]; fired.clear(); endTime=0;
  const p=PATTERNS[selected], L=radius*p.length;
  for(let arm=0;arm<6;arm++){
    const a=-Math.PI/2+arm*Math.PI/3, stagger=arm*44+((arm*37+selected*19)%31), duration=L/p.speed*1000;
    addSeg(0,0,Math.cos(a)*L,Math.sin(a)*L,stagger,duration,0,arm);
    p.forks.forEach((f,fi)=>{
      const bx=Math.cos(a)*L*f[0],by=Math.sin(a)*L*f[0], len=L*f[2], branchStart=stagger+duration*f[0]+70+fi*25;
      [-1,1].forEach(side=>{
        const ba=a+side*f[1]*Math.PI/180, bd=len/(p.speed*.78)*1000;
        const branch=addSeg(bx,by,bx+Math.cos(ba)*len,by+Math.sin(ba)*len,branchStart,bd,fi+1,arm,`f${fi}`);
        if(p.nested && fi>=Math.max(1,p.forks.length-3)){
          const count=p.nested===2?2:1;
          for(let n=0;n<count;n++){
            const at=.48+n*.25, nx=branch.x1+(branch.x2-branch.x1)*at,ny=branch.y1+(branch.y2-branch.y1)*at;
            const na=ba-side*(42-n*8)*Math.PI/180, nl=len*(.31-n*.08);
            addSeg(nx,ny,nx+Math.cos(na)*nl,ny+Math.sin(na)*nl,branchStart+bd*at+55,Math.max(230,nl/(p.speed*.68)*1000),Math.min(7,fi+3+n),arm,`n${fi}`);
          }
        }
      });
    });
  }
  p.rings.forEach((r,ri)=>{
    const pts=Array.from({length:6},(_,a)=>({x:Math.cos(-Math.PI/2+a*Math.PI/3)*L*r,y:Math.sin(-Math.PI/2+a*Math.PI/3)*L*r}));
    const start=L/p.speed*1000*r+310+ri*100;
    for(let a=0;a<6;a++){
      const n=(a+1)%6; addSeg(pts[a].x,pts[a].y,pts[n].x,pts[n].y,start+a*42,420,Math.min(7,ri+2),a,"ring");
    }
  });
}

function begin(){
  if(state!=="idle")return;
  ensureAudio(); buildCrystal(); state="growing"; startedAt=performance.now(); statusEl.textContent=tr("growing")(tr("names")[selected]);
}

function ensureAudio(){
  if(!audio){audio=new (window.AudioContext||window.webkitAudioContext)();master=audio.createGain();master.gain.value=.32;master.connect(audio.destination)}
  if(audio.state==="suspended")audio.resume();
}

function crack(note,variant=0){
  if(!soundOn||!audio)return;
  const now=audio.currentTime, freq=SCALE[Math.min(7,note)];
  const osc=audio.createOscillator(),gain=audio.createGain(),filter=audio.createBiquadFilter();
  osc.type=variant%3===0?"sine":"triangle"; osc.frequency.setValueAtTime(freq*2.02,now);osc.frequency.exponentialRampToValueAtTime(freq*1.55,now+.055);
  filter.type="highpass";filter.frequency.value=720;
  gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.11,now+.004);gain.gain.exponentialRampToValueAtTime(.0001,now+.13+variant%4*.018);
  osc.connect(filter).connect(gain).connect(master);osc.start(now);osc.stop(now+.2);
  const buffer=audio.createBuffer(1,Math.floor(audio.sampleRate*.035),audio.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);
  const noise=audio.createBufferSource(),ng=audio.createGain(),nf=audio.createBiquadFilter();noise.buffer=buffer;nf.type="bandpass";nf.frequency.value=freq*5;nf.Q.value=5;ng.gain.value=.045;
  noise.connect(nf).connect(ng).connect(master);noise.start(now);
}

function drawSeed(t){
  const pulse=state==="idle"?1+Math.sin(t*.003)*.08:1;
  ctx.save();ctx.translate(cx,cy);ctx.scale(pulse,pulse);ctx.shadowColor="#c9f4ff";ctx.shadowBlur=state==="idle"?13:7;
  const bw=27,bh=18.4,waist=bh*.2;
  ctx.beginPath();ctx.moveTo(0,-bh*.5);ctx.bezierCurveTo(bw*.27,-bh*.5,bw*.5,-bh*.25,bw*.48,waist);ctx.bezierCurveTo(bw*.46,bh*.46,bw*.25,bh*.5,0,bh*.5);ctx.bezierCurveTo(-bw*.25,bh*.5,-bw*.46,bh*.46,-bw*.48,waist);ctx.bezierCurveTo(-bw*.5,-bh*.25,-bw*.26,-bh*.5,0,-bh*.5);ctx.closePath();
  ctx.fillStyle="rgba(230,248,253,.94)";ctx.strokeStyle="rgba(127,184,207,.9)";ctx.lineWidth=.8;ctx.fill();ctx.stroke();ctx.shadowBlur=0;
  const blink=blinkAt&&t>blinkAt&&t<blinkAt+440, squeeze=blink?Math.max(.12,Math.abs(Math.cos((t-blinkAt)/440*Math.PI))):1;
  [-5.2,0,5.2].forEach((x,i)=>{const ew=i===1?3.3:3.05,eh=4.15*squeeze;ctx.fillStyle="#fff";ctx.strokeStyle="rgba(28,48,62,.9)";ctx.lineWidth=.65;ctx.beginPath();ctx.ellipse(x,0,ew/2,Math.max(.35,eh/2),0,0,Math.PI*2);ctx.fill();ctx.stroke();if(squeeze>.25){ctx.fillStyle="#162735";ctx.beginPath();ctx.arc(x,0,.62,0,Math.PI*2);ctx.fill()}});ctx.restore();
}

function render(now){
  ctx.clearRect(0,0,W,H); const elapsed=state==="growing"?now-startedAt:state==="done"?Infinity:-1;
  ctx.save();ctx.translate(cx,cy);ctx.lineCap="round";
  segments.forEach(s=>{
    if(elapsed<s.start)return; const prog=Math.min(1,(elapsed-s.start)/s.duration), ease=1-Math.pow(1-prog,2.1);
    const x=s.x1+(s.x2-s.x1)*ease,y=s.y1+(s.y2-s.y1)*ease;
    if(!fired.has(s.id)&&s.depth>0){fired.add(s.id);sparks.push({x:s.x1,y:s.y1,born:now,power:s.glow});crack(s.depth,(s.id+s.arm)%5)}
    ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(x,y);ctx.strokeStyle=`rgba(202,239,251,${.42+s.glow*.25})`;ctx.lineWidth=s.width;ctx.shadowBlur=2;ctx.shadowColor="#b9efff";ctx.stroke();
    if(prog<1){ctx.beginPath();ctx.arc(x,y,1.2+s.glow,0,Math.PI*2);ctx.fillStyle="rgba(229,251,255,.9)";ctx.shadowBlur=9;ctx.fill()}
  });
  sparks=sparks.filter(s=>now-s.born<420);sparks.forEach(s=>{const q=(now-s.born)/420;ctx.beginPath();ctx.arc(s.x,s.y,1+q*3.8,0,Math.PI*2);ctx.strokeStyle=`rgba(220,249,255,${(1-q)*.75})`;ctx.lineWidth=.8;ctx.shadowBlur=10*(1-q);ctx.stroke()});ctx.restore();
  drawSeed(now);
  if(state==="growing"&&elapsed>endTime+100){state="done";finishedAt=now;blinkAt=now+2600;statusEl.textContent=tr("done")(tr("names")[selected]);crack(7,2)}
  raf=requestAnimationFrame(render);
}

canvas.addEventListener("pointerdown",e=>{
  const d=Math.hypot(e.clientX-cx,e.clientY-cy);
  if(state==="idle"&&d<Math.max(45,radius*.19))begin();
});
soundButton.onclick=()=>{soundOn=!soundOn;soundButton.setAttribute("aria-pressed",String(soundOn));soundButton.setAttribute("aria-label",soundOn?tr("soundOff"):tr("soundOn"));if(soundOn)ensureAudio()};
function updateLanguage(){
  document.documentElement.lang=language;document.querySelector("h1").childNodes[0].nodeValue=tr("title")+" ";document.querySelector("h1 span").textContent=tr("subtitle");
  languageButton.textContent=language==="ja"?"EN":"日本語";languageButton.setAttribute("aria-label",tr("switch"));nav.setAttribute("aria-label",tr("patterns"));canvas.setAttribute("aria-label",tr("canvas"));document.querySelector(".rule span").textContent=tr("rule");
  document.querySelectorAll(".pattern").forEach((b,i)=>{b.querySelector("span").textContent=tr("names")[i];b.title=tr("names")[i];b.setAttribute("aria-label",language==="ja"?`${tr("names")[i]}の結晶`:`${tr("names")[i]} crystal`)});
  soundButton.setAttribute("aria-label",soundOn?tr("soundOff"):tr("soundOn"));
  statusEl.textContent=state==="idle"?tr("idle"):state==="growing"?tr("growing")(tr("names")[selected]):tr("done")(tr("names")[selected]);
}
languageButton.onclick=()=>{language=language==="ja"?"en":"ja";try{localStorage.setItem("marpan-snow-language",language)}catch(_){}updateLanguage()};
addEventListener("resize",resize);document.addEventListener("visibilitychange",()=>{if(document.hidden&&audio?.state==="running")audio.suspend()});
resize();selectPattern(selected);updateLanguage();raf=requestAnimationFrame(render);

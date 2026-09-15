(() => {
  "use strict";

  const canvas = document.querySelector("#universe");
  const ctx = canvas.getContext("2d");
  const hint = document.querySelector("#hint");
  const nameOutput = document.querySelector("#planet-name");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const TAU = Math.PI * 2;
  let w = 0, h = 0, dpr = 1, last = performance.now(), stars = [], dust = [];
  let pointer = { x: innerWidth / 2, y: innerHeight / 2, active: false };
  let selected = null, hideNameTimer = 0;

  const worlds = [
    { id:"mercury", name:"水星マーパン", scale:.66, speed:.085, phase:.2, lift:-.03, blink:4400, seed:11 },
    { id:"venus",   name:"金星マーパン", scale:.86, speed:-.052, phase:1.4, lift:.035, blink:5100, seed:23 },
    { id:"earth",   name:"地球マーパン", scale:.91, speed:.055, phase:2.5, lift:-.02, blink:6100, seed:37 },
    { id:"mars",    name:"火星マーパン", scale:.73, speed:.061, phase:3.1, lift:.04, blink:4700, seed:49 },
    { id:"jupiter", name:"木星マーパン", scale:1.22, speed:.096, phase:4.4, lift:-.025, blink:5700, seed:61 },
    { id:"saturn",  name:"土星マーパン", scale:1.05, speed:.083, phase:5.2, lift:.03, blink:5300, seed:79 }
  ].map(p => ({ ...p, rotation:p.phase, boost:0, focus:0, x:0, y:0, r:0 }));

  function noise(n) { const x = Math.sin(n * 91.717) * 43758.5453; return x - Math.floor(x); }

  function resize() {
    w = innerWidth; h = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    stars = Array.from({length:Math.min(260, Math.floor(w*h/3900))},(_,i)=>({
      x:noise(i+2)*w, y:noise(i+401)*h, r:.25+noise(i+817)*1.15, a:.16+noise(i+99)*.64, t:noise(i+77)*TAU
    }));
    dust = Array.from({length:14},(_,i)=>({x:noise(i+900)*w,y:noise(i+1200)*h,r:28+noise(i+42)*110,a:.008+noise(i+8)*.02}));
    layout();
  }

  function layout() {
    const mobile = w < 760;
    if (mobile) {
      const cols = 3, gapX = w / 3, gapY = Math.min(h*.35, 250);
      const base = Math.min(w*.115, h*.082, 53);
      worlds.forEach((p,i)=>{ p.x=gapX*(i%cols+.5); p.y=h*.32+Math.floor(i/cols)*gapY; p.r=base*p.scale; });
    } else {
      const margin = Math.max(62,w*.055), usable=w-margin*2, step=usable/6;
      const base=Math.min(step*.38,h*.105,76);
      worlds.forEach((p,i)=>{ p.x=margin+step*(i+.5); p.y=h*(.5+p.lift); p.r=base*p.scale; });
    }
  }

  function sphereClip(p, r) {
    ctx.beginPath(); ctx.arc(p.x,p.y,r,0,TAU); ctx.clip();
  }

  function baseSphere(p,r,colors) {
    const g=ctx.createRadialGradient(p.x-r*.35,p.y-r*.38,r*.04,p.x,p.y,r*1.15);
    colors.forEach(([stop,color])=>g.addColorStop(stop,color));
    ctx.fillStyle=g; ctx.fillRect(p.x-r,p.y-r,r*2,r*2);
  }

  function longitudeX(p,r,offset=0) { return p.x + Math.sin(p.rotation+offset)*r; }

  function drawMercury(p,r) {
    baseSphere(p,r,[[0,"#a9a59d"],[.5,"#77756f"],[1,"#292a2b"]]);
    for(let i=0;i<14;i++){
      const a=noise(p.seed+i)*TAU, rr=Math.sqrt(noise(p.seed+i+80))*r*.88, cr=r*(.035+noise(p.seed+i+140)*.105);
      const drift=Math.sin(p.rotation+noise(i)*TAU)*r*.13;
      ctx.fillStyle="rgba(35,35,34,.28)"; ctx.beginPath(); ctx.ellipse(p.x+Math.cos(a)*rr+drift,p.y+Math.sin(a)*rr,cr,cr*.72,0,0,TAU); ctx.fill();
      ctx.strokeStyle="rgba(225,220,208,.19)"; ctx.lineWidth=Math.max(1,r*.014); ctx.stroke();
    }
  }

  function drawVenus(p,r) {
    baseSphere(p,r,[[0,"#f3d58f"],[.52,"#c8843f"],[1,"#59341f"]]);
    ctx.lineCap="round";
    for(let i=-5;i<=5;i++){
      const y=p.y+i*r*.17+Math.sin(p.rotation*1.4+i)*r*.035;
      ctx.strokeStyle=i%2?"rgba(255,224,156,.37)":"rgba(112,57,27,.25)"; ctx.lineWidth=r*(.075+noise(i+91)*.05);
      ctx.beginPath(); ctx.moveTo(p.x-r*1.2,y); ctx.bezierCurveTo(p.x-r*.3,y-r*.12,p.x+r*.22,y+r*.13,p.x+r*1.2,y-r*.03); ctx.stroke();
    }
  }

  const continents = [
    [[-.78,-.5],[-.52,-.6],[-.3,-.36],[-.38,-.04],[-.62,.02],[-.82,-.2]],
    [[-.32,.05],[-.08,.02],[.06,.25],[-.08,.65],[-.27,.46],[-.38,.18]],
    [[.05,-.52],[.42,-.58],[.72,-.32],[.52,-.06],[.3,-.14],[.18,.18],[-.02,-.03]],
    [[.48,.28],[.75,.31],[.83,.56],[.56,.63],[.4,.45]]
  ];
  function drawEarth(p,r) {
    baseSphere(p,r,[[0,"#45acd5"],[.52,"#126d9f"],[1,"#052c52"]]);
    ctx.fillStyle="#4f8649";
    const shift=((p.rotation%TAU)/TAU)*r*1.5;
    continents.forEach(poly=>{ctx.beginPath();poly.forEach(([x,y],i)=>{let px=p.x+x*r-shift;while(px<p.x-r)px+=r*2.1; i?ctx.lineTo(px,p.y+y*r):ctx.moveTo(px,p.y+y*r);});ctx.closePath();ctx.fill();});
    ctx.strokeStyle="rgba(230,247,255,.27)"; ctx.lineWidth=r*.035;
    for(let i=-2;i<=2;i++){const y=p.y+i*r*.27;ctx.beginPath();ctx.arc(p.x-r*.08,y,r*(.38+Math.abs(i)*.12),.1,2.55);ctx.stroke();}
  }

  function drawMars(p,r) {
    baseSphere(p,r,[[0,"#d77a4d"],[.53,"#a9432c"],[1,"#421b19"]]);
    ctx.fillStyle="rgba(74,26,22,.32)";
    for(let i=0;i<9;i++){const a=noise(p.seed+i)*TAU,rr=noise(i+64)*r*.78;ctx.beginPath();ctx.ellipse(p.x+Math.cos(a)*rr+Math.sin(p.rotation)*r*.08,p.y+Math.sin(a)*rr,r*(.05+noise(i+9)*.11),r*.035,noise(i)*TAU,0,TAU);ctx.fill();}
    ctx.fillStyle="rgba(240,221,196,.72)";ctx.beginPath();ctx.ellipse(p.x,p.y-r*.88,r*.28,r*.08,0,0,TAU);ctx.fill();
  }

  function drawJupiter(p,r) {
    baseSphere(p,r,[[0,"#f2d8b1"],[.58,"#b87b59"],[1,"#4d302d"]]);
    const bands=["#d8a275","#f0d0a6","#9f6049","#e8bd91","#7f4c42","#e4c19d","#b36c50"];
    bands.forEach((c,i)=>{const y=p.y-r*.72+i*r*.23+Math.sin(p.rotation*1.6+i)*r*.018;ctx.fillStyle=c;ctx.globalAlpha=.66;ctx.fillRect(p.x-r,y,r*2,r*.16);}); ctx.globalAlpha=1;
    const spotX=longitudeX(p,r*.6,1.5); if(Math.cos(p.rotation+1.5)>-.15){ctx.fillStyle="#a83f31";ctx.beginPath();ctx.ellipse(spotX,p.y+r*.28,r*.22,r*.11,-.08,0,TAU);ctx.fill();}
  }

  function drawSaturn(p,r) {
    baseSphere(p,r,[[0,"#f1dba2"],[.58,"#c5a66d"],[1,"#55442c"]]);
    for(let i=-4;i<=4;i++){ctx.strokeStyle=i%2?"rgba(112,82,47,.28)":"rgba(255,238,181,.31)";ctx.lineWidth=r*.07;ctx.beginPath();ctx.moveTo(p.x-r,p.y+i*r*.17);ctx.lineTo(p.x+r,p.y+i*r*.17);ctx.stroke();}
  }

  function ringPath(p,r,front) {
    ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(-.16); ctx.scale(1,.29);
    ctx.strokeStyle=front?"rgba(222,194,132,.9)":"rgba(143,119,80,.52)";ctx.lineWidth=r*.23;
    ctx.beginPath();ctx.arc(0,0,r*1.62,front?0:Math.PI,front?Math.PI:TAU);ctx.stroke();
    ctx.strokeStyle="rgba(91,75,54,.48)";ctx.lineWidth=r*.035;ctx.beginPath();ctx.arc(0,0,r*1.62,front?0:Math.PI,front?Math.PI:TAU);ctx.stroke();ctx.restore();
  }

  function drawEyes(p,r,time) {
    const dx=pointer.x-p.x,dy=pointer.y-p.y,dist=Math.max(1,Math.hypot(dx,dy));
    const gazeX=Math.max(-1,Math.min(1,dx/(r*3))),gazeY=Math.max(-1,Math.min(1,dy/(r*3)));
    const phase=(time+p.seed*137)%p.blink;
    const blink=phase>p.blink-190?Math.max(.055,Math.abs((phase-(p.blink-95))/95)):1;
    [-.44,0,.44].forEach(longitude=>{
      const depth=Math.cos(longitude),ex=p.x+Math.sin(longitude)*r*.94,ey=p.y-r*.035;
      const ew=r*.383*(.76+depth*.24)*depth,eh=r*.383*1.08*(.76+depth*.24)*blink;
      ctx.save();ctx.translate(ex,ey);ctx.shadowColor="rgba(0,0,0,.3)";ctx.shadowBlur=r*.022;
      ctx.fillStyle="rgba(255,255,255,.97)";ctx.strokeStyle="#121212";ctx.lineWidth=Math.max(1.5,ew*.045);ctx.beginPath();ctx.ellipse(0,0,ew*.5,eh*.5,0,0,TAU);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
      if(blink>.18){ctx.fillStyle="#121212";ctx.beginPath();ctx.arc(gazeX*ew*.2,gazeY*eh*.17,ew*.19,0,TAU);ctx.fill();}
      ctx.restore();
    });
  }

  function drawWorld(p,time) {
    const bob=reduceMotion.matches?0:Math.sin(time*.00055+p.phase)*Math.min(5,p.r*.045);
    const oldY=p.y;p.y+=bob-p.focus*p.r*.07;const r=p.r*(1+p.focus*.2);
    ctx.save();ctx.shadowColor=p.id==="earth"?"rgba(76,165,230,.38)":"rgba(170,196,220,.2)";ctx.shadowBlur=r*(.1+p.focus*.08);
    if(p.id==="saturn") ringPath(p,r,false);
    ctx.beginPath();ctx.arc(p.x,p.y,r,0,TAU);ctx.fillStyle="#111";ctx.fill();ctx.save();sphereClip(p,r);
    ({mercury:drawMercury,venus:drawVenus,earth:drawEarth,mars:drawMars,jupiter:drawJupiter,saturn:drawSaturn}[p.id])(p,r);
    const shade=ctx.createRadialGradient(p.x-r*.37,p.y-r*.4,0,p.x,p.y,r*1.15);shade.addColorStop(0,"rgba(255,255,255,.18)");shade.addColorStop(.58,"rgba(0,0,0,0)");shade.addColorStop(1,"rgba(0,2,9,.75)");ctx.fillStyle=shade;ctx.fillRect(p.x-r,p.y-r,r*2,r*2);ctx.restore();
    ctx.strokeStyle="rgba(214,231,244,.28)";ctx.lineWidth=Math.max(1,r*.012);ctx.beginPath();ctx.arc(p.x,p.y,r,0,TAU);ctx.stroke();
    drawEyes(p,r,time);if(p.id==="saturn")ringPath(p,r,true);ctx.restore();p.y=oldY;
  }

  function drawBackground(time) {
    const bg=ctx.createRadialGradient(w*.48,h*.43,0,w*.5,h*.5,Math.max(w,h)*.78);bg.addColorStop(0,"#0a1727");bg.addColorStop(.5,"#040b17");bg.addColorStop(1,"#01040a");ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    dust.forEach(d=>{const g=ctx.createRadialGradient(d.x,d.y,0,d.x,d.y,d.r);g.addColorStop(0,`rgba(62,105,143,${d.a})`);g.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,TAU);ctx.fill();});
    stars.forEach((s,i)=>{ctx.globalAlpha=s.a*(.78+.22*Math.sin(time*.0004+s.t));ctx.fillStyle=i%13===0?"#b8d9ef":"#e1edf6";ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,TAU);ctx.fill();});ctx.globalAlpha=1;
  }

  function frame(now) {
    const dt=Math.min(.05,(now-last)/1000);last=now;drawBackground(now);
    worlds.forEach(p=>{p.focus+=((p===selected?1:0)-p.focus)*Math.min(1,dt*7);p.boost=Math.max(0,p.boost-dt*.72);if(!reduceMotion.matches)p.rotation+=dt*p.speed*(1+p.boost*5);});
    worlds.slice().sort((a,b)=>(a===selected?1:0)-(b===selected?1:0)).forEach(p=>drawWorld(p,now));
    requestAnimationFrame(frame);
  }

  function hitTest(x,y) {
    return worlds.slice().reverse().find(p=>Math.hypot(x-p.x,y-p.y)<p.r*(p.id==="saturn"?1.65:1.15))||null;
  }
  function point(e){const rect=canvas.getBoundingClientRect();return{x:(e.clientX-rect.left)*w/rect.width,y:(e.clientY-rect.top)*h/rect.height};}
  canvas.addEventListener("pointermove",e=>{pointer={...point(e),active:true};canvas.style.cursor=hitTest(pointer.x,pointer.y)?"pointer":"default";});
  canvas.addEventListener("pointerleave",()=>{pointer.active=false;pointer.x=w/2;pointer.y=h/2;canvas.style.cursor="default";});
  canvas.addEventListener("pointerdown",e=>{const pos=point(e),hit=hitTest(pos.x,pos.y);pointer={...pos,active:true};if(!hit)return;selected=selected===hit?null:hit;hit.boost=1;hint.classList.add("is-hidden");nameOutput.value=hit.name;nameOutput.classList.add("is-visible");clearTimeout(hideNameTimer);hideNameTimer=setTimeout(()=>nameOutput.classList.remove("is-visible"),1800);});
  addEventListener("keydown",e=>{const n=Number(e.key);if(n>=1&&n<=6){selected=worlds[n-1];selected.boost=1;nameOutput.value=selected.name;nameOutput.classList.add("is-visible");}});
  addEventListener("resize",resize);resize();requestAnimationFrame(frame);
})();

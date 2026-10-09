(() => {
  const canvas = document.getElementById('world');
  const ctx = canvas.getContext('2d');
  const hint = document.getElementById('hint');
  const sound = document.getElementById('sound');
  const TAU = Math.PI * 2;
  const COUNT = 108;
  const SPEED = 530;
  const FADE = 3800;
  let w, h, dpr, origin, segments = [], pulses = [], marks = [];
  let audio, muted = false, interacted = false;
  // A fresh seed is made on each load; resizing keeps the same cave.
  const seed = Math.random() * 0xffffffff >>> 0;
  let state = seed;
  const random = () => { state = (Math.imul(state,1664525)+1013904223)>>>0; return state/4294967296; };
  const between = (a,b) => a+(b-a)*random();
  const layout = [];
  for(let i=0;i<9;i++){
    const edge=i%4, pos=between(.10,.90), width=between(.055,.12), depth=between(.08,.21);
    let points;
    if(edge===0) points=[[pos-width,0],[pos-width*.65,depth*.35],[pos,depth],[pos+width*.55,depth*.45],[pos+width,0]];
    else if(edge===1) points=[[1,pos-width],[1-depth*.4,pos-width*.7],[1-depth,pos],[1-depth*.45,pos+width*.55],[1,pos+width]];
    else if(edge===2) points=[[pos-width,1],[pos-width*.6,1-depth*.45],[pos,1-depth],[pos+width*.6,1-depth*.35],[pos+width,1]];
    else points=[[0,pos-width],[depth*.4,pos-width*.7],[depth,pos],[depth*.5,pos+width*.65],[0,pos+width]];
    layout.push(points);
  }
  for(let i=0;i<5;i++){
    const cx=between(.12,.88),cy=between(.15,.85),rx=between(.035,.075),ry=between(.04,.085);
    if(Math.hypot((cx-.5)*1.1,cy-.51)<.20) continue;
    layout.push(Array.from({length:8},(_,j)=>{
      const a=j*TAU/8, jitter=between(.82,1.16);
      return [cx+Math.cos(a)*rx*jitter,cy+Math.sin(a)*ry*jitter];
    }));
  }

  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  function polygon(points) {
    for (let i=0;i<points.length;i++) segments.push([points[i],points[(i+1)%points.length]]);
  }
  function buildWorld() {
    segments=[];
    const W=w,H=h;
    polygon([[0,0],[W,0],[W,H],[0,H]]);
    layout.forEach(p => polygon(p.map(([x,y])=>[x*W,y*H])));
  }
  function resize() {
    w=innerWidth; h=innerHeight; dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    origin={x:w*.5,y:h*.51};
    buildWorld(); pulses=[]; marks=[];
  }
  // Ray / segment intersection. The smallest positive t is the first echo surface.
  function hit(dx,dy) {
    let best=Infinity, result=null;
    for (const [[ax,ay],[bx,by]] of segments) {
      const sx=bx-ax, sy=by-ay;
      const den=dx*sy-dy*sx;
      if(Math.abs(den)<1e-8) continue;
      const qx=ax-origin.x,qy=ay-origin.y;
      const t=(qx*sy-qy*sx)/den;
      const u=(qx*dy-qy*dx)/den;
      if(t>1 && t<best && u>=0 && u<=1) {
        best=t; result={x:origin.x+dx*t,y:origin.y+dy*t,a:[ax,ay],b:[bx,by],distance:t};
      }
    }
    return result;
  }
  function tone(freq, at, duration, volume) {
    if(!audio||muted) return;
    const osc=audio.createOscillator(), gain=audio.createGain();
    osc.type='sine';osc.frequency.setValueAtTime(freq,at);
    osc.frequency.exponentialRampToValueAtTime(freq*.76,at+duration);
    gain.gain.setValueAtTime(.0001,at);
    gain.gain.exponentialRampToValueAtTime(volume,at+.008);
    gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
    osc.connect(gain).connect(audio.destination);osc.start(at);osc.stop(at+duration+.01);
  }
  function ping() {
    if(!interacted){interacted=true;hint.classList.add('hidden')}
    if(!audio) audio=new (window.AudioContext||window.webkitAudioContext)();
    if(audio.state==='suspended') audio.resume();
    const now=performance.now();
    const rays=[];
    for(let i=0;i<COUNT;i++){
      const a=i*TAU/COUNT;
      const target=hit(Math.cos(a),Math.sin(a));
      if(target) rays.push({...target,a,impact:target.distance/SPEED*1000,returned:target.distance/SPEED*2000,revealed:false});
    }
    pulses.push({at:now,rays});
    if(pulses.length>4)pulses.shift();
    tone(1900,audio.currentTime,.095,.07);
    // A few grouped echoes preserve distance without making every ray audible.
    const distances=rays.map(r=>r.distance).sort((a,b)=>a-b);
    [.18,.47,.78].forEach((q,i)=>{
      const distance=distances[Math.floor(q*(distances.length-1))];
      if(distance) tone(1250-i*180,audio.currentTime+distance*2/SPEED,.085,.018-i*.004);
    });
  }
  function line(x1,y1,x2,y2,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
  function drawMarks(now){
    marks=marks.filter(m=>now-m.at<FADE);
    ctx.lineCap='round';
    for(const m of marks){
      const age=now-m.at, alpha=Math.pow(1-age/FADE,1.7);
      const vx=m.b[0]-m.a[0],vy=m.b[1]-m.a[1],len=Math.hypot(vx,vy)||1;
      const nx=vx/len,ny=vy/len;
      const spread=clamp(4+age*.017,4,34);
      const left=Math.min(spread,Math.hypot(m.x-m.a[0],m.y-m.a[1]));
      const right=Math.min(spread,Math.hypot(m.b[0]-m.x,m.b[1]-m.y));
      line(m.x-nx*left,m.y-ny*left,m.x+nx*right,m.y+ny*right,`rgba(113,220,231,${alpha*.62})`,1.25);
      ctx.fillStyle=`rgba(197,248,246,${alpha*.8})`;
      ctx.beginPath();ctx.arc(m.x,m.y,1.4,0,TAU);ctx.fill();
    }
  }
  function drawRays(now){
    pulses=pulses.filter(p=>now-p.at<Math.max(w,h)*3/SPEED*1000+350);
    for(const pulse of pulses){
      const elapsed=now-pulse.at;
      for(const r of pulse.rays){
        if(elapsed<r.impact){
          const d=elapsed/1000*SPEED;
          const start=Math.max(0,d-48);
          line(origin.x+Math.cos(r.a)*start,origin.y+Math.sin(r.a)*start,origin.x+Math.cos(r.a)*d,origin.y+Math.sin(r.a)*d,'rgba(110,206,220,.48)',.85);
        }else if(elapsed<r.returned){
          const d=r.distance-(elapsed-r.impact)/1000*SPEED;
          const end=Math.min(r.distance,d+48);
          line(origin.x+Math.cos(r.a)*d,origin.y+Math.sin(r.a)*d,origin.x+Math.cos(r.a)*end,origin.y+Math.sin(r.a)*end,'rgba(186,245,239,.75)',1);
          const spark=Math.max(0,1-(elapsed-r.impact)/190);
          if(spark){ctx.fillStyle=`rgba(202,255,248,${spark*.8})`;ctx.beginPath();ctx.arc(r.x,r.y,2.2+spark*2,0,TAU);ctx.fill()}
        }else if(!r.revealed){r.revealed=true;marks.push({...r,at:now})}
      }
    }
  }
  function bat(now){
    const s=clamp(Math.min(w,h)*.105,48,86), flap=Math.sin(now*.0024)*.10;
    ctx.save();ctx.translate(origin.x,origin.y+Math.sin(now*.0015)*3);
    // Wings grow from the body, forming one dark silhouette.
    for(const side of [-1,1]){
      ctx.save();ctx.scale(side,1);ctx.rotate(flap*side*.3);
      ctx.fillStyle='#111722';ctx.strokeStyle='#344350';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(s*.35,s*.1);ctx.quadraticCurveTo(s*.78,-s*.62,s*1.65,-s*.76);
      ctx.quadraticCurveTo(s*1.35,-s*.14,s*1.43,s*.17);
      ctx.quadraticCurveTo(s*1.1,-s*.07,s*.98,s*.37);
      ctx.quadraticCurveTo(s*.75,s*.18,s*.61,s*.47);
      ctx.quadraticCurveTo(s*.48,s*.3,s*.32,s*.32);ctx.closePath();ctx.fill();ctx.stroke();
      line(s*.42,s*.12,s*1.57,-s*.69,'rgba(89,117,130,.27)',1);
      ctx.restore();
    }
    ctx.fillStyle='#20242d';ctx.strokeStyle='#52616b';ctx.lineWidth=1.5;
    for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*s*.33,-s*.45);ctx.quadraticCurveTo(side*s*.55,-s*.98,side*s*.57,-s*.92);ctx.quadraticCurveTo(side*s*.67,-s*.38,side*s*.43,-s*.26);ctx.fill();ctx.stroke()}
    ctx.restore();
  }
  function frame(now){
    ctx.fillStyle='#030408';ctx.fillRect(0,0,w,h);
    drawRays(now);drawMarks(now);bat(now);
    requestAnimationFrame(frame);
  }
  window.addEventListener('resize',resize);
  canvas.addEventListener('pointerdown',ping);
  sound.addEventListener('pointerdown',e=>e.stopPropagation());
  sound.addEventListener('click',()=>{muted=!muted;sound.classList.toggle('muted',muted);sound.setAttribute('aria-pressed',String(!muted));sound.setAttribute('aria-label',muted?'音を出す':'音を消す')});
  resize();requestAnimationFrame(frame);
})();

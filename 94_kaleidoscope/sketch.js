// Palette and pitches: 27_MelodyFly4/sketch.js (noteColors / noteFrequencies).
const NOTES = [
  {name:'ド', color:'#ef6a67', hz:261.63}, {name:'レ', color:'#f29b52', hz:293.66},
  {name:'ミ', color:'#e5c64f', hz:329.63}, {name:'ファ', color:'#63b875', hz:349.23},
  {name:'ソ', color:'#4da9c9', hz:392}, {name:'ラ', color:'#6f86d6', hz:440},
  {name:'シ', color:'#9a72c7', hz:493.88}, {name:'高いド', color:'#e65f91', hz:523.25}
];
const TAU = Math.PI * 2, WEDGE = Math.PI / 3, MAX_VOICES = 12;
let pieces = [], glints = [], marpan, plate, audioReady = false;
let turn = 0, spin = .055, lastTouch = 0, dragging = false, lastAngle = 0, lastDragTime = 0;
let radius = 100, cx = 0, cy = 0, lastFrame = 0, accumulator = 0, activeVoices = 0;
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));

function setup(){
  const canvas = createCanvas(100,100); canvas.parent('stage'); pixelDensity(Math.min(devicePixelRatio || 1,2));
  marpan = new Marpan25D({bodyColor:'#fff8eb',autoBlink:true,maxSize:90});
  pieces = Array.from({length:20},(_,i) => {
    const shape = ['circle','square','rectangle','triangle'][i%4];
    const size = shape === 'circle' ? .035 : shape === 'rectangle' ? .046 : .039;
    const angle = random(.19,WEDGE-.19), r = random(.30,.83);
    return {x:r*Math.cos(angle),y:r*Math.sin(angle),vx:random(-.08,.08),vy:random(-.08,.08),
      angle:random(TAU),omega:random(-.3,.3),size,shape,note:i%8,
      mass:shape==='rectangle'?1.5:shape==='circle'?.85:1.1,restitution:shape==='circle'?.67:.48,
      lastSound:0};
  });
  NOTES.forEach(n=>{const item=document.createElement('span');item.className='note';
    const swatch=document.createElement('i');swatch.className='swatch';swatch.style.setProperty('--color',n.color);
    item.append(swatch,n.name);document.querySelector('.legend').append(item)});
  windowResized(); lastFrame=performance.now();
}

function windowResized(){
  const box=document.getElementById('stage').getBoundingClientRect();
  resizeCanvas(Math.max(280,Math.floor(box.width)),Math.max(260,Math.floor(box.height)));
  cx=width/2;cy=height/2;radius=Math.min(width*.455,height*.455,350);
}

function draw(){
  const now=performance.now(), frameDt=Math.min((now-lastFrame)/1000,.05);lastFrame=now;
  accumulator+=frameDt;
  while(accumulator>=1/120){updatePhysics(1/120,now);accumulator-=1/120}
  renderScene(now);
}

function updatePhysics(dt,now){
  if(!dragging){
    if(now-lastTouch>6500)spin += (.055-spin)*dt*.45;
    else spin *= Math.exp(-1.2*dt);
    turn += spin*dt;
  }
  // Gravity is fixed in screen space; inverse rotation expresses it in the vessel.
  const gx=Math.sin(turn)*.64, gy=Math.cos(turn)*.64;
  const agitation=clamp(Math.abs(spin)*.12,0,.8);
  for(const p of pieces){
    p.vx += (gx + -p.y*spin*spin*.13 + agitation*Math.sin(now*.001+p.note*5)) * dt;
    p.vy += (gy + p.x*spin*spin*.13 + agitation*Math.cos(now*.001+p.note*7)) * dt;
    const friction=Math.exp(-.43*dt);p.vx*=friction;p.vy*=friction;
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.angle+=p.omega*dt;p.omega*=Math.exp(-.65*dt);
    constrainToWedge(p,now);
  }
  // Collision impulses and positional correction apply only to the 20 physical pieces.
  for(let i=0;i<pieces.length;i++)for(let j=i+1;j<pieces.length;j++)collide(pieces[i],pieces[j],now);
  glints=glints.filter(g=>now-g.born<270);
}

function constrainToWedge(p,now){
  const s=p.size*.67, normals=[{x:0,y:1},{x:Math.sin(WEDGE),y:-Math.cos(WEDGE)}];
  for(const n of normals){
    const d=p.x*n.x+p.y*n.y;
    if(d<s){p.x+=n.x*(s-d);p.y+=n.y*(s-d);bounceWall(p,n,now)}
  }
  const r=Math.hypot(p.x,p.y),limit=.95-s;
  if(r>limit){const n={x:-p.x/r,y:-p.y/r};p.x=n.x*-limit;p.y=n.y*-limit;bounceWall(p,n,now)}
  // A small optical hub keeps the repeated character clear.
  const inner=.235+s,rr=Math.hypot(p.x,p.y);
  if(rr<inner){const n={x:p.x/(rr||1),y:p.y/(rr||1)};p.x=n.x*inner;p.y=n.y*inner;bounceWall(p,n,now)}
}

function bounceWall(p,n,now){
  const toward=p.vx*n.x+p.vy*n.y;
  if(toward<0){p.vx-=(1+p.restitution)*toward*n.x;p.vy-=(1+p.restitution)*toward*n.y;
    p.omega+=toward*.15;impact(p,Math.abs(toward),p.x,p.y,now)}
}

function collide(a,b,now){
  let dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy),minimum=(a.size+b.size)*.76;
  if(dist>=minimum)return;
  if(dist<.00001){dx=.00001;dist=.00001}
  const nx=dx/dist,ny=dy/dist,overlap=minimum-dist,invA=1/a.mass,invB=1/b.mass,total=invA+invB;
  a.x-=nx*overlap*invA/total;b.x+=nx*overlap*invB/total;
  a.y-=ny*overlap*invA/total;b.y+=ny*overlap*invB/total;
  const relative=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
  if(relative>=0)return;
  const strength=-relative,impulse=-(1+Math.min(a.restitution,b.restitution))*relative/total;
  a.vx-=impulse*nx*invA;a.vy-=impulse*ny*invA;
  b.vx+=impulse*nx*invB;b.vy+=impulse*ny*invB;
  a.omega-=impulse*.08;b.omega+=impulse*.08;
  const x=(a.x+b.x)/2,y=(a.y+b.y)/2;
  impact(a,strength,x,y,now);impact(b,strength,x,y,now);
}

function impact(p,strength,x,y,now){
  if(strength<.16 || now-p.lastSound<125)return;
  p.lastSound=now;glints.push({x,y,born:now,strength:clamp(strength,0,1)});
  playCollision(p,strength);
}

function enableSound(){
  if(audioReady)return;
  try{userStartAudio();audioReady=true;document.getElementById('sound-status').textContent='音を聴きながら、ゆっくり回してみてください'}
  catch(e){document.getElementById('sound-status').textContent='音声を開始できませんでした'}
}

function playCollision(p,strength){
  if(!audioReady || activeVoices>=MAX_VOICES)return;
  const volume=clamp((strength-.12)*.19,.012,.12),hard=p.shape!=='circle';
  const duration=hard?.48:.37,attack=hard?.003:.022;
  const osc=new p5.Oscillator(hard?'sine':'triangle');
  const env=new p5.Envelope();env.setADSR(attack,hard?.14:.11,.001,duration*.7);
  env.setRange(volume,0);osc.freq(NOTES[p.note].hz*(hard?2:1));osc.start();
  env.play(osc,0,duration*.18);activeVoices++;
  setTimeout(()=>{osc.stop();osc.dispose();activeVoices=Math.max(0,activeVoices-1)},(duration+.2)*1000);
}

function renderScene(now){
  clear();const c=drawingContext;
  c.save();c.translate(cx,cy);
  const halo=c.createRadialGradient(0,0,radius*.75,0,0,radius*1.13);
  halo.addColorStop(0,'rgba(187,207,255,0)');halo.addColorStop(1,'rgba(178,204,255,.11)');
  c.fillStyle=halo;c.beginPath();c.arc(0,0,radius*1.13,0,TAU);c.fill();
  c.save();c.beginPath();c.arc(0,0,radius,0,TAU);c.clip();
  c.fillStyle='#111a2a';c.fillRect(-radius,-radius,radius*2,radius*2);
  c.rotate(turn);
  for(let k=0;k<6;k++){
    c.save();c.rotate((k+(k%2))*WEDGE);if(k%2)c.scale(1,-1);
    c.beginPath();c.moveTo(0,0);c.arc(0,0,radius+.5,0,WEDGE);c.closePath();c.clip();
    drawWedge(c,now);c.restore();
  }
  c.restore();
  c.strokeStyle='rgba(229,239,255,.65)';c.lineWidth=2;c.beginPath();c.arc(0,0,radius,0,TAU);c.stroke();
  c.strokeStyle='rgba(226,236,255,.20)';c.lineWidth=12;c.beginPath();c.arc(0,0,radius+8,0,TAU);c.stroke();
  for(let i=0;i<48;i++){let a=i*TAU/48;c.beginPath();c.arc((radius+19)*Math.cos(a),(radius+19)*Math.sin(a),i%4===0?1.7:.8,0,TAU);c.fillStyle='rgba(214,226,248,.4)';c.fill()}
  c.restore();
}

function drawWedge(c,now){
  c.fillStyle='rgba(47,67,94,.17)';c.beginPath();c.moveTo(0,0);c.arc(0,0,radius,0,WEDGE);c.fill();
  c.strokeStyle='rgba(210,230,255,.09)';c.lineWidth=1;c.beginPath();c.moveTo(0,0);c.lineTo(radius,0);c.moveTo(0,0);c.lineTo(radius*Math.cos(WEDGE),radius*Math.sin(WEDGE));c.stroke();
  for(const p of pieces)drawPiece(c,p);
  for(const g of glints){const life=1-(now-g.born)/270;if(life<=0)continue;
    const x=g.x*radius,y=g.y*radius,s=(3+6*g.strength)*life;
    c.strokeStyle=`rgba(255,250,230,${.48*life})`;c.lineWidth=1;c.beginPath();c.moveTo(x-s,y);c.lineTo(x+s,y);c.moveTo(x,y-s);c.lineTo(x,y+s);c.stroke()}
  // The canonical Marpan renderer is used in the physical wedge and reflected with it.
  push();translate(radius*.34,radius*.205);rotate(-.16);scale(Math.min(radius/290,1.1));
  marpan.drawAt(0,0,{bodyWidth:55,bodyHeight:41,lookX:0,lookY:0,bodyColor:'#fff8eb'});pop();
}

function drawPiece(c,p){
  const x=p.x*radius,y=p.y*radius,s=p.size*radius,n=NOTES[p.note];c.save();c.translate(x,y);c.rotate(p.angle);
  c.shadowColor=n.color;c.shadowBlur=s*.7;c.fillStyle=hexAlpha(n.color,.63);
  c.strokeStyle=hexAlpha(n.color,.95);c.lineWidth=1.25;
  c.beginPath();if(p.shape==='circle')c.arc(0,0,s,0,TAU);
  else if(p.shape==='square')c.rect(-s,-s,s*2,s*2);
  else if(p.shape==='rectangle')c.rect(-s*1.22,-s*.65,s*2.44,s*1.3);
  else{c.moveTo(0,-s*1.25);c.lineTo(s*1.1,s*.8);c.lineTo(-s*1.1,s*.8);c.closePath()}
  c.fill();c.stroke();c.shadowBlur=0;c.strokeStyle='rgba(255,255,255,.48)';c.lineWidth=1;
  c.beginPath();c.moveTo(-s*.45,-s*.35);c.lineTo(s*.15,-s*.7);c.stroke();c.restore();
}
function hexAlpha(hex,a){const h=hex.slice(1);return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`}

function pointerAngle(x,y){return Math.atan2(y-cy,x-cx)}
function pointerInside(x,y){const d=Math.hypot(x-cx,y-cy);return d<radius+35 && d>radius*.36}
function mousePressed(){if(pointerInside(mouseX,mouseY)){startDrag(mouseX,mouseY);return false}}
function mouseDragged(){if(dragging){moveDrag(mouseX,mouseY);return false}}
function mouseReleased(){endDrag()}
function touchStarted(){const t=touches[0];if(t && pointerInside(t.x,t.y)){startDrag(t.x,t.y);return false}}
function touchMoved(){const t=touches[0];if(t && dragging){moveDrag(t.x,t.y);return false}}
function touchEnded(){endDrag();return false}
function startDrag(x,y){enableSound();dragging=true;lastAngle=pointerAngle(x,y);lastDragTime=performance.now();lastTouch=lastDragTime;spin=0}
function moveDrag(x,y){const now=performance.now(),a=pointerAngle(x,y),delta=Math.atan2(Math.sin(a-lastAngle),Math.cos(a-lastAngle));
  const dt=Math.max((now-lastDragTime)/1000,.008);turn+=delta;spin=clamp(delta/dt,-7,7);
  lastAngle=a;lastDragTime=now;lastTouch=now}
function endDrag(){if(dragging){dragging=false;lastTouch=performance.now()}}

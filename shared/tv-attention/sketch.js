/* Isolated trilogy runtime. All positions use a fixed room coordinate system;
   resizing changes only the projection, never simulation state. */
const piece = Number(document.body.dataset.piece);
const room = {w:800,h:560}, tv = {x:400,y:225};
let people=[], hero, locked=false, orbitHeld=false, dragging=false, target=null;
let floorAngle=0;
let zoom=1, ox=0, oy=0, elapsed=0, spawnClock=0, lastInput=-100;
let soundOn=false, oscillator=null, nextTone=0, audioPending=false;
let gentle=matchMedia('(prefers-reduced-motion: reduce)').matches;
const keys=new Set();
function person(x,y){return {x,y,stopped:false,marpan:new Marpan25D({autoBlink:false})};}
function resetPiece(){floorAngle=0;people=[];hero=person(155,425);locked=false;dragging=false;target=null;elapsed=0;spawnClock=0;lastInput=-100;orbitHeld=false;keys.clear();document.querySelector('#status').textContent='';}
function setup(){const host=document.querySelector('#stage');const c=createCanvas(host.clientWidth,host.clientHeight);c.parent(host);pixelDensity(Math.min(devicePixelRatio,2));resetPiece();
 c.elt.tabIndex=0;
 c.elt.addEventListener('pointerdown',e=>{c.elt.focus({preventScroll:true});c.elt.setPointerCapture(e.pointerId);dragging=true;setTarget(e);});
 c.elt.addEventListener('pointermove',e=>{if(dragging)setTarget(e);});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])c.elt.addEventListener(name,()=>{dragging=false;target=null;});
 c.elt.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','r','R'].includes(e.key)){e.preventDefault();keys.add(e.key);}});
 c.elt.addEventListener('keyup',e=>keys.delete(e.key));
 window.addEventListener('blur',clearInput);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInput();});
}
function clearInput(){keys.clear();dragging=false;target=null;orbitHeld=false;}
function setTarget(e){const b=e.currentTarget.getBoundingClientRect();target={x:constrain((e.clientX-b.left-ox)/zoom,35,765),y:constrain((e.clientY-b.top-oy)/zoom,60,515)};lastInput=elapsed;}
function windowResized(){const h=document.querySelector('#stage');resizeCanvas(h.clientWidth,h.clientHeight);}
function moveToward(p,x,y,speed,dt){const dx=x-p.x,dy=y-p.y,d=Math.hypot(dx,dy);if(d>0){const step=Math.min(d,speed*dt);p.x+=dx/d*step;p.y+=dy/d*step;}}
function inFront(p){return p.y>tv.y+32 && Math.abs(p.x-tv.x)<155;}
function step(dt){elapsed+=dt;
 if(piece===2){spawnClock-=dt;if(people.length<42&&spawnClock<=0){const i=people.length;people.push(person(-35,330+Math.floor(i/7)*32));spawnClock=1.25;}
 people.forEach((p,i)=>{const col=i%7,row=Math.floor(i/7),x=550-col*50,y=330+row*32;if(!p.stopped){moveToward(p,x,y,78,dt);if(Math.hypot(p.x-x,p.y-y)<1)p.stopped=true;}});return;}
 const dx=(keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0),dy=(keys.has('ArrowDown')?1:0)-(keys.has('ArrowUp')?1:0);
 if(!locked){if(dx||dy){const n=Math.hypot(dx,dy);hero.x+=dx/n*220*dt;hero.y+=dy/n*220*dt;lastInput=elapsed;}else if(dragging&&target){moveToward(hero,target.x,target.y,220,dt);}
 hero.x=constrain(hero.x,35,765);hero.y=constrain(hero.y,65,515);
 const d=Math.hypot(hero.x-tv.x,hero.y-tv.y);
 if(piece===1 && inFront(hero)){moveToward(hero,tv.x,tv.y+76,Math.max(0,250-d)*.65,dt);if(Math.hypot(hero.x-tv.x,hero.y-tv.y-76)<30){locked=true;target=null;document.querySelector('#status').textContent='移動が止まった';}}
 if(piece===3){const active=(dragging&&target)||dx||dy;const force=18+110*Math.pow(Math.max(0,1-d/470),2);if(!active||elapsed-lastInput>.15)moveToward(hero,tv.x,tv.y+40,force,dt);else moveToward(hero,tv.x,tv.y+40,force*.6,dt);
 if(Math.hypot(hero.x-tv.x,hero.y-tv.y-40)<22){locked=true;document.querySelector('#status').textContent='テレビにくっついた';}}
 }
 // The floor is an independent mechanism, not a second drag for the frozen body.
 // It carries the body on a continuous arc, preserving distance from the TV.
 if(piece===1&&(orbitHeld||keys.has('r')||keys.has('R'))){floorAngle-=dt*.95;const dx=hero.x-tv.x,dy=hero.y-tv.y,a=Math.atan2(dy,dx)-dt*.95,r=Math.max(90,Math.hypot(dx,dy));hero.x=tv.x+Math.cos(a)*r;hero.y=tv.y+Math.sin(a)*r;hero.x=constrain(hero.x,35,765);hero.y=constrain(hero.y,65,515);target=null;
 if(locked&&hero.y<tv.y-35){locked=false;dragging=false;document.querySelector('#status').textContent='テレビの裏で移動が戻った';}}
}
function draw(){const dt=Math.min(deltaTime/1000,.04);if(!document.hidden)step(dt);background('#f5f2e9');zoom=Math.min(width/room.w,height/room.h);ox=(width-room.w*zoom)/2;oy=(height-room.h*zoom)/2;push();translate(ox,oy);scale(zoom);
 stroke('#dedbcf');strokeWeight(1);line(45,520,755,520);noFill();ellipse(400,285,610,420);
 if(piece===1){push();translate(tv.x,tv.y);rotate(floorAngle);stroke('#dedbcf');for(let i=0;i<8;i++){const a=i*Math.PI/4;line(Math.cos(a)*80,Math.sin(a)*80,Math.cos(a)*205,Math.sin(a)*205);}pop();}
 const cast=piece===2?people:[hero];cast.filter(p=>p.y<tv.y+35).forEach(drawPerson);drawTV();cast.filter(p=>p.y>=tv.y+35).forEach(drawPerson);pop();
 if(soundOn&&!document.hidden&&oscillator&&elapsed>nextTone){nextTone=elapsed+0.65+Math.random()*.65;oscillator.freq(170+Math.random()*470);oscillator.amp(.025,.02);oscillator.amp(0,.18,.08);}
}
function drawPerson(p){const viewing=piece===2?p.stopped:(locked||inFront(p));noStroke();fill(60,65,60,16);ellipse(p.x,p.y+17,piece===2?43:68,9);p.marpan.drawAt(p.x,p.y,{bodyWidth:piece===2?45:70,lookX:viewing?tv.x:p.x+50,lookY:viewing?tv.y:p.y,expression:'pupil',yaw:viewing?constrain((tv.x-p.x)/180,-.5,.5):.28});}
function drawTV(){push();translate(tv.x,tv.y);noStroke();fill('#444b4c');rect(-112,-77,224,144,15);fill('#262e31');rect(-99,-64,192,117,7);
 const t=gentle?elapsed*.12:elapsed*.4;
 drawingContext.save();drawingContext.beginPath();drawingContext.rect(-94,-59,182,107);drawingContext.clip();
 const colors=['#809cba','#c49baf','#d3bb82','#82afa3'];for(let i=0;i<6;i++){fill(colors[i%4]);const x=-115+i*43+Math.sin(t+i)*20;rect(x,-62,46,115);}
 fill(232,223,204,100);ellipse(Math.sin(t)*65,Math.cos(t*.7)*25,85,85);fill(74,108,133,130);rotate(Math.sin(t*.5)*.6);rect(-42,-22,84,44,4);drawingContext.restore();fill('#404849');rect(-72,67,13,22,2);rect(59,67,13,22,2);fill('#98b8a3');circle(102,49,4);pop();}
document.querySelector('#reset').addEventListener('click',resetPiece);
document.querySelector('#light').setAttribute('aria-pressed',String(gentle));
document.querySelector('#light').addEventListener('click',e=>{gentle=!gentle;e.currentTarget.setAttribute('aria-pressed',String(gentle));});
document.querySelector('#sound').addEventListener('click',async e=>{if(audioPending)return;audioPending=true;const b=e.currentTarget;try{if(!soundOn){await userStartAudio();if(!oscillator){oscillator=new p5.Oscillator('sine');oscillator.amp(0);oscillator.start();}soundOn=true;nextTone=0;}else{soundOn=false;oscillator.amp(0,.03);}b.textContent=soundOn?'音を消す':'音を入れる';b.setAttribute('aria-pressed',String(soundOn));}catch{soundOn=false;b.textContent='音を再試行';}finally{audioPending=false;}});
const orbit=document.querySelector('#orbit');if(orbit){orbit.addEventListener('pointerdown',e=>{orbit.setPointerCapture(e.pointerId);orbitHeld=true;});for(const event of ['pointerup','pointercancel','lostpointercapture'])orbit.addEventListener(event,()=>orbitHeld=false);orbit.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();orbitHeld=true;}});orbit.addEventListener('keyup',()=>orbitHeld=false);orbit.addEventListener('blur',()=>orbitHeld=false);}

/* Shooting Gallery Marpan — p5.js, p5.sound, Matter.js, shared Marpan25D. */
const {Engine, Bodies, Body, Composite, Events, Query, Sleeping} = Matter;
const MAX_AMMO = 15;
const NOTE_NAMES = ['ド','レ','ミ','ファ','ソ','ラ','シ','高いド'];
const NOTE_LABELS = ['ド','レ','ミ','ファ','ソ','ラ','シ','ド'];
const NOTE_FREQ = [261.63,293.66,329.63,349.23,392,440,493.88,523.25];
const $ = id => document.getElementById(id);
let engine, prizes = [], platforms = [], corks = [], ripples = [], sparks = [];
let layout, ammo = MAX_AMMO, score = 0, won = 0, ended = false, calmFrames = 0;
let aim = {x:0,y:0,visible:false}, recoil = 0, audioReady = false;
const sound = {};

function setup() {
  const c = createCanvas(windowWidth, windowHeight);
  c.parent('stage'); pixelDensity(1); textFont('sans-serif');
  $('restart').addEventListener('click', resetGame);
  $('result-restart').addEventListener('click', resetGame);
  resetGame();
}

function computeLayout() {
  const w = width, h = height;
  const shelfLeft = w * (w < 600 ? .035 : .09);
  const shelfRight = w - shelfLeft;
  const top = h < 600 ? h * .30 : h * .285;
  const gap = h < 600 ? h * .225 : h * .205;
  return {left:shelfLeft,right:shelfRight,shelves:[top,top+gap,top+gap*2],
    floor:h*.885, noteWidth:min(63,(shelfRight-shelfLeft-14)/8*.78),
    margin:w<600?4:12};
}

function resetGame() {
  layout = computeLayout();
  engine = Engine.create({enableSleeping:true});
  engine.gravity.y = 1.4;
  engine.positionIterations = 10; engine.velocityIterations = 10;
  prizes=[]; platforms=[]; corks=[]; ripples=[]; sparks=[];
  ammo=MAX_AMMO; score=0; won=0; ended=false; calmFrames=0; recoil=0;
  $('result').hidden=true; syncHud();
  const world = engine.world;
  const floor = Bodies.rectangle(width/2,layout.floor+16,width*2,32,{isStatic:true,label:'floor',friction:.8});
  Composite.add(world,floor);
  const normalRows = [
    [{x:.16,size:'small'},{x:.34,size:'large'},{x:.57,size:'small'},{x:.79,size:'medium'}],
    [{x:.13,size:'medium'},{x:.33,size:'small'},{x:.52,size:'medium'},{x:.72,size:'large'},{x:.9,size:'small'}]
  ];
  normalRows.forEach((row,ri)=>row.forEach(spec=>{
    const span=layout.right-layout.left;
    const x=layout.left+span*spec.x;
    const base=ri===0?min(66,span*.105):min(62,span*.099);
    const factor={small:.73,medium:1,large:1.25}[spec.size];
    addPrize(x,layout.shelves[ri],base*factor,spec.size,ri,null);
  }));
  for(let i=0;i<8;i++){
    const x=layout.left+(layout.right-layout.left)*(i+.5)/8;
    addPrize(x,layout.shelves[2],layout.noteWidth,'note',2,i);
  }
  Events.on(engine,'collisionStart',event=>{
    for(const pair of event.pairs){
      const a=pair.bodyA, b=pair.bodyB;
      const pa=prizes.find(p=>p.body===a), pb=prizes.find(p=>p.body===b);
      const platform = (a.label==='platform'||b.label==='platform');
      if(platform && (pa||pb) && millis()-(pa||pb).lastImpact>160) playEffect('wood');
      else if(pa&&pb && Math.hypot(a.velocity.x-b.velocity.x,a.velocity.y-b.velocity.y)>2) playEffect('tap');
    }
  });
}

function addPrize(x,shelfY,w,size,row,noteIndex){
  const h=w*.68;
  const supportW=w*(size==='note'?1.16:size==='large'?1.22:1.18);
  const platform=Bodies.rectangle(x,shelfY+10,supportW,12,{isStatic:true,label:'platform',friction:size==='large'?.94:.75});
  platforms.push(platform); Composite.add(engine.world,platform);
  const body=Bodies.rectangle(x,shelfY-h/2+3,w*.92,h,{chamfer:{radius:w*.20},
    density:size==='large'?.004:size==='small'?.0012:.0021,
    friction:size==='large'?.88:size==='small'?.32:.58,
    frictionStatic:size==='large'?1.05:.7,
    frictionAir:size==='large'?.025:.014,
    restitution:.04,sleepThreshold:90,label:'prize'});
  Composite.add(engine.world,body);
  const palette=['#f2a582','#eed1a3','#b6d2b5','#b7c8dc','#e3b6bb'];
  const colorValue=noteIndex===null?palette[(row*5+prizes.length)%palette.length]:MARPAN_NOTE_COLORS[NOTE_NAMES[noteIndex]];
  const marpan=new Marpan25D({x:0,y:0,maxSize:w,bodyColor:colorValue,expression:'pupil'});
  prizes.push({body,marpan,w,h,row,size,noteIndex,color:colorValue,won:false,
    lastImpact:-1000,vibrate:0,originalX:x,platform,fallSound:false});
}

function draw(){
  background('#24151b');
  Engine.update(engine,1000/60);
  drawBooth();
  for(const p of prizes) { updatePrize(p); drawPrize(p); }
  drawShelfFronts(); drawEffects(); drawGun(); drawCrosshair();
  if(ammo===0 && !ended){
    const active=prizes.some(p=>!p.won && p.body.speed>.28) || corks.length>0;
    calmFrames=active?0:calmFrames+1;
    if(calmFrames>90 || frameCount>0 && millis()-lastShotAt>7000) finishGame();
  }
  recoil*=.77;
}
let lastShotAt=0;
function updatePrize(p){
  const b=p.body;
  p.vibrate*=.77;
  if(!p.won){
    const shelfY=layout.shelves[p.row];
    const cleared=(b.bounds.min.y>shelfY+15 &&
      (b.position.y>shelfY+max(30,p.h*.65) || b.bounds.max.x<p.platform.bounds.min.x || b.bounds.min.x>p.platform.bounds.max.x));
    if(cleared){
      p.won=true; won++; score+=p.size==='small'?10:p.size==='medium'?30:p.size==='large'?50:20;
      syncHud(); playEffect('win');
      sparks.push({x:b.position.x,y:b.position.y,life:45,color:p.color});
    }
  }
  if(p.won && !p.fallSound && b.position.y>layout.floor-p.h*.7){p.fallSound=true;playEffect('fall');}
}

function drawPrize(p){
  const b=p.body;
  if(b.position.y>height+100) return;
  push(); translate(b.position.x,b.position.y);
  rotate(b.angle);
  const shake=p.vibrate?sin(frameCount*1.8)*p.vibrate:0;
  translate(shake,0);
  p.marpan.drawAt(0,0,{bodyWidth:p.w,bodyHeight:p.h,lookX:aim.x-b.position.x,
    lookY:aim.y-b.position.y,pulse:p.vibrate*.03});
  pop();
}

function drawBooth(){
  const ctx=drawingContext;
  const g=ctx.createLinearGradient(0,0,0,height);g.addColorStop(0,'#422423');g.addColorStop(.65,'#70412d');g.addColorStop(1,'#2c1b1c');
  ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
  noStroke();fill(255,201,111,32);ellipse(width/2,height*.43,width*.8,height*.76);
  fill('#28161b');rect(0,0,width,height*.125);
  fill('#a44436');rect(0,height*.095,width,height*.026);
  fill('#d78c53');rect(layout.left-13,height*.14,13,layout.floor-height*.14);
  rect(layout.right,height*.14,13,layout.floor-height*.14);
  fill('#a25c39');rect(layout.left-16,height*.135,layout.right-layout.left+32,14,4);
  drawLantern(layout.left+25,height*.17);drawLantern(layout.right-25,height*.17);
  for(const y of layout.shelves){
    fill('#1f1114');rect(layout.left-6,y+9,layout.right-layout.left+12,17,3);
    fill('#955834');rect(layout.left-6,y+4,layout.right-layout.left+12,13,2);
    fill('#c78d56');rect(layout.left-6,y+3,layout.right-layout.left+12,4);
  }
  fill('#2b1918');rect(0,layout.floor+28,width,height-layout.floor);
  fill('#7c472c');rect(0,layout.floor+19,width,16);
  fill('#bd8150');rect(0,layout.floor+19,width,4);
}
function drawLantern(x,y){
  stroke('#5d3427');strokeWeight(2);line(x,0,x,y-16);noStroke();
  fill('#e9ac70');ellipse(x,y,30,36);fill('#bf5d47');rect(x-15,y-3,30,6);
  fill('#6b2c29');rect(x-10,y-21,20,4,2);rect(x-10,y+17,20,4,2);
}
function drawShelfFronts(){
  noStroke();
  layout.shelves.forEach((y,i)=>{
    fill('#67391e');rect(layout.left-7,y+12,layout.right-layout.left+14,11,2);
    fill('#d3a26a');rect(layout.left-7,y+12,layout.right-layout.left+14,3);
    if(i===2){
      textAlign(CENTER,CENTER);textStyle(BOLD);textSize(max(10,min(15,layout.noteWidth*.32)));
      for(let n=0;n<8;n++){
        const x=layout.left+(layout.right-layout.left)*(n+.5)/8;
        fill('#ffeed2');text(NOTE_LABELS[n],x,y+31);
      }
    }
  });
}

function drawEffects(){
  for(let i=corks.length-1;i>=0;i--){
    const c=corks[i];c.t+=deltaTime/170;
    const t=min(1,c.t),e=1-pow(1-t,2);
    const x=lerp(c.fromX,c.toX,e),y=lerp(c.fromY,c.toY,e);
    noStroke();fill(242,201,143,220*(1-t));circle(x,y,lerp(17,5,t));
    if(t>=1){corks.splice(i,1);resolveShot(c);}
  }
  for(let i=ripples.length-1;i>=0;i--){
    const r=ripples[i];r.life-=deltaTime;
    if(r.life<=0){ripples.splice(i,1);continue;}
    const alpha=r.life/460;noFill();stroke(red(r.color),green(r.color),blue(r.color),alpha*230);
    strokeWeight(2.5);circle(r.x,r.y,(1-alpha)*105+8);
  }
  for(let i=sparks.length-1;i>=0;i--){
    const s=sparks[i];s.life--;if(s.life<=0){sparks.splice(i,1);continue;}
    noStroke();fill(s.color);textAlign(CENTER,CENTER);textSize(16+s.life*.3);
    text('✦',s.x,s.y-(45-s.life)*1.5);
  }
}
function drawGun(){
  const x=width/2,y=height+recoil;
  push();translate(x,y);
  noStroke();fill('#140e12');ellipse(0,-12,150,35);
  fill('#653821');rect(-16,-83,32,73,8);fill('#bd8850');rect(-12,-76,24,65,6);
  fill('#271c20');rect(-23,-95,46,18,7);fill('#d5aa70');rect(-14,-103,28,12,4);
  fill('#8d5a35');beginShape();vertex(-21,-29);vertex(21,-29);vertex(39,4);vertex(-39,4);endShape(CLOSE);
  pop();
}
function drawCrosshair(){
  if(!aim.visible || ended) return;
  push();stroke('#fff3cf');strokeWeight(1.6);noFill();
  circle(aim.x,aim.y,25);line(aim.x-19,aim.y,aim.x-10,aim.y);
  line(aim.x+10,aim.y,aim.x+19,aim.y);line(aim.x,aim.y-19,aim.x,aim.y-10);
  line(aim.x,aim.y+10,aim.x,aim.y+19);pop();
}

function fire(x,y){
  if(ended||ammo<=0||y<height*.12||y>layout.floor+20)return;
  activateAudio();
  aim={x,y,visible:true};ammo--;syncHud();recoil=10;lastShotAt=millis();calmFrames=0;
  corks.push({fromX:width/2,fromY:height-95,toX:x,toY:y,t:0});
  playEffect('pop');
}
function resolveShot(shot){
  const point={x:shot.toX,y:shot.toY};
  const targets=prizes.filter(p=>!p.won && p.body.position.y<layout.floor+20);
  const found=Query.point(targets.map(p=>p.body),point);
  let prize=targets.find(p=>p.body===found[0]);
  if(!prize){
    prize=targets.find(p=>abs(point.x-p.body.position.x)<p.w*.47 && abs(point.y-p.body.position.y)<p.h*.5);
  }
  if(!prize){
    if(layout.shelves.some(y=>abs(point.y-y)<18))playEffect('wood');
    return;
  }
  const b=prize.body;
  Sleeping.set(b,false);
  const offX=constrain((point.x-b.position.x)/(prize.w*.5),-1,1);
  const offY=constrain((point.y-b.position.y)/(prize.h*.5),-1,1);
  const direction=offX===0?(b.position.x<width/2?-1:1):offX>0?-1:1;
  const resistance=prize.size==='large'?.62:prize.size==='small'?1.26:1;
  const impulse=6.3*resistance;
  Body.setVelocity(b,{x:b.velocity.x+direction*impulse,y:b.velocity.y-2.1*resistance});
  Body.setAngularVelocity(b,b.angularVelocity+(-offY*direction*.14+offX*.035)*resistance);
  Body.applyForce(b,{x:point.x,y:point.y},{x:direction*b.mass*.0027*resistance,y:-b.mass*.00075});
  prize.lastImpact=millis();prize.vibrate=prize.noteIndex===null?2:4;
  if(prize.noteIndex!==null){
    playNote(prize.noteIndex);ripples.push({x:point.x,y:point.y,color:color(prize.color),life:460});
  }else playEffect('tap');
}

function activateAudio(){
  if(!audioReady){
    userStartAudio();
    sound.output=new p5.Gain();sound.output.connect();sound.output.amp(.72);
    audioReady=true;
  }
}
function tone(freq,duration,volume,type='sine',when=0){
  if(!audioReady)return;
  const osc=new p5.Oscillator(type),env=new p5.Envelope();
  osc.disconnect();osc.connect(sound.output);osc.freq(freq);osc.amp(0);osc.start(when);
  env.setADSR(.004,duration*.38,.10,duration*.62);env.setRange(volume,0);
  env.play(osc,when,duration);
  setTimeout(()=>{osc.stop();osc.dispose();},Math.ceil((duration+when+.3)*1000));
}
function playNote(index){
  const f=NOTE_FREQ[index];
  tone(f,.28,.34,'sine');tone(f*3,.13,.065,'triangle');
}
function playEffect(name){
  if(!audioReady)return;
  if(name==='pop'){tone(155,.09,.075,'triangle');return;}
  if(name==='wood'){tone(205,.065,.035,'triangle');return;}
  if(name==='tap'){tone(345,.045,.038,'triangle');return;}
  if(name==='fall'){tone(115,.11,.068,'triangle');return;}
  if(name==='win'){tone(660,.11,.11,'sine');tone(880,.15,.09,'sine',.085);}
}
function syncHud(){$('ammo').textContent=ammo;$('score').textContent=score;$('prizes').textContent=won;}
function finishGame(){ended=true;$('final-score').textContent=score;$('final-prizes').textContent=won;$('result').hidden=false;}
function mouseMoved(){aim={x:mouseX,y:mouseY,visible:true};}
function mousePressed(){if(mouseButton===LEFT)fire(mouseX,mouseY);return false;}
function touchMoved(){if(touches.length)aim={x:touches[0].x,y:touches[0].y,visible:true};return false;}
function touchStarted(){if(touches.length)fire(touches[0].x,touches[0].y);return false;}
function windowResized(){resizeCanvas(windowWidth,windowHeight);resetGame();}

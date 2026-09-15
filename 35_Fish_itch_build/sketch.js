const SAVE_KEY="fish-marpan-aquarium-v2";
const NOTES=["ド","レ","ミ","ファ","ソ","ラ","シ","ド"];
const FREQ=[261.63,293.66,329.63,349.23,392,440,493.88,523.25];
const COLORS=["#e87969","#e9a653","#dbc64f","#72b477","#55a8ab","#718fc1","#a47cc0","#e87969"];
const FISH_TYPES={classic:{name:"しろい魚マーパン",body:"#f7f4e8",outline:"#304747",size:1,speed:.42,tail:"round",favorite:4,personality:"のんびり"}};
const SHOP=[
 {id:"plantA",name:"アヌビアス",desc:"丈夫な小さな水草",cost:10,type:"plant"},
 {id:"plantB",name:"ゆれる水草",desc:"背の高い水草",cost:18,type:"plant"},
 {id:"sandLight",name:"明るい砂",desc:"水槽がやわらかい印象に",cost:22,type:"sand"},
 {id:"sandBlack",name:"黒い砂",desc:"魚マーパンが映える",cost:28,type:"sand"},
 {id:"light2",name:"水面ライト",desc:"光が明るく揺らめく",cost:32,type:"light"},
 {id:"filter2",name:"静音フィルター",desc:"水の汚れをゆっくりに",cost:35,type:"filter"},
 {id:"conditioner",name:"カルキ抜き",desc:"水換えにひとつ使用",cost:8,type:"item"},
 {id:"tank2",name:"中型水槽",desc:"泳げる範囲が広がる",cost:55,type:"tank"}
];
let state,fish,foods=[],rests=[],particles=[],bubbles=[],algae=[],audioCtx,filter,master,lastTick=0,lastSave=0,toastTimer,waterAnimation=null;

function defaults(){return{points:12,quality:94,algae:0,conditioner:1,sand:"basic",light:1,filter:1,tank:1,plants:[],owned:[],eaten:0,lastAt:Date.now()}}
function loadGame(){try{return{...defaults(),...JSON.parse(localStorage.getItem(SAVE_KEY))}}catch(e){return defaults()}}
function saveGame(){state.lastAt=Date.now();localStorage.setItem(SAVE_KEY,JSON.stringify(state));lastSave=millis()}

function setup(){
 const c=createCanvas(1120,610);c.parent("canvas-wrap");pixelDensity(1);textFont('"Avenir Next","Yu Gothic",sans-serif');
 state=loadGame();const away=Math.min(18,(Date.now()-state.lastAt)/3600000);state.quality=Math.max(35,state.quality-away*.8);state.algae=Math.min(70,state.algae+away*.5);
 fish=new FishMarpan(FISH_TYPES.classic);for(let i=0;i<28;i++)bubbles.push(makeBubble(true));makePiano();wireUI();renderShop();syncUI();
}
function draw(){
 const dt=Math.min(.05,deltaTime/1000);updateWorld(dt);drawTank();if(millis()-lastSave>4000)saveGame();
}
function updateWorld(dt){
 if(millis()-lastTick>1000){state.quality=Math.max(15,state.quality-(.018+.008*rests.length+.012*state.algae)/state.filter);state.algae=Math.min(100,state.algae+.012);lastTick=millis();syncUI()}
 foods.forEach(f=>{f.x+=f.vx;f.y+=sin(frameCount*.035+f.phase)*.09;f.vx*=.995});
 rests.forEach(r=>{r.y=Math.min(tankBottom()-28,r.y+r.vy);r.rot+=r.spin});
 particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vx*=.97;p.vy*=.97;p.life-=dt});particles=particles.filter(p=>p.life>0);
 bubbles.forEach(b=>{b.y-=b.speed;if(b.y<-10)Object.assign(b,makeBubble(false))});
 if(waterAnimation){waterAnimation.t+=dt;if(waterAnimation.t>2.8){state.quality=Math.min(100,state.quality+waterAnimation.safe);waterAnimation=null;syncUI();saveGame()}}
 fish.update(dt);
}
function tankLeft(){return state.tank>1?45:95}function tankRight(){return width-tankLeft()}function tankTop(){return 24}function tankBottom(){return height-54}
function drawTank(){
 const q=state.quality,cloud=map(q,15,100,115,0,true);background(224,242,238);noStroke();
 fill(state.light>1?"#c8f2ed":"#b9dfdc");rect(tankLeft(),tankTop(),tankRight()-tankLeft(),tankBottom()-tankTop(),8);
 drawLight();drawPlants();drawFilter();bubbles.forEach(drawBubble);foods.forEach(drawFood);rests.forEach(drawRest);fish.draw();drawSand();drawParticles();drawAlgae();
 fill(246,239,214,cloud);rect(tankLeft(),tankTop(),tankRight()-tankLeft(),tankBottom()-tankTop());
 if(waterAnimation)drawWaterChange();noFill();stroke(62,91,91,170);strokeWeight(5);rect(tankLeft(),tankTop(),tankRight()-tankLeft(),tankBottom()-tankTop(),9);stroke(255,210);strokeWeight(2);line(tankLeft()+8,tankTop()+10,tankRight()-8,tankTop()+10);
}
function drawLight(){noStroke();for(let i=0;i<5;i++){fill(255,250,205,state.light>1?35:18);quad(tankLeft()+80+i*190,tankTop(),tankLeft()+145+i*190,tankTop(),tankLeft()+250+i*150,tankBottom(),tankLeft()+95+i*150,tankBottom())}stroke(255,255,235,150);strokeWeight(2);noFill();beginShape();for(let x=tankLeft();x<tankRight();x+=18)vertex(x,tankTop()+12+sin(x*.035+frameCount*.025)*4);endShape()}
function sandColor(){return state.sand==="sandBlack"?"#4b514e":state.sand==="sandLight"?"#ead8a9":"#a98d68"}
function drawSand(){noStroke();fill(sandColor());beginShape();vertex(tankLeft(),tankBottom()-34);for(let x=tankLeft();x<=tankRight();x+=35)vertex(x,tankBottom()-32+sin(x*.08)*5);vertex(tankRight(),tankBottom());vertex(tankLeft(),tankBottom());endShape(CLOSE);for(let i=0;i<80;i++){fill(255,255,255,25);circle(tankLeft()+((i*73)%int(tankRight()-tankLeft())),tankBottom()-8-(i%5)*5,3)}}
function drawPlants(){state.plants.forEach((p,i)=>{const x=tankLeft()+120+(i*173)%(tankRight()-tankLeft()-180),base=tankBottom()-28,tall=p==="plantB"?125:75;push();stroke(p==="plantB"?"#367e6d":"#467f62");strokeWeight(p==="plantB"?8:11);strokeCap(ROUND);noFill();for(let j=0;j<3;j++){const sway=sin(frameCount*.025+i+j)*12;bezier(x+j*15,base,x-8+j*15,base-tall*.5,x+sway+j*12,base-tall,x+sway+j*12,base-tall); }pop()})}
function drawFilter(){const x=tankRight()-42;noStroke();fill("#668b89");rect(x,tankTop()+35,20,92,5);fill("#96b8b2");rect(x+4,tankTop()+45,12,54,3);if(state.filter>1){for(let i=0;i<4;i++){stroke(255,150);noFill();arc(x-15-i*9,tankTop()+45+i*13,25,12,PI,TWO_PI)}}}
function makeBubble(initial){return{x:random(tankLeft()+30,tankRight()-30),y:initial?random(tankTop(),tankBottom()):tankBottom(),size:random(3,10),speed:random(.25,.8)}}
function drawBubble(b){noFill();stroke(255,150);strokeWeight(1.5);circle(b.x,b.y,b.size)}

class FishMarpan{
 constructor(type){this.type=type;this.x=width*.48;this.y=height*.46;this.vx=.32;this.vy=0;this.target=null;this.pause=0;this.wobble=0;this.happy=0;this.lookX=this.x;this.lookY=this.y;this.blink=0;this.nextTurn=random(3,8)}
 update(dt){
  this.happy=Math.max(0,this.happy-dt);this.blink=Math.max(0,this.blink-dt);this.wobble+=dt;
  if(foods.length){this.target=foods.reduce((a,b)=>dist(this.x,this.y,a.x,a.y)<dist(this.x,this.y,b.x,b.y)?a:b);this.lookX=this.target.x;this.lookY=this.target.y;const d=dist(this.x,this.y,this.target.x,this.target.y),boost=this.target.note%7===this.type.favorite?1.45:1;this.vx=lerp(this.vx,(this.target.x-this.x)/Math.max(d,1)*1.15*boost,.035);this.vy=lerp(this.vy,(this.target.y-this.y)/Math.max(d,1)*.85*boost,.035);if(d<58)this.eat(this.target);
  }else{this.target=null;this.nextTurn-=dt;if(this.nextTurn<0){this.nextTurn=random(4,9);this.pause=random()<.35?random(.7,2):0;if(random()<.55)this.vx*=-1;this.vy=random(-.16,.16)}this.pause=Math.max(0,this.pause-dt);if(this.pause===0){this.vx=constrain(this.vx+random(-.008,.008),-.48,.48);if(abs(this.vx)<.18)this.vx=(this.vx<0?-1:1)*.22}this.lookX=this.x+(this.vx>=0?70:-70);this.lookY=this.y+this.vy*90}
  this.x+=this.vx*60*dt;this.y+=this.vy*60*dt+sin(this.wobble*1.35)*.08;
  if(this.x<tankLeft()+95){this.x=tankLeft()+95;this.vx=abs(this.vx)}if(this.x>tankRight()-95){this.x=tankRight()-95;this.vx=-abs(this.vx)}if(this.y<tankTop()+90){this.y=tankTop()+90;this.vy=abs(this.vy)}if(this.y>tankBottom()-100){this.y=tankBottom()-100;this.vy=-abs(this.vy)}
 }
 eat(food){foods.splice(foods.indexOf(food),1);state.eaten++;state.points+=2;state.quality=Math.max(15,state.quality-.35);this.happy=1.2;this.blink=.18;for(let i=0;i<24;i++)particles.push({x:food.x,y:food.y,vx:random(-2,2),vy:random(-2,2),life:random(.5,1),c:food.color});setTimeout(()=>{rests.push({x:this.x,y:this.y+35,vy:.25,rot:0,spin:random(-.015,.015)});syncUI();saveGame()},random(5000,9000));playTone(FREQ[food.note]*2,.08,.06);syncUI()}
 draw(){
  const facing=this.vx>=0?1:-1,s=constrain(min(width/1120,1),.72,1)*this.type.size,bob=sin(this.wobble*1.4)*3,squish=this.happy?sin(this.happy*28)*.055:0;push();translate(this.x,this.y+bob);scale(facing*s,s);rotate(constrain(this.vy*.25,-.12,.12));
  stroke(this.type.outline);strokeWeight(4);strokeJoin(ROUND);fill("#d9a36b");const flap=sin(this.wobble*3.2)*7;beginShape();vertex(-78,0);bezierVertex(-123,-54-flap,-132,-48,-124,0);bezierVertex(-135,47,-116,55+flap,-78,0);endShape(CLOSE);
  fill(this.type.body);ellipse(0,0,176*(1+squish),132*(1-squish));
  fill("#d9a36b");triangle(-15,-63,14,-99,34,-58);triangle(5,62,32,91,51,54);noFill();strokeWeight(2);arc(12,-67,32,32,3.7,5.8);arc(30,62,24,25,.4,2.7);
  this.drawEyes(facing);pop();
 }
 drawEyes(facing){const targetX=(this.lookX-this.x)*facing,targetY=this.lookY-this.y,gx=constrain(targetX/180,-1,1)*4,gy=constrain(targetY/120,-1,1)*4;for(let i=-1;i<=1;i++){const ex=28+i*37,ey=-7+abs(i)*2;fill("#fdfcf4");stroke(this.type.outline);strokeWeight(3);ellipse(ex,ey,30,35*(this.blink?0.12:1));if(!this.blink){noStroke();fill("#273d3e");circle(ex+gx,ey+gy,10);fill(255,180);circle(ex+gx-2,ey+gy-2,3)}}}
 lookAt(x,y){this.lookX=x;this.lookY=y;this.blink=.12;this.happy=.45}
}

function drawFood(f){push();translate(f.x,f.y);rotate(sin(frameCount*.04+f.phase)*.2);noStroke();fill(f.color);circle(0,0,34);fill("#fffdf3");textAlign(CENTER,CENTER);textStyle(BOLD);textSize(20);text("♪",0,-2);pop()}
function drawRest(r){push();translate(r.x,r.y);rotate(r.rot);textAlign(CENTER,CENTER);textStyle(BOLD);textSize(46);stroke(245,239,211);strokeWeight(5);fill("#456f6c");text("𝄽",0,0);pop()}
function drawParticles(){particles.forEach(p=>{noStroke();fill(p.c);circle(p.x,p.y,5+p.life*7)})}
function drawAlgae(){const amount=floor(state.algae/4);for(let i=0;i<amount;i++){const x=tankLeft()+24+((i*137)%int(tankRight()-tankLeft()-48)),y=tankTop()+28+((i*83)%int(tankBottom()-tankTop()-80));noStroke();fill(64,122,76,18+state.algae*.45);ellipse(x,y,38+(i%4)*13,25+(i%3)*8)}}
function drawWaterChange(){const t=waterAnimation.t,level=t<1?map(t,0,1,tankTop(),height*.36):t<2?height*.36:map(t,2,2.8,height*.36,tankTop());noStroke();fill(248,244,222,150);rect(tankLeft()+3,tankTop()+3,tankRight()-tankLeft()-6,Math.max(0,level-tankTop()));stroke(255,220);line(tankLeft()+5,level,tankRight()-5,level)}

function makePiano(){const el=document.querySelector("#piano");NOTES.forEach((n,i)=>{const b=document.createElement("button");b.className="key";b.style.setProperty("--key",COLORS[i]);b.textContent=n;b.onclick=()=>feed(i,b);el.append(b)})}
function feed(i,b){ensureAudio();playTone(FREQ[i],.35,.18);b.classList.add("pressed");setTimeout(()=>b.classList.remove("pressed"),150);if(foods.length>5){toast("音符がたくさん漂っています");return}foods.push({note:i,color:COLORS[i],x:random(tankLeft()+100,tankRight()-100),y:tankTop()+45,vx:random(-.18,.18),phase:random(TWO_PI)});fish.lookX=foods.at(-1).x;fish.lookY=foods.at(-1).y}
function ensureAudio(){if(audioCtx){audioCtx.resume();return}audioCtx=new(window.AudioContext||window.webkitAudioContext)();filter=audioCtx.createBiquadFilter();filter.type="lowpass";master=audioCtx.createGain();filter.connect(master);master.connect(audioCtx.destination);updateAudio()}
function updateAudio(){if(!filter)return;filter.frequency.setTargetAtTime(map(state.quality,15,100,650,9000,true),audioCtx.currentTime,.25);master.gain.setTargetAtTime(map(state.quality,15,100,.35,.72,true),audioCtx.currentTime,.2)}
function playTone(freq,dur,vol){if(!audioCtx)return;updateAudio();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type="sine";o.frequency.value=freq;g.gain.setValueAtTime(0,audioCtx.currentTime);g.gain.linearRampToValueAtTime(vol,audioCtx.currentTime+.015);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+dur);o.connect(g);g.connect(filter);o.start();o.stop(audioCtx.currentTime+dur+.03)}
function wireUI(){document.querySelector("#shop-open").onclick=()=>{renderShop();document.querySelector("#shop").showModal()};document.querySelector("#water-change").onclick=changeWater}
function changeWater(){if(waterAnimation)return;const safe=state.conditioner>0?40:18;if(state.conditioner>0)state.conditioner--;else toast("カルキ抜きなしの軽い水換えです");waterAnimation={t:0,safe};state.algae=Math.max(0,state.algae-10);playTone(392,.4,.08);syncUI()}
function renderShop(){const grid=document.querySelector("#shop-grid");grid.innerHTML="";SHOP.forEach(item=>{const owned=state.owned.includes(item.id),disabled=(owned&&item.type!=="plant"&&item.type!=="item")||state.points<item.cost;const b=document.createElement("button");b.className="shop-item";b.disabled=disabled;b.innerHTML=`<b>${item.name}</b><small>${owned&&item.type!=="plant"&&item.type!=="item"?"購入済み":item.desc}</small><span>${item.cost} ♪</span>`;b.onclick=()=>buy(item);grid.append(b)});document.querySelector("#shop-points").textContent=state.points}
function buy(item){if(state.points<item.cost)return;state.points-=item.cost;if(item.type==="plant")state.plants.push(item.id);else if(item.type==="item")state.conditioner++;else{state.owned.push(item.id);if(item.type==="sand")state.sand=item.id;if(item.type==="light")state.light=2;if(item.type==="filter")state.filter=2;if(item.type==="tank")state.tank=2}toast(`${item.name}を水槽に迎えました`);renderShop();syncUI();saveGame()}
function syncUI(){document.querySelector("#points").textContent=state.points;document.querySelector("#shop-points").textContent=state.points;document.querySelector("#conditioner-count").textContent=`カルキ抜き ×${state.conditioner}`;document.querySelector("#quality-bar").style.width=`${state.quality}%`;document.querySelector("#quality-bar").style.background=state.quality>65?"#62b8a6":state.quality>35?"#d7ad5d":"#d77d6b";document.querySelector("#quality-label").textContent=state.quality>80?"きれい":state.quality>55?"少しにごっている":state.quality>30?"にごっている":"水換えしてあげよう";updateAudio()}
function toast(msg){const el=document.querySelector("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),1900)}
function mousePressed(){if(mouseX<tankLeft()||mouseX>tankRight()||mouseY<tankTop()||mouseY>tankBottom())return;for(let i=rests.length-1;i>=0;i--){if(dist(mouseX,mouseY,rests[i].x,rests[i].y)<42){const r=rests.splice(i,1)[0];state.points+=3;state.quality=Math.min(100,state.quality+2);for(let j=0;j<18;j++)particles.push({x:r.x,y:r.y,vx:random(-2,2),vy:random(-3,.5),life:random(.5,1),c:"#e8ce79"});ensureAudio();playTone(784,.12,.08);toast("休符をきれいにしました +3 ♪");syncUI();return false}}if(dist(mouseX,mouseY,fish.x,fish.y)<100){fish.lookAt(mouseX,mouseY);ensureAudio();playTone(523.25,.1,.05);return false}scrubAlgae(mouseX,mouseY);return false}
function mouseDragged(){if(mouseX>tankLeft()&&mouseX<tankRight()&&mouseY>tankTop()&&mouseY<tankBottom())scrubAlgae(mouseX,mouseY);return false}
function touchMoved(){mouseDragged();return false}
function scrubAlgae(x,y){if(state.algae<=0)return;state.algae=Math.max(0,state.algae-.65);if(frameCount%4===0)particles.push({x,y,vx:random(-1,1),vy:random(-1,1),life:.35,c:"#6a9b6c"});syncUI()}
function windowResized(){/* p5 canvas keeps a stable game coordinate system and scales with CSS */}

const TYPES = [
  {type:'marpan',icon:'◉',label:'マーパン',material:'soft'},
  {type:'board',icon:'▬',label:'板',material:'wood'},
  {type:'bowl',icon:'◡',label:'お椀',material:'ceramic'},
  {type:'cup',icon:'▯',label:'コップ',material:'glass'},
  {type:'spoon',icon:'♩',label:'スプーン',material:'metal'},
  {type:'metal',icon:'▰',label:'金属',material:'metal'},
  {type:'stone',icon:'●',label:'石',material:'stone'},
  {type:'bell',icon:'♢',label:'ベル',material:'bell'}
];
const MATERIALS={
  metal:{wave:'sine',base:880,decay:.55,bright:1.7},bell:{wave:'sine',base:1046,decay:.9,bright:2.4},
  wood:{wave:'triangle',base:330,decay:.17,bright:.45},ceramic:{wave:'sine',base:440,decay:.42,bright:1.25},
  glass:{wave:'sine',base:784,decay:.7,bright:2},stone:{wave:'triangle',base:220,decay:.1,bright:.25},soft:{wave:'sine',base:294,decay:.28,bright:.6}
};
const SCALE=[1,9/8,5/4,3/2,5/3,2,9/4,5/2,3];
let objects=[],drops=[],sprays=[],ripples=[],flow=.38,selected=null,dragOffset,rotating=false,rotateMoved=false;
let audioCtx,master,soundOn=true,lastSound=0,lastPointer={x:0,y:0},pointerSpeed=0;

function setup(){
  const wrap=document.getElementById('canvas-wrap'),c=createCanvas(wrap.clientWidth,wrap.clientHeight);c.parent(wrap);
  pixelDensity(min(devicePixelRatio||1,2)); strokeCap(ROUND); makeTray(); resetObjects();
}
function resetObjects(){objects=[]; spawn('marpan',width*.3,height*.68,-.08);spawn('board',width*.55,height*.57,.23);spawn('bowl',width*.72,height*.72,0)}
function makeTray(){
  const tray=document.getElementById('tray');
  TYPES.forEach(t=>{const b=document.createElement('button');b.className='item';b.innerHTML=`<div>${t.icon}<span>${t.label}</span></div>`;b.title=t.label;
    b.addEventListener('pointerdown',e=>{e.preventDefault();initAudio();const r=document.querySelector('canvas').getBoundingClientRect();spawn(t.type,e.clientX-r.left,e.clientY-r.top-70,0,true);});tray.appendChild(b)});
  document.getElementById('sound').onclick=()=>{initAudio();soundOn=!soundOn;document.getElementById('sound').classList.toggle('off',!soundOn)};
}
function spawn(type,x,y,a=0,grab=false){
  const def=TYPES.find(t=>t.type===type),o={...def,x,y,a,w:type==='marpan'?118:type==='board'||type==='metal'?132:type==='spoon'?115:type==='bowl'?112:type==='cup'?74:type==='bell'?70:88,h:type==='marpan'?82:type==='board'||type==='metal'?22:type==='spoon'?30:type==='bowl'?58:type==='cup'?88:type==='bell'?73:61,hitAt:0};
  objects.push(o);if(grab){selected=o;dragOffset={x:0,y:0};rotating=false}return o;
}
function draw(){
  background('#eaf8f7');drawTiles();drawSink();drawFaucet();emitWater();updateWater();objects.forEach(drawObject);drawSprays();drawRipples();drawSelection();
}
function drawTiles(){stroke(255,255,255,115);strokeWeight(1);for(let x=0;x<width;x+=80)line(x,0,x,height*.83);for(let y=0;y<height*.83;y+=80)line(0,y,width,y)}
function drawSink(){const y=height*.82;noStroke();fill(205,232,232);rect(0,y,width,height-y);fill(151,211,220,85);rect(0,y+12,width,height-y-12);stroke(255,210);strokeWeight(3);line(0,y+13,width,y+13);ripples.push&&0}
function faucetPos(){return{x:width*.5,y:min(118,height*.17)}}
function drawFaucet(){const p=faucetPos();push();translate(p.x,p.y);stroke('#182126');strokeWeight(4);strokeJoin(ROUND);fill('#d5dadd');
  // Wall-mounted faucet body: the silhouette follows the supplied reference.
  beginShape();vertex(116,-20);vertex(70,-20);bezierVertex(43,-20,31,-12,12,-10);bezierVertex(-9,-8,-23,-20,-37,-20);bezierVertex(-57,-20,-66,-3,-66,14);vertex(-66,43);vertex(-91,43);vertex(-91,13);bezierVertex(-91,-17,-73,-42,-47,-50);bezierVertex(-28,-56,-21,-70,-21,-86);vertex(23,-86);bezierVertex(23,-64,36,-53,58,-49);bezierVertex(74,-46,94,-46,116,-46);endShape(CLOSE);
  noFill();stroke(255,210);strokeWeight(9);arc(-63,8,36,67,PI,PI+HALF_PI);arc(-5,-66,33,45,0,HALF_PI);stroke('#182126');strokeWeight(4);
  fill('#c9ced1');rect(113,-51,22,36,8,0,0,8);arc(135,-33,28,70,HALF_PI,PI+HALF_PI,CHORD);
  // Stem and broad top handle. It slides horizontally to show the amount.
  fill('#bfc5c8');rect(-8,-105,16,21);fill('#d5dadd');rect(-50,-122,100,20,10,10,0,0);rect(-12,-136,24,14,1);
  const knobX=map(flow,0,1,-35,35);noStroke();fill('#57bcd8');rect(knobX-10,-126,20,5,3);fill(255,180);rect(knobX-6,-125,7,2,2);pop();
  if(flow<.03){noStroke();fill('#79d8ee');circle(p.x-78,p.y+50,7)}
}
function emitWater(){if(flow<=.01)return;const p=faucetPos(),outletX=p.x-78;let rate=flow<.15?map(flow,.01,.15,48,12):map(flow,.15,1,7,1.5);if(frameCount%max(1,floor(rate))===0){const n=flow<.15?1:ceil(flow*2.4);for(let i=0;i<n;i++)drops.push({x:outletX+random(-flow*5,flow*5),y:p.y+43,vx:random(-.15,.15),vy:flow<.15?1.2:3+flow*3.5,r:3+flow*2,life:260,trail:[]})}}
function updateWater(){
  for(let i=drops.length-1;i>=0;i--){const d=drops[i],px=d.x,py=d.y;d.trail.unshift({x:px,y:py});if(d.trail.length>6)d.trail.pop();d.vy+=.19;d.x+=d.vx;d.y+=d.vy;d.life--;
    let hit=null;for(let j=objects.length-1;j>=0;j--){const h=collision(objects[j],d.x,d.y);if(h){hit={o:objects[j],...h};break}}
    if(hit){splash(d,hit);drops.splice(i,1);continue}if(d.y>height*.82){ripples.push({x:d.x,y:height*.835,r:2,life:32});if(random()<.08)playHit({material:'ceramic',w:width},d.x/width,.18);drops.splice(i,1);continue}if(d.life<0||d.x<0||d.x>width)drops.splice(i,1)
  }
  noFill();stroke('#5cc8e5');for(const d of drops){for(let k=d.trail.length-1;k>=0;k--){const q=d.trail[k];stroke(89,200,229,map(k,0,d.trail.length,210,15));strokeWeight(d.r*(1-k/d.trail.length*.65));point(q.x,q.y)}stroke(215,251,255,210);strokeWeight(1.2);line(d.x-1,d.y-3,d.x-1,d.y+2)}
}
function collision(o,x,y){
  const c=cos(-o.a),s=sin(-o.a),lx=(x-o.x)*c-(y-o.y)*s,ly=(x-o.x)*s+(y-o.y)*c;let inside=false,nx=0,ny=-1;
  if(['board','metal'].includes(o.type)){inside=abs(lx)<o.w/2&&abs(ly)<o.h/2;ny=ly<0?-1:1}
  else if(o.type==='bowl'){const rr=sq(lx/(o.w*.5))+sq((ly+o.h*.04)/(o.h*.66));inside=rr<1&&ly>0;nx=lx/(o.w*.5);ny=-.3}
  else if(o.type==='cup'){inside=abs(lx)<o.w*.48&&ly>-o.h*.5&&ly<o.h*.5;if(abs(lx)<o.w*.34&&ly<o.h*.25)ny=-.15;else nx=lx<0?-1:1}
  else if(o.type==='spoon'){inside=(sq((lx+o.w*.36)/25)+sq(ly/20)<1)||(lx>-o.w*.3&&lx<o.w*.5&&abs(ly)<6);nx=lx<0?-.6:.3;ny=-1}
  else if(o.type==='bell'){inside=abs(lx)<o.w*(.38+.18*(ly/o.h+.5))&&ly>-o.h*.48&&ly<o.h*.46;nx=lx/(o.w*.5);ny=-1}
  else{inside=sq(lx/(o.w*.5))+sq(ly/(o.h*.5))<1;nx=lx/(o.w*.5);ny=ly/(o.h*.5)}
  if(!inside)return null;const wc=cos(o.a),ws=sin(o.a),len=max(.01,sqrt(nx*nx+ny*ny));return{nx:(nx*wc-ny*ws)/len,ny:(nx*ws+ny*wc)/len,localX:lx,localY:ly}
}
function splash(d,h){
  const tangent={x:-h.ny,y:h.nx},slope=constrain(h.nx,-1,1),impact=constrain(d.vy/12,0,1),count=floor(3+flow*12+impact*7);
  for(let k=0;k<count;k++){let side=random()<.5?-1:1,bias=slope*.72;let vx=tangent.x*side*random(1,4+flow*4)+bias*4+random(-1,1),vy=-abs(random(.7,4.5)*impact)+tangent.y*side*2;sprays.push({x:d.x,y:d.y,vx,vy,r:random(1.5,3.7+flow*2),life:random(22,52)})}
  if(flow>.16){for(let k=0;k<ceil(flow*2);k++){const side=abs(slope)<.12?(k%2?1:-1):(slope>0?1:-1);drops.push({x:d.x+h.nx*3,y:d.y+h.ny*3,vx:tangent.x*side*random(1.5,4.5)+random(-1,1),vy:max(-1,d.vy*.28+tangent.y*side*2),r:max(2,d.r*.7),life:100,trail:[]})}}
  if(millis()-h.o.hitAt>max(45,190-flow*130)){playHit(h.o,(h.localX/h.o.w)+.5,impact, h.localY);h.o.hitAt=millis();if(h.o.type==='marpan')eyePing(h.o,h.localX,h.localY)}
}
function eyePing(o,lx,ly){if(abs(ly)<o.h*.18){const spots=[-.25,0,.25];for(let i=0;i<3;i++)if(abs(lx/o.w-spots[i])<.09){playTone(660*SCALE[i+1],.42,.08,'sine',2.8);return}}}
function drawSprays(){for(let i=sprays.length-1;i>=0;i--){const p=sprays[i];p.x+=p.vx;p.y+=p.vy;p.vy+=.2;p.vx*=.985;p.life--;noStroke();fill(85,198,229,min(210,p.life*8));ellipse(p.x,p.y,p.r,p.r*1.35);if(p.y>height*.82||p.life<0)sprays.splice(i,1)}}
function drawRipples(){for(let i=ripples.length-1;i>=0;i--){const r=ripples[i];r.r+=1.3;r.life--;noFill();stroke(83,181,205,r.life*5);strokeWeight(1.5);ellipse(r.x,r.y,r.r*3,r.r*.55);if(r.life<0)ripples.splice(i,1)}}
function drawObject(o){push();translate(o.x,o.y);rotate(o.a);stroke('#27383c');strokeWeight(3);strokeJoin(ROUND);
  if(o.type==='marpan'){pop();drawMarpan(o);return}
  if(o.type==='board'){fill('#d7a768');rectMode(CENTER);rect(0,0,o.w,o.h,7);stroke(255,90);line(-o.w*.38,-3,o.w*.38,-3)}
  if(o.type==='metal'){fill('#a9bbc0');rectMode(CENTER);rect(0,0,o.w,o.h,5);stroke(255,170);line(-o.w*.4,-4,o.w*.4,-4)}
  if(o.type==='stone'){fill('#77898b');ellipse(0,0,o.w,o.h);noStroke();fill(255,35);ellipse(-15,-10,27,13)}
  if(o.type==='bowl'){fill('#f5bfa9');arc(0,-10,o.w,o.h*1.25,0,PI,CHORD);noFill();stroke('#27383c');ellipse(0,-10,o.w,17);stroke(255,160);arc(0,-6,o.w*.8,o.h*.75,.1,PI-.1)}
  if(o.type==='cup'){fill(204,243,247,120);beginShape();vertex(-o.w*.45,-o.h*.5);vertex(-o.w*.34,o.h*.5);vertex(o.w*.34,o.h*.5);vertex(o.w*.45,-o.h*.5);endShape();noFill();ellipse(0,-o.h*.5,o.w*.9,12)}
  if(o.type==='spoon'){fill('#c7d5d7');ellipse(-o.w*.35,0,31,25);strokeWeight(9);line(-o.w*.22,0,o.w*.5,0);stroke(255,160);strokeWeight(2);line(-o.w*.18,-2,o.w*.46,-2)}
  if(o.type==='bell'){fill('#f5c857');beginShape();vertex(0,-o.h*.5);bezierVertex(-o.w*.35,-o.h*.3,-o.w*.28,o.h*.2,-o.w*.48,o.h*.38);vertex(o.w*.48,o.h*.38);bezierVertex(o.w*.28,o.h*.2,o.w*.35,-o.h*.3,0,-o.h*.5);endShape(CLOSE);fill('#e69a3c');circle(0,o.h*.48,13)}pop()}
function drawMarpan(o){const m=new Marpan25D({x:o.x,y:o.y,maxSize:o.w,bodyColor:'#fffdfa'});m.lookAt(faucetPos().x,faucetPos().y);push();translate(o.x,o.y);rotate(o.a);translate(-o.x,-o.y);m.drawAt(o.x,o.y,{bodyWidth:o.w,bodyHeight:o.h,lookX:faucetPos().x,lookY:faucetPos().y});pop()}
function drawSelection(){if(!selected)return;push();translate(selected.x,selected.y);rotate(selected.a);noFill();stroke(42,141,165,130);strokeWeight(2);drawingContext.setLineDash([5,5]);rectMode(CENTER);rect(0,0,selected.w+18,selected.h+18,12);drawingContext.setLineDash([]);fill(rotating?'#dff7fb':'#fff');stroke('#2a8da5');strokeWeight(2.5);const hx=selected.w/2+19,hy=-selected.h/2-19;circle(hx,hy,32);noFill();arc(hx,hy,17,17,-PI*.8,PI*.65);fill('#2a8da5');noStroke();triangle(hx+8,hy+2,hx+3,hy+1,hx+7,hy+7);pop()}
function initAudio(){if(!audioCtx){audioCtx=new(window.AudioContext||window.webkitAudioContext)();master=audioCtx.createGain();master.gain.value=.18;master.connect(audioCtx.destination)}if(audioCtx.state==='suspended')audioCtx.resume()}
function playHit(o,pos,impact){if(!soundOn)return;initAudio();const m=MATERIALS[o.material],idx=constrain(floor(pos*SCALE.length),0,SCALE.length-1),f=m.base*SCALE[idx]/2;playTone(f,m.decay,.025+impact*.07,m.wave,m.bright)}
function playTone(freq,decay,vol,wave,bright){if(!audioCtx||!soundOn)return;const now=audioCtx.currentTime,osc=audioCtx.createOscillator(),g=audioCtx.createGain(),o2=audioCtx.createOscillator(),g2=audioCtx.createGain();osc.type=wave;osc.frequency.setValueAtTime(freq,now);o2.type='sine';o2.frequency.setValueAtTime(freq*bright,now);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(vol,now+.006);g.gain.exponentialRampToValueAtTime(.0001,now+decay);g2.gain.setValueAtTime(vol*.24,now);g2.gain.exponentialRampToValueAtTime(.0001,now+decay*.55);osc.connect(g).connect(master);o2.connect(g2).connect(master);osc.start(now);o2.start(now);osc.stop(now+decay+.02);o2.stop(now+decay+.02)}
function hitObject(x,y){for(let i=objects.length-1;i>=0;i--)if(collision(objects[i],x,y))return objects[i];return null}
function rotationHandle(o){const lx=o.w/2+19,ly=-o.h/2-19,c=cos(o.a),s=sin(o.a);return{x:o.x+lx*c-ly*s,y:o.y+lx*s+ly*c}}
function hitRotationHandle(x,y){for(let i=objects.length-1;i>=0;i--){const h=rotationHandle(objects[i]);if(dist(x,y,h.x,h.y)<25)return objects[i]}return null}
function pointerDown(x,y){initAudio();const handle=hitRotationHandle(x,y);if(handle){selected=handle;objects.splice(objects.indexOf(handle),1);objects.push(handle);rotating=true;rotateMoved=false;return 'rotate'}const p=faucetPos();if(x>p.x-62&&x<p.x+62&&y>p.y-150&&y<p.y-92){selected=null;rotating=false;return 'tap'}const o=hitObject(x,y);if(o){selected=o;objects.splice(objects.indexOf(o),1);objects.push(o);dragOffset={x:x-o.x,y:y-o.y};rotating=false;return 'object'}selected=null;rotating=false;return null}
function mousePressed(){pointerDown(mouseX,mouseY);lastPointer={x:mouseX,y:mouseY};return false}
function setRotationFromPointer(x,y){if(!selected)return;const base=atan2(-selected.h/2-19,selected.w/2+19);selected.a=atan2(y-selected.y,x-selected.x)-base;rotateMoved=true}
function mouseDragged(){pointerSpeed=dist(mouseX,mouseY,lastPointer.x,lastPointer.y);lastPointer={x:mouseX,y:mouseY};const p=faucetPos();if(!selected&&mouseY<p.y-80){flow=constrain(map(mouseX,p.x-55,p.x+55,0,1),0,1)}else if(selected){if(rotating||keyIsDown(SHIFT)){setRotationFromPointer(mouseX,mouseY)}else{selected.x=constrain(mouseX-dragOffset.x,30,width-30);selected.y=constrain(mouseY-dragOffset.y,120,height*.8)}}return false}
function mouseReleased(){if(rotating&&!rotateMoved&&selected)selected.a+=PI/12;rotating=false;return false}
function touchStarted(){if(touches.length===1)pointerDown(touches[0].x,touches[0].y);return false}
function touchMoved(){if(selected&&touches.length>=2){selected.a=atan2(touches[1].y-touches[0].y,touches[1].x-touches[0].x);rotateMoved=true}else if(selected&&touches[0]){if(rotating)setRotationFromPointer(touches[0].x,touches[0].y);else{selected.x=constrain(touches[0].x-dragOffset.x,30,width-30);selected.y=constrain(touches[0].y-dragOffset.y,120,height*.8)}}else if(touches[0]){const p=faucetPos();flow=constrain(map(touches[0].x,p.x-55,p.x+55,0,1),0,1)}return false}
function touchEnded(){if(rotating&&!rotateMoved&&selected)selected.a+=PI/12;rotating=false;return false}
function doubleClicked(){const o=hitObject(mouseX,mouseY);if(o){objects.splice(objects.indexOf(o),1);selected=null}return false}
function keyPressed(){if(selected){if(keyCode===LEFT_ARROW)selected.a-=.12;if(keyCode===RIGHT_ARROW)selected.a+=.12;if(keyCode===DELETE||keyCode===BACKSPACE){objects.splice(objects.indexOf(selected),1);selected=null}}}
function windowResized(){resizeCanvas(windowWidth,windowHeight);objects.forEach(o=>{o.x=constrain(o.x,30,width-30);o.y=constrain(o.y,120,height*.8)})}

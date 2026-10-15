"use strict";

const PAGES=[
  {bg:"#fff9ec",ja:"はみがき しゅっ",en:"Brush, swish!",instruction:{ja:"青のりを タップ！",en:"Tap the seaweed!"},kind:"seaweed",spots:[[-.13,-.19]]},
  {bg:"#f0f9f3",ja:"はみがき しゅっしゅっ",en:"Brush, swish swish!",instruction:{ja:"お肉を 左右に こすろう",en:"Rub left and right to remove the meat"},kind:"meat",spots:[[-.27,-.19],[.21,.19]]},
  {bg:"#eef5ff",ja:"はみがき しゅしゅしゅ",en:"Brush, scrub scrub scrub!",instruction:{ja:"大きく こすって お魚と骨を とろう",en:"Use big strokes to brush off the fish and bones"},kind:"fish",spots:[[-.31,-.19],[.05,.19],[.32,-.19]]},
  {bg:"#fff1ed",ja:"はみがき しゅっしゅっしゅっー",en:"Brush, swish swish swiiish!",instruction:{ja:"食べかすは タップ、黒ずみは こすろう",en:"Tap crumbs, then scrub the dark spots"},kind:"grime",spots:[[-.33,-.19],[-.09,.19],[.15,-.19],[.35,.19]]}
];
const LABELS={ja:{reset:"もういちど",next:"つぎへ →",again:"さいしょから →",done:"ぴっかぴか！",page:"ページ"},en:{reset:"Start over",next:"Next →",again:"Play again →",done:"Sparkly clean!",page:"Page"}};
let page=0,language="ja",marpan,states=[],mouth,active=null,particles=[],sparkles=[],soundReady=false,brushNoise,brushEnvelope,popOsc,lastBrushAt=0,completedAt=0;
const story=document.getElementById("story");

function newState(index){
  const spots=PAGES[index].spots.map(([x,y])=>({x,y,progress:0,fish:false,bone:false,removed:false,wobble:0}));
  const grime=index===3?Array.from({length:16},(_,tooth)=>Array.from({length:6},(_,cell)=>({tooth,cell,dirt:2+((tooth*7+cell*3)%3)}))).flat():[];
  return {spots,grime,complete:false};
}
function setup(){
  createCanvas(windowWidth,windowHeight,P2D,story);pixelDensity(min(window.devicePixelRatio||1,2));
  marpan=new Marpan25D({id:"common-marpan",autoBlink:true});marpan.enableAutoBlink(2600,4300);
  states=PAGES.map((_,i)=>newState(i));
  story.addEventListener("pointerdown",pointerDown,{passive:false});story.addEventListener("pointermove",pointerMove,{passive:false});story.addEventListener("pointerup",pointerUp,{passive:false});story.addEventListener("pointercancel",pointerUp,{passive:false});
  document.getElementById("language").addEventListener("click",()=>{language=language==="ja"?"en":"ja";updateUI()});
  document.getElementById("reset").addEventListener("click",()=>{states[page]=newState(page);particles=[];sparkles=[];completedAt=0;updateUI()});
  document.getElementById("next").addEventListener("click",()=>{if(!states[page].complete)return;page=(page+1)%4;particles=[];sparkles=[];completedAt=0;updateUI()});
  updateUI();
}
function updateUI(){
  document.documentElement.lang=language;
  document.getElementById("book").setAttribute("aria-label",language==="ja"?"マーパン はみがき。4ページの絵本":"Ma-pan Brush Your Teeth. A four-page picture book");
  story.setAttribute("aria-label",language==="ja"?"マーパンの歯。汚れをタップしたり、指でこすったりして磨きます":"Ma-pan's teeth. Tap crumbs and rub the teeth to brush them");
  document.getElementById("title").textContent=PAGES[page][language];
  document.getElementById("instruction").textContent=states[page].complete?LABELS[language].done:PAGES[page].instruction[language];
  document.getElementById("page").textContent=`${page+1}/4`;
  document.getElementById("reset").textContent=LABELS[language].reset;
  const next=document.getElementById("next");next.hidden=!states[page].complete;next.textContent=page===3?LABELS[language].again:LABELS[language].next;
  const lang=document.getElementById("language");lang.textContent=language==="ja"?"EN":"JA";lang.setAttribute("aria-label",language==="ja"?"Switch to English":"日本語に切り替え");
  document.getElementById("live").textContent=`${LABELS[language].page} ${page+1}. ${states[page].complete?LABELS[language].done:PAGES[page][language]}`;
}
function layout(){
  const mobile=width<600;
  const bodyW=min(width*(mobile?.91:.56),height*(mobile?.68:.83),650);
  const bodyH=min(height*(mobile?.36:.43),bodyW*(page===3?.52:.56));
  const cx=width*.5,cy=height*(mobile?.53:.55);
  const mw=bodyW*[.42,.48,.54,.68][page],mh=bodyH*(page===3?.25:.27);
  const eyeY=cy-bodyH*.18;
  const mouthY=cy+bodyH*.07;
  return {cx,cy,bodyW,bodyH,eyeY,x:cx-mw/2,y:mouthY-mh/2,w:mw,h:mh};
}
function toothRects(m){
  const out=[],count=page===3?8:4,gap=m.w*.012,span=m.w*.72,tw=span/count,start=m.x+m.w*.14;
  for(let row=0;row<2;row++)for(let col=0;col<count;col++)out.push({x:start+col*tw+gap,y:m.y+m.h*(row===0?.20:.56),w:tw-gap*2,h:m.h*.24,row,col,index:row*count+col});
  return out;
}
function spotXY(spot,m){return{x:m.x+m.w*(.5+spot.x),y:m.y+m.h*(.5+spot.y)}}
function draw(){
  background(PAGES[page].bg);mouth=layout();drawDecor();drawMarpan(mouth);drawMouth(mouth);drawSpots(mouth);drawParticles();if(states[page].complete)drawSparkles(mouth);
}
function drawDecor(){
  noStroke();fill(255,255,255,115);circle(width*.12,height*.34,min(width,height)*.17);circle(width*.86,height*.72,min(width,height)*.22);
  fill(109,91,78,22);ellipse(width*.5,height*.88,min(width*.65,510),24);
}
function drawMarpan(m){
  push();translate(m.cx,m.cy);marpan.updateAutoBlink();
  marpan.drawBody(0,0,m.bodyW,m.bodyH,0,"#fffdf8");
  const lookX=active?active.x:(mouseX===0&&mouseY===0?m.cx:mouseX);
  const lookY=active?active.y:(mouseX===0&&mouseY===0?m.cy:mouseY);
  marpan.lookAt(lookX,lookY);
  // Draw all three eyes using the common character, then replace the center eye with the mouth.
  marpan.drawEyes(0,0,m.bodyW,m.bodyH,0,lookX-m.cx,lookY-m.cy,{eyeScale:.72,eyeGroupOffsetY:m.eyeY-m.cy});
  noStroke();fill("#fffdf8");ellipse(0,m.eyeY-m.cy,m.bodyW*.24,m.bodyW*.25);
  pop();
}
function drawMouth(m){
  push();stroke("#684b4c");strokeWeight(max(3,m.w*.008));fill("#8d535d");ellipse(m.cx,m.y+m.h/2,m.w,m.h);
  noStroke();fill("#b86977");ellipse(m.cx,m.y+m.h*.8,m.w*.55,m.h*.18);
  const teeth=toothRects(m);
  teeth.forEach(t=>{
    stroke("#c9b8ab");strokeWeight(max(1,m.w*.003));fill("#fffef8");rect(t.x,t.y,t.w,t.h,max(3,t.w*.12));
    if(page===3)drawToothGrime(t,states[page].grime.filter(g=>g.tooth===t.index));
  });
  pop();
}
function grimeCellRect(tooth,cell){const col=cell%2,row=floor(cell/2);return{x:tooth.x+tooth.w*(.13+col*.4),y:tooth.y+tooth.h*(.08+row*.29),w:tooth.w*.35,h:tooth.h*.24}}
function drawToothGrime(tooth,cells){
  noStroke();cells.forEach(g=>{if(g.dirt<=0)return;const r=grimeCellRect(tooth,g.cell),alpha=min(225,55+g.dirt*36);if(g.cell%3===0)fill(81,75,70,alpha);else fill(132,100,72,alpha);rect(r.x,r.y,r.w,r.h,max(2,tooth.w*.08))});
}
function drawSpots(m){
  states[page].spots.forEach((s,i)=>{if(s.removed)return;const p=spotXY(s,m),r=max(8,m.w*.026);push();translate(p.x+sin(millis()*.035)*s.wobble,p.y);noStroke();
    if(page===0){fill("#2d8a57");ellipse(-r*.35,-r*.15,r*.95,r*.55);ellipse(r*.3,r*.13,r*.9,r*.45);stroke("#17693e");strokeWeight(2);line(-r*.6,-r*.55,r*.55,r*.45)}
    if(page===1){fill("#9b493d");ellipse(0,0,r*1.8,r*1.12);fill("#c87054");ellipse(-r*.22,-r*.14,r*.85,r*.4)}
    if(page===2){if(!s.fish){fill("#e8e2c9");ellipse(0,0,r*1.9,r*1.1);fill("#b5a986");ellipse(-r*.25,-r*.12,r*.7,r*.28)}if(!s.bone){stroke("#a5a294");strokeWeight(2.5);line(-r*.75,0,r*.75,0);line(-r*.2,0,-r*.55,-r*.45);line(r*.15,0,r*.47,r*.4)}}
    if(page===3){fill(i%2?"#76583b":"#447f5b");ellipse(0,0,r*1.3,r*.85)}
    pop();s.wobble*=.83;
  });
}
function drawParticles(){
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vy+=.12;p.life--;noStroke();fill(p.color);circle(p.x,p.y,p.size*p.life/28);if(p.life<=0)particles.splice(i,1)}
}
function burst(x,y,color){for(let i=0;i<9;i++){const a=TWO_PI*i/9+random(-.2,.2),speed=random(2,5);particles.push({x,y,vx:cos(a)*speed,vy:sin(a)*speed-2,life:28,size:random(4,9),color})}}
function drawSparkles(m){
  const t=millis()-completedAt;if(t<0)return;
  for(let i=0;i<5;i++){const x=m.x+m.w*(.12+i*.19),y=m.y+m.h*(i%2?.72:.25),phase=(t*.004+i*.8)%TWO_PI;push();translate(x,y);stroke(255,255,255,220);strokeWeight(2.5);const z=6+abs(sin(phase))*9;line(-z,0,z,0);line(0,-z,0,z);pop()}
}
function localPoint(e){const rect=story.getBoundingClientRect();return{x:(e.clientX-rect.left)*width/rect.width,y:(e.clientY-rect.top)*height/rect.height}}
function insideMouth(p,m,pad=0){return p.x>=m.x-pad&&p.x<=m.x+m.w+pad&&p.y>=m.y-pad&&p.y<=m.y+m.h+pad}
function nearestSpot(p,m,radius){let best=null,dist=Infinity;states[page].spots.forEach(s=>{if(s.removed)return;const q=spotXY(s,m),d=Math.hypot(p.x-q.x,p.y-q.y);if(d<radius&&d<dist){best=s;dist=d}});return best}
function pointerDown(e){
  e.preventDefault();if(active)return;const p=localPoint(e),m=layout();if(!insideMouth(p,m,max(18,m.w*.04)))return;
  unlockSound();story.setPointerCapture(e.pointerId);active={id:e.pointerId,x:p.x,y:p.y,startX:p.x,startY:p.y,total:0,spot:nearestSpot(p,m,max(27,m.w*.07))};
}
function pointerMove(e){
  if(!active||e.pointerId!==active.id)return;e.preventDefault();const p=localPoint(e),m=layout(),dx=p.x-active.x,dy=p.y-active.y,d=Math.hypot(dx,dy);
  if(d<2)return;const previous={x:active.x,y:active.y};active.x=p.x;active.y=p.y;active.total+=d;
  if(states[page].complete||page===0)return;
  const steps=max(1,ceil(d/max(6,m.w*.018)));for(let i=1;i<=steps;i++){const q={x:lerp(previous.x,p.x,i/steps),y:lerp(previous.y,p.y,i/steps)};if(insideMouth(q,m))scrubAt(q,m,d/steps,abs(dx)/max(d,1))}
  brushSound(d);
}
function pointerUp(e){
  if(!active||e.pointerId!==active.id)return;e.preventDefault();const m=layout(),p=localPoint(e),wasTap=active.total<max(12,m.w*.028);
  if(wasTap&&!states[page].complete&&(page===0||page===3)){
    const s=nearestSpot(p,m,max(30,m.w*.075));if(s){s.removed=true;const q=spotXY(s,m);burst(q.x,q.y,page===0?"#348d55":"#816046");swishSound();popSound();checkComplete()}
  }
  active=null;
}
function scrubAt(p,m,d,horizontal){
  if(page===3){
    const teeth=toothRects(m),radius=max(16,m.w*.045);
    states[page].grime.forEach(g=>{if(g.dirt<=0)return;const t=teeth[g.tooth],r=grimeCellRect(t,g.cell),cx=r.x+r.w/2,cy=r.y+r.h/2;if(Math.hypot(p.x-cx,p.y-cy)<radius){g.dirt=max(0,g.dirt-d/(m.w*.047))}});
    checkComplete();return;
  }
  const s=nearestSpot(p,m,max(28,m.w*.075));if(!s)return;
  s.wobble=min(4,s.wobble+1.1);
  // Sideways movement is most effective, while diagonal strokes still count for young players.
  s.progress+=d*(.45+.55*horizontal);
  const unit=m.w*(page===1?.12:.25);
  if(page===1&&s.progress>=unit){removeSpot(s,m,"#ab5b48")}
  if(page===2){if(!s.fish&&s.progress>=unit){s.fish=true;const q=spotXY(s,m);burst(q.x,q.y,"#e9e0c4");popSound()}
    if(!s.bone&&s.progress>=unit*1.8){s.bone=true;removeSpot(s,m,"#aaa89a")}}
}
function removeSpot(s,m,color){s.removed=true;const q=spotXY(s,m);burst(q.x,q.y,color);popSound();checkComplete()}
function checkComplete(){
  const state=states[page];if(state.complete)return;
  if(!state.spots.every(s=>s.removed))return;
  if(page===3&&state.grime.some(g=>g.dirt>.01))return;
  state.complete=true;completedAt=millis();completeSound();updateUI();
}
function unlockSound(){
  if(soundReady)return;userStartAudio();brushNoise=new p5.Noise("white");brushEnvelope=new p5.Envelope();brushEnvelope.setADSR(.005,.045,0,.045);brushEnvelope.setRange(.075,0);brushNoise.start();brushNoise.amp(0);popOsc=new p5.Oscillator("sine");popOsc.start();popOsc.amp(0);soundReady=true;
}
function brushSound(distance){
  if(!soundReady)return;const now=millis();if(now-lastBrushAt<42)return;lastBrushAt=now;
  brushNoise.amp(0);brushEnvelope.setRange(constrain(distance/90,.025,.09),0);brushEnvelope.play(brushNoise);
}
function swishSound(){if(!soundReady)return;brushEnvelope.setRange(.11,0);brushEnvelope.play(brushNoise)}
function popSound(){if(!soundReady)return;popOsc.freq(520);popOsc.amp(.09,.005);popOsc.freq(310,.09);popOsc.amp(0,.12)}
function completeSound(){if(!soundReady)return;[660,880,1175].forEach((hz,i)=>setTimeout(()=>{popOsc.freq(hz);popOsc.amp(.08,.01);popOsc.amp(0,.16)},i*105))}
function windowResized(){resizeCanvas(windowWidth,windowHeight)}

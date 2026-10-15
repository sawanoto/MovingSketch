"use strict";

const POSES = [
  ["正面で立つ","front","STAND"],["横向き","side","SIDE VIEW"],["歩く","walk","WALK"],["走る","run","RUN"],
  ["座る","sit","SIT"],["寝る","sleep","SLEEP"],["手を振る","wave","WAVE"],["指差す","point","POINT"],
  ["物を持つ","hold","HOLD"],["転ぶ","fall","FALL"],["腕を組む","cross","ARMS CROSSED"],["困って立ち尽くす","trouble","AT A LOSS"]
];
const RATIO_TEXT = {
  1:["01","マーパン本体 ＋ 小さな手足","従来のマーパン本体が頭と体を兼ねる、最もコンパクトな構成。"],
  2:["02","マーパンの頭 ＋ 同じ大きさの体","頭と同程度の丸い体をつなぎ、体から短い手足を生やした漫画向けの基本形。"],
  3:["03","マーパンの頭 ＋ 頭2個分の体","頭の下に縦長の楕円形の体をつなぎ、動作を大きく見せる構成。"]
};
const RATIO_COPY_EN = {
  1:"The original Ma-pan body serves as both head and torso, with tiny arms and legs.",
  2:"A round body about the size of the head, with short arms and legs: the basic comic form.",
  3:"A long oval body beneath the head makes each action read more clearly."
};
const RATIO_TITLE_EN = {
  1:"ORIGINAL MA-PAN BODY + SMALL LIMBS",
  2:"MA-PAN HEAD + MATCHING BODY",
  3:"MA-PAN HEAD + TWO-HEAD-TALL BODY"
};
let ratio=2, marpan, canvas;
const reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)");
let motionTime=0;

function setup(){
  canvas=createCanvas(1200,800);canvas.parent("sketch");pixelDensity(Math.min(devicePixelRatio||1,2));
  frameRate(30);
  marpan=new Marpan25D({bodyColor:"#fff",expression:"pupil"});
  reducedMotion.addEventListener("change",()=>{if(reducedMotion.matches){noLoop();redraw()}else loop()});
  document.querySelectorAll("[data-ratio]").forEach(button=>button.addEventListener("click",()=>setRatio(Number(button.dataset.ratio))));
  sizeCanvas();
  if(reducedMotion.matches)noLoop();
}
function sizeCanvas(){
  const host=document.getElementById("sketch"),w=Math.max(300,host.clientWidth),cols=w<660?2:w<960?3:4;
  resizeCanvas(w,Math.ceil(POSES.length/cols)*(w/cols*.78+48));
}
function windowResized(){sizeCanvas()}
function draw(){
  motionTime=reducedMotion.matches?0:millis()/1000;
  background("#faf9f5");const cols=width<660?2:width<960?3:4,cw=width/cols,ch=(height/Math.ceil(POSES.length/cols));
  POSES.forEach((p,i)=>{const col=i%cols,row=floor(i/cols),x=col*cw,y=row*ch;drawCell(x,y,cw,ch,p[0],p[1],p[2],i)});
}
function setRatio(next){ratio=next;document.querySelectorAll("[data-ratio]").forEach(b=>{const on=Number(b.dataset.ratio)===ratio;b.classList.toggle("active",on);b.setAttribute("aria-pressed",String(on))});const t=RATIO_TEXT[ratio];document.getElementById("ratio-number").textContent=t[0];document.getElementById("ratio-title").textContent=t[1];document.getElementById("ratio-title-en").textContent=RATIO_TITLE_EN[ratio];document.getElementById("ratio-copy").textContent=t[2];document.getElementById("ratio-copy-en").textContent=RATIO_COPY_EN[ratio];redraw()}
function drawCell(x,y,w,h,label,pose,english,index){
  stroke("#d5d3cc");strokeWeight(1);if(x>0)line(x,y,x,y+h);if(y>0)line(x,y,x+w,y);
  noStroke();fill("#777873");textFont("monospace");textSize(max(10,w*.036));textAlign(LEFT,TOP);text(String(index+1).padStart(2,"0"),x+14,y+12);
  fill("#20211f");textFont("sans-serif");textStyle(BOLD);textSize(max(13,w*.052));textAlign(CENTER,BOTTOM);text(label,x+w/2,y+h-26);textStyle(NORMAL);
  fill("#777873");textFont("monospace");textSize(max(9,w*.033));text(english,x+w/2,y+h-11);
  const maxS=min(w*.72,h*.76),s=maxS*(ratio===1?.9:ratio===2?.82:.72);drawCharacter(x+w/2,y+h*.46,s,pose);
}

function limb(points,weight){const path=()=>{beginShape();curveVertex(points[0][0],points[0][1]);points.forEach(p=>curveVertex(p[0],p[1]));const q=points[points.length-1];curveVertex(q[0],q[1]);endShape()};noFill();stroke("#161716");strokeWeight(weight+5);strokeCap(ROUND);strokeJoin(ROUND);path();stroke("#fff");strokeWeight(weight);path()}
function mitten(x,y,s,angle=0,pointing=false){push();translate(x,y);rotate(angle);stroke("#161716");strokeWeight(max(2,s*.1));fill("#fff");if(pointing){beginShape();vertex(-s*.5,-s*.42);vertex(s*.62,-s*.34);vertex(s*1.25,-s*.16);vertex(s*1.3,s*.05);vertex(s*.55,s*.17);vertex(s*.2,s*.55);vertex(-s*.55,s*.35);endShape(CLOSE)}else ellipse(0,0,s*1.12,s);pop()}
function foot(x,y,s,a=0){push();translate(x,y);rotate(a);stroke("#161716");strokeWeight(max(2,s*.09));fill("#fff");ellipse(0,0,s*1.5,s);pop()}
function drawCharacter(cx,cy,s,pose){
  const moving=!reducedMotion.matches;
  const cycle=motionTime*(pose==="run"?11:6.5);
  const stride=moving?sin(cycle):0;
  const bounce=moving?(pose==="run"?abs(sin(cycle))*s*.045:pose==="walk"?abs(sin(cycle))*s*.02:0):0;
  const sitShift=moving&&pose==="sit"?sin(motionTime*2.5)*s*.012:0;
  const slow=moving?sin(motionTime*2):0;
  const holdLift=moving&&pose==="hold"?sin(motionTime*2.2)*s*.018:0;
  push();translate(cx,(pose==="walk"||pose==="run"?cy-bounce:cy)+sitShift);
  let rot=pose==="fall"?-1.05:pose==="sleep"?PI/2:0;
  if(moving){
    if(pose==="front"||pose==="side")rot+=slow*.025;
    if(pose==="fall")rot+=sin(motionTime*2.8)*.08;
    if(pose==="trouble")rot+=sin(motionTime*12)*.015;
    if(pose==="cross")rot+=slow*.035;
  }
  rotate(rot);
  if(moving&&pose==="sleep")scale(1+sin(motionTime*1.6)*.012,1+sin(motionTime*1.6)*.025);
  const one=ratio===1;
  const headW=s*(one?.88:.72),headH=headW*.68;
  const torsoW=one?headW:(ratio===2?headW*.9:headW*.76),torsoH=one?headH:(ratio===2?headH:headH*2);
  const torsoY=one?0:headH*.42;
  // 頭と胴体の輪郭をわずかに重ね、離れて見えない一体のシルエットにする。
  const headY=one?0:torsoY-torsoH*.5-headH*.46;
  const arm=one?s*.22:ratio===2?s*.23:s*.3,leg=one?s*.2:ratio===2?s*.22:s*.28,lw=max(5,s*.065);
  let lift=0;if(pose==="run")lift=-s*.05;if(pose==="sit")lift=s*.07;if(pose==="sleep")lift=s*.02;
  const hipY=torsoY+torsoH*.4+lift,shoulderY=torsoY-torsoH*.18+lift;
  // legs behind the body
  if(pose!=="sleep"){
    let lf=[[-torsoW*.2,hipY],[-torsoW*.22,hipY+leg*.55],[-torsoW*.26,hipY+leg]],rf=[[torsoW*.2,hipY],[torsoW*.22,hipY+leg*.55],[torsoW*.28,hipY+leg]];
    if(pose==="walk"){lf=[[-torsoW*.18,hipY],[-torsoW*.2-stride*leg*.16,hipY+leg*.5],[-torsoW*.25-stride*leg*.35,hipY+leg*(.82+max(0,stride)*.13)]];rf=[[torsoW*.18,hipY],[torsoW*.2+stride*leg*.16,hipY+leg*.5],[torsoW*.25+stride*leg*.35,hipY+leg*(.82+max(0,-stride)*.13)]]}
    if(pose==="run"){lf=[[-torsoW*.16,hipY],[-torsoW*.2-stride*leg*.32,hipY+leg*.25],[-torsoW*.25-stride*leg*.55,hipY+leg*(.52+stride*.18)]];rf=[[torsoW*.16,hipY],[torsoW*.2+stride*leg*.32,hipY+leg*.25],[torsoW*.25+stride*leg*.55,hipY+leg*(.52-stride*.18)]]}
    if(pose==="sit"){lf=[[-torsoW*.18,hipY],[-torsoW*.35,hipY+leg*.12],[-torsoW*.42,hipY+leg*.2]];rf=[[torsoW*.18,hipY],[torsoW*.35,hipY+leg*.12],[torsoW*.43,hipY+leg*.2]]}
    if(pose==="cross"&&moving){rf[1][1]+=slow*leg*.035;rf[2][1]+=slow*leg*.075}
    limb(lf,lw);limb(rf,lw);foot(lf[2][0],lf[2][1],lw*1.45,pose==="walk"?-.25:0);foot(rf[2][0],rf[2][1],lw*1.45,pose==="walk"?.2:0)
  }
  // arms behind the body, except crossed arms which are redrawn in front
  const arms=armPaths(pose,torsoW,torsoH,arm,shoulderY,torsoY);
  if(pose==="walk"||pose==="run")arms.forEach((a,i)=>{const swing=(i?1:-1)*stride*arm*(pose==="run"?.5:.35);a.points[1][0]+=swing*.5;a.points[2][0]+=swing;a.end[0]+=swing});
  if(pose==="sit"&&moving)arms.forEach((a,i)=>{const sway=sin(motionTime*2.5+i)*arm*.06;a.points[2][1]+=sway;a.end[1]+=sway});
  if(moving&&pose==="wave"){const wave=sin(motionTime*5)*arm*.24;arms[0].points[1][0]+=wave*.5;arms[0].points[2][0]+=wave;arms[0].end[0]+=wave;arms[0].angle+=sin(motionTime*5)*.18}
  if(moving&&pose==="point"){const reach=(sin(motionTime*2.4)+1)*arm*.12;arms[1].points[1][0]+=reach*.5;arms[1].points[2][0]+=reach;arms[1].end[0]+=reach}
  if(moving&&pose==="hold")arms.forEach(a=>{a.points[2][1]+=holdLift;a.end[1]+=holdLift});
  if(moving&&pose==="trouble")arms.forEach((a,i)=>{const shake=sin(motionTime*10+i*2)*arm*.06;a.points[2][0]+=shake;a.end[0]+=shake});
  if(moving&&pose==="fall")arms.forEach((a,i)=>{const flail=sin(motionTime*4+i*2)*arm*.2;a.points[2][1]+=flail;a.end[1]+=flail});
  if(pose!=="cross"){arms.forEach(a=>{limb(a.points,lw);mitten(a.end[0],a.end[1],lw*1.55,a.angle,a.pointing)})}
  if(!one){stroke("#161716");strokeWeight(max(4,torsoW*.012));fill("#fff");ellipse(0,torsoY+lift,torsoW,torsoH)}
  marpan.drawBody(0,headY+lift,headW,headH,0,"#fff");
  const yaw=pose==="side"?.62:(pose==="walk"||pose==="run"||pose==="point")?.28:0;
  const eyeSweep=moving?sin(motionTime*1.6)*headW*.11:0;
  const lookX=pose==="trouble"?eyeSweep:(pose==="side"?headW*.28:pose==="point"?headW*.3:eyeSweep),lookY=(pose==="trouble"?headH*.15:0)+(moving?sin(motionTime*1.1)*headH*.025:0);
  push();marpan.beginClip(0,headY+lift,headW,headH,0);marpan.drawEyes(0,headY+lift,headW,headH,yaw,lookX,lookY,{eyeScale:.82});drawingContext.restore();pop();
  if(pose==="cross")arms.forEach(a=>{limb(a.points,lw);mitten(a.end[0],a.end[1],lw*1.5,a.angle)});
  if(pose==="hold")drawObject(0,torsoY-torsoH*.46+holdLift,torsoW*.28);
  if(pose==="trouble"){noFill();stroke("#e34a32");strokeWeight(2);arc(-headW*.5,headY-headH*.48,headW*.2,headH*.22,PI,PI*1.75);arc(headW*.48,headY-headH*.5,headW*.16,headH*.18,PI*1.2,TWO_PI)}
  pop();
}
function armPaths(pose,bw,bh,a,y,cy=0){
  const L=-bw*.43,R=bw*.43,down=bh*.32;
  if(pose==="wave")return[{points:[[L,y],[L-a*.35,y-a*.5],[L-a*.15,y-a]],end:[L-a*.15,y-a],angle:-.1},{points:[[R,y],[R+a*.45,y+a*.35],[R+a*.35,y+down]],end:[R+a*.35,y+down],angle:0}];
  if(pose==="point")return[{points:[[L,y],[L-a*.5,y+a*.2],[L-a*.38,y+down]],end:[L-a*.38,y+down],angle:0},{points:[[R,y],[R+a*.45,y-a*.04],[R+a,y-a*.08]],end:[R+a,y-a*.08],angle:0,pointing:true}];
  if(pose==="hold")return[{points:[[L,y],[L-a*.55,y-a*.15],[-bw*.18,cy-bh*.35]],end:[-bw*.18,cy-bh*.35],angle:.5},{points:[[R,y],[R+a*.55,y-a*.15],[bw*.18,cy-bh*.35]],end:[bw*.18,cy-bh*.35],angle:-.5}];
  if(pose==="cross")return[{points:[[L,y],[L-a*.35,y+a*.12],[bw*.17,cy]],end:[bw*.17,cy],angle:.15},{points:[[R,y],[R+a*.35,y+a*.15],[-bw*.17,cy+bh*.08]],end:[-bw*.17,cy+bh*.08],angle:-.15}];
  if(pose==="trouble")return[{points:[[L,y],[L-a*.5,y-a*.4],[L-a*.22,y-a*.75]],end:[L-a*.22,y-a*.75],angle:.4},{points:[[R,y],[R+a*.5,y-a*.4],[R+a*.22,y-a*.75]],end:[R+a*.22,y-a*.75],angle:-.4}];
  if(pose==="run")return[{points:[[L,y],[L-a*.55,y-a*.32],[L-a*.85,y-a*.12]],end:[L-a*.85,y-a*.12],angle:0},{points:[[R,y],[R+a*.45,y+a*.25],[R+a*.72,y+a*.08]],end:[R+a*.72,y+a*.08],angle:0}];
  if(pose==="sleep")return[{points:[[L,y],[L-a*.45,y+a*.18],[L-a*.75,y+a*.22]],end:[L-a*.75,y+a*.22],angle:0},{points:[[R,y],[R+a*.45,y+a*.18],[R+a*.75,y+a*.22]],end:[R+a*.75,y+a*.22],angle:0}];
  return[{points:[[L,y],[L-a*.35,y+a*.3],[L-a*.34,y+down]],end:[L-a*.34,y+down],angle:0},{points:[[R,y],[R+a*.35,y+a*.3],[R+a*.34,y+down]],end:[R+a*.34,y+down],angle:0}];
}
function drawObject(x,y,s){push();translate(x,y);stroke("#161716");strokeWeight(max(2,s*.05));fill("#f3c83c");rectMode(CENTER);rect(0,0,s,s*.72,s*.08);noFill();arc(s*.52,0,s*.5,s*.42,-HALF_PI,HALF_PI);pop()}

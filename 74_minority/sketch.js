"use strict";

const PAPER="#e9e7df", BLUE="#2877ba", RED="#d84c43";
const TALLY_AT=1200, DECISION_AT=2100, CONVERT_AT=3200, STEP=300, FILL_TIME=480;
let host, people=[], player, votedAt=0, tallyShown=false, decisionShown=false, resetShown=false;

function setup(){
  host=document.getElementById("sketch");
  const canvas=createCanvas(host.clientWidth,host.clientHeight); canvas.parent(host);
  pixelDensity(1); frameRate(45); buildPeople(); bindUI();
}

function buildPeople(){
  people=[];
  for(let i=0;i<99;i++) people.push({id:i,group:i<90?"BLUE":"RED",redOrder:i-90,phase:random(TWO_PI),marpan:new Marpan25D({id:`group-${i}`,expression:"pupil"})});
  player=new Marpan25D({id:"red-user",expression:"pupil"});
}

function bindUI(){
  document.getElementById("vote-red").addEventListener("click",castVote);
  document.getElementById("reset").addEventListener("click",resetWork);
  addEventListener("keydown",e=>{if(!votedAt&&e.key.toLowerCase()==="r")castVote();});
}

function draw(){
  background(PAPER); drawField();
  const pos=layoutPositions();
  people.forEach(p=>drawPerson(p,pos[p.id]));
  drawPlayer();
  if(votedAt){
    const age=millis()-votedAt;
    drawVotes(pos,age); drawReceipt(age); updateInterface(age);
  }
}

function layoutPositions(){
  const result={}, blue=people.filter(p=>p.group==="BLUE"), red=people.filter(p=>p.group==="RED");
  const cols=width<650?9:10, left=width*.045, right=width*(width<650?.66:.68), top=height*.14, bottom=height*.91;
  blue.forEach((p,i)=>{const row=floor(i/cols),col=i%cols,rows=ceil(blue.length/cols);result[p.id]={x:lerp(left,right,col/(cols-1)),y:lerp(top,bottom,row/(rows-1))};});
  red.forEach((p,i)=>{const col=i%3,row=floor(i/3);result[p.id]={x:width*(.78+col*.075),y:height*(.18+row*.125)};});
  return result;
}

function drawField(){
  noStroke();fill(23,24,23,17);rect(width*.735,height*.08,1,height*.84);
  textAlign(CENTER,CENTER);textStyle(BOLD);textSize(constrain(width*.013,12,17));
  fill(color(BLUE));text("BLUE GROUP",width*.36,height*.052);
  fill(color(RED));text("RED GROUP",width*.84,height*.052);
}

function bodySize(){return constrain(min(width/15.8,height/12.8),27,55)}

function drawPerson(person,pos){
  const size=bodySize(), y=pos.y+sin(millis()*.0012+person.phase)*.4;
  const progress=person.group==="BLUE"?1:conversionProgress(person.redOrder);
  drawColoredMarpan(person.marpan,pos.x,y,size,progress,false,person.group==="RED"&&progress>0);
}

function playerPosition(){return{x:width*(width<650?.86:.87),y:height*(width<650?.55:.71)}}

function drawPlayer(){
  const p=playerPosition(),size=constrain(min(width*.085,height*.16),56,106),progress=playerConversionProgress();
  noFill();stroke(23,24,23,55);strokeWeight(1.2);ellipse(p.x,p.y,size*1.25,size*.91);
  drawColoredMarpan(player,p.x,p.y,size,progress,true,progress>0);
}

function drawColoredMarpan(marpan,x,y,size,progress,isPlayer,sad){
  const base=progress>=1?BLUE:RED, h=size*.68;
  const target=votedAt?panelTarget():{x,y};
  marpan.drawAt(x,y,{bodyWidth:size,bodyHeight:h,lookX:votedAt?target.x:x,lookY:votedAt?target.y:y,eyeScale:isPlayer?1.05:1,bodyColor:base,expression:sad?"worried":"pupil"});
  if(progress>0&&progress<1){
    push();translate(x,y);clipBody(size,h);
    noStroke();fill(BLUE);
    const edge=-size*.5+size*progress;
    beginShape();vertex(-size*.56,-h*.56);vertex(edge,-h*.56);
    for(let j=0;j<=8;j++){const yy=lerp(-h*.56,h*.56,j/8);vertex(edge+sin(j*1.7+millis()*.005)*size*.025,yy);}
    vertex(-size*.56,h*.56);endShape(CLOSE);
    drawingContext.restore();
    marpan.drawEyes(0,0,size,h,0,(votedAt?target.x:x)-x,(votedAt?target.y:y)-y,{eyeScale:isPlayer?1.05:1,expression:"worried"});
    pop();
  }
}

function clipBody(w,h){
  const c=drawingContext,waist=h*.2;c.save();c.beginPath();c.moveTo(-w*.48,waist);
  c.bezierCurveTo(-w*.5,-h*.25,-w*.26,-h*.5,0,-h*.5);c.bezierCurveTo(w*.27,-h*.5,w*.5,-h*.25,w*.48,waist);
  c.bezierCurveTo(w*.46,h*.46,w*.25,h*.5,0,h*.5);c.bezierCurveTo(-w*.25,h*.5,-w*.46,h*.46,-w*.48,waist);c.closePath();c.clip();
}

function conversionProgress(order){if(!votedAt)return 0;return constrain((millis()-votedAt-CONVERT_AT-order*STEP)/FILL_TIME,0,1)}
function playerConversionProgress(){if(!votedAt)return 0;return constrain((millis()-votedAt-CONVERT_AT-9*STEP)/800,0,1)}

function panelTarget(){return{x:width*(width<700?.57:.735),y:height*(width<700?.65:.49)}}

function drawVotes(pos,age){
  const center=width<700?.57:.735,blueTarget={x:width*(center-.02),y:height*(width<700?.64:.46)},redTarget={x:width*(center+.02),y:height*(width<700?.69:.505)};
  people.forEach((p,i)=>{
    const delay=180+(i%10)*32,t=constrain((age-delay)/1050,0,1);if(t<=0||t>=1)return;
    const start=pos[p.id],target=p.group==="BLUE"?blueTarget:redTarget,e=t*t*(3-2*t);
    noStroke();fill(p.group==="BLUE"?color(BLUE):color(RED));circle(lerp(start.x,target.x,e),lerp(start.y,target.y,e)-sin(e*PI)*10,max(2,bodySize()*.09));
  });
  const p=playerPosition(),t=constrain(age/1100,0,1);
  if(t<1){const e=t*t*(3-2*t);noStroke();fill(RED);rectMode(CENTER);rect(lerp(p.x,redTarget.x,e),lerp(p.y,redTarget.y,e)-sin(e*PI)*22,18,12,2);rectMode(CORNER);}
}

function drawReceipt(age){
  if(age<900)return;const p=playerPosition(),a=constrain((age-900)/450,0,1);
  push();drawingContext.globalAlpha=a;rectMode(CENTER);stroke(RED);strokeWeight(1.2);fill(PAPER);rect(p.x+pOffset(),p.y+bodySize()*.78,48,24,2);
  noStroke();fill(RED);textAlign(CENTER,CENTER);textStyle(BOLD);textSize(11);text("RED",p.x+pOffset(),p.y+bodySize()*.78+1);pop();rectMode(CORNER);
}
function pOffset(){return width<650?-38:-58}

function updateInterface(age){
  if(age>=TALLY_AT&&!tallyShown){tallyShown=true;document.querySelector(".tally").classList.add("visible");document.getElementById("blue-count").textContent="90";document.getElementById("red-count").textContent="10";}
  if(age>=DECISION_AT&&!decisionShown){decisionShown=true;document.getElementById("decision").textContent="BLUE";}
  if(age>=CONVERT_AT+9*STEP+1000&&!resetShown){resetShown=true;document.getElementById("reset").hidden=false;}
}

function castVote(){
  if(votedAt)return;votedAt=millis();document.getElementById("vote-red").disabled=true;player.blink([0,1,2],260);
}

function resetWork(){
  votedAt=0;tallyShown=false;decisionShown=false;resetShown=false;
  document.querySelector(".tally").classList.remove("visible");
  document.getElementById("blue-count").textContent="—";document.getElementById("red-count").textContent="—";document.getElementById("decision").textContent="";
  document.getElementById("vote-red").disabled=false;document.getElementById("reset").hidden=true;
}

function windowResized(){resizeCanvas(host.clientWidth,host.clientHeight)}

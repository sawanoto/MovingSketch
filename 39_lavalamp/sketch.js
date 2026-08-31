let lamp={}, membrane=[], face, shapePath;
let settings={heat:.65,softness:2,speed:1};
const STATIONS=11;

function setup(){
  createCanvas(windowWidth,windowHeight); pixelDensity(min(devicePixelRatio,2)); frameRate(60);
  configureUi(); layoutLamp(); resetBody();
}

function draw(){
  const dt=min(deltaTime/1000,.035)*settings.speed;
  drawRoom(); drawLampBack(); updateBody(dt); shapePath=buildBodyPath();
  drawLiquidBody(shapePath); drawCommonFace(); drawGlassFront(); drawLampHardware();
}

function layoutLamp(){
  const portrait=height>width*1.08;
  const h=min(portrait?height*.81:height*.78,portrait?width*1.72:width*.88,720);
  const glassH=h*.62,glassW=min(h*.31,width*(portrait?.58:.32));
  lamp={cx:width/2,top:height/2-h*.43,h,glassH,glassW};
  lamp.glassTop=lamp.top+h*.13; lamp.glassBottom=lamp.glassTop+glassH; lamp.baseBottom=lamp.top+h;
}

function resetBody(){
  membrane=[];
  for(let i=0;i<STATIONS;i++){
    const t=i/(STATIONS-1), bell=sin(t*PI);
    membrane.push({
      t,x:random(-.012,.012),y:.77+(t-.5)*.28,
      vx:0,vy:0,width:.15+bell*.19, targetWidth:.2,
      seed:random(1000),phase:random(TWO_PI),temp:lerp(.84,.45,t)
    });
  }
  const actor=new Marpan25D({maxSize:180}); actor.enableAutoBlink(2600,6200);
  face={x:0,y:.72,w:.55,h:.35,actor};
}

function updateBody(dt){
  const step=dt*60,time=millis()*.001;
  // A slow heat pulse travels upward inside one unbroken body.
  for(let i=0;i<membrane.length;i++){
    const p=membrane[i],t=p.t;
    const heatAtBottom=smoothstep(.72,.98,p.y)*settings.heat;
    p.temp+=(heatAtBottom*.0038-(1-smoothstep(.08,.48,p.y))*.0031-.00022)*step;
    p.temp=constrain(p.temp,.12,1);
    const travelling=noise(p.seed*.02,time*.025+t*.42)-.5;
    const curl=noise(p.seed,time*.038)-.5;
    const wave=sin(time*.12+t*5.1+p.phase)*.5+sin(time*.071-t*3.4+p.phase*.4)*.5;
    const heatLift=(p.temp-.48)*(-.00048)*(1+.7*sin(t*PI));
    p.vx+=(curl*.00032+wave*.000055)*step;
    p.vy+=(heatLift+travelling*.00013+.000055)*step;
    // End stations remain rounded caps; inner stations are free to bow into S curves.
    if(i===0||i===membrane.length-1) p.vx+=(-p.x)*.00024*step;
  }

  // Viscous spine springs: the body stretches, but its topology cannot break.
  for(let i=0;i<membrane.length-1;i++){
    const a=membrane[i],b=membrane[i+1],dx=b.x-a.x,dy=b.y-a.y;
    const d=sqrt(dx*dx+dy*dy)||.001,rest=.048+settings.softness*.006;
    const f=(d-rest)*.0048;
    a.vx+=dx/d*f*step; a.vy+=dy/d*f*step;
    b.vx-=dx/d*f*step; b.vy-=dy/d*f*step;
  }
  // Bending resistance gives honey-like curves instead of a chain of circles.
  for(let i=1;i<membrane.length-1;i++){
    const a=membrane[i-1],p=membrane[i],b=membrane[i+1];
    p.vx+=((a.x+b.x)*.5-p.x)*.0032*step;
    p.vy+=((a.y+b.y)*.5-p.y)*.0025*step;
  }

  for(const p of membrane){
    const wall=.25+sin(constrain(p.y,0,1)*PI)*.13;
    if(p.x<-wall)p.vx+=(-wall-p.x)*.012*step;
    if(p.x>wall)p.vx+=(wall-p.x)*.012*step;
    if(p.y<.06)p.vy+=(.06-p.y)*.018*step;
    if(p.y>.94){p.vy+=(.94-p.y)*.018*step;p.temp=min(1,p.temp+.004*step)}
    p.vx*=pow(.91,step); p.vy*=pow(.93,step);
    p.vx=constrain(p.vx,-.012,.012); p.vy=constrain(p.vy,-.01,.01);
    p.x+=p.vx*step; p.y+=p.vy*step;
  }
  conserveArea(step,time); updateFace();
}

function conserveArea(step,time){
  // Width is redistributed along the membrane; total cross-sectional mass stays stable.
  let desired=[],sum=0;
  for(let i=0;i<membrane.length;i++){
    const p=membrane[i],cap=pow(sin(p.t*PI),.48);
    const lobe=.76+noise(p.seed+70,time*.032)*.78;
    const travelling=.82+.34*sin(time*.11-p.t*7.2+p.phase);
    let w=(.055+cap*.205)*lobe*travelling;
    if(i===0||i===membrane.length-1)w*=.58;
    desired.push(max(.047,w)); sum+=desired[i]*desired[i];
  }
  const target=.48,scale=sqrt(target/sum);
  for(let i=0;i<membrane.length;i++){
    const minNeck=i===0||i===membrane.length-1?.045:.052;
    membrane[i].targetWidth=max(minNeck,desired[i]*scale);
  }
  // Laplacian smoothing removes the grape-like local circles while preserving broad lobes.
  for(let i=1;i<membrane.length-1;i++){
    const average=(membrane[i-1].targetWidth+membrane[i+1].targetWidth)*.5;
    membrane[i].targetWidth=lerp(membrane[i].targetWidth,average,.3);
  }
  for(const p of membrane)p.width=lerp(p.width,p.targetWidth,.018*step);
}

function buildBodyPath(){
  const left=[],right=[];
  for(let i=0;i<membrane.length;i++){
    const p=membrane[i],prev=membrane[max(0,i-1)],next=membrane[min(membrane.length-1,i+1)];
    let tx=(next.x-prev.x)*lamp.glassW,ty=(next.y-prev.y)*lamp.glassH,len=sqrt(tx*tx+ty*ty)||1;
    const nx=-ty/len,ny=tx/len;
    const cx=lamp.cx+p.x*lamp.glassW,cy=lamp.glassTop+p.y*lamp.glassH,r=p.width*lamp.glassW;
    left.push({x:cx+nx*r,y:cy+ny*r}); right.push({x:cx-nx*r,y:cy-ny*r});
  }
  return left.concat(right.reverse());
}

function traceSmooth(c,points){
  const last=points[points.length-1],first=points[0];
  c.beginPath(); c.moveTo((last.x+first.x)/2,(last.y+first.y)/2);
  for(let i=0;i<points.length;i++){
    const p=points[i],n=points[(i+1)%points.length];
    c.quadraticCurveTo(p.x,p.y,(p.x+n.x)/2,(p.y+n.y)/2);
  }
  c.closePath();
}

function drawLiquidBody(points){
  const c=drawingContext;c.save();glassPath(c);c.clip();
  c.save();traceSmooth(c,points);c.clip();
  let g=c.createLinearGradient(lamp.cx-lamp.glassW*.45,lamp.glassTop,lamp.cx+lamp.glassW*.4,lamp.glassBottom);
  g.addColorStop(0,'rgba(205,112,101,.96)');g.addColorStop(.32,'rgba(255,220,179,.98)');g.addColorStop(.72,'rgba(239,151,116,.97)');g.addColorStop(1,'rgba(163,65,87,.98)');
  c.fillStyle=g;c.fillRect(lamp.cx-lamp.glassW,lamp.glassTop,lamp.glassW*2,lamp.glassH);
  g=c.createRadialGradient(lamp.cx-lamp.glassW*.1,lamp.glassTop+lamp.glassH*.42,0,lamp.cx,lamp.glassTop+lamp.glassH*.5,lamp.glassW*.7);
  g.addColorStop(0,'rgba(255,252,224,.4)');g.addColorStop(.58,'rgba(255,183,128,.07)');g.addColorStop(1,'rgba(76,25,59,.35)');c.fillStyle=g;c.fillRect(lamp.cx-lamp.glassW,lamp.glassTop,lamp.glassW*2,lamp.glassH);
  g=c.createLinearGradient(0,lamp.glassBottom-lamp.glassH*.35,0,lamp.glassBottom);g.addColorStop(0,'rgba(255,180,105,0)');g.addColorStop(1,`rgba(255,224,145,${.2+settings.heat*.3})`);c.fillStyle=g;c.fillRect(lamp.cx-lamp.glassW,lamp.glassTop,lamp.glassW*2,lamp.glassH);
  c.restore();
  c.shadowColor='rgba(255,143,98,.38)';c.shadowBlur=lamp.glassW*.07;traceSmooth(c,points);c.strokeStyle='rgba(116,45,68,.52)';c.lineWidth=max(1.4,lamp.glassW*.009);c.stroke();c.shadowBlur=0;
  c.save();traceSmooth(c,points);c.clip();noFill();stroke(255,244,214,50);strokeWeight(max(1,lamp.glassW*.01));
  const top=membrane.reduce((a,p)=>p.y<a.y?p:a,membrane[0]);
  arc(lamp.cx+top.x*lamp.glassW-top.width*lamp.glassW*.15,lamp.glassTop+top.y*lamp.glassH,top.width*lamp.glassW*1.25,top.width*lamp.glassW*.7,PI*1.06,PI*1.65);c.restore();c.restore();
}

function updateFace(){
  // Prefer a broad region near the visual middle, not merely the global centroid.
  let best=membrane[0],score=-99;
  for(const p of membrane){const middle=1-abs(p.y-.53),s=p.width*3+middle*.22;if(s>score){score=s;best=p}}
  const targetX=best.x,targetY=best.y+best.width*.08;
  face.x=lerp(face.x,targetX,.018);face.y=lerp(face.y,targetY,.018);
  face.w=lerp(face.w,best.width*2.25,.025);face.h=lerp(face.h,best.width*1.5,.025);
}

function drawCommonFace(){
  const x=lamp.cx+face.x*lamp.glassW,y=lamp.glassTop+face.y*lamp.glassH;
  const bw=constrain(face.w*lamp.glassW,lamp.glassW*.38,lamp.glassW*.76),bh=constrain(face.h*lamp.glassW,lamp.glassW*.28,lamp.glassW*.58);
  const nearest=membrane.reduce((a,p)=>abs(p.y-face.y)<abs(a.y-face.y)?p:a,membrane[0]);
  const c=drawingContext;c.save();glassPath(c);c.clip();traceSmooth(c,shapePath);c.clip();push();translate(x,y);rotate(nearest.vx*5);face.actor.updateAutoBlink();face.actor.drawEyes(0,0,bw,bh,0,nearest.vx*lamp.glassW*8,nearest.vy*lamp.glassH*5,{eyeScale:.78});pop();c.restore();
}

function smoothstep(a,b,v){const t=constrain((v-a)/(b-a),0,1);return t*t*(3-2*t)}

function drawRoom(){background('#100c1b');const c=drawingContext,g=c.createRadialGradient(lamp.cx,height*.5,10,lamp.cx,height*.5,lamp.h*.75);g.addColorStop(0,'rgba(151,76,74,.16)');g.addColorStop(.55,'rgba(72,42,76,.08)');g.addColorStop(1,'rgba(8,6,17,0)');c.fillStyle=g;c.fillRect(0,0,width,height);noStroke();fill(5,4,12,85);ellipse(lamp.cx,lamp.baseBottom+8,lamp.glassW*1.55,lamp.h*.09)}
function glassPath(c){const x=lamp.cx,y=lamp.glassTop,w=lamp.glassW,h=lamp.glassH;c.beginPath();c.moveTo(x-w*.31,y);c.bezierCurveTo(x-w*.36,y+h*.14,x-w*.52,y+h*.35,x-w*.48,y+h*.72);c.bezierCurveTo(x-w*.46,y+h*.87,x-w*.37,y+h,x-w*.3,y+h);c.lineTo(x+w*.3,y+h);c.bezierCurveTo(x+w*.37,y+h,x+w*.46,y+h*.87,x+w*.48,y+h*.72);c.bezierCurveTo(x+w*.52,y+h*.35,x+w*.36,y+h*.14,x+w*.31,y);c.closePath()}
function drawLampBack(){const c=drawingContext;c.save();glassPath(c);c.clip();let g=c.createLinearGradient(0,lamp.glassTop,0,lamp.glassBottom);g.addColorStop(0,'rgba(52,30,64,.82)');g.addColorStop(.55,'rgba(102,46,69,.68)');g.addColorStop(1,'rgba(214,94,62,.78)');c.fillStyle=g;c.fillRect(lamp.cx-lamp.glassW,lamp.glassTop,lamp.glassW*2,lamp.glassH);g=c.createRadialGradient(lamp.cx,lamp.glassBottom,0,lamp.cx,lamp.glassBottom,lamp.glassW*1.25);g.addColorStop(0,`rgba(255,179,91,${.28+settings.heat*.25})`);g.addColorStop(1,'rgba(255,112,70,0)');c.fillStyle=g;c.fillRect(lamp.cx-lamp.glassW,lamp.glassBottom-lamp.glassW*1.3,lamp.glassW*2,lamp.glassW*1.5);c.restore()}
function drawGlassFront(){const c=drawingContext;c.save();glassPath(c);c.strokeStyle='rgba(255,238,225,.25)';c.lineWidth=max(1,lamp.glassW*.008);c.stroke();c.save();glassPath(c);c.clip();const g=c.createLinearGradient(lamp.cx-lamp.glassW*.5,0,lamp.cx+lamp.glassW*.42,0);g.addColorStop(0,'rgba(255,255,255,.02)');g.addColorStop(.18,'rgba(255,246,239,.18)');g.addColorStop(.28,'rgba(255,255,255,.025)');g.addColorStop(.78,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(255,213,196,.11)');c.fillStyle=g;c.fillRect(lamp.cx-lamp.glassW,lamp.glassTop,lamp.glassW*2,lamp.glassH);c.restore();c.restore()}
function drawLampHardware(){const x=lamp.cx,w=lamp.glassW,top=lamp.top,gb=lamp.glassBottom,c=drawingContext;noStroke();c.shadowColor='rgba(0,0,0,.45)';c.shadowBlur=18;fill('#292230');beginShape();vertex(x-w*.31,lamp.glassTop+2);vertex(x-w*.4,top+lamp.h*.055);quadraticVertex(x,top-3,x+w*.4,top+lamp.h*.055);vertex(x+w*.31,lamp.glassTop+2);endShape(CLOSE);fill('#40343d');ellipse(x,top+lamp.h*.056,w*.79,lamp.h*.035);let g=c.createLinearGradient(x-w*.65,0,x+w*.65,0);g.addColorStop(0,'#201b27');g.addColorStop(.25,'#55404a');g.addColorStop(.55,'#2c252d');g.addColorStop(.82,'#493641');g.addColorStop(1,'#17141c');c.fillStyle=g;c.beginPath();c.moveTo(x-w*.3,gb-3);c.lineTo(x-w*.68,lamp.baseBottom);c.quadraticCurveTo(x,lamp.baseBottom+lamp.h*.025,x+w*.68,lamp.baseBottom);c.lineTo(x+w*.3,gb-3);c.closePath();c.fill();c.shadowBlur=0;g=c.createRadialGradient(x,gb+lamp.h*.025,0,x,gb+lamp.h*.025,w*.42);g.addColorStop(0,`rgba(255,211,125,${.55+settings.heat*.35})`);g.addColorStop(.35,'rgba(238,121,69,.25)');g.addColorStop(1,'rgba(238,121,69,0)');c.fillStyle=g;c.fillRect(x-w*.48,gb-w*.22,w*.96,w*.74);stroke(255,231,207,35);strokeWeight(1);line(x-w*.47,lamp.baseBottom-2,x+w*.47,lamp.baseBottom-2)}

function configureUi(){const t=document.getElementById('controlToggle'),box=document.getElementById('controls');t.addEventListener('click',()=>{const open=box.classList.toggle('open');t.setAttribute('aria-expanded',String(open))});bind('heat',v=>settings.heat=v/100,v=>v);bind('count',v=>settings.softness=v,v=>v);bind('speed',v=>settings.speed=v/100,v=>(v/100).toFixed(1))}
function bind(id,apply,format){const el=document.getElementById(id),out=document.getElementById(id+'Value');el.addEventListener('input',()=>{const v=Number(el.value);apply(v);out.value=format(v)})}
function windowResized(){resizeCanvas(windowWidth,windowHeight);layoutLamp()}

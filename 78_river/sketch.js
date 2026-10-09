"use strict";

const canvas=document.getElementById("river"),ctx=canvas.getContext("2d");
const reset=document.getElementById("reset"),hint=document.getElementById("hint");
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
let W,H,N,terrain,water,delta,flux,scar,rightWall,downWall,wallAge,flowX,flowY,nextX,nextY,riverBend;
let viewW=0,viewH=0,dpr=1,sourceX=0,sourceY=0,frame=0,seed=0;
let image,buffer,bctx,drag=null,preview=null,changed=false,renderScale=2;
const key=(x,y)=>y*W+x;

function randomField(w,h,scale){
  const a=new Float32Array(w*h);
  for(let i=0;i<a.length;i++)a[i]=Math.random();
  return (x,y)=>{
    const fx=clamp(x/scale,0,w-1.001),fy=clamp(y/scale,0,h-1.001);
    const ix=fx|0,iy=fy|0,tx=fx-ix,ty=fy-iy;
    const s=t=>t*t*(3-2*t),u=s(tx),v=s(ty),i=iy*w+ix;
    return (a[i]*(1-u)+a[i+1]*u)*(1-v)+(a[i+w]*(1-u)+a[i+w+1]*u)*v;
  };
}
function makeWorld(){
  W=clamp(Math.round(viewW/7),80,210);H=clamp(Math.round(viewH/7),65,145);N=W*H;
  terrain=new Float32Array(N);water=new Float32Array(N);delta=new Float32Array(N);
  flux=new Float32Array(N);scar=new Float32Array(N);
  flowX=new Float32Array(N);flowY=new Float32Array(N);nextX=new Float32Array(N);nextY=new Float32Array(N);
  rightWall=new Float32Array(N);downWall=new Float32Array(N);wallAge=new Float32Array(N);
  const n1=randomField(Math.ceil(W/20)+2,Math.ceil(H/20)+2,20);
  const n2=randomField(Math.ceil(W/7)+2,Math.ceil(H/7)+2,7);
  const n3=randomField(Math.ceil(W/3)+2,Math.ceil(H/3)+2,3);
  seed=Math.random()*99;
  sourceX=Math.round(W*(.48+(Math.random()-.5)*.12));sourceY=Math.max(9,Math.round(H*.12));
  riverBend=new Float32Array(H);
  const bendNoise=randomField(4,Math.ceil(H/24)+2,24);
  let bend=sourceX,heading=0;
  for(let y=0;y<H;y++){
    const wander=(bendNoise(1,y)-.5)*.13;
    heading=clamp(heading*.98+wander*.2+(sourceX-bend)*.00055,-.34,.34);
    bend=clamp(bend+heading,W*.17,W*.83);
    riverBend[y]=bend;
  }
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const i=key(x,y),edge=Math.pow(Math.abs(x-W*.5)/(W*.5),2);
    const dx=(x-riverBend[y])/5.5;
    const valley=Math.exp(-dx*dx*.5)*.72;
    terrain[i]=(H-y)*.09+edge*.55+(n1(x,y)-.5)*1.15+(n2(x,y)-.5)*.28+(n3(x,y)-.5)*.045-valley;
  }
  // A modest opening channel gives the first trickle somewhere to go.
  for(let y=sourceY;y<Math.min(H,sourceY+12);y++){
    const x=Math.round(sourceX+Math.sin(y*.2+seed)*1.5);
    for(let dx=-2;dx<=2;dx++)if(x+dx>=0&&x+dx<W)terrain[key(x+dx,y)]-=.13*(3-Math.abs(dx));
  }
  renderScale=clamp(Math.ceil(3*W/viewW*7),2,3);
  buffer=document.createElement("canvas");buffer.width=W*renderScale;buffer.height=H*renderScale;
  bctx=buffer.getContext("2d",{willReadFrequently:true});image=bctx.createImageData(buffer.width,buffer.height);
  frame=0;drag=null;preview=null;changed=false;hint.classList.remove("hidden");
}
function edge(i,j){
  if(j===i+1)return [rightWall,i];
  if(j===i-1)return [rightWall,j];
  if(j===i+W)return [downWall,i];
  return [downWall,j];
}
function step(){
  frame++;
  // A concentrated spring begins at the body's lower edge.
  for(let y=sourceY;y<=sourceY+1;y++)for(let x=sourceX-1;x<=sourceX+1;x++)
    water[key(x,y)]+=.045*(x===sourceX?1.5:1);
  delta.fill(0);flux.fill(0);nextX.fill(0);nextY.fill(0);
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
    const i=key(x,y),available=water[i];if(available<.0001)continue;
    const surface=terrain[i]+available;
    const neighbors=[i-1,i+1,i-W,i+W],rates=[0,0,0,0];let total=0,overWall=[false,false,false,false];
    for(let k=0;k<4;k++){
      const j=neighbors[k],[walls,wi]=edge(i,j);
      // A wall has a crest. Below it, the adjacent cells cannot exchange water.
      const crest=walls[wi]>0?Math.max(terrain[i],terrain[j])+walls[wi]:-Infinity;
      const difference=surface-Math.max(terrain[j]+water[j],crest);
      if(difference>0){
        overWall[k]=walls[wi]>0;
        const direction=k===3?1.35:k===2?.78:1;
        const momentum=k===0?-flowX[i]:k===1?flowX[i]:k===2?-flowY[i]:flowY[i];
        const bendGuide=clamp((riverBend[y+1]-riverBend[y])*.7,-.32,.32);
        const steer=k===0?1-bendGuide:k===1?1+bendGuide:1;
        rates[k]=Math.pow(difference,1.12)*direction*steer*(1+Math.max(0,momentum)*.55)*(overWall[k]?.22:1);
        total+=rates[k];
      }
    }
    if(!total)continue;
    const amount=Math.min(available*.64,total*.18);
    delta[i]-=amount;
    for(let k=0;k<4;k++)if(rates[k]){
      const q=amount*rates[k]/total,j=neighbors[k];delta[j]+=q;flux[i]+=q;
      nextX[j]+=q*(k===0?-1:k===1?1:0);
      nextY[j]+=q*(k===2?-1:k===3?1:0);
      const [walls,wi]=edge(i,j);
      if(walls[wi]>0&&surface>Math.max(terrain[i],terrain[j])+walls[wi]){
        wallAge[wi]+=q*.014;
        if(wallAge[wi]>1.4){walls[wi]=0;wallAge[wi]=0;}
      }
    }
  }
  for(let i=0;i<N;i++){
    water[i]=Math.max(0,water[i]+delta[i]);
    const incoming=Math.max(.01,water[i]);
    flowX[i]=clamp(flowX[i]*.77+nextX[i]/incoming*.23,-1,1);
    flowY[i]=clamp(flowY[i]*.77+nextY[i]/incoming*.23,-1,1);
    if(flux[i]>.012){
      const turn=Math.abs(flowX[i]-(flowX[i-W]+flowX[i+W])*.5);
      const outerBank=clamp(1+turn*2+Math.abs(flowX[i])*.35,1,1.7);
      const cut=Math.min(.00035,.000017*Math.pow(flux[i]*10,.8)*outerBank);
      terrain[i]-=cut;scar[i]=Math.min(1,scar[i]+cut*19);
    }
  }
  // The lower edge is the sea; no water accumulates beyond the picture.
  for(let x=0;x<W;x++)water[key(x,H-1)]=0;
  if(frame%4===0)render();
}
function color(t,w,s,x,y){
  const elevation=clamp((t-(H-y)*.09+1.2)/3,0,1);
  let r=228-elevation*33-s*32,g=225-elevation*25-s*22,b=208-elevation*37-s*13;
  const contour=Math.abs((t*.8)%1-.5)<.023?.7:0;
  r-=contour*20;g-=contour*19;b-=contour*15;
  if(w>.001){
    const depth=clamp(Math.sqrt(w)*.9,0,1);
    const shimmer=Math.sin(x*.65+y*.32+frame*.12)*3;
    const shoreline=clamp((w-.001)/.024,0,1);
    const a=(.48+depth*.45)*shoreline*shoreline*(3-2*shoreline);
    r=r*(1-a)+(72-depth*17+shimmer)*a;
    g=g*(1-a)+(143-depth*17+shimmer)*a;
    b=b*(1-a)+(158+depth*17+shimmer)*a;
  }
  return [r,g,b];
}
function render(){
  const pixels=image.data;
  const bw=buffer.width,bh=buffer.height;
  for(let y=0;y<bh;y++)for(let x=0;x<bw;x++){
    const gx=clamp((x+.5)/renderScale-.5,0,W-1.001),gy=clamp((y+.5)/renderScale-.5,0,H-1.001);
    const ix=gx|0,iy=gy|0,tx=gx-ix,ty=gy-iy,i=key(ix,iy);
    const sample=a=>(a[i]*(1-tx)+a[i+1]*tx)*(1-ty)+(a[i+W]*(1-tx)+a[i+W+1]*tx)*ty;
    const p=(y*bw+x)*4,c=color(sample(terrain),sample(water),sample(scar),gx,gy);
    pixels[p]=c[0];pixels[p+1]=c[1];pixels[p+2]=c[2];pixels[p+3]=255;
  }
  bctx.putImageData(image,0,0);
  ctx.clearRect(0,0,viewW,viewH);
  ctx.imageSmoothingEnabled=true;ctx.drawImage(buffer,0,0,viewW,viewH);
  const sx=viewW/W,sy=viewH/H;
  ctx.lineCap="round";ctx.lineJoin="round";
  ctx.strokeStyle="#826b4c";ctx.lineWidth=Math.max(2,Math.min(sx,sy)*.62);
  ctx.beginPath();
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const i=key(x,y);
    if(rightWall[i]>0){ctx.moveTo((x+1)*sx,(y+.16)*sy);ctx.lineTo((x+1)*sx,(y+.84)*sy);}
    if(downWall[i]>0){ctx.moveTo((x+.16)*sx,(y+1)*sy);ctx.lineTo((x+.84)*sx,(y+1)*sy);}
  }
  ctx.stroke();
  if(preview){
    ctx.setLineDash([7,6]);ctx.strokeStyle="#594830";ctx.lineWidth=4;
    ctx.beginPath();ctx.moveTo(preview.x1,preview.y1);ctx.lineTo(preview.x2,preview.y2);ctx.stroke();ctx.setLineDash([]);
  }
  drawMarpan((sourceX+.5)*sx,(sourceY+.5)*sy,Math.max(38,Math.min(viewW,viewH)*.11));
}
function drawMarpan(x,outlet,width){
  // Canvas rendering of the shared Marpan25D body and three-eye proportions.
  const w=width,h=w*.68,cy=outlet-h*.5,waist=h*.2;
  ctx.save();ctx.translate(x,cy);ctx.fillStyle="#fffdfa";ctx.strokeStyle="#121212";ctx.lineWidth=Math.max(2.5,w*.012);
  ctx.beginPath();ctx.moveTo(0,-h*.5);
  ctx.bezierCurveTo(w*.27,-h*.5,w*.5,-h*.25,w*.48,waist);
  ctx.bezierCurveTo(w*.46,h*.46,w*.25,h*.5,0,h*.5);
  ctx.bezierCurveTo(-w*.25,h*.5,-w*.46,h*.46,-w*.48,waist);
  ctx.bezierCurveTo(-w*.5,-h*.25,-w*.26,-h*.5,0,-h*.5);
  ctx.closePath();ctx.fill();ctx.stroke();
  for(let i=-1;i<=1;i++){
    const longitude=i*.44,projection=Math.cos(longitude);
    const ex=Math.sin(longitude)*w*.47,ew=w*.135*1.42*(.76+projection*.24)*projection,eh=ew*1.08;
    ctx.beginPath();ctx.ellipse(ex,0,ew*.5,eh*.5,0,0,Math.PI*2);
    ctx.fillStyle="#fff";ctx.fill();ctx.lineWidth=Math.max(1.5,ew*.045);ctx.stroke();
    ctx.beginPath();ctx.ellipse(ex,eh*.09,ew*.19,eh*.25,0,0,Math.PI*2);ctx.fillStyle="#121212";ctx.fill();
  }
  ctx.restore();
}
function point(e){const box=canvas.getBoundingClientRect();return{x:e.clientX-box.left,y:e.clientY-box.top};}
function gridPoint(p){return{x:clamp(Math.floor(p.x/viewW*W),0,W-1),y:clamp(Math.floor(p.y/viewH*H),0,H-1)};}
function wallBetween(a,b){
  if(b.x===a.x+1&&b.y===a.y)return[rightWall,key(a.x,a.y)];
  if(b.x===a.x-1&&b.y===a.y)return[rightWall,key(b.x,b.y)];
  if(b.y===a.y+1&&b.x===a.x)return[downWall,key(a.x,a.y)];
  if(b.y===a.y-1&&b.x===a.x)return[downWall,key(b.x,b.y)];
  return null;
}
function drawDam(a,b){
  const dx=(b.x-a.x)/viewW*W,dy=(b.y-a.y)/viewH*H;
  const count=Math.max(1,Math.ceil(Math.hypot(dx,dy)*3));
  for(let n=0;n<=count;n++){
    const p=gridPoint({x:a.x+(b.x-a.x)*n/count,y:a.y+(b.y-a.y)*n/count});
    const i=key(p.x,p.y);
    // The drag stroke is the crest itself: block edges that cross it.
    if(Math.abs(dx)>=Math.abs(dy)*.7&&p.y<H-1){downWall[i]=2.2;wallAge[i]=0;}
    if(Math.abs(dy)>=Math.abs(dx)*.7&&p.x<W-1){rightWall[i]=2.2;wallAge[i]=0;}
  }
  changed=true;hint.classList.add("hidden");render();
}
function breakDam(p){
  const g=gridPoint(p);let best=null,bestD=Infinity;
  for(let y=Math.max(0,g.y-2);y<=Math.min(H-1,g.y+2);y++)for(let x=Math.max(0,g.x-2);x<=Math.min(W-1,g.x+2);x++){
    const i=key(x,y);
    for(const [walls,d] of [[rightWall,Math.hypot((x+1)*viewW/W-p.x,(y+.5)*viewH/H-p.y)],[downWall,Math.hypot((x+.5)*viewW/W-p.x,(y+1)*viewH/H-p.y)]])
      if(walls[i]>0&&d<bestD){best=[walls,i];bestD=d;}
  }
  if(best&&bestD<18){best[0][best[1]]=0;render();}
}
canvas.addEventListener("pointerdown",e=>{canvas.setPointerCapture(e.pointerId);drag=point(e);preview=null;});
canvas.addEventListener("pointermove",e=>{if(!drag)return;const p=point(e);preview={x1:drag.x,y1:drag.y,x2:p.x,y2:p.y};render();});
canvas.addEventListener("pointerup",e=>{if(!drag)return;const p=point(e);if(Math.hypot(p.x-drag.x,p.y-drag.y)>9)drawDam(drag,p);else breakDam(p);drag=null;preview=null;render();});
canvas.addEventListener("pointercancel",()=>{drag=null;preview=null;render();});
reset.addEventListener("click",()=>{makeWorld();render();});
function resize(){
  const oldW=viewW,oldH=viewH;viewW=innerWidth;viewH=innerHeight;dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(viewW*dpr);canvas.height=Math.round(viewH*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  if(!oldW||Math.abs(viewW/oldW-1)>.25||Math.abs(viewH/oldH-1)>.25)makeWorld();
  render();
}
addEventListener("resize",resize);resize();
let last=performance.now(),acc=0;
function animate(now){
  acc+=Math.min(.1,(now-last)/1000);last=now;
  while(acc>=1/30){step();acc-=1/30;}
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
